import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up Google Gen AI with the environment variable
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Paths for persistence
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const ISSUES_FILE = path.join(DATA_DIR, "issues.json");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Debug log helper to write logs to a file for auditing/proofing
function logDebug(message: string) {
  console.log(message);
  try {
    fs.appendFileSync(path.join(process.cwd(), "server_debug.log"), `${new Date().toISOString()} ${message}\n`);
  } catch (err) {
    // ignore
  }
}

interface Issue {
  id: string;
  category: "Pothole" | "Water Leakage" | "Streetlight" | "Waste Management" | "Infrastructure" | "Other";
  severity: number;
  auto_description: string;
  confidence: number;
  lat: number;
  lng: number;
  location_name: string;
  photos: string[];
  status: "Reported" | "Verified" | "In Progress" | "Resolved";
  confirmation_count: number;
  department_name: string;
  draft_complaint_text: string;
  is_hsvp_sector: boolean;
  created_at: string;
  updated_at: string;
  needs_attention: boolean;
  status_history: { status: string; changed_at: string; note?: string }[];
  raw_analysis_json?: string;
  raw_complaint_json?: string;
  simulated_days_old?: number; // to track simulated delay
  reporter_name?: string;
  confirmers?: string[];
}

// Seed data
const SEED_ISSUES: Issue[] = [
  {
    id: "seed-1",
    category: "Pothole",
    severity: 4,
    auto_description: "Multiple deep craters visible on the main tarmac road, disrupting traffic and causing safety hazards.",
    confidence: 0.94,
    lat: 28.4682,
    lng: 77.0620,
    location_name: "Sector 29, Near Leisure Valley Road",
    photos: ["/seed-pothole.jpg"],
    status: "Reported",
    confirmation_count: 5,
    department_name: "Municipal Corporation of Gurugram (MCG)",
    draft_complaint_text: "To,\nThe Commissioner,\nMunicipal Corporation of Gurugram (MCG),\nGurugram, Haryana.\n\nSubject: Urgent complaint regarding deep potholes on internal road at Sector 29.\n\nDear Sir/Madam,\n\nI am writing to draw your attention to a critical civic issue regarding severe potholes at Sector 29, Near Leisure Valley Road (Coordinates: 28.4682, 77.0620). There are multiple deep craters on this stretch that are posing a major hazard to motorists, especially two-wheelers during night hours. The severity is marked as 4 out of 5.\n\nKindly inspect this site and authorize immediate road repair work to avoid potential accidents.\n\nThank you.\n\nSincerely,\nConcerned Citizen,\nGurugram Hero App",
    is_hsvp_sector: false,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    needs_attention: false,
    status_history: [
      { status: "Reported", changed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), note: "System seeded" }
    ],
    simulated_days_old: 4
  },
  {
    id: "seed-2",
    category: "Streetlight",
    severity: 3,
    auto_description: "A damaged streetlight fixture with hanging wires, making the immediate neighborhood street pitch dark.",
    confidence: 0.89,
    lat: 28.4352,
    lng: 77.0835,
    location_name: "Sector 56, Near HUDA Market Lane 3",
    photos: ["/seed-streetlight.jpg"],
    status: "Verified",
    confirmation_count: 2,
    department_name: "Dakshin Haryana Bijli Vitran Nigam (DHBVN)",
    draft_complaint_text: "To,\nThe Executive Engineer,\nDakshin Haryana Bijli Vitran Nigam (DHBVN),\nGurugram, Haryana.\n\nSubject: Faulty streetlight and hanging wires at Sector 56.\n\nDear Sir/Madam,\n\nThis is to report that the streetlights near HUDA Market Lane 3 in Sector 56 (Coordinates: 28.4352, 77.0835) have been completely non-functional due to damaged fixtures and loose wires. The lane is unsafe after sunset.\n\nPlease arrange for an electrician to fix the streetlight and secure the electrical cables at the earliest.\n\nSincerely,\nConcerned Citizen,\nGurugram Hero App",
    is_hsvp_sector: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    needs_attention: false,
    status_history: [
      { status: "Reported", changed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: "Initial report" },
      { status: "Verified", changed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), note: "Verified by community inspectors" }
    ],
    simulated_days_old: 1
  },
  {
    id: "seed-3",
    category: "Water Leakage",
    severity: 2,
    auto_description: "Drinking water pipeline leakage spraying water continuously onto the pavement, causing waterlogging.",
    confidence: 0.95,
    lat: 28.4554,
    lng: 77.0392,
    location_name: "Sector 15 Part 2, Near HUDA Park",
    photos: ["/seed-water.jpg"],
    status: "In Progress",
    confirmation_count: 1,
    department_name: "Municipal Corporation of Gurugram (MCG)",
    draft_complaint_text: "To,\nThe Commissioner,\nMunicipal Corporation of Gurugram (MCG),\nGurugram, Haryana.\n\nSubject: Severe drinking water leakage near HUDA Park in Sector 15 Part 2.\n\nDear Sir/Madam,\n\nWe would like to alert you regarding a broken pipe leaking fresh drinking water onto the pavement at Sector 15 Part 2. This is creating water pools and wasting gallons of clean water daily.\n\nKindly send an MCG plumbing crew to repair the pipeline leak.\n\nSincerely,\nConcerned Citizen,\nGurugram Hero App",
    is_hsvp_sector: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    needs_attention: false,
    status_history: [
      { status: "Reported", changed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { status: "In Progress", changed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), note: "Assigned to Ward Junior Engineer" }
    ],
    simulated_days_old: 2
  },
  {
    id: "seed-4",
    category: "Waste Management",
    severity: 5,
    auto_description: "Large dump of mixed municipal plastic waste, organic garbage, and construction debris blocking the footpath.",
    confidence: 0.97,
    lat: 28.4812,
    lng: 77.0718,
    location_name: "Near IFFCO Chowk Metro Station Exit",
    photos: ["/seed-garbage.jpg"],
    status: "Reported",
    confirmation_count: 8,
    department_name: "Gurugram Metropolitan Development Authority (GMDA)",
    draft_complaint_text: "To,\nThe Chief Executive Officer,\nGurugram Metropolitan Development Authority (GMDA),\nGurugram, Haryana.\n\nSubject: Immediate request for clearance of massive garbage accumulation near IFFCO Chowk Metro.\n\nDear Sir/Madam,\n\nThis is to formally highlight the extreme garbage heap right near the IFFCO Chowk Metro Station Exit (Coordinates: 28.4812, 77.0718). It blocks the sidewalk, emits a foul odor, and presents serious public health risks. The severity is 5.\n\nWe request a high-capacity cleaning team to clear this dump instantly.\n\nSincerely,\nConcerned Citizen,\nGurugram Hero App",
    is_hsvp_sector: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    needs_attention: false,
    status_history: [
      { status: "Reported", changed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: "Reported by commuters" }
    ],
    simulated_days_old: 5
  }
];

// Load issues helper
function loadIssues(): Issue[] {
  try {
    if (!fs.existsSync(ISSUES_FILE)) {
      const pristineSeeds = JSON.parse(JSON.stringify(SEED_ISSUES));
      fs.writeFileSync(ISSUES_FILE, JSON.stringify(pristineSeeds, null, 2));
      return pristineSeeds;
    }
    const data = fs.readFileSync(ISSUES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading issues database, using seed data:", err);
    return JSON.parse(JSON.stringify(SEED_ISSUES));
  }
}

// Save issues helper
function saveIssues(issues: Issue[]) {
  try {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2));
  } catch (err) {
    console.error("Error saving issues database:", err);
  }
}

// Haversine distance formula to calculate distance between two coordinates in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GURUGRAM_CENTER_LAT = 28.4595;
const GURUGRAM_CENTER_LNG = 77.0266;
const GURUGRAM_RADIUS_METERS = 30000; // 30 km radius threshold

function isLocationInGurugram(lat: number, lng: number): { inside: boolean; distanceKm: number } {
  const distMeters = getDistanceInMeters(lat, lng, GURUGRAM_CENTER_LAT, GURUGRAM_CENTER_LNG);
  const distanceKm = distMeters / 1000;
  const inside = distMeters <= GURUGRAM_RADIUS_METERS;
  return { inside, distanceKm };
}

app.use(express.json({ limit: "50mb" }));

// Serve local upload files
app.use("/uploads", express.static(UPLOADS_DIR));

// Fallback images in case seed images are accessed (simply serve plain pixel/canvas or mock graphics from client)
app.get("/seed-pothole.jpg", (req, res) => res.status(404).send());
app.get("/seed-streetlight.jpg", (req, res) => res.status(404).send());
app.get("/seed-water.jpg", (req, res) => res.status(404).send());
app.get("/seed-garbage.jpg", (req, res) => res.status(404).send());

// API Endpoints

// 1. Get all issues
app.get("/api/issues", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const issues = loadIssues();
  res.json(issues);
});

// 2. Clear / Reset database to seed issues
app.post("/api/issues/reset", (req, res) => {
  const { name } = req.body;
  const resetBy = name || "Unspecified Official";
  logDebug(`[RESET DB] Database reset by ${resetBy}`);

  const currentIssues = loadIssues();
  console.log(`[RESET DB] Received reset request. Count BEFORE reset: ${currentIssues.length}, IDs:`, currentIssues.map(i => i.id));
  console.log("RESET DB: writing to", ISSUES_FILE);
  const pristineSeeds = JSON.parse(JSON.stringify(SEED_ISSUES));
  saveIssues(pristineSeeds);
  
  // Re-read physical file from disk to verify
  try {
    const verifiedData = fs.readFileSync(ISSUES_FILE, "utf-8");
    console.log("RESET DB: Verification - File successfully written. Current contents on disk:");
    console.log(verifiedData);
  } catch (err) {
    console.error("RESET DB ERROR: Failed to read back written file:", err);
  }

  res.json({ message: "Database reset to seeds successfully", issues: pristineSeeds });
});

// 3. Increment confirmation count for "I see this too"
app.post("/api/issues/:id/confirm", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const issues = loadIssues();
  const issueIndex = issues.findIndex((i) => i.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = issues[issueIndex];
  issue.confirmation_count += 1;
  issue.updated_at = new Date().toISOString();
  
  if (name) {
    if (!issue.confirmers) {
      issue.confirmers = [];
    }
    if (!issue.confirmers.includes(name)) {
      issue.confirmers.push(name);
    }
  }

  issue.status_history.push({
    status: issue.status,
    changed_at: new Date().toISOString(),
    note: name ? `Community confirmation ('I see this too' clicked by ${name}).` : "Community confirmation ('I see this too' clicked)."
  });

  saveIssues(issues);
  res.json(issues[issueIndex]);
});

// 4. Update status
app.post("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const validStatuses = ["Reported", "Verified", "In Progress", "Resolved"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const issues = loadIssues();
  const issueIndex = issues.findIndex((i) => i.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  issues[issueIndex].status = status;
  issues[issueIndex].updated_at = new Date().toISOString();
  issues[issueIndex].status_history.push({
    status,
    changed_at: new Date().toISOString(),
    note: note || `Status updated to ${status}`
  });

  saveIssues(issues);
  res.json(issues[issueIndex]);
});

// 5. Image analysis via Gemini
app.post("/api/analyze-image", async (req, res) => {
  const { base64Image, mimeType } = req.body;

  if (!base64Image || !mimeType) {
    return res.status(400).json({ error: "Image data and mimeType are required" });
  }

  // Detect demo SVG presets to ensure perfect deterministic hackathon behavior
  const isSvgPreset = base64Image.includes("<svg") || mimeType.includes("svg") || base64Image.includes("data:image/svg");
  if (isSvgPreset) {
    let category: "Pothole" | "Water Leakage" | "Streetlight" | "Waste Management" | "Infrastructure" | "Other" = "Other";
    let severity = 3;
    let auto_description = "A visual civic issue reported in Gurugram.";
    let confidence = 0.99;

    if (base64Image.includes("DEMO POTHOLE IMAGE")) {
      category = "Pothole";
      severity = 4;
      auto_description = "Multiple deep craters visible on the main tarmac road, disrupting traffic and causing safety hazards.";
    } else if (base64Image.includes("DEMO BROKEN STREETLIGHT")) {
      category = "Streetlight";
      severity = 3;
      auto_description = "A damaged streetlight fixture with hanging wires, making the immediate neighborhood street pitch dark.";
    } else if (base64Image.includes("DEMO GARBAGE HEAP")) {
      category = "Waste Management";
      severity = 5;
      auto_description = "Large dump of mixed municipal plastic waste, organic garbage, and construction debris blocking the footpath.";
    } else if (base64Image.includes("DEMO WATER PIPELINE LEAK")) {
      category = "Water Leakage";
      severity = 2;
      auto_description = "Drinking water pipeline leakage spraying water continuously onto the pavement, causing waterlogging.";
    }

    const mockResponseJson = JSON.stringify({
      category,
      severity,
      auto_description,
      confidence
    }, null, 2);

    console.log(`[DEMO PRESET BYPASS] Detected SVG preset image. Automatically resolving to category: "${category}"`);

    return res.json({
      success: true,
      data: {
        category,
        severity,
        auto_description,
        confidence
      },
      raw_analysis_json: mockResponseJson
    });
  }

  // Graceful retry once
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Analyze this image of a civic issue in Gurugram, India. Categorize the issue strictly as one of the following: 'Pothole', 'Water Leakage', 'Streetlight', 'Waste Management', 'Infrastructure', or 'Other'. Determine the severity level on an integer scale of 1 to 5 (1 being minor, 5 being extremely hazardous/critical). Write a brief 1-2 sentence description of the visible issue. Provide a confidence value from 0.0 to 1.0. Format the response strictly as valid JSON.",
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "One of: Pothole, Water Leakage, Streetlight, Waste Management, Infrastructure, Other",
              },
              severity: {
                type: Type.INTEGER,
                description: "Severity level of the civic issue from 1 to 5",
              },
              auto_description: {
                type: Type.STRING,
                description: "A 1-2 sentence description of what's visible in the image",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence level of the categorization, float between 0.0 and 1.0",
              },
            },
            required: ["category", "severity", "auto_description", "confidence"],
          },
        },
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());

      // Validate categories
      const validCategories = ["Pothole", "Water Leakage", "Streetlight", "Waste Management", "Infrastructure", "Other"];
      if (!validCategories.includes(parsedData.category)) {
        parsedData.category = "Other";
      }
      parsedData.severity = Math.max(1, Math.min(5, Number(parsedData.severity) || 3));
      parsedData.confidence = Math.max(0, Math.min(1, Number(parsedData.confidence) || 0.8));

      return res.json({
        success: true,
        data: parsedData,
        raw_analysis_json: responseText
      });
    } catch (err: any) {
      attempts++;
      console.warn(`Gemini analysis attempt ${attempts} failed:`, err.message || err);
      if (attempts >= maxAttempts) {
        // Ultimate fallback to prevent crashing
        return res.json({
          success: false,
          error: "Failed to analyze image via Gemini API. Applied fallback estimation.",
          data: {
            category: "Other",
            severity: 3,
            auto_description: "A visual issue reported in Gurugram. (Image analysis estimated due to API rate limit/timeout)",
            confidence: 0.5
          },
          raw_analysis_json: JSON.stringify({ error: err.message || String(err) })
        });
      }
    }
  }
});

// 6. Complaint drafting via Gemini
app.post("/api/draft-complaint", async (req, res) => {
  const { category, severity, auto_description, lat, lng, location_name, is_hsvp_sector } = req.body;

  const { inside: isGurugram, distanceKm } = isLocationInGurugram(lat, lng);
  logDebug(`[API DRAFT COMPLAINT] Received coordinates: Lat ${lat}, Lng ${lng}. Calculated distance from Gurugram Center is ${distanceKm.toFixed(2)} km. Judged inside threshold (30km): ${isGurugram}`);

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      let prompt = "";
      if (isGurugram) {
        prompt = `You are a professional civic engagement and complaint router assistant for Gurugram, Haryana, India.
Draft a formal complaint letter and select the correct government department for this reported issue:
Category: ${category}
Severity Level: ${severity}/5
Description: ${auto_description}
Location: ${location_name || 'Gurugram'} (Coordinates: ${lat}, ${lng})
Locality Specified as HSVP Sector vs MCG Area: ${is_hsvp_sector ? "HSVP sector" : "MCG area (or unspecified)"}

Follow these exact routing rules to choose the 'department_name' (Gurugram's overlapping jurisdictions):
1. For streetlights, electrical faults, transformer sparks, or power infrastructure issues, route to: "Dakshin Haryana Bijli Vitran Nigam (DHBVN)"
2. If the user explicitly notes their locality is inside an "HSVP sector" AND the issue is internal sector infrastructure, parks, sector markets, route to: "Haryana Shehri Vikas Pradhikaran (HSVP)"
3. If the issue is on main/master roads, larger road widening/drainage projects, or citywide water supply augmentation, route to: "Gurugram Metropolitan Development Authority (GMDA)"
4. For potholes or road damage on internal sector roads, residential streets, garbage pileups, sanitation, sewage/drainage blocks, route to: "Municipal Corporation of Gurugram (MCG)" (as MCG has taken over most internal maintenance from HSVP).

Write the complaint formally, addressing the respective department head. Outline the problem, coordinates, severity, and make a strong but polite request for resolution. Do not include placeholders like [Your Name]; sign off as "Concerned Citizen, Gurugram Hero Platform".`;
      } else {
        prompt = `You are a professional civic engagement and complaint router assistant for any global city/locality.
The reported issue is located OUTSIDE of Gurugram's municipal borders:
Category: ${category}
Severity Level: ${severity}/5
Description: ${auto_description}
Location: ${location_name || 'Generic Locality'} (Coordinates: ${lat}, ${lng})

Since this is outside Gurugram, we cannot route to Gurugram-specific agencies (MCG, GMDA, HSVP, DHBVN).
Instead, follow these guidelines:
1. Choose the department_name as "Local Civic Authority (Non-Gurugram Fallback)".
2. Compose a formal, helpful civic complaint letter directed to the general local municipal commissioner or local civic administration for these coordinates.
3. Explicitly include a working Google Maps search link to the exact coordinates in the letter text using exactly this URL: https://www.google.com/maps/search/?api=1&query=${lat},${lng}

Write the complaint formally, addressing the respective department head. Outline the problem, coordinates, severity, and make a strong but polite request for resolution. Do not include placeholders like [Your Name]; sign off as "Concerned Citizen, Community Hero Platform".`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              department_name: {
                type: Type.STRING,
                description: "Exactly one of: Municipal Corporation of Gurugram (MCG), Gurugram Metropolitan Development Authority (GMDA), Haryana Shehri Vikas Pradhikaran (HSVP), Dakshin Haryana Bijli Vitran Nigam (DHBVN), Local Civic Authority (Non-Gurugram Fallback)",
              },
              draft_complaint_text: {
                type: Type.STRING,
                description: "Fully composed, formal, polite, urgent civic complaint letter referencing coordinates, category, and request for resolution.",
              }
            },
            required: ["department_name", "draft_complaint_text"],
          }
        }
      });

      const responseText = response.text || "";
      const parsedData = JSON.parse(responseText.trim());

      // Server-side safety backup check to guarantee valid department routing fallback
      const validDepts = [
        "Municipal Corporation of Gurugram (MCG)",
        "Gurugram Metropolitan Development Authority (GMDA)",
        "Haryana Shehri Vikas Pradhikaran (HSVP)",
        "Dakshin Haryana Bijli Vitran Nigam (DHBVN)",
        "Local Civic Authority (Non-Gurugram Fallback)"
      ];
      if (!validDepts.includes(parsedData.department_name)) {
        if (!isGurugram) {
          parsedData.department_name = "Local Civic Authority (Non-Gurugram Fallback)";
        } else {
          // Fallback calculation in case Gemini outputs something slightly different
          if (category === "Streetlight") {
            parsedData.department_name = "Dakshin Haryana Bijli Vitran Nigam (DHBVN)";
          } else if (is_hsvp_sector) {
            parsedData.department_name = "Haryana Shehri Vikas Pradhikaran (HSVP)";
          } else if (category === "Infrastructure" && severity >= 4) {
            parsedData.department_name = "Gurugram Metropolitan Development Authority (GMDA)";
          } else {
            parsedData.department_name = "Municipal Corporation of Gurugram (MCG)";
          }
        }
      }

      return res.json({
        success: true,
        data: parsedData,
        raw_complaint_json: responseText
      });
    } catch (err: any) {
      attempts++;
      console.warn(`Gemini drafting attempt ${attempts} failed:`, err.message || err);
      if (attempts >= maxAttempts) {
        // Backup Local Rules fallback
        let fallbackDept = "Municipal Corporation of Gurugram (MCG)";
        if (!isGurugram) {
          fallbackDept = "Local Civic Authority (Non-Gurugram Fallback)";
        } else if (category === "Streetlight") {
          fallbackDept = "Dakshin Haryana Bijli Vitran Nigam (DHBVN)";
        } else if (is_hsvp_sector) {
          fallbackDept = "Haryana Shehri Vikas Pradhikaran (HSVP)";
        } else if (category === "Infrastructure" && severity >= 4) {
          fallbackDept = "Gurugram Metropolitan Development Authority (GMDA)";
        }

        let fallbackText = "";
        if (!isGurugram) {
          fallbackText = `To,\nThe Commissioner/Head,\n${fallbackDept},\nLocal Administration.\n\nSubject: Formal Complaint: ${category} issue.\n\nDear Sir/Madam,\n\nWe hereby bring to your attention a civic grievance categorized under "${category}" located at coordinates ${lat}, ${lng} (${location_name || 'Local Area'}).\n\nGoogle Maps Link: https://www.google.com/maps/search/?api=1&query=${lat},${lng}\n\nThe issue is described as: ${auto_description}.\n\nGiven the severity rating of ${severity}/5, we request your department to inspect this spot and implement a swift repair/cleanup strategy to prevent further inconvenience to local residents and commuters.\n\nThank you,\nConcerned Citizen,\nCommunity Hero Platform`;
        } else {
          fallbackText = `To,\nThe Commissioner/Head,\n${fallbackDept},\nGurugram, Haryana.\n\nSubject: Formal Complaint: ${category} issue in Gurugram.\n\nDear Sir/Madam,\n\nWe hereby bring to your attention a civic grievance categorized under "${category}" located at coordinates ${lat}, ${lng} (${location_name || 'Gurugram'}).\n\nThe issue is described as: ${auto_description}.\n\nGiven the severity rating of ${severity}/5, we request your department to inspect this spot and implement a swift repair/cleanup strategy to prevent further inconvenience to local residents and commuters.\n\nThank you,\nConcerned Citizen,\nCommunity Hero Platform`;
        }

        return res.json({
          success: false,
          error: "Failed to generate complaint draft via Gemini API. Applied rule-based backup draft.",
          data: {
            department_name: fallbackDept,
            draft_complaint_text: fallbackText
          },
          raw_complaint_json: JSON.stringify({ error: err.message || String(err) })
        });
      }
    }
  }
});

// 7. Submit Issue (with deduplication)
app.post("/api/issues", (req, res) => {
  const {
    category,
    severity,
    auto_description,
    confidence,
    lat,
    lng,
    location_name,
    base64Image,
    mimeType,
    is_hsvp_sector,
    department_name,
    draft_complaint_text,
    raw_analysis_json,
    raw_complaint_json
  } = req.body;

  if (!category || !lat || !lng) {
    return res.status(400).json({ error: "Category, Latitude, and Longitude are required" });
  }

  const issues = loadIssues();

  // Deduplication check: status is NOT Resolved AND same category AND within 100 meters
  logDebug(`\n--- [SUBMIT ISSUE] New Submission received ---`);
  const { inside: isGurugram, distanceKm } = isLocationInGurugram(lat, lng);
  logDebug(`[BOUNDARY CHECK] Lat: ${lat}, Lng: ${lng}. Distance from Gurugram Center (${GURUGRAM_CENTER_LAT}, ${GURUGRAM_CENTER_LNG}) is ${distanceKm.toFixed(2)} km. Inside threshold (30km): ${isGurugram}`);
  console.log(`Category: "${category}"`);
  console.log(`Checking against ${issues.length} existing tickets for deduplication...`);

  const MATCH_THRESHOLD_METERS = 100;
  const duplicateIssue = issues.find((issue) => {
    if (issue.status === "Resolved") {
      console.log(`  -> Ticket ${issue.id} ignored: Status is 'Resolved'`);
      return false;
    }
    if (issue.category !== category) {
      console.log(`  -> Ticket ${issue.id} ignored: Category mismatch ("${issue.category}" vs "${category}")`);
      return false;
    }
    const dist = getDistanceInMeters(lat, lng, issue.lat, issue.lng);
    console.log(`  -> Ticket ${issue.id} comparison: distance is ${dist.toFixed(2)} meters (Threshold: ${MATCH_THRESHOLD_METERS}m)`);
    if (dist <= MATCH_THRESHOLD_METERS) {
      console.log(`  [DUPLICATE MATCH FOUND] Ticket ${issue.id} matches within ${MATCH_THRESHOLD_METERS}m!`);
      return true;
    }
    return false;
  });
  console.log(`Deduplication check completed. Duplicate found: ${duplicateIssue ? duplicateIssue.id : "None"}\n`);

  // Save the uploaded base64 image as a static local file
  let savedPhotoUrl = "";
  if (base64Image && mimeType) {
    try {
      const fileExt = mimeType.split("/")[1] || "jpg";
      const fileName = `issue_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      const cleanedBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(cleanedBase64, "base64"));
      savedPhotoUrl = `/uploads/${fileName}`;
    } catch (err) {
      console.error("Failed to save image file, defaulting to inline preview:", err);
      savedPhotoUrl = `data:${mimeType};base64,${base64Image}`;
    }
  }

  if (duplicateIssue) {
    // Increment confirmation count, append photo, log history, and return duplicate flag
    duplicateIssue.confirmation_count += 1;
    if (savedPhotoUrl) {
      duplicateIssue.photos.push(savedPhotoUrl);
    }
    duplicateIssue.updated_at = new Date().toISOString();
    
    const repName = req.body.reporter_name || "Citizen";
    if (!duplicateIssue.confirmers) {
      duplicateIssue.confirmers = [];
    }
    if (!duplicateIssue.confirmers.includes(repName)) {
      duplicateIssue.confirmers.push(repName);
    }

    duplicateIssue.status_history.push({
      status: duplicateIssue.status,
      changed_at: new Date().toISOString(),
      note: `Duplicate issue reported within ${MATCH_THRESHOLD_METERS}m of coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}). Incrementing confirmation count & attaching new photo. Confirmed by ${repName}.`
    });

    console.log(`[CREATE ISSUE - MERGING DUPLICATE] Saving issues. Total count: ${issues.length}, IDs:`, issues.map(i => i.id));
    saveIssues(issues);
    return res.json({
      is_duplicate: true,
      issue: duplicateIssue,
      message: "An active issue matching this category was found nearby. Your report has been merged as a confirmation with supporting evidence!"
    });
  }

  // Create new issue record
  const repName = req.body.reporter_name || "Citizen";
  const newIssue: Issue = {
    id: `issue-${Date.now()}`,
    category,
    severity,
    auto_description,
    confidence,
    lat,
    lng,
    location_name: location_name || (isGurugram ? `Sector, Gurugram (${lat.toFixed(4)}, ${lng.toFixed(4)})` : `External Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`),
    photos: savedPhotoUrl ? [savedPhotoUrl] : [],
    status: "Reported",
    confirmation_count: 1,
    department_name: department_name || (isGurugram ? "Municipal Corporation of Gurugram (MCG)" : "Local Civic Authority (Non-Gurugram Fallback)"),
    draft_complaint_text: draft_complaint_text || "Formal complaint drafting in progress.",
    is_hsvp_sector: !!is_hsvp_sector,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    needs_attention: false,
    status_history: [
      { status: "Reported", changed_at: new Date().toISOString(), note: `Civic issue reported initially via Community Hero portal by ${repName}.` }
    ],
    raw_analysis_json,
    raw_complaint_json,
    simulated_days_old: 0,
    reporter_name: repName,
    confirmers: [repName]
  };

  issues.push(newIssue);
  console.log(`[CREATE ISSUE - NEW ISSUE] Saving issues. Total count: ${issues.length}, IDs:`, issues.map(i => i.id));
  saveIssues(issues);

  res.json({
    is_duplicate: false,
    issue: newIssue,
    message: "New civic issue successfully logged. AI-powered complaint draft created!"
  });
});

// 8. Trigger/Simulate Fast-Forward Days (Escalation Check)
app.post("/api/issues/fast-forward", async (req, res) => {
  const { daysToFastForward } = req.body;
  const days = Number(daysToFastForward) || 1;
  const issues = loadIssues();

  let escalatedCount = 0;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    // Advance days
    issue.simulated_days_old = (issue.simulated_days_old || 0) + days;

    // Escalation criteria: status is "Reported" or "Verified" AND days old > 3 AND not already flagged as needs_attention
    if ((issue.status === "Reported" || issue.status === "Verified") && issue.simulated_days_old > 3 && !issue.needs_attention) {
      issue.needs_attention = true;
      const oldSeverity = issue.severity;
      issue.severity = Math.min(5, issue.severity + 1);
      issue.updated_at = new Date().toISOString();
      escalatedCount++;

      issue.status_history.push({
        status: issue.status,
        changed_at: new Date().toISOString(),
        note: `ESCALATION TRIGGERED: Issue has remained unresolved for ${issue.simulated_days_old} days. Severity boosted from ${oldSeverity} to ${issue.severity}. Marked as 'Needs Attention'.`
      });

      // Regenerate draft complaint text with more urgent language mentioning the delay
      try {
        const urgentPrompt = `You are a professional civic engagement and complaint router assistant for Gurugram, Haryana, India.
This complaint has been severely delayed and remains unresolved. It has been active for ${issue.simulated_days_old} days.
Please regenerate the formal complaint letter with highly urgent, strict, yet formal language highlighting this delay and demanding an immediate audit.

Original details:
Department: ${issue.department_name}
Category: ${issue.category}
Escalated Severity Level: ${issue.severity}/5 (Bumped up due to neglect)
Description: ${issue.auto_description}
Location: ${issue.location_name} (Coordinates: ${issue.lat}, ${issue.lng})

The letter must reference the delay (unresolved for ${issue.simulated_days_old} days) and demand immediate intervention. Format the output as JSON with the 'draft_complaint_text' key.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: urgentPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                draft_complaint_text: {
                  type: Type.STRING,
                  description: "Strongly worded, urgent formal complaint demanding immediate audit and citing delay.",
                }
              },
              required: ["draft_complaint_text"],
            }
          }
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        if (parsed.draft_complaint_text) {
          issue.draft_complaint_text = parsed.draft_complaint_text;
          issue.raw_complaint_json = response.text;
        }
      } catch (err: any) {
        console.warn(`Failed to regenerate urgent complaint for issue ${issue.id}:`, err.message || err);
        // Fallback modification
        issue.draft_complaint_text = `*** URGENT DELAY REMINDER ***\n\nTo,\nThe Head of Department,\n${issue.department_name},\nGurugram, Haryana.\n\nSubject: URGENT ESCALATED COMPLAINT: ${issue.category} - UNRESOLVED FOR ${issue.simulated_days_old} DAYS\n\nDear Sir/Madam,\n\nWe are issuing this urgent, escalated reminder regarding the critical civic grievance first reported on ${new Date(issue.created_at).toLocaleDateString()}. Despite passing ${issue.simulated_days_old} days, this issue has remained in '${issue.status}' status without progress.\n\nThe severity level has now escalated to ${issue.severity}/5. We demand an immediate site audit and remedial action.\n\nSincerely,\nConcerned Citizen,\nGurugram Community Hero Portal\n(Issue Reference: ${issue.id})`;
      }
    }
  }

  saveIssues(issues);
  res.json({
    message: `Fast-forwarded by ${days} days. Checked all issues for escalation.`,
    escalatedCount,
    issues
  });
});

// Vite server middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
