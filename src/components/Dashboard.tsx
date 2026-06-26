import { Issue } from "../types";
import { AlertTriangle, ShieldCheck, Clock, Layers, MapPin, CheckCircle, BarChart3, TrendingUp, AlertCircle } from "lucide-react";

interface DashboardProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export default function Dashboard({ issues, onSelectIssue }: DashboardProps) {
  // 1. Key calculations
  const totalReported = issues.length;
  const totalResolved = issues.filter((i) => i.status === "Resolved").length;
  const totalInProg = issues.filter((i) => i.status === "In Progress" || i.status === "Verified").length;
  const escalatedIssues = issues.filter((i) => i.needs_attention && i.status !== "Resolved");

  // Calculate resolution rate
  const resolutionRate = totalReported > 0 ? ((totalResolved / totalReported) * 100).toFixed(0) : "0";

  // Average resolution time (simulated and dynamic)
  let avgResDays = 2.4; // default demo fallback
  const resolvedIssuesWithTimes = issues.filter(
    (i) => i.status === "Resolved" && i.status_history.some((h) => h.status === "Resolved")
  );
  if (resolvedIssuesWithTimes.length > 0) {
    let totalMs = 0;
    resolvedIssuesWithTimes.forEach((issue) => {
      const created = new Date(issue.created_at).getTime();
      const resolvedLog = issue.status_history.find((h) => h.status === "Resolved");
      const resolved = resolvedLog ? new Date(resolvedLog.changed_at).getTime() : Date.now();
      totalMs += Math.max(12 * 60 * 60 * 1000, resolved - created); // minimum 12 hours
    });
    avgResDays = Number(((totalMs / resolvedIssuesWithTimes.length) / (24 * 60 * 60 * 1000)).toFixed(1));
  }

  // 2. Group by Category
  const categoriesList: Record<string, number> = {
    Pothole: 0,
    "Water Leakage": 0,
    Streetlight: 0,
    "Waste Management": 0,
    Infrastructure: 0,
    Other: 0,
  };
  issues.forEach((issue) => {
    if (categoriesList[issue.category] !== undefined) {
      categoriesList[issue.category]++;
    } else {
      categoriesList.Other++;
    }
  });

  const categoryColors: Record<string, string> = {
    Pothole: "bg-slate-700",
    "Water Leakage": "bg-blue-500",
    Streetlight: "bg-amber-400",
    "Waste Management": "bg-emerald-600",
    Infrastructure: "bg-indigo-500",
    Other: "bg-slate-400",
  };

  // Find max count for scaling the chart
  const maxCategoryCount = Math.max(...Object.values(categoriesList), 1);

  // 3. Group by Locality / Area
  const areaDistribution: Record<string, number> = {};
  issues.forEach((issue) => {
    // extract sector names from location name to make groups cleaner
    let area = "Other Areas";
    if (issue.location_name.includes("Sector 29")) area = "Sector 29";
    else if (issue.location_name.includes("Sector 56")) area = "Sector 56";
    else if (issue.location_name.includes("Sector 15")) area = "Sector 15";
    else if (issue.location_name.includes("IFFCO Chowk")) area = "IFFCO Chowk";
    else if (issue.location_name.includes("DLF Phase 3")) area = "DLF Phase 3";
    else if (issue.location_name.includes("Golf Course")) area = "Golf Course Road";
    else if (issue.location_name.includes("Sector 82")) area = "Sector 82";
    else {
      // dynamic split
      const parts = issue.location_name.split(",");
      area = parts[0]?.trim() || "Gurugram";
    }

    areaDistribution[area] = (areaDistribution[area] || 0) + 1;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Reports */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Reports</span>
            <span className="text-2xl md:text-3xl font-display font-black text-slate-900 mt-1 block">
              {totalReported}
            </span>
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">Active backlog: {totalInProg} open issues</p>
        </div>

        {/* Card 2: Resolved */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Issues</span>
            <span className="text-2xl md:text-3xl font-display font-black text-emerald-600 mt-1 block">
              {totalResolved}
            </span>
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold mt-2">
            Resolution rate: <span className="font-bold">{resolutionRate}%</span>
          </p>
        </div>

        {/* Card 3: Avg Resolution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Fix Latency</span>
            <span className="text-2xl md:text-3xl font-display font-black text-amber-600 mt-1 block">
              {avgResDays} <span className="text-sm font-bold text-slate-400">days</span>
            </span>
          </div>
          <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">Calculated from resolution logs</p>
        </div>

        {/* Card 4: Needs Attention */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escalated Tickets</span>
            <span className={`text-2xl md:text-3xl font-display font-black mt-1 block ${escalatedIssues.length > 0 ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>
              {escalatedIssues.length}
            </span>
          </div>
          <div className={`absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center ${escalatedIssues.length > 0 ? "bg-rose-50" : "bg-slate-50"}`}>
            <AlertTriangle className={`w-5 h-5 ${escalatedIssues.length > 0 ? "text-rose-600" : "text-slate-400"}`} />
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">Unresolved after &gt;3 days trigger</p>
        </div>
      </div>

      {/* Main Stats Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="font-display font-black text-sm text-slate-800">Issue Volume by Category</h3>
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(categoriesList).map(([category, count]) => {
              const percentage = maxCategoryCount > 0 ? (count / maxCategoryCount) * 100 : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{category}</span>
                    <span className="font-bold text-slate-900">{count} reports</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${categoryColors[category]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Locality Leaderboard */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display font-black text-sm text-slate-800">Reports by Locality</h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[290px] overflow-y-auto pr-1">
            {Object.entries(areaDistribution).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 italic">No geographic data logged yet.</p>
            ) : (
              Object.entries(areaDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([area, count], idx) => (
                  <div key={area} className="flex items-center justify-between py-2.5 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                      <span className="text-slate-700">{area}</span>
                    </div>
                    <span className="bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">
                      {count} {count === 1 ? "issue" : "issues"}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Escalated Issues Feed */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h3 className="font-display font-black text-sm text-slate-800">Critical: Escalated Concerns ({escalatedIssues.length})</h3>
          </div>
          {escalatedIssues.length > 0 && (
            <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
              Requires Inspection
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {escalatedIssues.length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100 text-slate-500 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Excellent! All items resolved or active under 3 days.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Use the 'Fast-Forward' button to simulate days passing and trigger delayed escalations.</p>
            </div>
          ) : (
            escalatedIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue(issue)}
                className="flex gap-3 p-4 bg-rose-50/30 hover:bg-rose-50/60 border border-rose-100/80 rounded-xl transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-rose-100 border border-rose-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-rose-600 text-[10px] font-bold">
                  {issue.photos?.[0] ? (
                    <img src={issue.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    issue.severity
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-rose-700">{issue.category}</span>
                    <span className="text-[9.5px] font-semibold text-slate-400 font-mono">{issue.simulated_days_old} days old</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-blue-700 mt-0.5">
                    {issue.location_name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 truncate leading-relaxed italic mt-0.5">
                    "{issue.auto_description}"
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[8px] tracking-wide">
                      SEVERITY {issue.severity}/5
                    </span>
                    <span className="text-[9.5px] text-slate-400 font-semibold">{issue.confirmation_count} citizen validations</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
