import { useEffect, useRef } from "react";
import { Issue } from "../types";

interface CivicMapProps {
  issues: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue?: (issue: Issue) => void;
  center?: [number, number];
  zoom?: number;
}

export default function CivicMap({
  issues,
  selectedIssueId,
  onSelectIssue,
  center = [28.4595, 77.0266],
  zoom = 13,
}: CivicMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || !(window as any).L) return;

    const L = (window as any).L;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync view when center changes (but only if map is active and selectedIssueId shifts)
  useEffect(() => {
    if (mapRef.current && center) {
      const L = (window as any).L;
      if (L) {
        mapRef.current.setView(center, zoom);
      }
    }
  }, [center, zoom]);

  // Sync markers and active popups
  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    issues.forEach((issue) => {
      // Color-coding: green=1-2, yellow=3, red=4-5
      let pinBg = "bg-emerald-500";
      let pinColor = "#10b981"; // green
      let glowBg = "bg-emerald-400";
      if (issue.severity === 3) {
        pinBg = "bg-amber-500";
        pinColor = "#f59e0b"; // yellow
        glowBg = "bg-amber-400";
      } else if (issue.severity >= 4) {
        pinBg = "bg-rose-600";
        pinColor = "#e11d48"; // red
        glowBg = "bg-rose-500";
      }

      // Pulse ring for escalated issues
      const isEscalated = issue.needs_attention;

      const markerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 group">
          <div class="absolute w-4 h-4 rounded-full border border-white shadow-lg ${isEscalated ? 'animate-ping duration-1000' : 'animate-pulse'} opacity-40 ${glowBg}"></div>
          <div class="w-6 h-6 rounded-full border border-white shadow-md flex items-center justify-center text-[11px] font-bold text-white transition-all duration-200 transform group-hover:scale-125 ${pinBg}">
            ${issue.severity}
          </div>
          ${
            isEscalated
              ? `<span class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                   <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border border-white flex items-center justify-center text-[8px] text-white font-extrabold">!</span>
                 </span>`
              : ""
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-map-pin",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([issue.lat, issue.lng], { icon: customIcon }).addTo(mapRef.current);

      const statusColors: Record<string, string> = {
        Reported: "bg-blue-100 text-blue-800",
        Verified: "bg-purple-100 text-purple-800",
        "In Progress": "bg-amber-100 text-amber-800",
        Resolved: "bg-emerald-100 text-emerald-800",
      };

      const popupContent = `
        <div class="p-2 min-w-[210px] font-sans">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style="background-color: ${pinColor}">
              Severity ${issue.severity}/5
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusColors[issue.status] || "bg-slate-100"}">
              ${issue.status}
            </span>
          </div>
          <h4 class="text-xs font-bold text-slate-800 mb-0.5">${issue.category}</h4>
          <p class="text-[10.5px] text-slate-500 font-medium leading-tight mb-1 truncate">${issue.location_name}</p>
          <p class="text-[11px] text-slate-600 line-clamp-2 italic mb-2">"${issue.auto_description}"</p>
          <div class="flex items-center justify-between pt-1 border-t border-slate-100">
            <span class="text-[9.5px] text-slate-400 font-semibold">${issue.confirmation_count} confirmations</span>
            <span class="text-[9.5px] text-blue-600 font-bold hover:underline cursor-pointer" id="popup-btn-${issue.id}">View Details →</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        offset: [0, -4],
      });

      marker.on("click", () => {
        if (onSelectIssue) {
          onSelectIssue(issue);
        }
      });

      markersRef.current.push(marker);

      // Trigger standard callback when clicking popup button
      marker.on("popupopen", () => {
        const btn = document.getElementById(`popup-btn-${issue.id}`);
        if (btn) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (onSelectIssue) {
              onSelectIssue(issue);
            }
          });
        }
      });

      // If selected
      if (selectedIssueId === issue.id) {
        setTimeout(() => {
          marker.openPopup();
          mapRef.current.setView([issue.lat, issue.lng], 15);
        }, 100);
      }
    });
  }, [issues, selectedIssueId]);

  return (
    <div className="w-full h-full relative group">
      <div id="civic-issue-map" ref={containerRef} className="w-full h-full rounded-2xl shadow-inner border border-slate-200 z-10" />
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs py-1.5 px-3 rounded-lg border border-slate-200 shadow-sm z-20 text-[10px] font-semibold text-slate-600 flex gap-4 items-center">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white"></span> Severity 1-2</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white"></span> Severity 3</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block border border-white"></span> Severity 4-5</span>
      </div>
    </div>
  );
}
