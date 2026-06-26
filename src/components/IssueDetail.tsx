import { useState } from "react";
import { Issue, IssueStatus } from "../types";
import { Copy, Check, ThumbsUp, ShieldAlert, Clock, ArrowRight, UserCheck, CheckCircle, FileText, Database, Code, RefreshCw } from "lucide-react";

interface IssueDetailProps {
  issue: Issue;
  onStatusChanged: (issueId: string, status: IssueStatus, note: string) => void;
  onConfirmClicked: (issueId: string) => void;
  onBackToList?: () => void;
}

export default function IssueDetail({
  issue,
  onStatusChanged,
  onConfirmClicked,
  onBackToList,
}: IssueDetailProps) {
  const [activeTab, setActiveTab] = useState<"details" | "complaint" | "developer">("details");
  const [copied, setCopied] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const handleCopyComplaint = () => {
    navigator.clipboard.writeText(issue.draft_complaint_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusUpdateSubmit = (status: IssueStatus) => {
    onStatusChanged(issue.id, status, statusNote.trim() || `Status manually advanced to ${status}.`);
    setStatusNote("");
    setIsUpdatingStatus(false);
  };

  const severityColors = (sev: number) => {
    if (sev <= 2) return "bg-emerald-500 text-white";
    if (sev === 3) return "bg-amber-500 text-white";
    return "bg-rose-600 text-white";
  };

  const statusTags = {
    Reported: "bg-blue-100 text-blue-800 border-blue-200",
    Verified: "bg-purple-100 text-purple-800 border-purple-200",
    "In Progress": "bg-amber-100 text-amber-800 border-amber-200",
    Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden font-sans flex flex-col h-full">
      {/* Detail Header */}
      <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
              Ref: {issue.id}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${statusTags[issue.status]}`}>
              {issue.status}
            </span>
            {issue.needs_attention && (
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                <ShieldAlert className="w-3 h-3" /> Escalated
              </span>
            )}
          </div>
          <h2 className="font-display font-black text-xl md:text-2xl text-slate-50">{issue.category}</h2>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">{issue.location_name}</p>
        </div>
        {onBackToList && (
          <button
            onClick={onBackToList}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 flex gap-2 px-5 shrink-0 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("details")}
          className={`py-3 px-3 border-b-2 font-bold transition-all ${
            activeTab === "details"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Details & Status
        </button>
        <button
          onClick={() => setActiveTab("complaint")}
          className={`py-3 px-3 border-b-2 font-bold transition-all ${
            activeTab === "complaint"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Jurisdiction & Complaint
        </button>
        <button
          onClick={() => setActiveTab("developer")}
          className={`py-3 px-3 border-b-2 font-bold transition-all flex items-center gap-1 ${
            activeTab === "developer"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Code className="w-3.5 h-3.5" /> Developer Logs
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Image carousel / attachments */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Supporting Evidence Photos ({issue.photos.length})</span>
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                {issue.photos.map((photoUrl, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-44 w-60 shrink-0 snap-center flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt={`Evidence ${idx + 1}`}
                      className="object-cover h-full w-full"
                      onError={(e) => {
                        // Fallback placeholder image for seeded photos that aren't on disk
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400&auto=format&fit=crop`;
                      }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[9px] px-2 py-0.5 rounded-md font-bold">
                      {idx === 0 ? "Initial Report Photo" : `Citizen Evidence #${idx}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary Block */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Verified Description</span>
              <p className="text-slate-700 text-xs mt-1 leading-relaxed font-medium">
                "{issue.auto_description}"
              </p>
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Incident Severity</span>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-[10px] ${severityColors(issue.severity)}`}>
                    Level {issue.severity}/5
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Simulated Active Time</span>
                  <span className="font-bold text-slate-700">
                    {issue.simulated_days_old || 0} days old
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Jurisdictional Status</span>
                  <span className="font-bold text-slate-700 block max-w-[150px] truncate">
                    {issue.department_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Citizen Attribution Block */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reported By</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {issue.reporter_name || "Citizen (Seeded)"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Logged Via</span>
                  <span className="font-semibold text-blue-600 mt-0.5 block font-mono text-[10.5px]">
                    Community Hero Portal
                  </span>
                </div>
              </div>

              {issue.confirmers && issue.confirmers.length > 0 && (
                <div className="pt-2.5 border-t border-slate-200/40 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Confirmed by Citizens</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {issue.confirmers.map((name, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-100/60">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Citizen interaction / validation */}
            <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100/80">
              <div>
                <h4 className="text-xs font-bold text-blue-900">Do you see this issue too?</h4>
                <p className="text-[10.5px] text-blue-700 mt-0.5">
                  Confirm to help prioritize this complaint and fast-track municipal action.
                </p>
              </div>
              <button
                onClick={() => onConfirmClicked(issue.id)}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                I see this too ({issue.confirmation_count})
              </button>
            </div>

            {/* Manual Status Admin controls */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Advance Issue Status (Administrative Action)
                </span>
                {!isUpdatingStatus && (
                  <button
                    onClick={() => setIsUpdatingStatus(true)}
                    className="text-[10.5px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Change Status
                  </button>
                )}
              </div>

              {isUpdatingStatus ? (
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Optional Action Memo Note</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g. Dispatched MCG sewer cleaning team or DHBVN fault ticket issued."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 outline-none text-slate-700"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(["Reported", "Verified", "In Progress", "Resolved"] as IssueStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusUpdateSubmit(st)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                          issue.status === st
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setIsUpdatingStatus(false);
                        setStatusNote("");
                      }}
                      className="py-1 px-2.5 rounded-lg text-[10px] font-bold text-slate-500 bg-transparent hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[10.5px] text-slate-500 leading-relaxed">
                  Active status is currently <span className="font-extrabold text-slate-700">"{issue.status}"</span>. Anyone can click 'Change Status' to simulate verified field investigations or maintenance completions.
                </div>
              )}
            </div>

            {/* Status History Timeline */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-3">Audit Logs & Status Timeline</span>
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {issue.status_history.map((log, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center z-10 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-800">{log.status}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.changed_at).toLocaleString()}
                        </span>
                      </div>
                      {log.note && <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">"{log.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "complaint" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4.5">
              <span className="text-[10px] uppercase font-bold text-blue-500 block">Civic Authority Jurisdiction</span>
              <h3 className="font-display font-extrabold text-sm text-blue-900 mt-0.5">{issue.department_name}</h3>
              <p className="text-[11px] text-blue-800/80 leading-relaxed mt-1">
                Gurugram's municipal landscape is notoriously fragmented. Potholes on master roads belong to <strong>GMDA</strong>, streetlights belong to <strong>DHBVN</strong>, sectors developed by HUDA belong to <strong>HSVP</strong>, while internal residential wards and standard sanitation/garbage piles report to <strong>MCG</strong>.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Formal Complaint Letter Draft</span>
                <button
                  onClick={handleCopyComplaint}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 font-bold text-[10.5px] text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                      Copied Letter!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Draft Text
                    </>
                  )}
                </button>
              </div>

              <div className="bg-amber-50/30 border border-amber-200/50 p-4 rounded-xl text-slate-700 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap">
                {issue.draft_complaint_text}
              </div>
            </div>
          </div>
        )}

        {activeTab === "developer" && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 rounded-xl text-slate-400 text-xs flex gap-2">
              <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200">AI Verification Transparency</h4>
                <p className="mt-0.5">Below are the exact, raw JSON models returned from the two separate server-side Gemini API calls for this ticket. This provides verifiable evidence of structured multimodal outputs.</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                Call 1: Multimodal Image Analysis JSON (gemini-3.5-flash)
              </span>
              <pre className="text-[10px] font-mono bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-56 leading-relaxed">
                {issue.raw_analysis_json || `{\n  "info": "Seeded issue. Original response payload archived."\n}`}
              </pre>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                Call 2: Text Jurisdiction Routing & Complaint Composition JSON (gemini-3.5-flash)
              </span>
              <pre className="text-[10px] font-mono bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-56 leading-relaxed">
                {issue.raw_complaint_json || `{\n  "info": "Seeded issue. Original response payload archived."\n}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
