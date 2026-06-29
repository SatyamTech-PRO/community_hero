import { useState, useEffect } from "react";
import { Issue, IssueStatus, IssueCategory } from "./types";
import CivicMap from "./components/CivicMap";
import ReportForm from "./components/ReportForm";
import IssueDetail from "./components/IssueDetail";
import Dashboard from "./components/Dashboard";
import SignInScreen from "./components/SignInScreen";
import DepartmentView from "./components/DepartmentView";
import {
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  PlusCircle,
  BarChart3,
  ListFilter,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Menu,
  X,
  User,
  Mail,
  LogOut,
  UserCheck,
  Building2
} from "lucide-react";

export default function App() {
  // Lightweight sign-in state
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    const name = localStorage.getItem("citizen_name");
    const email = localStorage.getItem("citizen_email");
    if (name && email) {
      return { name, email };
    }
    return null;
  });

  const handleSignIn = (name: string, email: string) => {
    localStorage.setItem("citizen_name", name.trim());
    localStorage.setItem("citizen_email", email.trim());
    setCurrentUser({ name: name.trim(), email: email.trim() });
  };

  const handleSignOut = () => {
    localStorage.removeItem("citizen_name");
    localStorage.removeItem("citizen_email");
    setCurrentUser(null);
  };

  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<"report" | "map" | "dashboard" | "department">("map");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Issues Data Store
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Escalation Simulation State
  const [fastForwardDays, setFastForwardDays] = useState<number>(3);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Load issues on launch
  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/issues?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (err) {
      console.error("Failed to fetch issues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Handle new issue submitted
  const handleReportSubmitted = (data: { is_duplicate: boolean; issue: Issue; message: string }) => {
    fetchIssues(); // reload issues database
  };

  const handleNavigateToMap = (issueId: string) => {
    setSelectedIssueId(issueId);
    setActiveTab("map");
  };

  // Click handler "I see this too"
  const handleConfirmIssue = async (issueId: string) => {
    try {
      const citizenName = localStorage.getItem("citizen_name");
      const res = await fetch(`/api/issues/${issueId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: citizenName })
      });
      if (res.ok) {
        const updatedIssue = await res.json();
        // Update local issues state
        setIssues(issues.map((i) => (i.id === issueId ? updatedIssue : i)));
        setSimulationToast(
          citizenName
            ? `Confirmation logged for ${citizenName}! Community vote count incremented.`
            : "Confirmation logged! Community vote count incremented."
        );
        setTimeout(() => setSimulationToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change Status Admin Control
  const handleStatusChanged = async (issueId: string, status: IssueStatus, note: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note })
      });
      if (res.ok) {
        const updatedIssue = await res.json();
        setIssues(issues.map((i) => (i.id === issueId ? updatedIssue : i)));
        setSimulationToast(`Issue status successfully updated to "${status}".`);
        setTimeout(() => setSimulationToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fast-Forward Days (Escalation Trigger)
  const handleFastForward = async () => {
    setIsSimulating(true);
    setSimulationToast(null);
    try {
      const res = await fetch("/api/issues/fast-forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysToFastForward: fastForwardDays })
      });
      if (res.ok) {
        const result = await res.json();
        setIssues(result.issues);
        if (result.escalatedCount > 0) {
          setSimulationToast(
            `Fast-forwarded ${fastForwardDays} days. ${result.escalatedCount} ticket(s) breached SLA limits and were automatically escalated!`
          );
        } else {
          setSimulationToast(`Fast-forwarded ${fastForwardDays} days. Active tickets assessed. No SLA breaches occurred.`);
        }
        setTimeout(() => setSimulationToast(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset Database to Seed Values
  const handleResetDatabase = async (officialName: string = "Unspecified Official") => {
    try {
      const res = await fetch("/api/issues/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: officialName })
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
        setSelectedIssueId(null);
        setSimulationToast(`Database successfully reset by ${officialName}!`);
        setTimeout(() => setSimulationToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchCat = categoryFilter === "All" || issue.category === categoryFilter;
    const matchStatus = statusFilter === "All" || issue.status === statusFilter;
    return matchCat && matchStatus;
  });

  const selectedIssue = issues.find((i) => i.id === selectedIssueId) || null;

  if (!currentUser) {
    return <SignInScreen onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Simulation notifications banner */}
      {simulationToast && (
        <div className="bg-amber-500 text-slate-950 font-bold text-xs py-2 px-4 text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-slate-950" />
          <span>{simulationToast}</span>
          <button onClick={() => setSimulationToast(null)} className="ml-2 hover:underline">
            [Dismiss]
          </button>
        </div>
      )}

      {/* Primary Header Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
              <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-black text-base sm:text-lg text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                Community Hero
              </h1>
              <p className="text-[10.5px] text-slate-400 font-medium leading-none mt-1">Civic Tech Platform & Overlapping Jurisdiction Routing</p>
            </div>
          </div>

          {/* Desktop Tab Switcher */}
          <nav className="hidden md:flex gap-1.5 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab("map");
                setSelectedIssueId(null);
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg border transition-all cursor-pointer ${
                activeTab === "map"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Live Map View
            </button>
            <button
              onClick={() => {
                setActiveTab("report");
                setSelectedIssueId(null);
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg border transition-all cursor-pointer ${
                activeTab === "report"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </button>
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedIssueId(null);
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg border transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Impact Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab("department");
                setSelectedIssueId(null);
              }}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg border transition-all cursor-pointer ${
                activeTab === "department"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Department View
            </button>
          </nav>

          {/* Actions panel */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Fast-Forward Simulation Panel */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2 font-mono">Demo:</span>
              <input
                type="number"
                min="1"
                max="30"
                value={fastForwardDays}
                onChange={(e) => setFastForwardDays(Math.max(1, Number(e.target.value)))}
                className="w-10 bg-white border border-slate-200 rounded-md p-1 text-center text-xs text-slate-800 font-bold focus:outline-none"
              />
              <button
                onClick={handleFastForward}
                disabled={isSimulating}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-black py-1.5 px-3 rounded-lg border border-blue-600 shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                {isSimulating ? "Fast-forwarding..." : "FF Days & Audit"}
              </button>
            </div>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4 h-9">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-extrabold text-slate-800 leading-none">{currentUser.name}</span>
              <span className="text-[9.5px] text-slate-400 font-semibold leading-none mt-1 truncate max-w-[120px]">{currentUser.email}</span>
            </div>
            <div className="bg-blue-50 text-blue-700 p-1.5 rounded-full border border-blue-100 flex items-center justify-center shrink-0" title={`${currentUser.name} (${currentUser.email})`}>
              <User className="w-4 h-4" />
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-all cursor-pointer shrink-0"
              title="Sign Out / Switch User"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3.5">
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setActiveTab("map");
                  setSelectedIssueId(null);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-left ${
                  activeTab === "map" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <MapPin className="w-4 h-4 text-blue-600" />
                Live Map View
              </button>
              <button
                onClick={() => {
                  setActiveTab("report");
                  setSelectedIssueId(null);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-left ${
                  activeTab === "report" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                Report Civic Issue
              </button>
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setSelectedIssueId(null);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-left ${
                  activeTab === "dashboard" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Impact Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab("department");
                  setSelectedIssueId(null);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-left ${
                  activeTab === "department" ? "bg-blue-50 text-blue-700 font-extrabold" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-4 h-4 text-purple-600" />
                Department View
              </button>
            </div>

            {/* Simulated actions on mobile */}
            <div className="border-t border-slate-100 pt-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Simulate Delay Passing:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={fastForwardDays}
                    onChange={(e) => setFastForwardDays(Math.max(1, Number(e.target.value)))}
                    className="w-10 bg-slate-50 border border-slate-200 rounded-md p-1.5 text-center text-xs text-slate-800 font-bold focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      handleFastForward();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isSimulating}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    FF Days
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Loading Overlay */}
        {isLoading && issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600 mb-4" />
            <h3 className="font-display font-black text-slate-800">Booting Community Hero</h3>
            <p className="text-slate-400 text-xs mt-1">Connecting to Express datastore and fetching registered tickets...</p>
          </div>
        ) : (
          <>
            {/* 1. REPORT ISSUE TAB */}
            {activeTab === "report" && (
              <div className="max-w-2xl mx-auto">
                <ReportForm
                  onReportSubmitted={handleReportSubmitted}
                  onNavigateToMap={handleNavigateToMap}
                />
              </div>
            )}

            {/* 2. MAP VIEW TAB */}
            {activeTab === "map" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[580px] lg:h-[calc(100vh-250px)]">
                {/* Sidebar - List & filters */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden max-h-[500px] lg:max-h-full">
                  {/* Filters Header */}
                  <div className="p-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 mb-3.5">
                      <ListFilter className="w-4 h-4 text-blue-600" />
                      <h3 className="font-display font-black text-xs text-slate-800 uppercase tracking-wider">Filter Incident Records</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Category</label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-1.5 text-slate-700 outline-none focus:border-blue-500"
                        >
                          <option value="All">All Category</option>
                          <option value="Pothole">Potholes</option>
                          <option value="Streetlight">Streetlights</option>
                          <option value="Water Leakage">Water Leaks</option>
                          <option value="Waste Management">Garbage</option>
                          <option value="Infrastructure">Infrastructure</option>
                          <option value="Other">Others</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-1.5 text-slate-700 outline-none focus:border-blue-500"
                        >
                          <option value="All">All Status</option>
                          <option value="Reported">Reported</option>
                          <option value="Verified">Verified</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Issues Feed scroll */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-[250px]">
                    {filteredIssues.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs italic">
                        No tickets match the active filter criteria.
                      </div>
                    ) : (
                      filteredIssues.map((issue) => {
                        const isSelected = selectedIssueId === issue.id;
                        let severityBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        if (issue.severity === 3) severityBadge = "bg-amber-50 text-amber-700 border-amber-100";
                        else if (issue.severity >= 4) severityBadge = "bg-rose-50 text-rose-700 border-rose-100";

                        const statusColors: Record<string, string> = {
                          Reported: "bg-blue-50 text-blue-700",
                          Verified: "bg-purple-50 text-purple-700",
                          "In Progress": "bg-amber-50 text-amber-700",
                          Resolved: "bg-emerald-50 text-emerald-700",
                        };

                        return (
                          <div
                            key={issue.id}
                            onClick={() => setSelectedIssueId(issue.id)}
                            className={`p-3.5 text-left transition-all cursor-pointer select-none border-l-4 ${
                              isSelected
                                ? "bg-blue-50/50 border-blue-600"
                                : "border-transparent hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-slate-400">{issue.id}</span>
                              <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${statusColors[issue.status]}`}>
                                {issue.status}
                              </span>
                            </div>

                            <h4 className="font-display font-black text-xs text-slate-800 leading-tight mt-1 truncate">
                              {issue.category}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate leading-relaxed">
                              {issue.location_name}
                            </p>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${severityBadge}`}>
                                Severity {issue.severity}
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-semibold">
                                {issue.confirmation_count} confirmations
                              </span>
                            </div>

                            {issue.needs_attention && (
                              <div className="mt-1.5 bg-rose-50 border border-rose-100 text-rose-700 text-[9.5px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                                Escalated (Delay Breached)
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Main panel - Map & Details split */}
                <div className="lg:col-span-8 flex flex-col lg:flex-row gap-6 items-stretch">
                  {/* Left element: Map box */}
                  <div className="flex-1 min-h-[350px] lg:min-h-full">
                    <CivicMap
                      issues={filteredIssues}
                      selectedIssueId={selectedIssueId}
                      onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
                      center={selectedIssue ? [selectedIssue.lat, selectedIssue.lng] : [28.4595, 77.0266]}
                      zoom={selectedIssue ? 15 : 13}
                    />
                  </div>

                  {/* Right element: Selected Issue detail slide drawer */}
                  {selectedIssue && (
                    <div className="w-full lg:w-[400px] shrink-0 h-[500px] lg:h-full">
                      <IssueDetail
                        issue={selectedIssue}
                        onConfirmClicked={handleConfirmIssue}
                        onStatusChanged={handleStatusChanged}
                        onBackToList={() => setSelectedIssueId(null)}
                        onResetDatabase={handleResetDatabase}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. IMPACT DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <Dashboard
                issues={issues}
                onSelectIssue={(issue) => {
                  setSelectedIssueId(issue.id);
                  setActiveTab("map");
                }}
              />
            )}

            {/* 4. DEPARTMENT VIEW TAB */}
            {activeTab === "department" && (
              <DepartmentView
                issues={issues}
                onConfirmClicked={handleConfirmIssue}
                onStatusChanged={handleStatusChanged}
                onResetDatabase={handleResetDatabase}
              />
            )}
          </>
        )}
      </main>

      {/* Trust Badge Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-slate-400 text-xs font-semibold">
            Gurugram Community Hero © 2026. Made for civic inspection, municipal auditing, and transparent citizen engagement.
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400">
            <span>MCG Jurisdiction Code: 122001</span>
            <span>•</span>
            <span>GMDA Route Node ID: 29X</span>
            <span>•</span>
            <span>DHBVN Electrical grid: GUR-56</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
