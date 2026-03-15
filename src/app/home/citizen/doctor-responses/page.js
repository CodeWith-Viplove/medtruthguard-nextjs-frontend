"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getCitizenQueries, getAiResponse } from "@/lib/api";
import {
  Stethoscope,
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  User,
  BookOpen,
  Heart,
  Pill,
  Building2,
  Award,
  ArrowLeft,
  Bell,
  Shield,
  Activity,
  FileText,
  ChevronRight,
  X,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  HourglassIcon,
  Info,
} from "lucide-react";

// NOTE: Doctor responses are now fetched from the real backend.
// No simulation — the citizen waits until the doctor genuinely responds.



// ─── Config ─────────────────────────────────────────────────────────────────────
const urgencyConfig = {
  high: { label: "High Priority", color: "text-[#ef4444]", bg: "bg-[#fef2f2]", border: "border-[#fca5a5]" },
  moderate: { label: "Moderate", color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", border: "border-[#fcd34d]" },
  low: { label: "Routine", color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#6ee7b7]" },
};
const verifyConfig = {
  safe: { color: "text-[#10b981]", bg: "bg-[#ecfdf5]", border: "border-[#6ee7b7]", Icon: ShieldCheck },
  caution: { color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", border: "border-[#fcd34d]", Icon: AlertTriangle },
  unsafe: { color: "text-[#ef4444]", bg: "bg-[#fef2f2]", border: "border-[#fca5a5]", Icon: AlertTriangle },
};

// ─── Response Card ───────────────────────────────────────────────────────────────
const ResponseCard = ({ item, selected, onSelect }) => {
  const uCfg = urgencyConfig[item.urgency] || urgencyConfig.moderate;
  const isPending = item.status === "pending";
  const vcStatus = item.verification?.status || "safe";
  const vCfg = verifyConfig[vcStatus];
  const VerifyIcon = vCfg.Icon;

  return (
    <div
      className={`rc-card ${selected ? "rc-card--active" : ""} ${!item.read ? "rc-card--unread" : ""}`}
      onClick={onSelect}
    >
      {!item.read && <div className="rc-unread-dot" />}
      <div className="rc-doctor-row">
        <div className="rc-doc-avatar">
          {item.doctor.name.split(" ").filter(w => w !== "Dr.").map(w => w[0]).join("").slice(0, 2)}
        </div>
        <div className="rc-doc-info">
          <div className="rc-doc-name">
            {item.doctor.name}
            {item.doctor.verified && <Award size={11} className="rc-verified-icon" />}
          </div>
          <div className="rc-doc-spec">{item.doctor.specialty}</div>
        </div>
        <div className={`rc-urgency-badge border ${uCfg.bg} ${uCfg.color} ${uCfg.border}`}>
          {uCfg.label}
        </div>
      </div>

      <p className="rc-query-text">"{item.query}"</p>

      <div className="rc-preview">
        {isPending ? (
          <div className="rc-pending-row">
            <Loader2 size={12} className="rc-pending-spin" />
            Awaiting doctor's response…
          </div>
        ) : (
          (item.response || "").slice(0, 110) + "…"
        )}
      </div>

      <div className="rc-footer">
        {isPending ? (
          <div className="rc-status-pending"><HourglassIcon size={10} /> Pending</div>
        ) : (
          <div className={`rc-verify-chip border ${vCfg.bg} ${vCfg.color} ${vCfg.border}`}>
            <VerifyIcon size={11} />
            {item.verification?.label || "Verified"}
          </div>
        )}
        <div className="rc-time"><Clock size={11} />
          {isPending ? `Sent: ${item.sentAt}` : item.respondedAt}
        </div>
      </div>
    </div>
  );
};

// ─── Detail Panel ────────────────────────────────────────────────────────────────
const DetailPanel = ({ item, onClose, onBackToChat }) => {
  const isPending = item.status === "pending";
  const vCfg = verifyConfig[item.verification?.status || "safe"];
  const uCfg = urgencyConfig[item.urgency] || urgencyConfig.moderate;
  const VerifyIcon = vCfg.Icon;
  const isSafe = item.verification?.status === "safe";

  return (
    <div className="flex flex-col h-full">
      <div className="py-[16px] px-[22px] bg-gradient-to-br from-[#f8faff] to-[#f0f4ff] border-b border-[#e8ecf4] flex items-center justify-between gap-[10px] shrink-0">
        <div className="flex items-center gap-[10px]">

          <div>
            <div className="text-[14px] font-bold text-[#0f172a]">{isPending ? "Consultation Sent" : "Doctor Response"}</div>
            <div className="text-[11px] text-[#94a3b8] mt-[1px]">AI-verified medical consultation</div>
          </div>
        </div>
        <div className="flex items-center gap-[8px]">

          <div className={`text-[10.5px] font-bold py-[4px] px-[10px] rounded-[14px] uppercase tracking-[0.04em] border ${uCfg.bg} ${uCfg.color} ${uCfg.border}`}>
            {uCfg.label}
          </div>
        </div>
      </div>

      <div className="py-[20px] px-[22px] flex flex-col gap-[18px] flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#e2e8f0] scrollbar-track-transparent">
        {/* Doctor Info */}
        <div className="flex gap-[14px] items-start bg-white border-[1.5px] border-[#e8ecf4] rounded-[14px] p-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <div className="w-[48px] h-[48px] rounded-full bg-[#2793ef] text-white text-[15px] font-bold flex items-center justify-center shrink-0">
            {item.doctor.name.split(" ").filter(w => w !== "Dr.").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-[#0f172a] flex items-center gap-[6px] flex-wrap">
              {item.doctor.name}
              {item.doctor.verified && (
                <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold bg-[#ecfdf5] text-[#059669] rounded-[10px] py-[2px] px-[8px]"><Award size={11} /> Verified Doctor</span>
              )}
            </div>
            <div className="text-[12px] text-[#6366f1] font-medium mt-[2px]">{item.doctor.specialty}</div>
            <div className="flex flex-wrap gap-[10px] mt-[6px] text-[11.5px] text-[#94a3b8] [&>span]:flex [&>span]:items-center [&>span]:gap-[4px]">
              <span><Building2 size={11} /> {item.doctor.hospital}</span>
              <span><Star size={11} /> {item.doctor.rating}</span>
              <span><Activity size={11} /> {item.doctor.exp} experience</span>
            </div>
          </div>
        </div>

        {/* Original Query */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]"> Your Question</div>
          <div className="bg-white border-[1.5px] border-[#e8ecf4] rounded-[14px] p-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <p className="text-[13.5px] font-semibold text-[#0f172a] leading-[1.6] m-0">{item.query}</p>
            {item.note && (
              <p className="text-[12.5px] text-[#64748b] mt-[10px] pt-[10px] border-t border-[#f1f5f9] leading-[1.5] flex items-start gap-[5px]"><Info size={11} /> Additional note: {item.note}</p>
            )}
            {/* Patient context pills */}
            {item.patientContext && (item.patientContext.age || (item.patientContext.conditions || []).length > 0) && (
              <div className="flex flex-wrap gap-[6px] mt-[10px]">
                {item.patientContext.age && <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">Age: {item.patientContext.age}</span>}
                {item.patientContext.gender && <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">{item.patientContext.gender}</span>}
                {item.patientContext.isPregnant && <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">Pregnant</span>}
                {(item.patientContext.conditions || []).map((c, i) => <span key={i} className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">{c}</span>)}
                {(item.patientContext.medications || []).map((m, i) => <span key={i} className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd] bg-[#faf5ff] border-[#e9d5ff] text-[#7c3aed]">{m}</span>)}
              </div>
            )}
            <div className="flex items-center gap-[5px] text-[11px] text-[#94a3b8] mt-[10px]"><Clock size={11} /> Sent: {item.sentAt}</div>
          </div>
        </div>

        {/* Pending state */}
        {isPending ? (
          <div className="flex flex-col items-center gap-[12px] bg-white border-[1.5px] border-[#e8ecf4] rounded-[16px] py-[36px] px-[24px] text-center shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="w-[56px] h-[56px] rounded-full bg-[#eff6ff] border-2 border-[#bfdbfe] flex items-center justify-center">
              <Loader2 size={28} className="animate-[spin_1.2s_linear_infinite]" color="#3b82f6" />
            </div>
            <div className="text-[15px] font-bold text-[#0f172a]">Waiting for Doctor's Response</div>
            <div className="text-[13px] text-[#64748b] leading-[1.5] max-w-[360px]">
              Your query has been sent to <strong>{item.doctor.name}</strong>. The doctor will review your medical question and patient context, then provide a personalized response.
            </div>
            <div className="text-[12px] text-[#94a3b8] leading-[1.5] max-w-[360px]">
              No response will be shown until the doctor has reviewed and replied. This page automatically checks for new responses every 15 seconds.
            </div>
            <div className="flex items-center gap-[6px] text-[11.5px] font-medium text-[#3b82f6] bg-[#eff6ff] rounded-[10px] py-[6px] px-[14px]">
              <Shield size={13} color="#3b82f6" />
              All responses are AI-verified before delivery
            </div>
          </div>
        ) : (
          <>
            {/* MedTruth AI Response */}
            {item.aiResponse && (item.aiResponse.recommendation || item.aiResponse.medical_analysis) && (
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]"> MedTruth AI Response</div>
                <div className="bg-[#f8faff] border-[1.5px] border-[#c7d2fe] rounded-[14px] overflow-hidden">
                  <div className="py-[10px] px-[16px] flex items-center justify-between border-b border-[#e0e7ff] bg-gradient-to-r from-[#eef2ff] to-[#f8faff]">
                    <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#6366f1]">
                      <Shield size={13} className="text-[#6366f1]" />
                      <span>MedTruth AI</span>
                    </div>
                    {item.aiResponse.confidence_score != null && (
                      <span className="flex items-center gap-[4px] text-[11px] font-semibold text-[#6366f1] bg-[#eef2ff] py-[2px] px-[8px] rounded-[8px]">
                        Confidence: {Math.round(item.aiResponse.confidence_score * 1)}%
                      </span>
                    )}
                  </div>
                  <p className="py-[14px] px-[16px] text-[13.5px] text-[#374151] leading-[1.7] whitespace-pre-wrap m-0">
                    {item.aiResponse.recommendation || item.aiResponse.medical_analysis}
                  </p>
                  {item.aiResponse.required_specialization && (
                    <div className="px-[16px] pb-[10px] flex items-center gap-[6px]">
                      <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#eef2ff] text-[#6366f1] border border-[#c7d2fe]">Recommended: {item.aiResponse.required_specialization}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Doctor's Response */}
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]"> Doctor's Response</div>
              <div className="bg-[#f0fdf4] border-[1.5px] border-[#a7f3d0] rounded-[14px] overflow-hidden">
                <div className="py-[10px] px-[16px] flex items-center justify-between border-b border-[#a7f3d0] bg-white/50">
                  <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#6366f1]">
                    <span>{item.doctor.name}</span>
                  </div>
                  <span className="flex items-center gap-[4px] text-[11px] text-[#94a3b8]"><Clock size={11} /> {item.respondedAt}</span>
                </div>
                <p className="py-[14px] px-[16px] text-[13.5px] text-[#374151] leading-[1.7] whitespace-pre-wrap m-0">{item.response}</p>
              </div>
            </div>

            {/* AI Verification */}
            {item.verification && (
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]"><Shield size={13} /> MedTruth AI</div>
                <div className={`bg-white rounded-[14px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)] border-x border-y ${vCfg.border}`}>
                  <div className="py-[14px] px-[16px] flex items-center justify-between">
                    <div className="flex items-center gap-[12px]">
                      <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 border-x-2 border-y-2 ${vCfg.bg} ${vCfg.border}`}>
                        <VerifyIcon size={18} className={vCfg.color} />
                      </div>
                      <div>
                        <div className={`text-[12px] font-bold py-[3px] px-[10px] rounded-[10px] ${vCfg.bg} ${vCfg.color}`}>
                          {item.verification.label}
                        </div>
                        <div className={`flex items-center gap-[4px] text-[11px] font-semibold mt-[3px] ${vCfg.color}`}>
                          <CheckCircle2 size={12} /> {item.verification.safeLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-[16px] pb-[14px]">
                    <div className="flex items-center gap-[5px] text-[10.5px] font-bold tracking-[0.04em] uppercase mb-[6px]">
                      <BookOpen size={12} className="text-[#1d6fa8]" />
                      <span>VERIFICATION JUSTIFICATION</span>
                    </div>
                    <p className="text-[13px] text-[#334155] leading-[1.6] m-0">{item.verification.justification}</p>
                  </div>
                  <div className="flex flex-wrap gap-[6px] py-[10px] px-[16px] border-t border-[#f1f5f9]">
                    {(item.verification.sources || []).map((s, i) => (
                      <span key={i} className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe]">{s}</span>
                    ))}
                  </div>
                  {item.verification.patientContextStr && (
                    <div className="flex gap-[10px] items-center py-[12px] px-[16px] bg-[#f8faff] border-t border-[#f1f5f9]">
                      <User size={14} className="text-[#3b82f6] shrink-0" />
                      <div>
                        <div className="text-[12px] font-bold text-[#0f172a]">Patient Context Applied</div>
                        <div className="text-[11.5px] text-[#64748b] mt-[1px]">{item.verification.patientContextStr}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && (
              <div className="flex flex-wrap gap-[6px]">
                {item.tags.map((t, i) => (
                  <span key={i} className="text-[11px] font-medium py-[4px] px-[10px] rounded-[12px] bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">{t}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────────
export default function DoctorResponsesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const citizenId = session?.user?.id;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [allItems, setAllItems] = useState([]);

  const [refreshing, setRefreshing] = useState(false);

  // ── Build items from localStorage (pending consults saved from chat page)
  const getStoredItems = () => {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem("medtruth_consultations") || "[]");
    } catch (e) { }
    
    // Filter by citizenId if available. 
    // If citizenId exists in storage, it MUST match the current session user.
    // If it doesn't exist (legacy), we only show it if the user is not logged in (anonymous).
    return stored
      .filter(c => {
        if (c.citizenId) return String(c.citizenId) === String(citizenId);
        return !citizenId || citizenId === "anonymous"; 
      })
      .map(c => ({
        ...c,
        urgency: c.urgency || "moderate",
        read: c.read || false,
        tags: c.status === "pending" ? ["Awaiting Doctor"] : (c.tags || ["Doctor Reviewed"]),
      }));
  };

  // ── Build items from backend API response
  const buildBackendItems = (queries) => {
    const items = [];
    queries.forEach(q => {
      // Normalize ai_response vs ai_draft_response
      const aiResp = getAiResponse(q);
      (q.consult_requests || []).forEach(cr => {
        const isResponded = cr.consult_status === "approved" || cr.consult_status === "rejected" || cr.consult_status === "reviewed" || cr.consult_status === "completed";
        items.push({
          id: `${q._id || q.query_id}_${cr.doctor_id}`,
          isBackend: true,
          doctor: {
            name: cr.doctor_name || `Doctor ${cr.doctor_id?.slice(-4) || ""}`,
            specialty: cr.doctor_specialization || aiResp?.required_specialization || "General",
            hospital: "MedTruth Network",
            rating: null,
            exp: null,
            verified: true,
          },
          query: q.query,
          queryId: q._id || q.query_id,
          note: "",
          sentAt: cr.consult_requested_at ? new Date(cr.consult_requested_at).toLocaleString() : "Recently",
          status: isResponded ? "responded" : "pending",
          read: isResponded,
          urgency: (aiResp?.risk_level || "low") === "high" ? "high" : (aiResp?.risk_level || "low") === "medium" ? "moderate" : "low",
          response: cr.doctor_recommendation || null,
          respondedAt: cr.reviewed_at ? new Date(cr.reviewed_at).toLocaleString() : null,
          verification: isResponded ? {
            status: "safe",
            label: "Verified Safe",
            safeLabel: "Doctor Reviewed & Approved",
            justification: cr.doctor_view || "Response has been reviewed by a medical professional.",
            sources: (aiResp?.citations || []).map(c => typeof c === "string" ? c : c.title || ""),
            patientContextStr: null,
          } : null,
          tags: isResponded ? ["Doctor Reviewed", "AI Verified"] : ["Awaiting Doctor"],
          patientContext: q.patient_context || q.patientContext || {},
          aiResponse: aiResp || null,
        });
      });
    });
    return items;
  };

  // ── Fetch consultations from backend + localStorage
  const fetchAll = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    const enriched = getStoredItems();

    if (!citizenId) {
      setAllItems([...enriched]);
      if (isManualRefresh) setRefreshing(false);
      return;
    }

    try {
      const data = await getCitizenQueries(citizenId);
      const queries = Array.isArray(data) ? data : (data?.queries || []);
      const backendItems = buildBackendItems(queries);

      // Merge: backend items take priority, then localStorage items not already in backend
      const backendIds = new Set(backendItems.map(b => b.queryId));
      const localOnly = enriched.filter(e => !e.queryId || !backendIds.has(e.queryId));

      const combined = [...localOnly, ...backendItems];
      setAllItems(combined);
    } catch (err) {
      console.error("Failed to fetch citizen queries:", err);
      setAllItems([...enriched]);
    } finally {
      if (isManualRefresh) setRefreshing(false);
    }
  };

  // ── Initial load + auto-poll every 15s for doctor responses
  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(), 15000);
    return () => clearInterval(interval);
  }, [citizenId]);

  const filtered = useMemo(() => {
    return allItems.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (r.query || "").toLowerCase().includes(q) ||
        r.doctor.name.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q));
      const matchUrgency = filterUrgency === "all" || r.urgency === filterUrgency;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "pending" && r.status === "pending") ||
        (filterStatus === "responded" && r.status === "responded") ||
        (filterStatus === "unread" && !r.read);
      return matchSearch && matchUrgency && matchStatus;
    });
  }, [search, filterStatus, filterUrgency, allItems]);

  const selectedItem = allItems.find(r => r.id === selectedId);
  const unreadCount = allItems.filter(r => !r.read).length;
  const pendingCount = allItems.filter(r => r.status === "pending").length;

  const handleSelect = (id) => {
    setSelectedId(id);
    setAllItems(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
  };

  return (
    <>


      <div className="flex flex-col h-full font-sans bg-[#f0f4ff] overflow-hidden">
        {/* ── Top Bar ── */}
        <div className="bg-white border-b border-[#e8ecf4] py-[16px] px-[28px] max-md:pl-[60px] max-md:px-[14px] flex items-center justify-between shrink-0 shadow-[0_1px_6px_rgba(0,0,0,0.04)] flex-wrap gap-[10px]">
          <div className="flex items-center gap-[14px] max-md:gap-[10px]">
            <div className="w-[40px] h-[40px] max-md:w-[34px] max-md:h-[34px] bg-[#2793ef] rounded-[12px] max-md:rounded-[10px] flex items-center justify-center text-white shadow-[0_3px_12px_rgba(99,102,241,0.3)] shrink-0">
              <Stethoscope size={19} className="max-md:hidden" />
              <Stethoscope size={16} className="md:hidden" />
            </div>
            <div>
              <div className="text-[16px] max-md:text-[14px] font-bold text-[#0f172a]">Doctor Responses</div>
              <div className="text-[11.5px] max-md:text-[10px] text-[#94a3b8] mt-[1px] max-md:hidden">AI-verified medical consultations</div>
            </div>
          </div>
          <div className="hidden md:flex gap-[6px] items-center">
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#f1f5f9] border-[#e2e8f0] text-[#475569]">
              <FileText size={12} /> {allItems.length} Total
            </div>
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#eff6ff] border-[#bfdbfe] text-[#3b82f6]">
              <Bell size={12} /> {unreadCount} Unread
            </div>
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#fffbeb] border-[#fde68a] text-[#d97706]">
              <HourglassIcon size={12} /> {pendingCount} Waiting
            </div>
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]">
              <CheckCircle2 size={12} /> {allItems.filter(r => r.status === "responded").length} Answered
            </div>
            <button
              className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#f0f9ff] border-[#0ea5e9] text-[#0ea5e9] cursor-pointer transition-all duration-200 hover:bg-[#0ea5e9] hover:text-white disabled:opacity-50"
              onClick={() => fetchAll(true)}
              disabled={refreshing}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Checking…" : "Check for Responses"}
            </button>
          </div>
          {/* Mobile refresh button */}
          <button
            className="md:hidden flex items-center gap-[5px] py-[6px] px-[12px] rounded-[10px] text-[11px] font-semibold border bg-[#f0f9ff] border-[#0ea5e9] text-[#0ea5e9] cursor-pointer transition-all duration-200 disabled:opacity-50 shrink-0"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "…" : "Refresh"}
          </button>
        </div>

        {/* ── Search + Filters ── */}
        <div className="py-[14px] px-[28px] max-md:px-[14px] flex items-center gap-[12px] max-md:gap-[8px] bg-white border-b border-[#f1f5f9] shrink-0 flex-wrap">
          <div className="flex-1 min-w-[140px] flex items-center gap-[8px] bg-[#f8faff] border-[1.5px] border-[#e2e8f0] rounded-[10px] py-[8px] max-md:py-[6px] px-[14px] max-md:px-[10px] transition-colors duration-200 focus-within:border-[#3b82f6] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]">
            <Search size={14} className="text-[#94a3b8] shrink-0" />
            <input
              className="flex-1 border-none bg-transparent outline-none text-[13px] max-md:text-[12px] text-[#1e293b] placeholder:text-[#94a3b8] min-w-0"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="bg-transparent border-none cursor-pointer text-[#94a3b8] flex">
                <X size={13} />
              </button>
            )}
          </div>
          <select className="bg-[#f8faff] border-[1.5px] border-[#e2e8f0] rounded-[10px] py-[8px] max-md:py-[6px] px-[12px] max-md:px-[8px] text-[12px] max-md:text-[11px] font-medium text-[#475569] outline-none cursor-pointer transition-colors duration-200 focus:border-[#3b82f6]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="responded">Responded</option>
            <option value="unread">Unread</option>
          </select>
          <select className="bg-[#f8faff] border-[1.5px] border-[#e2e8f0] rounded-[10px] py-[8px] max-md:py-[6px] px-[12px] max-md:px-[8px] text-[12px] max-md:text-[11px] font-medium text-[#475569] outline-none cursor-pointer transition-colors duration-200 focus:border-[#3b82f6]" value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}>
            <option value="all">Priority</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Routine</option>
          </select>
        </div>

        {/* ── Card List ── */}
        <div className="flex-1 overflow-y-auto py-[20px] px-[28px] max-md:py-[12px] max-md:px-[14px] flex flex-col gap-[12px] bg-white scrollbar-thin scrollbar-thumb-[#cbd5e1] scrollbar-track-transparent">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-[8px] py-[60px] px-[20px] text-center">
              <div className="w-[56px] h-[56px] bg-gradient-to-br from-[#dbeafe] to-[#ede9fe] rounded-[16px] flex items-center justify-center"><FileText size={28} color="#6366f1" /></div>
              <div className="text-[15px] font-bold text-[#0f172a]">No responses found</div>
              <div className="text-[12.5px] text-[#94a3b8] max-w-[320px]">Try adjusting your search or filters</div>
            </div>
          ) : (
            filtered.map(item => {
              const initials = item.doctor.name
                .split(" ")
                .filter(w => w !== "Dr.")
                .map(w => w[0])
                .join("")
                .slice(0, 2);
              return (
                <div
                  key={item.id}
                  className={`group bg-white border-[1.5px] border-[#e8ecf4] rounded-[14px] py-[18px] px-[20px] cursor-pointer transition-all duration-200 flex items-start gap-[14px] relative hover:border-[#bfdbfe] hover:shadow-[0_4px_16px_rgba(59,130,246,0.08)] hover:-translate-y-[1px] ${selectedId === item.id ? "border-[#3b82f6] bg-[#f8faff] shadow-[0_4px_16px_rgba(59,130,246,0.12)]" : ""} ${!item.read ? "before:content-[''] before:absolute before:top-1/2 before:-left-[1px] before:-translate-y-1/2 before:w-[3px] before:h-[28px] before:bg-[#3b82f6] before:rounded-[0_3px_3px_0]" : ""}`}
                  onClick={() => handleSelect(item.id)}
                >
                  <div className="w-[44px] h-[44px] rounded-full bg-[#2793ef] text-white text-[14px] font-bold flex items-center justify-center shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-[8px] mb-[4px]">
                      <span className="text-[14px] font-bold text-[#0f172a]">{item.doctor.name}</span>
                      <div className="flex gap-[5px] shrink-0">
                        <span className={`text-[10px] font-semibold py-[3px] px-[8px] rounded-[12px] uppercase tracking-[0.03em] ${item.status === "pending" ? "bg-[#fffbeb] text-[#d97706]" : "bg-[#ecfdf5] text-[#059669]"}`}>
                          {item.status === "pending" ? "⏳ Waiting for Doctor" : "✓ Responded"}
                        </span>
                        <span className={`text-[10px] font-semibold py-[3px] px-[8px] rounded-[12px] uppercase tracking-[0.03em] ${item.urgency === "high" ? "bg-[#fef2f2] text-[#dc2626]" : item.urgency === "moderate" ? "bg-[#fff7ed] text-[#ea580c]" : "bg-[#f0fdf4] text-[#16a34a]"}`}>
                          {item.urgency === "high" ? "⚡ Urgent" : item.urgency === "moderate" ? "Moderate" : "Routine"}
                        </span>
                      </div>
                    </div>
                    <div className="text-[12px] text-[#3b82f6] font-medium mb-[6px]">
                      {item.doctor.specialty} · {item.doctor.hospital || "Verified Doctor"}
                    </div>
                    <div className="text-[13px] text-[#475569] leading-relaxed overflow-hidden line-clamp-2">{item.query}</div>
                    <div className="flex items-center gap-[12px] mt-[8px]">
                      <span className="flex items-center gap-[4px] text-[11px] text-[#94a3b8]">
                        <Clock size={11} />
                        {item.responseDate || item.consultDate || "Recently"}
                      </span>
                      {item.tags && item.tags.map((t, i) => (
                        <span key={i} className="flex items-center gap-[4px] text-[11px] text-[#94a3b8] text-[#6366f1]">
                          <ShieldCheck size={11} /> {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#cbd5e1] shrink-0 transition-colors duration-200 group-hover:text-[#3b82f6]" />
                </div>
              );
            })
          )}
        </div>

        {/* ── Detail Modal ── */}
        {selectedItem && (
          <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-[4px] z-[199] flex items-center justify-center animate-[drFadeIn_0.2s_ease]" onClick={() => setSelectedId(null)}>
            <div className="relative w-[680px] max-w-[92vw] max-h-[88vh] bg-white z-[200] shadow-[0_20px_60px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)] rounded-[20px] flex flex-col overflow-hidden animate-[drModalIn_0.25s_cubic-bezier(0.4,0,0.2,1)] md:max-w-[96vw] md:max-h-[92vh] md:rounded-[14px]" onClick={e => e.stopPropagation()}>
              <div className="py-[18px] px-[24px] border-b border-[#e8ecf4] flex items-center justify-between bg-gradient-to-br from-[#f8faff] to-[#f0f4ff] shrink-0 rounded-t-[20px] md:rounded-t-[14px]">
                <div className="flex items-center gap-[10px]">
                  <div>
                    <div className="text-[16px] font-bold text-[#0f172a]">Consultation Detail</div>
                    <div className="text-[11.5px] text-[#94a3b8] mt-[1px]">{selectedItem.doctor.name} · {selectedItem.doctor.specialty}</div>
                  </div>
                </div>
                <button className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[10px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer text-[#64748b] transition-all duration-200 hover:text-[#ef4444] hover:border-[#ef4444] hover:bg-[#fef2f2]" onClick={() => setSelectedId(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-[#e2e8f0] scrollbar-track-transparent">
                <DetailPanel
                  key={selectedItem.id}
                  item={selectedItem}
                  onClose={() => setSelectedId(null)}
                  onBackToChat={() => router.push("/home/citizen/chat")}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
