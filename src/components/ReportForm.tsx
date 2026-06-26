import React, { useState, useEffect } from "react";
import { IssueCategory, Issue } from "../types";
import { Camera, MapPin, CheckCircle, AlertTriangle, Cpu, FileText, HelpCircle, RefreshCw } from "lucide-react";

interface ReportFormProps {
  onReportSubmitted: (data: {
    is_duplicate: boolean;
    issue: Issue;
    message: string;
  }) => void;
  onNavigateToMap: (issueId: string) => void;
}

// Famous Gurugram landmarks & coordinates for perfect fallback
const GURUGRAM_SECTORS = [
  { name: "Sector 29 Market (Internal Road, Cafes & Sector Parks)", lat: 28.4682, lng: 77.0620, isHsvp: false, desc: "Sector 29 Cafe Market area, Gurugram" },
  { name: "Sector 56 HUDA Market (Residential Housing Sector)", lat: 28.4352, lng: 77.0835, isHsvp: true, desc: "Sector 56 HUDA Market Residential Area, Gurugram" },
  { name: "IFFCO Chowk Metro Station Exit (GMDA Master Road & NH-48)", lat: 28.4812, lng: 77.0718, isHsvp: false, desc: "IFFCO Chowk flyover zone, Sector 17, Gurugram" },
  { name: "Sector 15 Part 2 (High Density MCG Residential Ward)", lat: 28.4554, lng: 77.0392, isHsvp: false, desc: "Sector 15 Part 2 Residential Complex, Gurugram" },
  { name: "DLF Phase 3 (Cyber City commercial road boundary)", lat: 28.4905, lng: 77.0801, isHsvp: false, desc: "DLF Phase 3, Near Cyber City, Gurugram" },
  { name: "Golf Course Road (GMDA Master Sewerage/Water Expansion)", lat: 28.4485, lng: 77.0982, isHsvp: false, desc: "Golf Course Road, DLF Phase 5, Gurugram" },
  { name: "Sector 82 New Gurugram (Emerging MCG sector zone)", lat: 28.3995, lng: 76.9698, isHsvp: true, desc: "Sector 82 residential lane, New Gurugram" }
];

// High-quality colored SVG representation base64 strings so the demo can run instantly with visual placeholders!
const PRESET_PHOTOS = {
  Pothole: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23555555'/><circle cx='200' cy='150' r='80' fill='%23111111'/><circle cx='180' cy='140' r='40' fill='%23333333'/><path d='M 120 180 Q 200 240 280 180' stroke='black' stroke-width='4' fill='none'/><text x='20' y='40' fill='white' font-family='sans-serif' font-weight='bold' font-size='16'>DEMO POTHOLE IMAGE (SECTOR 29 ROAD)</text></svg>",
  Streetlight: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23111827'/><line x1='200' y1='50' x2='200' y2='250' stroke='%234b5563' stroke-width='8'/><circle cx='200' cy='50' r='20' fill='%23f59e0b' opacity='0.2'/><circle cx='200' cy='50' r='10' fill='%239ca3af'/><path d='M 200 60 L 230 110 M 200 80 L 170 120' stroke='%23ef4444' stroke-width='3' stroke-dasharray='4'/><text x='20' y='40' fill='white' font-family='sans-serif' font-weight='bold' font-size='16'>DEMO BROKEN STREETLIGHT (DHBVN FAULT)</text></svg>",
  Waste: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%234b5320'/><path d='M 100 250 L 150 180 L 200 250 M 180 250 L 230 150 L 300 250 M 50 250 Q 200 120 350 250' fill='%23854d0e' opacity='0.8'/><circle cx='140' cy='220' r='12' fill='%23b45309'/><circle cx='240' cy='210' r='15' fill='%23a16207'/><text x='20' y='40' fill='white' font-family='sans-serif' font-weight='bold' font-size='16'>DEMO GARBAGE HEAP (MCG SANITATION)</text></svg>",
  Water: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230284c7'/><circle cx='200' cy='150' r='50' fill='none' stroke='white' stroke-width='6' opacity='0.5'/><circle cx='200' cy='150' r='30' fill='none' stroke='white' stroke-width='4' opacity='0.7'/><path d='M 150 220 Q 200 120 250 220' stroke='%2338bdf8' stroke-width='8' fill='none'/><text x='20' y='40' fill='white' font-family='sans-serif' font-weight='bold' font-size='16'>DEMO WATER PIPELINE LEAK (GMDA PIPE)</text></svg>"
};

export default function ReportForm({ onReportSubmitted, onNavigateToMap }: ReportFormProps) {
  // Input fields
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>("");
  const [latitude, setLatitude] = useState<number>(28.4682);
  const [longitude, setLongitude] = useState<number>(77.0620);
  const [locationName, setLocationName] = useState<string>("Sector 29 Market, Gurugram");
  const [isHsvpSector, setIsHsvpSector] = useState<boolean>(false);

  // Flow control
  const [step, setStep] = useState<number>(1); // 1: Photo & Loc, 2: AI Analysis, 3: Complaint Draft, 4: Submit Result
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // AI results
  const [aiAnalysis, setAiAnalysis] = useState<{
    category: IssueCategory;
    severity: number;
    auto_description: string;
    confidence: number;
  } | null>(null);
  const [rawAnalysisJson, setRawAnalysisJson] = useState<string>("");

  const [aiComplaint, setAiComplaint] = useState<{
    department_name: string;
    draft_complaint_text: string;
  } | null>(null);
  const [rawComplaintJson, setRawComplaintJson] = useState<string>("");

  // Auto-request Geolocation and Camera permissions on mount
  useEffect(() => {
    // 1. Request camera permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Immediately stop tracks to close camera
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((err) => {
          console.warn("Camera permission prompt error or denied:", err);
        });
    }

    // 2. Request geolocation permission & auto-fill
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationName(`Gurugram Lat ${position.coords.latitude.toFixed(4)}, Lng ${position.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          console.warn("Initial automatic geolocation prompt error or denied:", err);
        }
      );
    }
  }, []);

  // Server response
  const [submitResult, setSubmitResult] = useState<{
    is_duplicate: boolean;
    issue: Issue;
    message: string;
  } | null>(null);

  // File upload reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setStep(1); // reset step if new photo uploaded
      setAiAnalysis(null);
      setAiComplaint(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Preset selector helper
  const handleSelectPreset = (key: keyof typeof PRESET_PHOTOS) => {
    setPhoto(PRESET_PHOTOS[key]);
    setPhotoMimeType("image/svg+xml");
    setStep(1);
    setAiAnalysis(null);
    setAiComplaint(null);
    setError(null);

    // Auto-match locations to match the seeds for exciting dedup/merge demos!
    if (key === "Pothole") {
      setLatitude(28.4682);
      setLongitude(77.0620);
      setLocationName("Sector 29, Near Leisure Valley Road");
      setIsHsvpSector(false);
    } else if (key === "Streetlight") {
      setLatitude(28.4352);
      setLongitude(77.0835);
      setLocationName("Sector 56, Near HUDA Market Lane 3");
      setIsHsvpSector(true);
    } else if (key === "Waste") {
      setLatitude(28.4812);
      setLongitude(77.0718);
      setLocationName("Near IFFCO Chowk Metro Station Exit");
      setIsHsvpSector(false);
    } else if (key === "Water") {
      setLatitude(28.4554);
      setLongitude(77.0392);
      setLocationName("Sector 15 Part 2, Near HUDA Park");
      setIsHsvpSector(false);
    }
  };

  // Browser geolocation
  const handleGeolocate = () => {
    setLoading(true);
    setLoadingMsg("Acquiring GPS Signal...");
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please use manual selection.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationName(`Gurugram Lat ${position.coords.latitude.toFixed(4)}, Lng ${position.coords.longitude.toFixed(4)}`);
        setLoading(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setError("Could not retrieve precise location. Please choose a nearby Sector using the dropdown list.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Custom sector select handler
  const handleSectorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    if (isNaN(idx)) return;
    const sector = GURUGRAM_SECTORS[idx];
    setLatitude(sector.lat);
    setLongitude(sector.lng);
    setLocationName(sector.desc);
    setIsHsvpSector(sector.isHsvp);
    setError(null);
  };

  // STEP 1: Image Analysis Call
  const handleRunImageAnalysis = async () => {
    if (!photo) {
      setError("Please select/upload an image first.");
      return;
    }

    setLoading(true);
    setLoadingMsg("Analyzing image using multimodal Gemini 3.5 Flash...");
    setError(null);

    try {
      const cleanedBase64 = photo.replace(/^data:image\/\w+;base64,/, "");
      let mime = photoMimeType;
      if (!mime || mime.includes("svg")) {
        // Gemini expects typical raster images. If SVG preset, we convert mime to image/jpeg or send as is
        mime = "image/png";
      }

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: cleanedBase64,
          mimeType: mime
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success && !data.data) {
        throw new Error(data.error || "Failed to analyze image.");
      }

      setAiAnalysis(data.data);
      setRawAnalysisJson(data.raw_analysis_json || JSON.stringify(data.data, null, 2));
      setStep(2); // advance to review / draft complaint
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during image analysis.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Complaint Drafting Call
  const handleDraftComplaint = async () => {
    if (!aiAnalysis) return;

    setLoading(true);
    setLoadingMsg("Determining department jurisdiction and drafting complaint text...");
    setError(null);

    try {
      const res = await fetch("/api/draft-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: aiAnalysis.category,
          severity: aiAnalysis.severity,
          auto_description: aiAnalysis.auto_description,
          lat: latitude,
          lng: longitude,
          location_name: locationName,
          is_hsvp_sector: isHsvpSector
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success && !data.data) {
        throw new Error(data.error || "Failed to draft complaint.");
      }

      setAiComplaint(data.data);
      setRawComplaintJson(data.raw_complaint_json || JSON.stringify(data.data, null, 2));
      setStep(3); // advance to final submit
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during complaint drafting.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Submit to database
  const handleSubmitIssue = async () => {
    if (!aiAnalysis || !aiComplaint) return;

    setLoading(true);
    setLoadingMsg("Logging issue in Gurugram database and performing deduplication audit...");
    setError(null);

    try {
      const cleanedBase64 = photo?.replace(/^data:image\/\w+;base64,/, "");
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: aiAnalysis.category,
          severity: aiAnalysis.severity,
          auto_description: aiAnalysis.auto_description,
          confidence: aiAnalysis.confidence,
          lat: latitude,
          lng: longitude,
          location_name: locationName,
          base64Image: cleanedBase64,
          mimeType: photoMimeType.includes("svg") ? "image/png" : photoMimeType,
          is_hsvp_sector: isHsvpSector,
          department_name: aiComplaint.department_name,
          draft_complaint_text: aiComplaint.draft_complaint_text,
          raw_analysis_json: rawAnalysisJson,
          raw_complaint_json: rawComplaintJson,
          reporter_name: localStorage.getItem("citizen_name") || "Citizen"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit issue.");
      }

      setSubmitResult(data);
      onReportSubmitted(data);
      setStep(4); // Success screen
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during report logging.");
    } finally {
      setLoading(false);
    }
  };

  // Start over
  const handleReset = () => {
    setPhoto(null);
    setPhotoMimeType("");
    setLatitude(28.4682);
    setLongitude(77.0620);
    setLocationName("Sector 29 Market, Gurugram");
    setIsHsvpSector(false);
    setStep(1);
    setAiAnalysis(null);
    setAiComplaint(null);
    setRawAnalysisJson("");
    setRawComplaintJson("");
    setSubmitResult(null);
    setError(null);
  };

  const getSeverityBadgeClass = (severity: number) => {
    if (severity <= 2) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (severity === 3) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 text-white">
        <h2 className="font-display font-bold text-lg md:text-xl flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" />
          Report a Civic Issue
        </h2>
        <p className="text-blue-100 text-xs mt-1 max-w-md">
          Report potholes, garbage, streetlights, or water leaks. Our AI instantly analyzes images, routes complaints, and merges duplicates.
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Execution Warning</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="my-8 py-10 flex flex-col items-center justify-center text-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
              <div className="absolute inset-x-0 top-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin w-16 h-16"></div>
              <Cpu className="w-6 h-6 text-blue-600 absolute inset-0 m-auto animate-bounce" />
            </div>
            <h4 className="text-slate-800 text-sm font-bold">{loadingMsg}</h4>
            <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed animate-pulse">
              Gemini model is running real-time multimodal inferences. This typically completes in 2-4 seconds.
            </p>
          </div>
        )}

        {!loading && (
          <>
            {/* STEP 1: Upload Photo and Location */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Visual selectors */}
                <div>
                  <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-2">
                    Step 1: Upload Civic Incident Image
                  </label>
                  
                  {/* Photo picker or drop area */}
                  {!photo ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors p-6 text-center">
                      <Camera className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-xs text-slate-600 font-bold mb-1">
                        Drag and drop your image, or click to browse
                      </p>
                      <p className="text-[10px] text-slate-400 mb-4">
                        Supports JPEG, PNG, HEIC up to 10MB
                      </p>
                      
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                      >
                        Choose File
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-56 flex items-center justify-center">
                      <img
                        src={photo}
                        alt="Civic issue report preview"
                        className="object-contain max-h-56 max-w-full"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg p-1 text-[10px] px-2 font-bold"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}

                  {/* Preset Buttons for Demo */}
                  <div className="mt-4">
                    <p className="text-[11px] text-slate-400 font-bold mb-2">
                      HACKATHON DEMO SHORTCUTS (Quick Preset Images):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectPreset("Pothole")}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-left text-[10px] font-bold flex items-center gap-1.5 transition-all text-slate-700"
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-800 shrink-0"></span>
                        Pothole (Sector 29)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset("Waste")}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-left text-[10px] font-bold flex items-center gap-1.5 transition-all text-slate-700"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-800 shrink-0"></span>
                        Garbage Dump
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset("Streetlight")}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-left text-[10px] font-bold flex items-center gap-1.5 transition-all text-slate-700"
                      >
                        <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0"></span>
                        Broken Light
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset("Water")}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-left text-[10px] font-bold flex items-center gap-1.5 transition-all text-slate-700"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        Water Leakage
                      </button>
                    </div>
                  </div>
                </div>

                {/* Location Selectors */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider">
                    Step 2: Tag Incident Location in Gurugram
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gurugram Predefined Sectors */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Select Landmark/Sector Preset (Best for Demo)
                      </label>
                      <select
                        onChange={handleSectorSelect}
                        className="w-full text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-slate-700 font-medium"
                      >
                        <option value="">-- Choose sector (Syncs map coordinates) --</option>
                        {GURUGRAM_SECTORS.map((sector, idx) => (
                          <option key={idx} value={idx}>
                            {sector.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Geolocation trigger */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Live Precision Tracking
                      </label>
                      <button
                        type="button"
                        onClick={handleGeolocate}
                        className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs p-2.5 rounded-lg transition-all cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-blue-600 animate-bounce" />
                        Capture Browser Location
                      </button>
                    </div>
                  </div>

                  {/* Manual coordinates coordinates */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Latitude</span>
                        <input
                          type="number"
                          step="0.0001"
                          value={latitude}
                          onChange={(e) => setLatitude(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Longitude</span>
                        <input
                          type="number"
                          step="0.0001"
                          value={longitude}
                          onChange={(e) => setLongitude(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Locality Name / Landmarking</span>
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="e.g. Near IFFCO Chowk Metro, Sector 17"
                        className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs text-slate-800 font-medium focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Sector type checkbox */}
                    <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-blue-50/50 rounded-lg border border-blue-100">
                      <input
                        type="checkbox"
                        id="hsvp-sector-chk"
                        checked={isHsvpSector}
                        onChange={(e) => setIsHsvpSector(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded-md focus:ring-blue-500"
                      />
                      <div>
                        <label htmlFor="hsvp-sector-chk" className="text-xs font-bold text-blue-900 block cursor-pointer">
                          Mark locality as HSVP Sector area
                        </label>
                        <p className="text-[10.5px] text-blue-700/80 leading-relaxed mt-0.5">
                          Checked: internal sectors under HUDA/HSVP licensing (internal parks, market sewage). Unchecked: default roads/sanitation MCG area jurisdiction.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={!photo}
                    onClick={handleRunImageAnalysis}
                    className={`w-full py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-white ${
                      photo
                        ? "bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer"
                        : "bg-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    Step 1: Analyze Photo with Gemini AI
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Review AI Analysis & trigger Draft Complaint */}
            {step === 2 && aiAnalysis && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-100 text-emerald-800 text-xs flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Image Analyzed Successfully!</h4>
                    <p className="mt-0.5">Gemini completed structured multimodal inference.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo Preview */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                    <img src={photo || ""} alt="Uploaded" className="object-contain max-h-56 max-w-full" referrerPolicy="no-referrer" />
                  </div>

                  {/* AI Extracted Parameters */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Detected Category</span>
                      <span className="inline-block mt-1 font-bold text-sm text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                        {aiAnalysis.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Severity Score</span>
                        <span className={`inline-block mt-1 font-bold text-xs px-2.5 py-1 rounded-lg border ${getSeverityBadgeClass(aiAnalysis.severity)}`}>
                          Level {aiAnalysis.severity} / 5
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Detection Confidence</span>
                        <span className="inline-block mt-1 font-mono font-bold text-xs text-slate-700">
                          {(aiAnalysis.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto Description</span>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        "{aiAnalysis.auto_description}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show raw JSON */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      Raw Multimodal JSON Output (Demostration)
                    </span>
                  </div>
                  <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-24">
                    {rawAnalysisJson}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-2.5 px-4 font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Start Over
                  </button>
                  <button
                    type="button"
                    onClick={handleDraftComplaint}
                    className="py-2.5 px-4 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Step 2: Route Department & Draft Letter
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Review Drafted Complaint & Submit */}
            {step === 3 && aiAnalysis && aiComplaint && (
              <div className="space-y-6">
                <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-100 text-purple-800 text-xs flex gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Complaint Drafted & Routed!</h4>
                    <p className="mt-0.5">Jurisdiction algorithm executed via text-based Gemini API model.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Routed Government Division</span>
                    <span className="inline-block mt-1 font-extrabold text-xs text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                      {aiComplaint.department_name}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Jurisdiction automatically evaluated based on location classification, HSVP marking, and category.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">AI drafted civic letter</span>
                    <textarea
                      value={aiComplaint.draft_complaint_text}
                      onChange={(e) => setAiComplaint({ ...aiComplaint, draft_complaint_text: e.target.value })}
                      className="w-full text-xs font-medium text-slate-700 leading-relaxed bg-amber-50/20 border border-amber-200/60 rounded-xl p-4 h-48 focus:outline-none focus:border-amber-400 focus:bg-amber-50/30"
                    />
                  </div>
                </div>

                {/* Show raw JSON */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      Raw Text Complaint JSON Output (Demostration)
                    </span>
                  </div>
                  <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-24">
                    {rawComplaintJson}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2.5 px-4 font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Back to Step 1
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitIssue}
                    className="py-2.5 px-4 font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Submit Civic Issue Report
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success Result Screen */}
            {step === 4 && submitResult && (
              <div className="space-y-6 text-center py-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${submitResult.is_duplicate ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                  {submitResult.is_duplicate ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                </div>

                <h3 className="font-display font-extrabold text-lg text-slate-800">
                  {submitResult.is_duplicate ? "Merged into Active Issue (Deduplicated)" : "New Issue Logged Successfully"}
                </h3>
                
                <p className="text-slate-600 text-xs px-4 leading-relaxed max-w-sm mx-auto">
                  {submitResult.message}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-sm mx-auto">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400">TICKET REF</span>
                    <span className="text-[10.5px] font-mono font-bold text-slate-700">{submitResult.issue.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Category</span>
                      <span className="font-bold text-slate-800">{submitResult.issue.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Status</span>
                      <span className="font-bold text-blue-600">{submitResult.issue.status}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Confirmations</span>
                      <span className="font-bold text-slate-800">{submitResult.issue.confirmation_count} citizens</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Authority</span>
                      <span className="font-bold text-slate-800 truncate">{submitResult.issue.department_name.split(" ")[0]}...</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => onNavigateToMap(submitResult.issue.id)}
                    className="w-full py-2.5 px-4 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md rounded-xl transition-all cursor-pointer"
                  >
                    Locate on Live Map
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    File Another Report
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
