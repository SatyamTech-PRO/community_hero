import { useState } from "react";
import { Issue, IssueStatus } from "../types";
import IssueDetail from "./IssueDetail";
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Inbox,
  Sparkles,
  BarChart2
} from "lucide-react";

interface DepartmentViewProps {
  issues: Issue[];
  onConfirmClicked: (issueId: string) => void;
  onStatusChanged: (issueId: string, status: IssueStatus, note: string) => void;
  onResetDatabase: (name: string) => void;
}

// Fixed 5 departments list
const DEPARTMENTS = [
  {
    id: "mcg",
    shortName: "MCG",
    fullName: "Municipal Corporation of Gurugram",
    color: "blue",
    description: "Internal sector roads, residential streets, garbage pileups, sanitation, sewage, drainage.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "gmda",
    shortName: "GMDA",
    fullName: "Gurugram Metropolitan Development Authority",
    color: "emerald",
    description: "Major arterial roads, drainage networks, metro buffer zones, master water supply.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "hsvp",
    shortName: "HSVP",
    fullName: "Haryana Shehri Vikas Pradhikaran",
    color: "purple",
    description: "Sector-specific markets, public parks, core estate/commercial land holdings.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: "dhbvn",
    shortName: "DHBVN",
    fullName: "Dakshin Haryana Bijli Vitran Nigam",
    color: "amber",
    description: "Electrical infrastructure, streetlights, transformer failures, hanging wire hazards.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "fallback",
    shortName: "External",
    fullName: "Local Civic Authority (Non-Gurugram Fallback)",
    color: "slate",
    description: "Cross-boundary incidents, neighboring zones outside Gurugram's 30km municipal limit.",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200"
  }
];

export default function DepartmentView({
  issues,
  onConfirmClicked,
  onStatusChanged,
  onResetDatabase
}: DepartmentViewProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeDeptTab, setActiveDeptTab] = useState<string>("all");

  // Helper to categorize issue into exact department bucket
  const getDeptId = (deptName: string): string => {
    const name = (deptName || "").toUpperCase();
    if (name.includes("MCG") || name.includes("MUNICIPAL CORPORATION")) {
      return "mcg";
    }
    if (name.includes("GMDA") || name.includes("METROPOLITAN DEVELOPMENT")) {
      return "gmda";
    }
    if (name.includes("HSVP") || name.includes("SHEHRI VIKAS") || name.includes("SHAHARI VIKAS")) {
      return "hsvp";
    }
    if (name.includes("DHBVN") || name.includes("BIJLI") || name.includes("VITRAN")) {
      return "dhbvn";
    }
    return "fallback";
  };

  const selectedIssue = issues.find((i) => i.id === selectedIssueId) || null;

  // Filter departments based on tab selection
  const visibleDepartments = activeDeptTab === "all" 
    ? DEPARTMENTS 
    : DEPARTMENTS.filter(d => d.id === activeDeptTab);

  return (
    <div className="space-y-6 font-sans">
      {/* Visual Hub Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
            Municipal Console
          </span>
          <h2 className="font-display font-black text-xl md:text-2xl text-slate-900 tracking-tight mt-1.5">
            Inter-Departmental Command View
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time incident distribution among overlapping jurisdictions. Filter complaints by specific municipal boards, check SLA performance, and execute direct admin interventions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setActiveDeptTab("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeDeptTab === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            All Agencies
          </button>
          {DEPARTMENTS.map((dept) => {
            const count = issues.filter(i => getDeptId(i.department_name) === dept.id).length;
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDeptTab(dept.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  activeDeptTab === dept.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {dept.shortName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Department Groupings */}
        <div className={`${selectedIssue ? "lg:col-span-7" : "lg:col-span-12"} space-y-6 transition-all duration-300`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleDepartments.map((dept) => {
              const deptIssues = issues.filter((i) => getDeptId(i.department_name) === dept.id);
              const openIssues = deptIssues.filter((i) => i.status !== "Resolved");
              const escalatedIssues = deptIssues.filter((i) => i.needs_attention && i.status !== "Resolved");
              const resolvedIssues = deptIssues.filter((i) => i.status === "Resolved");

              return (
                <div
                  key={dept.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-${dept.color}-50 text-${dept.color}-600`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${dept.badgeClass}`}>
                          {dept.shortName}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-bold text-slate-400">
                        {deptIssues.length} total tickets
                      </span>
                    </div>
                    <h3 className="font-display font-black text-xs text-slate-800 leading-snug">
                      {dept.fullName}
                    </h3>
                    <p className="text-[10.5px] text-slate-500 mt-1 leading-normal italic">
                      {dept.description}
                    </p>
                  </div>

                  {/* Micro Stats Row */}
                  <div className="grid grid-cols-3 gap-1 border-b border-slate-100/50 bg-slate-50/10 py-2 px-3 text-center">
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-slate-400">Active</span>
                      <span className="text-xs font-black text-slate-700">{openIssues.length}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-rose-400">Escalated</span>
                      <span className={`text-xs font-black ${escalatedIssues.length > 0 ? "text-rose-600 animate-pulse" : "text-slate-400"}`}>
                        {escalatedIssues.length}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase font-bold text-emerald-400">Resolved</span>
                      <span className="text-xs font-black text-emerald-600">{resolvedIssues.length}</span>
                    </div>
                  </div>

                  {/* Issues List Container */}
                  <div className="p-4 flex-1">
                    {deptIssues.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center text-center text-slate-400">
                        <Inbox className="w-5 h-5 text-slate-300" />
                        <span className="text-[10.5px] italic mt-1">No active reports for this agency</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {deptIssues.map((issue) => {
                          const isSelected = selectedIssueId === issue.id;
                          const statusColors: Record<string, string> = {
                            Reported: "bg-blue-50 text-blue-700 border-blue-100",
                            Verified: "bg-purple-50 text-purple-700 border-purple-100",
                            "In Progress": "bg-amber-50 text-amber-700 border-amber-100",
                            Resolved: "bg-emerald-50 text-emerald-700 border-emerald-100"
                          };

                          return (
                            <div
                              key={issue.id}
                              onClick={() => setSelectedIssueId(issue.id)}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50/50 border-blue-500 shadow-xs"
                                  : "bg-slate-50/30 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[9px] font-bold text-slate-400 shrink-0">{issue.id}</span>
                                  <span className="text-[10.5px] font-black text-slate-800 truncate">
                                    {issue.category}
                                  </span>
                                </div>
                                <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${statusColors[issue.status]}`}>
                                  {issue.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-1.5">
                                <span className="text-[9px] text-slate-400 truncate max-w-[150px]">
                                  {issue.location_name}
                                </span>
                                {issue.needs_attention && issue.status !== "Resolved" && (
                                  <span className="text-[8px] bg-rose-50 text-rose-600 border border-rose-100 rounded px-1 font-bold animate-pulse flex items-center gap-0.5 shrink-0">
                                    <AlertTriangle className="w-2 h-2 shrink-0" />
                                    SLA Breach
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Shared Standard Interactive Issue Detail View */}
        {selectedIssue ? (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px] lg:h-auto sticky top-20">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[10.5px] font-extrabold text-slate-500 flex items-center gap-1">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Administrative Case File
              </span>
              <button
                onClick={() => setSelectedIssueId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold py-1 px-2 hover:bg-slate-200/50 rounded-lg cursor-pointer"
              >
                Close Case File
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <IssueDetail
                issue={selectedIssue}
                onConfirmClicked={onConfirmClicked}
                onStatusChanged={onStatusChanged}
                onBackToList={() => setSelectedIssueId(null)}
                onResetDatabase={onResetDatabase}
              />
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex lg:col-span-5 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl items-center justify-center p-8 text-center">
            <div className="max-w-xs space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-extrabold text-slate-600">Select an Incident Ticket</p>
              <p className="text-[10.5px] text-slate-400 leading-normal">
                Click on any complaint under an agency's column to pull up the official dossier, view detailed auto-drafts, attribute your title, adjust status, or execute database operations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
