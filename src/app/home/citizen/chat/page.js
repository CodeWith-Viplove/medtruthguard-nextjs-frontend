"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createMedicalQuery, consultDoctor, mapAiResponseToChat, ApiError } from "@/lib/api";
import {
  User,
  Heart,
  Pill,
  Baby,
  ChevronLeft,
  ChevronRight,
  Send,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Sparkles,
  BookOpen,
  Plus,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Stethoscope,
  Activity,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Tag, Tooltip } from "antd";

// ─── Preset checkbox options ────────────────────────────────────────────────────
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

// ─── Suggested queries ──────────────────────────────────────────────────────────
/* const suggestedQueries = [
  "What can I take for fever during pregnancy?",
  "Treatment options for dengue fever?",
  "Can diabetic patient take Metformin?",
  "Blood pressure management for hypertension?",
  "Safe antibiotics for kidney patients?",
]; */

// ─── Status badge config ────────────────────────────────────────────────────────
const statusConfig = {
  safe: {
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    icon: <ShieldCheck size={14} />,
    label: "Verified Safe",
  },
  caution: {
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fcd34d",
    icon: <ShieldAlert size={14} />,
    label: "Use with Caution",
  },
  unsafe: {
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fca5a5",
    icon: <AlertTriangle size={14} />,
    label: "Not Recommended",
  },
};

// ─── Chat Message Component ─────────────────────────────────────────────────────
const ChatMessage = ({ message, onConsult }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-[10px] max-w-[96%] md:max-w-[88%] animate-[fadeInUp_0.3s_ease] self-end flex-row-reverse">
        <div className="py-[12px] px-[16px] rounded-2xl relative max-w-full bg-[#2793ef] text-white rounded-tr-md shadow-[0_4px_12px_rgba(99,102,241,0.25)]">
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <span className="block text-[10.5px] mt-[5px] opacity-55">{message.time}</span>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-[#2793ef] text-white">
          <User size={16} />
        </div>
      </div>
    );
  }

  const verification = message.verification;
  const cfg = verification ? statusConfig[verification.status] : null;
  const isSafe = verification?.status === "safe";

  return (
    <div className="flex gap-[10px] max-w-[96%] md:max-w-[88%] animate-[fadeInUp_0.3s_ease] self-start">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-gradient-to-br from-sky-500 to-blue-500 text-white">
        <Stethoscope size={16} />
      </div>
      <div className="flex flex-col gap-[10px] flex-1">

        {/* Verification Results Card — exact image format */}
        {verification && cfg && (
          <div className="bg-white border border-[#e8ecf4] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden animate-[fadeInUp_0.35s_ease] max-w-full">
            {/* ── Title ── */}
            <div className="text-[20px] font-bold text-slate-900 pt-[20px] px-[22px]">Verification Results</div>

            {/* ── Status Row ── */}
            <div className="flex items-center justify-between py-[14px] px-[22px] flex-wrap gap-[8px]">
              <div className="flex items-center gap-[14px]">
                <div className={`w-[42px] h-[42px] rounded-full border-2 flex items-center justify-center shrink-0 ${isSafe ? "bg-emerald-50 border-emerald-300 text-emerald-500" : verification.status === "caution" ? "bg-amber-50 border-amber-300 text-amber-500" : "bg-red-50 border-red-300 text-red-500"}`}>
                  {isSafe && <ShieldCheck size={20} />}
                  {verification.status === "caution" && <ShieldAlert size={20} />}
                  {verification.status === "unsafe" && <AlertTriangle size={20} />}
                </div>
                <div>
                  <span className={`inline-block rounded-full text-[11px] font-bold py-[4px] px-[12px] mb-[4px] uppercase tracking-[0.05em] ${isSafe ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : verification.status === "caution" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                    {cfg.label}
                  </span>
                  <div className={`flex items-center gap-[5px] text-[13px] font-semibold ${isSafe ? "text-emerald-600" : verification.status === "caution" ? "text-amber-600" : "text-red-500"}`}>
                    {isSafe && <CheckCircle2 size={14} />}
                    {verification.status === "caution" && <Info size={14} />}
                    {verification.status === "unsafe" && <AlertTriangle size={14} />}

                    {verification.safeLabel && verification.safeLabel.toLowerCase() !== cfg.label.toLowerCase()
                      ? verification.safeLabel
                      : (isSafe ? "Safe for this patient" : verification.status === "caution" ? "Caution advised for this patient" : "Not safe for this patient")}
                  </div>
                </div>
              </div>
              <span className="text-[12px] text-slate-400 whitespace-nowrap">{message.time}</span>
            </div>

            {/* ── QUERY ── */}
            <div className="py-[10px] px-[22px] border-t border-slate-100">
              <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-[6px]">QUERY</div>
              <p className="text-[14px] text-slate-800 leading-relaxed">{message.queryText}</p>
            </div>

            {/* ── AI RESPONSE ── */}
            <div className="py-[10px] px-[22px] border-t border-slate-100">
              <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-[6px]">Medthruth Response</div>
              <div className="bg-[#f8faff] border border-[#e8ecf4] rounded-[10px] py-[12px] px-[14px]">
                <p className="text-[13.5px] text-slate-700 leading-relaxed">{message.content}</p>
              </div>
            </div>

            {/* ── VERIFICATION JUSTIFICATION ── */}
            <div className="py-[10px] px-[22px] border-t border-slate-100">
              <div className="flex items-center gap-[8px] mb-[6px]">
                <div className="flex items-center gap-[6px] text-[11px] font-bold tracking-[0.08em] uppercase text-[#1d6fa8]">
                  VERIFICATION JUSTIFICATION
                </div>
                <Tag color="blue" className="rounded-full font-bold m-0 px-[8px] tracking-[0.05em] text-[10px]">PUBMED</Tag>
              </div>
              <p className="text-[13.5px] text-slate-700 leading-relaxed">{verification.justification}</p>
            </div>

            {/* ── Source Pills ── */}
            <div className="flex flex-wrap gap-[8px] p-[8px_22px_14px] border-t border-slate-100">
              {verification.sources.map((s, i) => (
                <span key={i} className="border border-slate-300 rounded-full text-[12px] text-slate-700 py-[5px] px-[14px] bg-white">{s}</span>
              ))}
            </div>

            {/* ── Patient Context Applied ── */}
            {verification.patientContextStr && (
              <div className="flex items-center gap-[12px] bg-[#f8faff] border border-[#e8ecf4] rounded-[10px] mx-[22px] mb-[14px] p-[12px_14px]">
                <User size={16} className="text-slate-500 shrink-0" />
                <div>
                  <div className="text-[13px] font-bold text-slate-800">Patient Context Applied</div>
                  <div className="text-[12px] text-slate-500 mt-[2px]">{verification.patientContextStr}</div>
                </div>
              </div>
            )}

            {/* ── Recommended Doctors ── */}
            {message.doctors && message.doctors.length > 0 && (
              <div className="border-t border-slate-100 p-[14px_22px_18px]">
                <div className="flex items-center gap-[7px] text-[12px] font-bold tracking-[0.06em] uppercase text-slate-500 mb-[12px]">
                  <Stethoscope size={14} />
                  Recommended Doctors
                </div>
                <div className="flex flex-col gap-[8px]">
                  {message.doctors.map((doc, i) => (
                    <div key={doc.id || i} className="flex items-center gap-[12px] bg-[#f8faff] border border-[#e8ecf4] rounded-[10px] py-[10px] px-[14px] transition-shadow duration-200 hover:shadow-[0_3px_12px_rgba(59,130,246,0.1)] hover:border-blue-200">
                      <div className="w-[38px] h-[38px] rounded-full bg-[#2793ef] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                        {(doc.name || "").split(" ").filter(w => !w.startsWith("Dr")).map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-slate-800">{doc.name}</div>
                        <div className="text-[11.5px] text-[#2793ef] font-medium mt-[1px]">{doc.specialty || doc.specialization}</div>
                        {doc.reason && <div className="text-[11px] text-slate-500 mt-[1px] overflow-hidden text-ellipsis whitespace-nowrap">{doc.reason}</div>}
                      </div>
                      <div className="text-right shrink-0">
                        {doc.suitability_score != null && (
                          <div className="text-[12px] text-amber-500 font-bold">Score: {doc.suitability_score}</div>
                        )}
                        {doc.rating && <div className="text-[12px] text-amber-500 font-bold">★ {doc.rating}</div>}
                        {doc.exp && <div className="text-[11px] text-slate-400 mt-[2px]">{doc.exp}</div>}
                      </div>
                      <button
                        className="flex items-center gap-[5px] bg-[#2793ef] border-none rounded-lg text-white text-[11px] font-semibold py-[6px] px-[10px] cursor-pointer shrink-0 transition-all duration-200 shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(99,102,241,0.4)]"
                        onClick={() => onConsult && onConsult(doc, message.queryText, message.queryId, message.aiResponse)}
                        title="Send query to this doctor"
                      >
                        <Send size={12} />
                        Consult
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plain AI bubble when no verification */}
        {!verification && (
          <div className="py-[12px] px-[16px] rounded-2xl relative max-w-full bg-white text-slate-800 rounded-tl-md shadow-[0_2px_10px_rgba(0,0,0,0.07)] border border-slate-100">
            <div className="flex items-center gap-[5px] mb-[6px]">
              <span className="text-[11px] font-bold text-[#2793ef] tracking-[0.03em] uppercase">MedTruth AI</span>
            </div>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
            <span className="block text-[10.5px] mt-[5px] opacity-55">{message.time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const dynamic = "force-dynamic";

// ─── Main Chat Page ─────────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const citizenId = session?.user?.id || "anonymous";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      content:
        "Hello! I'm MedTruth AI, your medical verification assistant. Ask me any medical question and I'll provide verified, evidence-based information tailored to your patient context.",
      time: "Just now",
      verification: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
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
  const [showConditions, setShowConditions] = useState(true);
  const [showMedications, setShowMedications] = useState(true);
  const [contextSaved, setContextSaved] = useState(false);
  // Consult Modal state
  const [consultModal, setConsultModal] = useState(null); // { doctor, queryText }
  const [consultNote, setConsultNote] = useState("");
  const [consultSent, setConsultSent] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const formatTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSend = async (queryText) => {
    const q = queryText || input.trim();
    if (!q || loading) return;
    setInput("");
    setApiError(null);

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: q,
      time: formatTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const backendResponse = await createMedicalQuery(q, citizenId, patientContext);
      const parsed = mapAiResponseToChat(backendResponse);

      // Build patient context string for display
      const ctxParts = [];
      if (patientContext.age) ctxParts.push(`Age: ${patientContext.age}`);
      if (patientContext.gender) ctxParts.push(patientContext.gender);
      if (patientContext.isPregnant) ctxParts.push("Pregnant");
      if (patientContext.conditions.length) ctxParts.push(...patientContext.conditions);
      if (ctxParts.length) parsed.verification.patientContextStr = ctxParts.join(" • ");

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: parsed.response,
        queryText: q,
        queryId: parsed.queryId,
        time: new Date().toLocaleString(),
        verification: parsed.verification,
        doctors: parsed.doctors,
        disclaimer: parsed.disclaimer,
        aiResponse: parsed.aiResponse || null,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("API Error:", err);
      const errorContent =
        err instanceof ApiError && err.body?.detail?.missing_fields
          ? `⚠️ Patient context incomplete. Please fill in: ${err.body.detail.missing_fields.join(", ")}. Open the Patient Profile panel to update your details.`
          : `⚠️ Failed to get response: ${err.message}. Please check that the backend server is running and try again.`;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          content: errorContent,
          time: formatTime(),
          verification: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
    // Automatically close the modal after a short delay so the user sees the "Saved!" state
    setTimeout(() => {
      setContextSaved(false);
      setSidebarOpen(false);
    }, 800);
  };

  // Open consultation modal
  const handleConsult = (doctor, queryText, queryId, aiResponse) => {
    setConsultModal({ doctor, queryText, queryId, aiResponse });
    setConsultNote("");
    setConsultSent(false);
  };

  // Send consultation to doctor via backend API
  const handleSendConsult = async () => {
    if (!consultModal) return;

    try {
      // Call the real consult API if we have a queryId
      if (consultModal.queryId && consultModal.doctor.id) {
        await consultDoctor(
          consultModal.queryId,
          consultModal.doctor.id,
          citizenId
        );
      }
    } catch (err) {
      console.error("Consult API error:", err);
      // Continue anyway — the local state will still update for UX
    }

    // Also persist to localStorage for the doctor-responses page to pick up
    if (typeof window !== "undefined") {
      const consultation = {
        id: Date.now(),
        doctor: consultModal.doctor,
        query: consultModal.queryText,
        queryId: consultModal.queryId,
        citizenId: citizenId, // Save the citizen ID
        note: consultNote,
        patientContext,
        sentAt: new Date().toLocaleString(),
        status: "pending",
        read: false,
        urgency: "moderate",
        aiResponse: consultModal.aiResponse || null,
      };
      try {
        const existing = JSON.parse(localStorage.getItem("medtruth_consultations") || "[]");
        localStorage.setItem("medtruth_consultations", JSON.stringify([consultation, ...existing]));
      } catch (e) { }
    }
    setConsultSent(true);
    setTimeout(() => {
      setConsultModal(null);
      router.push("/home/citizen/doctor-responses");
    }, 1800);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        role: "ai",
        content:
          "Hello! I'm MedTruth AI, your medical verification assistant. Ask me any medical question and I'll provide verified, evidence-based information tailored to your patient context.",
        time: "Just now",
        verification: null,
      },
    ]);
  };

  return (
    <>


      <div className="flex h-full bg-[#f0f4ff] font-sans overflow-hidden relative">
        {/* ── PATIENT CONTEXT MODAL ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-[6px] z-[1000] flex items-center justify-center p-[20px] animate-[fadeIn_0.2s_ease]"
            onClick={(e) => e.target === e.currentTarget && setSidebarOpen(false)}
          >
            <div className="bg-white rounded-3xl w-full max-w-[620px] max-h-[90vh] shadow-[0_24px_60px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
              {/* Modal Header */}
              <div className="bg-[#fafbfc] border-b border-slate-200 p-[20px_24px] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-[14px]">
                  <div className="w-[44px] h-[44px] bg-[#2793ef] rounded-[12px] flex items-center justify-center shrink-0 text-white shadow-[0_4px_14px_rgba(59,130,246,0.4)]">
                    <User size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="text-slate-900 text-[17px] font-bold leading-tight">Patient Profile</div>
                    <div className="text-slate-500 text-[12px] mt-[3px]">Configure your health profile for personalized responses</div>
                  </div>
                </div>
                <button
                  className="bg-slate-100 border border-slate-200 rounded-lg w-9 h-9 flex items-center justify-center cursor-pointer text-slate-400 transition-all duration-200 shrink-0 hover:text-red-500 hover:border-red-400 hover:bg-red-50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body — Scrollable */}
              <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[20px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">

                {/* Active Context Badge */}
                {(patientContext.age || patientContext.conditions.length > 0) && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[12px] px-[16px] py-[12px] flex items-center gap-[10px]">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0 animate-[pulse_2s_infinite]" />
                    <div>
                      <div className="text-emerald-600 text-[13px] font-semibold">Patient Context Active</div>
                      <div className="text-slate-600 text-[12px] mt-[2px]">
                        {patientContext.age && `${patientContext.age}yo ${patientContext.gender}`}
                        {patientContext.conditions.length > 0 &&
                          ` • ${patientContext.conditions.join(", ")}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Demographics Card */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-[14px] p-[20px]">
                  <div className="flex items-center gap-[8px] text-slate-500 text-[11px] font-bold tracking-[0.1em] uppercase mb-[18px] [&_svg]:text-[#2793ef]">
                    <User size={13} />
                    Basic Information
                  </div>

                  {/* Age + Gender */}
                  <div className="flex gap-[14px] mb-[16px]">
                    <div className="flex-1 flex flex-col gap-[6px]">
                      <label className="text-slate-700 text-[12px] font-medium">Age</label>
                      <input
                        className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)] [&_option]:bg-white"
                        type="number"
                        placeholder="e.g. 30"
                        value={patientContext.age}
                        onChange={(e) =>
                          setPatientContext((p) => ({ ...p, age: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-[6px]">
                      <label className="text-slate-700 text-[12px] font-medium">Gender</label>
                      <select
                        className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)] [&_option]:bg-white"
                        value={patientContext.gender}
                        onChange={(e) =>
                          setPatientContext((p) => ({
                            ...p,
                            gender: e.target.value,
                          }))
                        }
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Pregnancy Toggle */}
                  <div
                    className="flex items-center gap-[10px] cursor-pointer select-none"
                    onClick={() =>
                      setPatientContext((p) => ({
                        ...p,
                        isPregnant: !p.isPregnant,
                      }))
                    }
                  >
                    <div className={`w-[40px] h-[22px] rounded-full relative transition-colors duration-200 shrink-0 ${patientContext.isPregnant ? "bg-[#2793ef]" : "bg-slate-300"}`}>
                      <div className={`w-[16px] h-[16px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${patientContext.isPregnant ? "left-[21px]" : "left-[3px]"}`} />
                    </div>
                    <Baby size={14} className={patientContext.isPregnant ? "text-[#3b82f6]" : "text-[#64748b]"} />
                    <span className="text-slate-600 text-[13px]">Currently Pregnant</span>
                  </div>
                </div>

                {/* Health Conditions Card */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-[14px] p-[20px]">
                  <div className="flex items-center justify-between mb-[14px]">
                    <div className="flex items-center gap-[8px] text-slate-600 text-[13px] font-semibold">
                      <Heart size={13} color="#ef4444" />
                      Existing Health Conditions
                    </div>
                    <button
                      className="flex items-center gap-[4px] bg-white border border-slate-200 rounded-md text-[#2793ef] text-[11px] px-[14px] py-[5px] cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:border-slate-300"
                      onClick={() => setShowConditions((v) => !v)}
                    >
                      <ChevronDown size={12} className={`transition-transform duration-200 ${showConditions ? "rotate-180" : ""}`} />
                      {showConditions ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showConditions && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-[8px] gap-x-[10px] bg-white border border-slate-100 rounded-[10px] p-[12px_14px]">
                      {PRESET_CONDITIONS.map((item) => (
                        <label key={item} className="flex items-start gap-[7px] cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-[15px] h-[15px] min-w-[15px] accent-blue-500 cursor-pointer mt-[1px]"
                            checked={patientContext.conditions.includes(item)}
                            onChange={() => toggleCondition(item)}
                          />
                          <span className="text-slate-700 text-[12px] leading-tight group-hover:text-slate-900 transition-colors">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Medications Card */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-[14px] p-[20px]">
                  <div className="flex items-center justify-between mb-[14px]">
                    <div className="flex items-center gap-[8px] text-slate-600 text-[13px] font-semibold">
                      <Pill size={13} color="#8b5cf6" />
                      Current Medications
                    </div>
                    <button
                      className="flex items-center gap-[4px] bg-white border border-slate-200 rounded-md text-[#2793ef] text-[11px] px-[14px] py-[5px] cursor-pointer transition-all duration-200 hover:bg-slate-100 hover:border-slate-300"
                      onClick={() => setShowMedications((v) => !v)}
                    >
                      <ChevronDown size={12} className={`transition-transform duration-200 ${showMedications ? "rotate-180" : ""}`} />
                      {showMedications ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showMedications && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-[8px] gap-x-[10px] bg-white border border-slate-100 rounded-[10px] p-[12px_14px]">
                      {PRESET_MEDICATIONS.map((item) => (
                        <label key={item} className="flex items-start gap-[7px] cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-[15px] h-[15px] min-w-[15px] accent-blue-500 cursor-pointer mt-[1px]"
                            checked={patientContext.medications.includes(item)}
                            onChange={() => toggleMedication(item)}
                          />
                          <span className="text-slate-700 text-[12px] leading-tight group-hover:text-slate-900 transition-colors">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Details Card */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-[14px] p-[20px]">
                  <div className="flex items-center gap-[8px] text-slate-500 text-[11px] font-bold tracking-[0.1em] uppercase mb-[16px] [&_svg]:text-[#2793ef]">
                    <Activity size={13} />
                    Additional Details
                  </div>
                  <div className="flex flex-col gap-[14px]">
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-slate-700 text-[12px] font-medium">Current Symptoms</label>
                      <input
                        className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)]"
                        type="text"
                        placeholder="e.g. fever and headache"
                        value={patientContext.symptoms}
                        onChange={(e) =>
                          setPatientContext((p) => ({ ...p, symptoms: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-slate-700 text-[12px] font-medium">Known Allergies</label>
                      <input
                        className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)]"
                        type="text"
                        placeholder="e.g. penicillin, sulfa"
                        value={patientContext.allergies}
                        onChange={(e) =>
                          setPatientContext((p) => ({ ...p, allergies: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-[6px]">
                      <label className="text-slate-700 text-[12px] font-medium">Medical History</label>
                      <input
                        className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)]"
                        type="text"
                        placeholder="e.g. no chronic conditions"
                        value={patientContext.history}
                        onChange={(e) =>
                          setPatientContext((p) => ({ ...p, history: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-[10px] p-[16px_24px] border-t border-slate-100 bg-white shrink-0">
                <button
                  className="bg-slate-100 border border-slate-200 rounded-[10px] text-slate-500 text-[13px] font-semibold py-[10px] px-[20px] cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-800"
                  onClick={() => setSidebarOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={`flex items-center gap-[8px] bg-[#2793ef] border-none rounded-[10px] text-white p-[10px_24px] text-[14px] font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(59,130,246,0.35)] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(59,130,246,0.45)] ${contextSaved ? "!from-emerald-500 !to-emerald-600 !shadow-[0_4px_16px_rgba(16,185,129,0.35)]" : ""}`}
                  onClick={() => { saveContext(); }}
                >
                  {contextSaved ? (
                    <>
                      <CheckCircle2 size={16} />
                      Context Saved!
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Save Patient Context
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CHAT ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#f8faff] relative">
          {/* Chat Header */}
          <header className="bg-white border-b border-[#e8ecf4] py-[14px] px-[22px] max-md:pl-[60px] max-md:px-[14px] flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.05)] gap-[10px]">
            <div className="flex items-center gap-[12px] max-md:gap-[8px]">
              <div className="w-[38px] h-[38px] max-md:w-[32px] max-md:h-[32px] bg-[#2793ef] rounded-[10px] max-md:rounded-[8px] flex items-center justify-center text-white shadow-[0_3px_10px_rgba(99,102,241,0.3)] shrink-0">
                <Stethoscope size={18} className="max-md:hidden" />
                <Stethoscope size={15} className="md:hidden" />
              </div>
              <div>
                <div className="text-[16px] max-md:text-[13px] font-bold text-slate-900">Medical Query Chat</div>
                <div className="text-[12px] max-md:text-[10px] text-slate-400 max-md:hidden">Ask any medical question for verified AI responses</div>
              </div>
            </div>
            <div className="flex items-center gap-[8px] max-md:gap-[6px] shrink-0">
              <button className="flex items-center gap-[6px] bg-[#f8faff] border border-slate-200 rounded-lg text-slate-500 text-[12px] max-md:text-[11px] font-medium px-[12px] max-md:px-[8px] py-[7px] max-md:py-[5px] cursor-pointer transition-all duration-200 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 danger [&.danger:hover]:border-red-500 [&.danger:hover]:text-red-500 [&.danger:hover]:bg-red-50 " onClick={clearChat}>
                <Trash2 size={13} />
                <span className="max-md:hidden">Clear</span>
              </button>
              <button
                className="flex items-center gap-[7px] max-md:gap-[5px] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-[1.5px] border-blue-500/25 rounded-[10px] text-[#2793ef] text-[12px] max-md:text-[11px] font-semibold px-[14px] max-md:px-[10px] py-[7px] max-md:py-[5px] cursor-pointer transition-all duration-250 whitespace-nowrap hover:from-blue-500/20 hover:to-indigo-500/20 hover:border-blue-500 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]"
                onClick={() => setSidebarOpen(true)}
              >
                <User size={14} />
                <span className="max-md:hidden">Patient Profile</span>
                <span className="md:hidden">Profile</span>
              </button>
            </div>
          </header>

          {/* Status Bar */}
          {/* <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-100 py-[8px] px-[22px] flex items-center gap-[16px] hidden md:flex">
            <div className="flex items-center gap-[6px] text-[11.5px] text-slate-600 font-medium [&_svg]:text-blue-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
              AI Online
            </div>
            <div className="flex items-center gap-[6px] text-[11.5px] text-slate-600 font-medium [&_svg]:text-blue-500">
              <ShieldCheck size={13} />
              Evidence-Based Verification Active
            </div>
            <div className="flex items-center gap-[6px] text-[11.5px] text-slate-600 font-medium [&_svg]:text-blue-500">
              <BookOpen size={13} />
              WHO · CDC · ADA Sources
            </div>
            {
              patientContext.age && (
                <div className="flex items-center gap-[6px] text-[11.5px] text-slate-600 font-medium [&_svg]:text-blue-500">
                  <User size={13} />
                  Context: {patientContext.age}yo {patientContext.gender}
                </div>
              )
            }
          </div> */}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-[24px_24px_12px] flex flex-col gap-[20px] scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {
              messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onConsult={handleConsult} />
              ))
            }

            {/* Simple & Nice Loading */}
            {loading && (
              <div className="flex items-start gap-[12px] animate-[fadeInUp_0.3s_ease]">
                <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 mt-1 bg-blue-50 text-[#2793ef] border border-blue-100 italic font-bold">
                  <Stethoscope size={18} />
                </div>
                <div className="bg-white border border-slate-100 rounded-[18px] rounded-tl-[4px] py-[12px] px-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex items-center gap-[12px]">
                  <div className="flex gap-[4px]">
                    <div className="w-[6px] h-[6px] rounded-full bg-blue-400 animate-[bounce_1.4s_infinite_0ms]" />
                    <div className="w-[6px] h-[6px] rounded-full bg-blue-400 animate-[bounce_1.4s_infinite_200ms]" />
                    <div className="w-[6px] h-[6px] rounded-full bg-blue-400 animate-[bounce_1.4s_infinite_400ms]" />
                  </div>
                  {/* <span className="text-[13px] text-slate-400 font-medium">Verifying with medical sources...</span> */}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Queries */}
          {/*
            messages.length <= 2 && !loading && (
              <div className="p-[12px_24px] border-t border-slate-100 overflow-x-auto flex gap-[8px] bg-white scrollbar-hide">
                {suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    className="shrink-0 bg-blue-50 border border-blue-100 rounded-[20px] text-[#2793ef] text-[12px] font-medium px-[14px] py-[6px] cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-blue-500 hover:text-white hover:border-transparent hover:-translate-y-[1px] hover:shadow-[0_3px_8px_rgba(59,130,246,0.3)]"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )
          */}

          {/* Input Area */}
          <div className="bg-white border-t border-[#e8ecf4] py-[14px] px-[22px] shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-end gap-[10px] bg-[#f8faff] border-2 border-slate-200 rounded-[14px] py-[10px] px-[14px] transition-all duration-200 focus-within:border-[#2793ef] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]">
              <textarea
                ref={textareaRef}
                className="flex-1 bg-transparent border-none outline-none resize-none text-[14px] text-slate-800 leading-relaxed max-h-[120px] min-h-[22px] font-inherit placeholder:text-slate-400 h-auto"
                placeholder="Ask a medical question… e.g. What can I take for fever?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
              <button
                className="w-[38px] h-[38px] rounded-[10px] border-none bg-[#2793ef] text-white flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 shadow-[0_3px_10px_rgba(99,102,241,0.3)] hover:not(:disabled):scale-105 hover:not(:disabled):shadow-[0_5px_14px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-[8px] px-[2px]">
              <span className="text-[11px] text-slate-400">
                Press <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line
              </span>
              <div className="flex items-center gap-[4px] text-[10.5px] text-slate-400">
                <AlertTriangle size={11} />
                For informational purposes only — not a substitute for medical advice
              </div>
            </div>
          </div>
        </main>
      </div>


      {/* ── Consult Doctor Modal ── */}
      {consultModal && (
        <div className="fixed inset-0 bg-[#0f172a]/65 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-[20px] animate-[fadeIn_0.2s_ease]" onClick={(e) => e.target === e.currentTarget && !consultSent && setConsultModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-[540px] shadow-[0_24px_60px_rgba(0,0,0,0.25)] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            {/* Header */}
            <div className="bg-[#f9faff] p-[18px_22px] flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                {/* <div className="w-[36px] h-[36px] rounded-[10px] bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center"><Stethoscope size={17} color="#fff" /></div> */}
                <div>
                  <div className="text-[15px] font-bold text-black">Consult a Doctor</div>
                  <div className="text-[11px] text-slate-400 mt-[1px]">Your query will be sent for expert review</div>
                </div>
              </div>
              {!consultSent && (
                <button className="bg-white/10 border border-white/10 rounded-lg text-slate-400 p-[6px] cursor-pointer flex items-center transition-all duration-200 hover:text-red-500 hover:border-red-500" onClick={() => setConsultModal(null)}>
                  <X size={16} />
                </button>
              )}
            </div>

            {!consultSent ? (
              <>
                <div className="p-[20px_22px] flex flex-col gap-[14px]">
                  {/* Selected Doctor */}
                  <div>
                    <div className="text-[10.5px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-[6px] flex items-center gap-[5px]"> Selected Doctor</div>
                    <div className="flex items-center gap-[12px] bg-[#f8faff] border border-[#e8ecf4] rounded-xl p-[12px_14px]">
                      <div className="w-[44px] h-[44px] rounded-full bg-[#2793ef] text-white text-[15px] font-bold flex items-center justify-center shrink-0">
                        {consultModal.doctor.name.split(" ").filter(w => w !== "Dr.").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-900">{consultModal.doctor.name}</div>
                        <div className="text-[12px] text-blue-500 font-medium">{consultModal.doctor.specialty}</div>
                        {/* <div className="text-[11px] text-slate-400 mt-[1px]">{consultModal.doctor.hospital} &bull; ★ {consultModal.doctor.rating} &bull; {consultModal.doctor.exp}</div> */}
                      </div>
                    </div>
                  </div>

                  {/* Query */}
                  <div>
                    <div className="text-[10.5px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-[6px] flex items-center gap-[5px]">Your Query</div>
                    <div className="bg-[#f8faff] border border-[#e8ecf4] rounded-[10px] p-[11px_14px] text-[13px] text-slate-700 italic leading-relaxed">“{consultModal.queryText}”</div>
                  </div>

                  {/* Patient Context */}
                  {(patientContext.age || patientContext.conditions.length > 0 || patientContext.medications.length > 0) && (
                    <div>
                      <div className="text-[10.5px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-[6px] flex items-center gap-[5px]">Patient Context (Pre-filled)</div>
                      <div className="flex flex-wrap gap-[6px]">
                        {patientContext.age && <span className="bg-blue-50 border border-blue-200 rounded-[20px] text-[11px] text-blue-500 font-medium py-[3px] px-[10px]">Age: {patientContext.age}</span>}
                        {patientContext.gender && <span className="bg-blue-50 border border-blue-200 rounded-[20px] text-[11px] text-blue-500 font-medium py-[3px] px-[10px]">{patientContext.gender}</span>}
                        {patientContext.isPregnant && <span className="bg-blue-50 border border-blue-200 rounded-[20px] text-[11px] text-blue-500 font-medium py-[3px] px-[10px]">Pregnant</span>}
                        {patientContext.conditions.map((c, i) => <span key={i} className="bg-blue-50 border border-blue-200 rounded-[20px] text-[11px] text-blue-500 font-medium py-[3px] px-[10px]">{c}</span>)}
                        {patientContext.medications.map((m, i) => <span key={i} className="bg-blue-50 border border-blue-200 rounded-[20px] text-[11px] text-blue-500 font-medium py-[3px] px-[10px] bg-[#faf5ff] border-[#e9d5ff] text-[#7c3aed]">{m}</span>)}
                      </div>
                    </div>
                  )}

                  {/* Additional Note */}
                  <div>
                    <div className="text-[10.5px] font-bold tracking-[0.07em] uppercase text-slate-500 mb-[6px] flex items-center gap-[5px]">Additional Note (Optional)</div>
                    <textarea
                      className="w-full border-[1.5px] border-slate-200 rounded-[10px] bg-[#f8faff] text-slate-800 text-[13px] font-inherit p-[10px_12px] resize-none outline-none min-h-[72px] leading-relaxed transition-colors duration-200 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] placeholder:text-slate-400"
                      placeholder="Add any additional symptoms, concerns or specific questions for the doctor..."
                      value={consultNote}
                      onChange={(e) => setConsultNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-[10px] p-[16px_22px] border-t border-slate-100">
                  <button className="bg-[#f8faff] border-[1.5px] border-slate-200 rounded-[10px] text-slate-500 text-[13px] font-semibold py-[9px] px-[18px] cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-800" onClick={() => setConsultModal(null)}>Cancel</button>
                  <button className="flex items-center gap-[7px] bg-[#2793ef] border-none rounded-[10px] text-white text-[13px] font-bold py-[9px] px-[22px] cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(99,102,241,0.4)] [&.sent]:from-emerald-500 [&.sent]:to-emerald-600" onClick={handleSendConsult}>

                    Send to Doctor
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-[10px] p-[30px_22px] text-center">
                <div className="w-[56px] h-[56px] rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center animate-[bounceIn_0.4s_ease]">
                  <CheckCircle2 size={28} color="#10b981" />
                </div>
                <div className="text-[16px] font-bold text-slate-900">Query Sent Successfully!</div>
                <div className="text-[13px] text-slate-500">
                  Your query has been sent to <strong>{consultModal.doctor.name}</strong>.<br />
                  Redirecting to Doctor Responses…
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}