"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Activity,
  Plus,
  X,
  Heart,
  Pill,
  Baby,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Scan,
  History,
  Calendar,
  Search,
  ChevronRight,
  Clock,
} from "lucide-react";
import AnalysisForm from "@/components/home/citizen/analysis/AnalysisForm";
import AnalysisResultView from "@/components/home/citizen/analysis/AnalysisResultView";
import { getImageAnalysis, getCitizenImageAnalyses } from "@/lib/api";

const PRESET_CONDITIONS = [
  "Diabetes Type 1", "Diabetes Type 2", "Hypertension",
  "Heart Disease", "Chronic Kidney Disease", "Asthma",
  "COPD", "Liver Disease", "Thyroid Disorder",
  "Arthritis", "Cancer", "HIV/AIDS",
  "Epilepsy", "Depression", "Anxiety",
];
const PRESET_MEDICATIONS = [
  "Aspirin", "Ibuprofen", "Metformin",
  "Lisinopril", "Atorvastatin", "Omeprazole",
  "Amlodipine", "Levothyroxine", "Metoprolol",
  "Losartan", "Gabapentin", "Prednisone",
  "Warfarin", "Clopidogrel", "Insulin",
];

export const dynamic = "force-dynamic";

export default function ImageAnalysisPage() {
  const { data: session } = useSession();
  const citizenId = session?.user?.id || "anonymous";

  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ── History drawer states ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all"); // all | today | yesterday | week | older
  const [historySearch, setHistorySearch] = useState("");
  const [loadingHistoryId, setLoadingHistoryId] = useState(null);

  const fetchHistory = async () => {
    if (!citizenId || citizenId === "anonymous") return;
    setHistoryLoading(true);
    try {
      const res = await getCitizenImageAnalyses(citizenId);
      const data = Array.isArray(res) ? res : (res?.analyses || []);
      const sortedData = [...data].sort((a, b) =>
        new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
      );
      setHistoryItems(sortedData);
    } catch (e) {
      console.error("History fetch error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  React.useEffect(() => {
    if (historyOpen) fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, refreshHistory]);

  const groupHistoryItems = (items) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
    const weekStart = new Date(todayStart); weekStart.setDate(todayStart.getDate() - 7);

    const groups = { today: [], yesterday: [], week: [], older: [] };
    items.forEach((item) => {
      const d = new Date(item.created_at || item.timestamp);
      if (d >= todayStart) groups.today.push(item);
      else if (d >= yesterdayStart) groups.yesterday.push(item);
      else if (d >= weekStart) groups.week.push(item);
      else groups.older.push(item);
    });
    return groups;
  };

  const filteredHistory = (() => {
    let items = historyItems;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      items = items.filter((i) => {
        const typeLabel = (i.analysis_type || i.analysis?.modality || "Report").toLowerCase();
        const severity = (i.analysis?.severity || i.severity || "").toLowerCase();
        return typeLabel.includes(q) || severity.includes(q);
      });
    }
    if (historyFilter === "all") return items;
    const groups = groupHistoryItems(items);
    if (historyFilter === "today") return groups.today;
    if (historyFilter === "yesterday") return groups.yesterday;
    if (historyFilter === "week") return groups.week;
    if (historyFilter === "older") return groups.older;
    return items;
  })();

  const groupedFiltered = historyFilter === "all" ? groupHistoryItems(filteredHistory) : null;

  const getSeverityBadge = (item) => {
    const data = item.analysis || item;
    const severity = (data.severity || "Normal").toLowerCase();
    const isSafe = !severity.includes("severe") && !severity.includes("critical") && !severity.includes("high");
    
    if (isSafe) {
      return { color: "#059669", bg: "#ecfdf5", label: severity.toUpperCase() };
    } else {
      return { color: "#dc2626", bg: "#fef2f2", label: severity.toUpperCase() };
    }
  };

  const formatHistoryTime = (item) => {
    const d = new Date(item.created_at || item.timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleHistoryItemClick = async (item) => {
    const analysisId = item.analysis_id || item.id;
    if (!analysisId) {
      setActiveAnalysis(item);
      setHistoryOpen(false);
      return;
    }
    setLoadingHistoryId(analysisId);
    try {
      const fullAnalysis = await getImageAnalysis(analysisId);
      setActiveAnalysis(fullAnalysis || item);
      setHistoryOpen(false);
    } catch (err) {
      console.error("Failed to fetch full analysis details:", err);
      setActiveAnalysis(item);
      setHistoryOpen(false);
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const [patientContext, setPatientContext] = useState({
    age: "",
    gender: "Male",
    isPregnant: false,
    conditions: [],
    medications: [],
    symptoms: "",
    allergies: "",
    history: "",
  });

  const toggleCondition = (item) => {
    setPatientContext((p) => ({
      ...p,
      conditions: p.conditions.includes(item)
        ? p.conditions.filter((c) => c !== item)
        : [...p.conditions, item],
    }));
  };

  const toggleMedication = (item) => {
    setPatientContext((p) => ({
      ...p,
      medications: p.medications.includes(item)
        ? p.medications.filter((m) => m !== item)
        : [...p.medications, item],
    }));
  };

  const saveContext = () => {
    setContextSaved(true);
    setTimeout(() => {
      setContextSaved(false);
      setSidebarOpen(false);
    }, 800);
  };

  const onAnalysisComplete = (result) => {
    setActiveAnalysis(result);
    setRefreshHistory((prev) => prev + 1);
  };

  const handleSelectAnalysis = async (analysis) => {
    const analysisId = analysis.analysis_id || analysis.id;
    if (!analysisId) {
      setActiveAnalysis(analysis);
      return;
    }
    setLoadingDetails(true);
    try {
      const fullAnalysis = await getImageAnalysis(analysisId);
      setActiveAnalysis(fullAnalysis);
    } catch (err) {
      console.error("Failed to fetch full analysis details:", err);
      setActiveAnalysis(analysis);
    } finally {
      setLoadingDetails(false);
    }
  };

  const contextFilled =
    patientContext.age ||
    patientContext.conditions.length > 0 ||
    patientContext.medications.length > 0;

  return (
    <div className="flex h-full bg-[#f0f4ff] font-sans overflow-hidden relative w-full">

      {/* ── Patient Profile Modal ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-[20px] animate-[fadeIn_0.2s_ease]"
          onClick={(e) => e.target === e.currentTarget && setSidebarOpen(false)}
        >
          <div className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[88vh] shadow-[0_20px_60px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col animate-[cqModalIn_0.25s_cubic-bezier(0.4,0,0.2,1)]">
            {/* Header */}
            <div className="py-[18px] px-[24px] border-b border-[#e8ecf4] flex items-center justify-between bg-gradient-to-br from-[#f8faff] to-[#f0f4ff] shrink-0 rounded-t-[20px]">
              <div className="flex items-center gap-[10px]">
                <div className="w-[40px] h-[40px] bg-[#2793ef] rounded-[12px] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(39,147,239,0.35)]">
                  <User size={18} />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[#0f172a]">Patient Profile</div>
                  <div className="text-[11px] text-[#94a3b8] mt-[1px]">Configure your health profile for personalized analysis</div>
                </div>
              </div>
              <button
                className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[10px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer text-[#64748b] transition-all duration-200 hover:text-[#ef4444] hover:border-[#ef4444] hover:bg-[#fef2f2]"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-[20px] px-[24px] flex flex-col gap-[16px] scrollbar-thin scrollbar-thumb-[#e2e8f0] scrollbar-track-transparent">
              {/* Basic Info */}
              <div className="bg-[#f8faff] border border-[#e8ecf4] rounded-[14px] p-[18px]">
                <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b] mb-[14px]">
                  <User size={12} className="text-[#2793ef]" /> Basic Information
                </div>
                <div className="flex gap-[12px] mb-[14px]">
                  <div className="flex-1 flex flex-col gap-[5px]">
                    <label className="text-[12px] font-medium text-[#475569]">Age</label>
                    <input
                      className="bg-white border border-[#e2e8f0] rounded-[10px] text-[#1e293b] py-[9px] px-[12px] text-[13px] w-full outline-none transition-all focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)]"
                      type="number"
                      placeholder="e.g. 30"
                      value={patientContext.age}
                      onChange={(e) => setPatientContext((p) => ({ ...p, age: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-[5px]">
                    <label className="text-[12px] font-medium text-[#475569]">Gender</label>
                    <select
                      className="bg-white border border-[#e2e8f0] rounded-[10px] text-[#1e293b] py-[9px] px-[12px] text-[13px] w-full outline-none transition-all focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)]"
                      value={patientContext.gender}
                      onChange={(e) => setPatientContext((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div
                  className="flex items-center gap-[10px] cursor-pointer select-none"
                  onClick={() => setPatientContext((p) => ({ ...p, isPregnant: !p.isPregnant }))}
                >
                  <div className={`w-[38px] h-[21px] rounded-full relative transition-colors duration-200 shrink-0 ${patientContext.isPregnant ? "bg-[#2793ef]" : "bg-[#cbd5e1]"}`}>
                    <div className={`w-[15px] h-[15px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${patientContext.isPregnant ? "left-[20px]" : "left-[3px]"}`} />
                  </div>
                  <Baby size={13} className={patientContext.isPregnant ? "text-[#2793ef]" : "text-[#94a3b8]"} />
                  <span className="text-[#475569] text-[13px]">Currently Pregnant</span>
                </div>
              </div>

              {/* Conditions */}
              <div className="bg-[#f8faff] border border-[#e8ecf4] rounded-[14px] p-[18px]">
                <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b] mb-[12px]">
                  <Heart size={12} className="text-[#ef4444]" /> Health Conditions
                </div>
                <div className="flex flex-wrap gap-[8px]">
                  {PRESET_CONDITIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleCondition(item)}
                      className={`px-[12px] py-[6px] rounded-[10px] text-[12px] font-semibold transition-all border ${patientContext.conditions.includes(item)
                        ? "bg-[#2793ef] border-[#2793ef] text-white shadow-sm"
                        : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#2793ef] hover:text-[#2793ef]"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medications */}
              <div className="bg-[#f8faff] border border-[#e8ecf4] rounded-[14px] p-[18px]">
                <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b] mb-[12px]">
                  <Pill size={12} className="text-[#8b5cf6]" /> Current Medications
                </div>
                <div className="flex flex-wrap gap-[8px]">
                  {PRESET_MEDICATIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleMedication(item)}
                      className={`px-[12px] py-[6px] rounded-[10px] text-[12px] font-semibold transition-all border ${patientContext.medications.includes(item)
                        ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-sm"
                        : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-[10px] py-[14px] px-[24px] border-t border-[#f1f5f9] bg-white shrink-0">
              <button
                className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[10px] text-[#64748b] text-[13px] font-semibold py-[9px] px-[18px] cursor-pointer transition-all hover:border-[#cbd5e1] hover:text-[#475569]"
                onClick={() => setSidebarOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`flex items-center gap-[8px] rounded-[10px] text-white py-[9px] px-[22px] text-[13px] font-semibold cursor-pointer transition-all duration-200 shadow-sm ${contextSaved
                  ? "bg-[#059669] shadow-[0_4px_14px_rgba(5,150,105,0.35)]"
                  : "bg-[#2793ef] shadow-[0_4px_14px_rgba(39,147,239,0.35)] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(39,147,239,0.45)]"
                  }`}
                onClick={saveContext}
              >
                {contextSaved ? (
                  <><CheckCircle2 size={15} /> Saved!</>
                ) : (
                  <><ShieldCheck size={15} /> Save Profile</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY PANEL ── */}
      {historyOpen && (
        <div className="w-[320px] max-md:hidden flex flex-col bg-white border-r border-slate-200 shadow-[2px_0_12px_rgba(0,0,0,0.05)] overflow-hidden shrink-0 animate-[fadeIn_0.2s_ease]">
          {/* Panel Header */}
          <div className="px-[18px] py-[14px] border-b border-slate-100 bg-[#fafbfc] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-[8px]">
              <History size={15} className="text-[#2793ef]" />
              <span className="text-[14px] font-bold text-slate-800">Analysis History</span>
              {historyItems.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full px-[7px] py-[1px]">{historyItems.length}</span>
              )}
            </div>
            <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-[4px] rounded-md hover:bg-slate-100">
              <X size={15} />
            </button>
          </div>

          {/* Search */}
          <div className="px-[14px] py-[10px] border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-[8px] bg-slate-50 border border-slate-200 rounded-[10px] px-[10px] py-[7px]">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                className="flex-1 bg-transparent border-none outline-none text-[12px] text-slate-700 placeholder:text-slate-400"
                placeholder="Search assessments…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-[14px] py-[8px] border-b border-slate-100 flex gap-[6px] flex-wrap shrink-0">
            {[
              { key: "all", label: "All" },
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "week", label: "Last 7 Days" },
              { key: "older", label: "Older" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setHistoryFilter(tab.key)}
                className={`text-[11px] font-semibold px-[10px] py-[4px] rounded-full border transition-all duration-150 ${
                  historyFilter === tab.key
                    ? "bg-[#2793ef] text-white border-[#2793ef] shadow-[0_2px_6px_rgba(39,147,239,0.3)]"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-[10px] py-[8px] flex flex-col gap-[4px] scrollbar-thin scrollbar-thumb-[#cbd5e1] scrollbar-track-transparent">
            {historyLoading ? (
              <div className="flex flex-col gap-[8px] pt-[8px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-slate-100 rounded-[10px] h-[64px] animate-pulse" />
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[40px] text-center gap-[8px]">
                <Scan size={28} className="text-slate-300 animate-pulse" />
                <p className="text-[12px] text-slate-400 font-medium">No assessments found</p>
              </div>
            ) : historyFilter === "all" && groupedFiltered ? (
              // Grouped view
              Object.entries({ today: "Today", yesterday: "Yesterday", week: "Last 7 Days", older: "Older" }).map(([key, label]) =>
                groupedFiltered[key]?.length > 0 ? (
                  <div key={key} className="mb-[4px]">
                    <div className="flex items-center gap-[6px] px-[6px] py-[6px]">
                      <Calendar size={11} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.06em]">{label}</span>
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-[10px] text-slate-400">{groupedFiltered[key].length}</span>
                    </div>
                    {groupedFiltered[key].map((item, idx) => {
                      const badge = getSeverityBadge(item);
                      const typeLabel = (item.analysis_type || item.analysis?.modality || "Report").toUpperCase();
                      const isEcg = typeLabel.includes("ECG");
                      const itemId = item.analysis_id || item.id || idx;
                      const isItemLoading = loadingHistoryId === item.analysis_id;

                      return (
                        <div
                          key={itemId}
                          onClick={() => handleHistoryItemClick(item)}
                          className={`bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-[10px] p-[10px_12px] cursor-pointer transition-all duration-150 mb-[3px] group ${
                            isItemLoading ? "opacity-70 pointer-events-none" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-[6px] mb-[4px]">
                            <div className="flex items-center gap-[6px] min-w-0 flex-1">
                              {isEcg ? <Activity size={12} className="text-[#2793ef] shrink-0" /> : <Scan size={12} className="text-[#7c3aed] shrink-0" />}
                              <p className="text-[12px] font-bold text-slate-700 leading-snug group-hover:text-slate-900 truncate">{typeLabel} Assessment</p>
                            </div>
                            {isItemLoading ? (
                              <Loader2 size={12} className="animate-spin text-blue-400 shrink-0 mt-[2px]" />
                            ) : badge && (
                              <span className="text-[9px] font-bold px-[6px] py-[2px] rounded-full shrink-0" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-[6px]">
                            <span className="text-[10px] text-slate-400 flex items-center gap-[3px]">
                              <Clock size={10} />
                              {formatHistoryTime(item)}
                            </span>
                            <span className="text-[10px] text-[#2793ef] font-bold group-hover:translate-x-[2px] transition-transform">Report &rarr;</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null
              )
            ) : (
              // Flat filtered view
              filteredHistory.map((item, idx) => {
                const badge = getSeverityBadge(item);
                const typeLabel = (item.analysis_type || item.analysis?.modality || "Report").toUpperCase();
                const isEcg = typeLabel.includes("ECG");
                const itemId = item.analysis_id || item.id || idx;
                const isItemLoading = loadingHistoryId === item.analysis_id;

                return (
                  <div
                    key={itemId}
                    onClick={() => handleHistoryItemClick(item)}
                    className={`bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-[10px] p-[10px_12px] cursor-pointer transition-all duration-150 mb-[3px] group ${
                      isItemLoading ? "opacity-70 pointer-events-none" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-[6px] mb-[4px]">
                      <div className="flex items-center gap-[6px] min-w-0 flex-1">
                        {isEcg ? <Activity size={12} className="text-[#2793ef] shrink-0" /> : <Scan size={12} className="text-[#7c3aed] shrink-0" />}
                        <p className="text-[12px] font-bold text-slate-700 leading-snug group-hover:text-slate-900 truncate">{typeLabel} Assessment</p>
                      </div>
                      {isItemLoading ? (
                        <Loader2 size={12} className="animate-spin text-blue-400 shrink-0 mt-[2px]" />
                      ) : badge && (
                        <span className="text-[9px] font-bold px-[6px] py-[2px] rounded-full shrink-0" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-[6px]">
                      <span className="text-[10px] text-slate-400 flex items-center gap-[3px]">
                        <Clock size={10} />
                        {formatHistoryTime(item)}
                      </span>
                      <span className="text-[10px] text-[#2793ef] font-bold group-hover:translate-x-[2px] transition-transform">Report &rarr;</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Main Panel View ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* ── Top Bar ─ consistent with chat/doctor pages ── */}
        <header className="bg-white border-b border-[#e8ecf4] py-[16px] px-[28px] max-md:pl-[60px] max-md:px-[14px] flex items-center justify-between shrink-0 shadow-[0_1px_6px_rgba(0,0,0,0.04)] flex-wrap gap-[10px]">
        <div className="flex items-center gap-[14px] max-md:gap-[10px]">
          <div className="w-[40px] h-[40px] max-md:w-[34px] max-md:h-[34px] bg-[#2793ef] rounded-[12px] max-md:rounded-[10px] flex items-center justify-center text-white shadow-[0_3px_12px_rgba(39,147,239,0.3)] shrink-0">
            <Scan size={19} className="max-md:hidden" />
            <Scan size={16} className="md:hidden" />
          </div>
          <div>
            <div className="text-[16px] max-md:text-[14px] font-bold text-[#0f172a]">Medical Image Analysis</div>
            <div className="text-[11.5px] max-md:text-[10px] text-[#94a3b8] mt-[1px] max-md:hidden">Upload ECG or X-ray scans for AI-powered clinical verification</div>
          </div>
        </div>
        <div className="flex items-center gap-[8px] shrink-0">
          {/* History Toggle Button */}
          <button
            className={`flex items-center gap-[6px] border rounded-lg text-[12px] max-md:text-[11px] font-medium px-[12px] max-md:px-[8px] py-[7px] max-md:py-[5px] cursor-pointer transition-all duration-200 ${
              historyOpen
                ? "bg-blue-50 border-blue-400 text-blue-600"
                : "bg-[#f8faff] border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50"
            }`}
            onClick={() => setHistoryOpen((v) => !v)}
          >
            <History size={13} />
            <span className="max-md:hidden">History</span>
          </button>

          {/* Context Indicator */}
          {contextFilled && (
            <div className="hidden md:flex items-center gap-[5px] py-[5px] px-[12px] rounded-[20px] text-[11px] font-semibold bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669]">
              <ShieldCheck size={12} /> Profile Active
            </div>
          )}
          <button
            className="flex items-center gap-[6px] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-[1.5px] border-blue-500/25 rounded-[10px] text-[#2793ef] text-[12px] font-semibold px-[14px] py-[7px] cursor-pointer transition-all duration-200 whitespace-nowrap hover:from-blue-500/20 hover:to-indigo-500/20 hover:border-[#2793ef] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(39,147,239,0.18)]"
            onClick={() => setSidebarOpen(true)}
          >
            <User size={13} />
            <span className="max-md:hidden">Patient Profile</span>
            <span className="md:hidden">Profile</span>
          </button>
        </div>
      </header>

      {/* ── Main Scrollable Area ── */}
      <main className="flex-1 overflow-y-auto py-[24px] px-[28px] max-md:px-[14px] scrollbar-thin scrollbar-thumb-[#cbd5e1] scrollbar-track-transparent">
        <div className="max-w-[1200px] mx-auto pb-[40px]">

          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-[80px] min-h-[400px] bg-white rounded-[20px] border border-[#e8ecf4]">
              <div className="w-[60px] h-[60px] rounded-full bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center mb-[16px]">
                <Loader2 size={28} className="animate-spin text-[#2793ef]" />
              </div>
              <p className="text-[14px] font-bold text-[#0f172a]">Retrieving Clinical Dataset</p>
              <p className="text-[12px] text-[#94a3b8] mt-[4px]">Synchronizing neural analysis patterns…</p>
            </div>
          ) : !activeAnalysis ? (
            <div className="flex flex-col gap-[24px] animate-[fadeIn_0.3s_ease]">

              {/* Info Banner */}
              <div className="bg-white border border-[#e8ecf4] rounded-[16px] py-[18px] px-[24px] flex items-center justify-between gap-[16px] shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-[14px]">
                  <div className="w-[44px] h-[44px] bg-[#eff6ff] border border-[#bfdbfe] rounded-[12px] flex items-center justify-center shrink-0">
                    <Scan size={20} className="text-[#2793ef]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#0f172a]">AI-Powered Diagnostic Support</div>
                    <div className="text-[12px] text-[#64748b] mt-[2px]">Upload ECG or X-ray scans for high-precision analysis reviewed against clinical standards.</div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-[16px] text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest shrink-0">
                  <span className="flex items-center gap-[5px]"><ShieldCheck size={13} className="text-[#2793ef]" /> HIPAA Compliant</span>
                  <span className="flex items-center gap-[5px]"><Activity size={13} className="text-[#2793ef]" /> Real-time</span>
                </div>
              </div>

              {/* Analysis Form */}
              <AnalysisForm
                citizenId={citizenId}
                patientContext={{
                  ...patientContext,
                  currentDisease: patientContext.conditions.join(", "),
                  medication: patientContext.medications.join(", "),
                }}
                onAnalysisComplete={onAnalysisComplete}
              />


            </div>
          ) : (
            <div className="animate-[fadeIn_0.3s_ease]">
              <AnalysisResultView
                result={activeAnalysis}
                onBack={() => setActiveAnalysis(null)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="py-[20px] text-center border-t border-[#e8ecf4] mt-[4px]">
          <p className="text-[10.5px] text-[#94a3b8] font-bold uppercase tracking-[0.15em]">
            MedTruth Guard &bull; Institutional Diagnostic Standard &bull; &copy; 2026 All Rights Reserved
          </p>
        </footer>
      </main>
      </div>
    </div>
  );
}
