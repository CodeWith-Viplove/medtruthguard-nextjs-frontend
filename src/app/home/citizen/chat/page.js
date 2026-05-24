"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createMedicalQuery, consultDoctor, mapAiResponseToChat, ApiError, getCitizenQueries, getQuery, deleteQuery, deleteCitizenHistory } from "@/lib/api";
import AiResponseCard from "@/components/shared/AiResponseCard";
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
  History,
  Search,
  Calendar,
} from "lucide-react";
import { Tag, Tooltip } from "antd";

// Registered doctor accounts in the database for client-side ID resolution
const KNOWN_DOCTORS = {
  "69ca538e36b561bf0399034b": { name: "Dr. Doc", specialty: "Cardiology" },
  "69ca5ab536b561bf03990354": { name: "Dr. Viplove Doctor", specialty: "Dermatology" },
  "69fdd37f79c238cd956a5a4e": { name: "Dr. Aniket Kundgir", specialty: "Cardiology" },
  "6a0b09ac7affea714df7dead": { name: "Dr. Gautam Bhawsar", specialty: "Cardiology" },
  "6a0ec05a657810c0892cefeb": { name: "Dr. Ankita Kundgir", specialty: "Orthopedics" },
};

const resolveQueryDoctors = (src) => {
  const aiResp = src.ai_response || src.ai_draft_response || {};
  const assignedDoctorName =
    src.assigned_doctor_name ||
    (Array.isArray(src.assigned_doctor_names) ? src.assigned_doctor_names[0] : null);

  // 1. Prefer consult_requests — these hold the actual stored doctor info
  const consults = src.consult_requests || [];
  if (consults.length > 0) {
    return consults.map((cr) => {
      const docId = String(cr.doctor_id || "");
      const known = KNOWN_DOCTORS[docId];
      return {
        id: docId,
        name:
          cr.doctor_name ||
          known?.name ||
          assignedDoctorName ||
          "Doctor",
        specialty:
          cr.doctor_specialization ||
          known?.specialty ||
          aiResp.required_specialization ||
          "General",
        suitability_score: null,
        reason: null,
      };
    });
  }

  // 2. Map doctor_suggestions (which can be ID strings or objects)
  const rawSuggestions = src.doctor_suggestions || [];
  
  return rawSuggestions.map((doc) => {
    if (typeof doc === "string") {
      const known = KNOWN_DOCTORS[doc];
      return {
        id: doc,
        name: known?.name || "Doctor",
        specialty: known?.specialty || aiResp.required_specialization || "General",
        suitability_score: null,
        reason: null,
      };
    }

    // doc is an object
    const docId = doc.id || doc._id || doc.doctor_id || "";
    const known = KNOWN_DOCTORS[String(docId)];
    const displayName =
      doc.name ||
      known?.name ||
      doc.doctor_name ||
      doc.full_name ||
      [doc.first_name, doc.last_name].filter(Boolean).join(" ") ||
      "Doctor";

    return {
      id: docId,
      name: displayName,
      specialty: doc.specialization || doc.specialisation || doc.specialty || known?.specialty || aiResp.required_specialization || "General",
      suitability_score: doc.suitability_score ?? null,
      reason: doc.reason || null,
    };
  });
};

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
const LOADING_TEXTS = [
  "Analyzing your query…",
  "Cross-referencing PubMed sources…",
  "Checking WHO clinical guidelines…",
  "Running AI verification…",
  "Evaluating patient context…",
  "Compiling evidence-based response…",
];
const PATIENT_CONTEXT_STORAGE_KEY = "medtruth_patient_context";
const CITIZEN_MOBILE_STORAGE_KEY = "medtruth_citizen_mobile";

// ─── Centralised Greeting Detection Helper (Strict matching to prevent false positives on queries like "hello, I have a fever") ────
const GREETING_PHRASES = new Set([
  "hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", 
  "howdy", "hola", "sup", "yo", "namaste", "hey there", "hello there", "hi there",
  "good morning medtruth", "hello medtruth", "hi medtruth"
]);

const isGreetingMessage = (text) => {
  if (!text) return false;
  // Normalize: lowercase, trim, remove all punctuation, and flatten extra spaces
  const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ");
  return GREETING_PHRASES.has(clean);
};

const ChatMessage = ({ message, onConsult, doctorProfiles = {} }) => {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-[10px] max-w-[96%] md:max-w-[78%] animate-[fadeInUp_0.3s_ease] self-end">
        <div className="py-[12px] px-[16px] rounded-2xl relative bg-[#2793ef] text-white rounded-tr-md shadow-[0_4px_12px_rgba(99,102,241,0.25)]">
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
  const isGreeting = isGreetingMessage(message.queryText);

  // Dynamically resolve doctor names and specialities from MongoDB profiles in background
  const resolvedDoctors = (message.doctors || []).map((doc) => {
    const cached = doctorProfiles[doc.id];
    return {
      ...doc,
      name: (!doc.name || doc.name === "Loading Doctor…" || doc.name === "Doctor") && cached ? cached.name : doc.name,
      specialty: (!doc.specialty || doc.specialty === "General Specialist" || doc.specialty === "General") && cached ? cached.specialty : doc.specialty,
    };
  });

  return (
    <div className="flex gap-[10px] w-full max-w-[96%] md:max-w-[88%] animate-[fadeInUp_0.3s_ease] self-start">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-gradient-to-br from-sky-500 to-blue-500 text-white">
        <Stethoscope size={16} />
      </div>
      <div className="flex flex-col gap-[10px] min-w-0 flex-1">

        {/* Shared Verification Results Card (Hidden for greetings) */}
        {verification && cfg && !isGreeting && (
            <AiResponseCard
              queryText={message.queryText}
              content={message.content}
              verification={verification}
              rawAiResponse={message.rawAiResponse}
              time={message.time}
              doctors={resolvedDoctors}
              onConsult={onConsult}
              queryId={message.queryId}
              aiResponse={message.aiResponse}
            />
        )}

        {/* Plain AI bubble when no verification OR when query is a greeting */}
        {(!verification || isGreeting) && (
          <div className="py-[12px] px-[16px] rounded-2xl relative max-w-full bg-white text-slate-800 rounded-tl-md shadow-[0_2px_10px_rgba(0,0,0,0.07)] border border-slate-100">
            <div className="flex items-center gap-[5px] mb-[6px]">
              <span className="text-[11px] font-bold text-[#2793ef] tracking-[0.03em] uppercase">
                MedTruth AI
              </span>
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

  // ── History panel state ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all"); // all | today | yesterday | week | older
  const [historySearch, setHistorySearch] = useState("");
  const [loadingHistoryId, setLoadingHistoryId] = useState(null);
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
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
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
  const [hasSavedContext, setHasSavedContext] = useState(false);
  const [contextDirty, setContextDirty] = useState(false);
  // Consult Modal state
  const [consultModal, setConsultModal] = useState(null); // { doctor, queryText }
  const [consultNote, setConsultNote] = useState("");
  const [consultSent, setConsultSent] = useState(false);
  const [consultLoading, setConsultLoading] = useState(false);
  const [deletedQueryIds, setDeletedQueryIds] = useState([]);
  
  // ─── Dynamic Doctor Profiles Resolution State ───
  const [doctorProfiles, setDoctorProfiles] = useState({});
  const [fetchingDoctorIds, setFetchingDoctorIds] = useState(new Set());

  useEffect(() => {
    const ids = new Set();
    
    // Scan active messages for doctor suggestions
    messages.forEach(m => {
      (m.doctors || []).forEach(d => {
        if (d.id && d.id.length === 24) ids.add(d.id);
      });
    });

    // Scan history items for doctor suggestions or consult requests
    historyItems.forEach(h => {
      (h.doctor_suggestions || []).forEach(d => {
        const id = typeof d === "string" ? d : d.id || d._id || d.doctor_id;
        if (id && id.length === 24) ids.add(id);
      });
      (h.consult_requests || []).forEach(cr => {
        if (cr.doctor_id && cr.doctor_id.length === 24) ids.add(cr.doctor_id);
      });
    });

    // Filter to obtain only unfetched and non-pending IDs
    const toFetch = Array.from(ids).filter(id => !doctorProfiles[id] && !fetchingDoctorIds.has(id));
    if (toFetch.length === 0) return;

    // Mark as pending
    setFetchingDoctorIds(prev => {
      const next = new Set(prev);
      toFetch.forEach(id => next.add(id));
      return next;
    });

    // Resolve details dynamically from MongoDB via Next.js API route
    toFetch.forEach(async (id) => {
      try {
        const res = await fetch(`/api/doctor/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDoctorProfiles(prev => ({
            ...prev,
            [id]: { name: data.name, specialty: data.specialty }
          }));
        } else {
          setDoctorProfiles(prev => ({
            ...prev,
            [id]: { name: "Doctor", specialty: "General Specialist" }
          }));
        }
      } catch (err) {
        console.error(`Failed to resolve doctor ${id} profile:`, err);
      } finally {
        setFetchingDoctorIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  }, [messages, historyItems, doctorProfiles, fetchingDoctorIds]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const hasMeaningfulContext = Boolean(
    patientContext.age ||
    patientContext.conditions.length ||
    patientContext.medications.length ||
    patientContext.symptoms.trim() ||
    patientContext.allergies.trim() ||
    patientContext.history.trim()
  );

  const updatePatientContext = (updater) => {
    setPatientContext((prev) =>
      typeof updater === "function" ? updater(prev) : { ...prev, ...updater }
    );
    setContextDirty(true);
    setContextSaved(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Set up global references for background query updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.medtruthSetMessages = (updater) => {
        setMessages(updater);
      };
      window.medtruthSetLoading = (val) => {
        setLoading(val);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        window.medtruthSetMessages = null;
        window.medtruthSetLoading = null;
      }
    };
  }, []);

  // Check if there was an active pending query on mount
  useEffect(() => {
    if (typeof window === "undefined" || !citizenId || citizenId === "anonymous") return;

    let activeInterval = null;

    try {
      const pendingStr = localStorage.getItem("medtruth_pending_query");
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        // If the pending query is relatively fresh (less than 5 minutes old)
        if (Date.now() - pending.timestamp < 5 * 60 * 1000) {
          setLoading(true);

          const { queryText, timestamp, patientContext: pendingContext } = pending;
          let attempts = 0;
          const maxAttempts = 15; // 15 attempts * 10s = 150s (2.5 minutes) slow polling fallback

          // Slow fallback polling to recover query in case of tab refresh / page reload
          activeInterval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
              clearInterval(activeInterval);
              setLoading(false);
              try {
                localStorage.removeItem("medtruth_pending_query");
              } catch (e) {}
              return;
            }

            try {
              const data = await getCitizenQueries(citizenId);
              const queries = Array.isArray(data) ? data : data?.queries || [];
              
              // Find matching query in history
              const match = queries.find(q => {
                const qText = (q.query || "").trim().toLowerCase();
                const pText = queryText.trim().toLowerCase();
                const qTime = new Date(q.created_at || q.timestamp || q._id).getTime();
                return qText === pText && (qTime > timestamp - 30 * 1000);
              });

              if (match) {
                clearInterval(activeInterval);
                
                // Fetch full details
                const fullQuery = await getQuery(match._id || match.query_id);
                const finishedQuery = fullQuery || match;

                const ai = finishedQuery.ai_response || finishedQuery.ai_draft_response || {};
                const riskLevel = (ai.risk_level || "low").toLowerCase();
                const verificationStatus =
                  riskLevel === "high" ? "unsafe" : riskLevel === "medium" ? "caution" : "safe";
                
                const ctxParts = [];
                const ctx = pendingContext || patientContext;
                if (ctx.age) ctxParts.push(`Age: ${ctx.age}`);
                if (ctx.gender) ctxParts.push(ctx.gender);
                if (ctx.isPregnant) ctxParts.push("Pregnant");
                if (ctx.conditions?.length) ctxParts.push(...ctx.conditions);
                const patientContextStr = ctxParts.length ? ctxParts.join(" • ") : null;

                const aiMsg = {
                  id: Date.now(),
                  role: "ai",
                  content: ai.recommendation || ai.medical_analysis || "",
                  queryText: finishedQuery.query || queryText,
                  queryId: finishedQuery._id || finishedQuery.query_id,
                  time: finishedQuery.created_at
                    ? new Date(finishedQuery.created_at).toLocaleString()
                    : new Date().toLocaleString(),
                  verification: {
                    status: verificationStatus,
                    safeLabel: ai.disclaimer || "This is not a substitute for professional medical advice.",
                    justification: ai.medical_analysis || "",
                    sources: (ai.citations || []).map((c) =>
                      typeof c === "string" ? c : c.title || JSON.stringify(c)
                    ),
                    verification_sources: ai.verification_sources || null,
                    patientContextStr,
                    confidenceScore: ai.confidence_score ?? null,
                    requiredSpecialization: ai.required_specialization,
                  },
                  doctors: resolveQueryDoctors(finishedQuery),
                  aiResponse: {
                    recommendation: ai.recommendation || "",
                    medical_analysis: ai.medical_analysis || "",
                    risk_level: ai.risk_level || "low",
                    confidence_score: ai.confidence_score ?? null,
                    required_specialization: ai.required_specialization || "",
                    citations: ai.citations || [],
                    disclaimer: ai.disclaimer || "",
                  },
                };

                // Persist User/AI response to localStorage
                try {
                  const savedMessages = localStorage.getItem("medtruth_chat_messages");
                  let currentMessages = savedMessages ? JSON.parse(savedMessages) : [];
                  if (!currentMessages.some(m => m.role === "ai" && m.queryText === queryText)) {
                    currentMessages.push(aiMsg);
                    localStorage.setItem("medtruth_chat_messages", JSON.stringify(currentMessages));
                  }
                } catch (e) {}

                setMessages((prev) => {
                  const hasAiResponse = prev.some(m => m.role === "ai" && m.queryText === queryText && m.verification);
                  if (hasAiResponse) return prev;
                  return [...prev, aiMsg];
                });

                setLoading(false);
                try {
                  localStorage.removeItem("medtruth_pending_query");
                } catch (e) {}
              }
            } catch (err) {
              console.error("Slow fallback polling error:", err);
            }
          }, 10000);
        } else {
          // Clean up stale pending query
          localStorage.removeItem("medtruth_pending_query");
        }
      }
    } catch (e) {
      console.error("Failed to check pending query on mount:", e);
    }

    return () => {
      if (activeInterval) clearInterval(activeInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizenId]);

  // Load chat messages and deleted query IDs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medtruth_chat_messages");
      if (saved) {
        setMessages(JSON.parse(saved));
      }
      const deleted = localStorage.getItem("medtruth_deleted_query_ids");
      if (deleted) {
        setDeletedQueryIds(JSON.parse(deleted));
      }
    } catch (e) {
      console.error("Failed to load saved messages/deleted IDs:", e);
    }
  }, []);

  // Save chat messages to localStorage when updated
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 1) return;
    try {
      localStorage.setItem("medtruth_chat_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save messages:", e);
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedContext = localStorage.getItem(PATIENT_CONTEXT_STORAGE_KEY);
      if (!storedContext) {
        setHasSavedContext(false);
        setContextDirty(false);
        setSidebarOpen(true);
        return;
      }

      const parsed = JSON.parse(storedContext);
      const hydrated = {
        age: parsed?.age || "",
        gender: parsed?.gender || "Male",
        isPregnant: !!parsed?.isPregnant,
        conditions: Array.isArray(parsed?.conditions) ? parsed.conditions : [],
        medications: Array.isArray(parsed?.medications) ? parsed.medications : [],
        symptoms: parsed?.symptoms || "",
        allergies: parsed?.allergies || "",
        history: parsed?.history || "",
      };
      setPatientContext(hydrated);
      setHasSavedContext(true);
      setContextDirty(false);
    } catch {
      localStorage.removeItem(PATIENT_CONTEXT_STORAGE_KEY);
      setHasSavedContext(false);
      setContextDirty(false);
      setSidebarOpen(true);
    }
  }, []);

  // Rotate loading text every 2.5 seconds while loading
  useEffect(() => {
    if (!loading) { setLoadingTextIdx(0); return; }
    const interval = setInterval(() => {
      setLoadingTextIdx(prev => (prev + 1) % LOADING_TEXTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Fetch chat query history ──
  const fetchHistory = async () => {
    if (!citizenId || citizenId === "anonymous") return;
    setHistoryLoading(true);
    try {
      const data = await getCitizenQueries(citizenId);
      const list = Array.isArray(data) ? data : data?.queries || [];
      setHistoryItems(list);
    } catch (e) {
      console.error("History fetch error:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (historyOpen) fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen]);

  // ── Group history items by date ──
  const groupHistoryItems = (items) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
    const weekStart = new Date(todayStart); weekStart.setDate(todayStart.getDate() - 7);

    const groups = { today: [], yesterday: [], week: [], older: [] };
    items.forEach((item) => {
      const d = new Date(item.created_at || item.timestamp || item._id);
      if (d >= todayStart) groups.today.push(item);
      else if (d >= yesterdayStart) groups.yesterday.push(item);
      else if (d >= weekStart) groups.week.push(item);
      else groups.older.push(item);
    });
    return groups;
  };

  const filteredHistory = (() => {
    let items = historyItems.filter(item => {
      const itemId = item._id || item.query_id;
      return !deletedQueryIds.includes(itemId);
    });
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      items = items.filter((i) => (i.query || "").toLowerCase().includes(q));
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

  const formatHistoryTime = (item) => {
    const d = new Date(item.created_at || item.timestamp || item._id);
    if (isNaN(d)) return "";
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1);
    if (d >= todayStart) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d >= yesterdayStart) return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getRiskBadge = (item) => {
    const risk = (item.ai_response?.risk_level || item.ai_draft_response?.risk_level || "").toLowerCase();
    if (risk === "high") return { color: "#ef4444", bg: "#fef2f2", label: "High" };
    if (risk === "medium") return { color: "#f59e0b", bg: "#fffbeb", label: "Medium" };
    if (risk === "low") return { color: "#10b981", bg: "#ecfdf5", label: "Low" };
    return null;
  };

  // ── Load a history query into the chat ──
  const handleHistoryClick = async (item) => {
    const queryId = item._id || item.query_id;
    if (!queryId || loadingHistoryId) return;
    setLoadingHistoryId(queryId);
    try {
      const full = await getQuery(queryId);
      const src = full || item;
      const ai = src.ai_response || src.ai_draft_response || {};
      const queryText = src.query || item.query || "";
      const ts = src.created_at
        ? new Date(src.created_at).toLocaleString()
        : new Date().toLocaleString();

      // Rebuild risk/verification
      const riskLevel = (ai.risk_level || "low").toLowerCase();
      const verificationStatus =
        riskLevel === "high" ? "unsafe" : riskLevel === "medium" ? "caution" : "safe";

      const userMsg = {
        id: Date.now(),
        role: "user",
        content: queryText,
        time: ts,
      };

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: ai.recommendation || ai.medical_analysis || "",
        queryText,
        queryId,
        time: ts,
        verification: {
          status: verificationStatus,
          safeLabel: ai.disclaimer || "This is not a substitute for professional medical advice.",
          justification: ai.medical_analysis || "",
          sources: (ai.citations || []).map((c) =>
            typeof c === "string" ? c : c.title || JSON.stringify(c)
          ),
          verification_sources: ai.verification_sources || null,
          patientContextStr: null,
          confidenceScore: ai.confidence_score ?? null,
          requiredSpecialization: ai.required_specialization,
        },
        doctors: resolveQueryDoctors(src),
        aiResponse: {
          recommendation: ai.recommendation || "",
          medical_analysis: ai.medical_analysis || "",
          risk_level: ai.risk_level || "low",
          confidence_score: ai.confidence_score ?? null,
          required_specialization: ai.required_specialization || "",
          citations: ai.citations || [],
          disclaimer: ai.disclaimer || "",
        },
      };

      setMessages([userMsg, aiMsg]);
      setHistoryOpen(false);
    } catch (err) {
      console.error("Failed to load history query:", err);
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const handleDeleteHistoryItem = async (e, itemId) => {
    e.stopPropagation(); // Avoid triggering handleHistoryClick
    if (!itemId) return;
    
    if (!confirm("Are you sure you want to delete this query from your history?")) {
      return;
    }

    try {
      if (citizenId && citizenId !== "anonymous") {
        await deleteQuery(itemId, citizenId);
      }
      
      // Update history state instantly
      setHistoryItems((prev) => prev.filter(item => (item._id || item.query_id) !== itemId));
      
      // Reset the active chat messages if the deleted query is currently loaded
      setMessages((prev) => {
        const isCurrentQuery = prev.some(m => m.queryId === itemId);
        if (isCurrentQuery) {
          return [
            {
              id: 1,
              role: "ai",
              content:
                "Hello! I'm MedTruth AI, your medical verification assistant. Ask me any medical question and I'll provide verified, evidence-based information tailored to your patient context.",
              time: "Just now",
              verification: null,
            }
          ];
        }
        return prev;
      });

      // Sync and remove from medtruth_consultations in localStorage so it updates Doctor Responses page
      try {
        const stored = JSON.parse(localStorage.getItem("medtruth_consultations") || "[]");
        const updatedStored = stored.filter(c => c.queryId !== itemId);
        localStorage.setItem("medtruth_consultations", JSON.stringify(updatedStored));
      } catch (err) {
        console.error("Failed to update stored consultations:", err);
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
      alert("Failed to delete this history item. Please try again.");
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire search history? This action cannot be undone.")) {
      return;
    }

    try {
      if (citizenId && citizenId !== "anonymous") {
        await deleteCitizenHistory(citizenId);
      }
      
      setHistoryItems([]);
      startNewChat();
      
      // Clear stored consultations from localStorage as well
      try {
        localStorage.removeItem("medtruth_consultations");
      } catch (err) {
        console.error("Failed to clear stored consultations:", err);
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
      alert("Failed to clear history. Please try again.");
    }
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSend = async (queryText) => {
    const q = queryText || input.trim();
    if (!q || loading) return;

    if (!hasSavedContext || contextDirty || !hasMeaningfulContext) {
      let blockReason = "Please update and save your Patient Profile before sending a medical query.";
      if (hasSavedContext && contextDirty) {
        blockReason = "Your Patient Profile has unsaved changes. Save Patient Context before sending a medical query.";
      } else if (hasSavedContext && !hasMeaningfulContext) {
        blockReason = "Patient Profile is empty. Add details in Patient Profile and save before sending a medical query.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          content: `⚠️ ${blockReason}`,
          time: formatTime(),
          verification: null,
        },
      ]);
      setSidebarOpen(true);
      return;
    }

    setInput("");
    setApiError(null);

    // Client-side Greeting Interceptor (Avoids database API call to prevent polluting history)
    if (isGreetingMessage(q)) {
      const userMsgId = Date.now();
      const userMsg = {
        id: userMsgId,
        role: "user",
        content: q,
        time: formatTime(),
      };
      
      let greetingReply = "Hello! I am here to assist you. Please ask any medical question, and I will verify it against PubMed and WHO clinical sources.";
      if (patientContext.age || patientContext.conditions.length > 0) {
        const parts = [];
        if (patientContext.age) parts.push(`${patientContext.age}yo`);
        if (patientContext.gender) parts.push(patientContext.gender.toLowerCase());
        if (patientContext.conditions.length > 0) {
          parts.push(`with pre-existing ${patientContext.conditions.join(", ")}`);
        }
        greetingReply = `Hello! I have loaded your patient profile as a ${parts.join(" ")}. I am ready to assist you. Do you have any specific medical questions or symptoms you would like me to analyze?`;
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: greetingReply,
        queryText: q,
        queryId: `greeting_${userMsgId}`,
        time: new Date().toLocaleString(),
        verification: null,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      // Persist directly to localStorage so it survives tab reloads
      try {
        const saved = localStorage.getItem("medtruth_chat_messages");
        let currentMessages = saved ? JSON.parse(saved) : [];
        currentMessages.push(userMsg, aiMsg);
        localStorage.setItem("medtruth_chat_messages", JSON.stringify(currentMessages));
      } catch (e) {
        console.error("Failed to persist greeting to localStorage:", e);
      }
      return;
    }

    const userMsgId = Date.now();
    const userMsg = {
      id: userMsgId,
      role: "user",
      content: q,
      time: formatTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Save pending query details to localStorage so it can be resumed if unmounted
    try {
      localStorage.setItem("medtruth_pending_query", JSON.stringify({
        queryText: q,
        timestamp: Date.now(),
        userMsgId: userMsgId,
        patientContext
      }));
    } catch (e) {
      console.error("Failed to store pending query:", e);
    }

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

      // 1. Persist directly to localStorage to guarantee updates survive unmounting
      try {
        const saved = localStorage.getItem("medtruth_chat_messages");
        let currentMessages = saved ? JSON.parse(saved) : [];
        if (!currentMessages.some(m => m.id === userMsgId)) {
          currentMessages.push(userMsg);
        }
        if (!currentMessages.some(m => m.role === "ai" && m.queryText === q)) {
          currentMessages.push(aiMsg);
        }
        localStorage.setItem("medtruth_chat_messages", JSON.stringify(currentMessages));
      } catch (e) {
        console.error("Failed to persist resolved message to localStorage:", e);
      }

      // 2. Clear pending state in localStorage
      try {
        localStorage.removeItem("medtruth_pending_query");
      } catch (e) {}

      // 3. Update active UI states
      if (typeof window !== "undefined" && window.medtruthSetMessages) {
        window.medtruthSetMessages((prev) => {
          const hasAiResponse = prev.some(m => m.role === "ai" && m.queryText === q);
          if (hasAiResponse) return prev;
          return [...prev, aiMsg];
        });
        window.medtruthSetLoading(false);
      } else {
        // Fallback for current component context if not unmounted yet
        setMessages((prev) => {
          const hasAiResponse = prev.some(m => m.role === "ai" && m.queryText === q);
          if (hasAiResponse) return prev;
          return [...prev, aiMsg];
        });
        setLoading(false);
      }
    } catch (err) {
      console.error("API Error:", err);
      let errorContent = "";
      
      if (err instanceof ApiError) {
        if (err.status === 503) {
          errorContent = "⚠️ The medical verification model is currently experiencing extremely high demand. Please wait a few moments and try your question again.";
        } else if (err.body?.detail?.missing_fields) {
          errorContent = `⚠️ Patient context incomplete. Please fill in: ${err.body.detail.missing_fields.join(", ")}. Open the Patient Profile panel to update your details.`;
        } else {
          errorContent = `⚠️ Failed to get response: ${err.message}. Please try again shortly.`;
        }
      } else {
        errorContent = `⚠️ Connection error: ${err.message}. Please check your internet and make sure the server is reachable.`;
      }

      const errorMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: errorContent,
        time: formatTime(),
        verification: null,
      };

      // Persist error to localStorage
      try {
        const saved = localStorage.getItem("medtruth_chat_messages");
        let currentMessages = saved ? JSON.parse(saved) : [];
        if (!currentMessages.some(m => m.id === userMsgId)) {
          currentMessages.push(userMsg);
        }
        currentMessages.push(errorMsg);
        localStorage.setItem("medtruth_chat_messages", JSON.stringify(currentMessages));
      } catch (e) {}

      try {
        localStorage.removeItem("medtruth_pending_query");
      } catch (e) {}

      if (typeof window !== "undefined" && window.medtruthSetMessages) {
        window.medtruthSetMessages((prev) => [...prev, errorMsg]);
        window.medtruthSetLoading(false);
      } else {
        setMessages((prev) => [...prev, errorMsg]);
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleCondition = (item) => {
    updatePatientContext((p) => ({
      ...p,
      conditions: p.conditions.includes(item)
        ? p.conditions.filter((c) => c !== item)
        : [...p.conditions, item],
    }));
  };

  const toggleMedication = (item) => {
    updatePatientContext((p) => ({
      ...p,
      medications: p.medications.includes(item)
        ? p.medications.filter((m) => m !== item)
        : [...p.medications, item],
    }));
  };

  const saveContext = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PATIENT_CONTEXT_STORAGE_KEY, JSON.stringify(patientContext));
    }
    setContextSaved(true);
    setHasSavedContext(true);
    setContextDirty(false);
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
    setConsultLoading(false);
  };

  // Send consultation to doctor via backend API
  const handleSendConsult = async () => {
    if (!consultModal || consultLoading) return;
    setConsultLoading(true);

    try {
      // Call the real consult API if we have a queryId
      if (consultModal.queryId && consultModal.doctor.id) {
        const citizenMobile =
          session?.user?.mobile ||
          (typeof window !== "undefined"
            ? localStorage.getItem(CITIZEN_MOBILE_STORAGE_KEY)
            : null);

        await consultDoctor(
          consultModal.queryId,
          consultModal.doctor.id,
          citizenId,
          citizenMobile
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
    setConsultLoading(false);
    setTimeout(() => {
      setConsultModal(null);
      router.push("/home/citizen/doctor-responses");
    }, 1800);
  };

  const startNewChat = () => {
    try {
      localStorage.removeItem("medtruth_chat_messages");
      localStorage.removeItem(PATIENT_CONTEXT_STORAGE_KEY);
    } catch (e) {}
    
    // Reset active chat viewport messages
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

    // Reset patient profile context to default values
    setPatientContext({
      age: "",
      gender: "Male",
      isPregnant: false,
      conditions: [],
      medications: [],
      symptoms: "",
      allergies: "",
      history: "",
    });

    // Reset profile modal and save statuses
    setContextSaved(false);
    setHasSavedContext(false);
    setContextDirty(false);
    setSidebarOpen(true); // Automatically open the profile configuration modal for the new session
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
                          updatePatientContext((p) => ({ ...p, age: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-[6px]">
                      <label className="text-slate-700 text-[12px] font-medium">Gender</label>
                      <select
                        className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)] [&_option]:bg-white"
                        value={patientContext.gender}
                        onChange={(e) =>
                          updatePatientContext((p) => ({
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
                      updatePatientContext((p) => ({
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
                          updatePatientContext((p) => ({ ...p, symptoms: e.target.value }))
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
                          updatePatientContext((p) => ({ ...p, allergies: e.target.value }))
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
                          updatePatientContext((p) => ({ ...p, history: e.target.value }))
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

        {/* ── HISTORY PANEL ── */}
        {historyOpen && (
          <div className="w-[320px] max-md:hidden flex flex-col bg-white border-r border-slate-200 shadow-[2px_0_12px_rgba(0,0,0,0.05)] overflow-hidden shrink-0">
            {/* Panel Header */}
            <div className="px-[18px] py-[14px] border-b border-slate-100 bg-[#fafbfc] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-[8px]">
                <History size={15} className="text-[#2793ef]" />
                <span className="text-[14px] font-bold text-slate-800">Chat History</span>
                {historyItems.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full px-[7px] py-[1px]">{historyItems.length}</span>
                )}
              </div>
              <div className="flex items-center gap-[6px]">
                {historyItems.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-[11px] text-red-500 hover:text-red-700 transition-colors font-semibold px-[8px] py-[4px] rounded hover:bg-red-50 cursor-pointer"
                    title="Clear all history"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-[4px] rounded-md hover:bg-slate-100">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-[14px] py-[10px] border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-[8px] bg-slate-50 border border-slate-200 rounded-[10px] px-[10px] py-[7px]">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-[12px] text-slate-700 placeholder:text-slate-400"
                  placeholder="Search queries…"
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
            <div className="flex-1 overflow-y-auto px-[10px] py-[8px] flex flex-col gap-[4px]">
              {historyLoading ? (
                <div className="flex flex-col gap-[8px] pt-[8px]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-slate-100 rounded-[10px] h-[64px] animate-pulse" />
                  ))}
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-[40px] text-center gap-[8px]">
                  <MessageSquare size={28} className="text-slate-300" />
                  <p className="text-[12px] text-slate-400 font-medium">No queries found</p>
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
                        const badge = getRiskBadge(item);
                        const itemId = item._id || item.query_id;
                        const isItemLoading = loadingHistoryId === itemId;
                        return (
                          <div
                            key={itemId || idx}
                            onClick={() => handleHistoryClick(item)}
                            className={`bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-[10px] p-[10px_12px] cursor-pointer transition-all duration-150 mb-[3px] group ${
                              isItemLoading ? "opacity-70 pointer-events-none" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-[6px] mb-[4px]">
                              <p className="text-[12px] font-medium text-slate-700 line-clamp-2 leading-snug group-hover:text-slate-900 flex-1">{item.query}</p>
                              {isItemLoading ? (
                                <Loader2 size={12} className="animate-spin text-blue-400 shrink-0 mt-[2px]" />
                              ) : badge && (
                                <span className="text-[9px] font-bold px-[6px] py-[2px] rounded-full shrink-0" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-[4px]">
                              <span className="text-[10px] text-slate-400">{formatHistoryTime(item)}</span>
                              <button
                                onClick={(e) => handleDeleteHistoryItem(e, itemId)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all duration-150 p-[2px] rounded hover:bg-slate-200 cursor-pointer"
                                title="Delete query"
                              >
                                <Trash2 size={12} />
                              </button>
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
                  const badge = getRiskBadge(item);
                  const itemId = item._id || item.query_id;
                  const isItemLoading = loadingHistoryId === itemId;
                  return (
                    <div
                      key={itemId || idx}
                      onClick={() => handleHistoryClick(item)}
                      className={`bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-[10px] p-[10px_12px] cursor-pointer transition-all duration-150 mb-[3px] group ${
                        isItemLoading ? "opacity-70 pointer-events-none" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-[6px] mb-[4px]">
                        <p className="text-[12px] font-medium text-slate-700 line-clamp-2 leading-snug group-hover:text-slate-900 flex-1">{item.query}</p>
                        {isItemLoading ? (
                          <Loader2 size={12} className="animate-spin text-blue-400 shrink-0 mt-[2px]" />
                        ) : badge && (
                          <span className="text-[9px] font-bold px-[6px] py-[2px] rounded-full shrink-0" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-[4px]">
                        <span className="text-[10px] text-slate-400">{formatHistoryTime(item)}</span>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(e, itemId)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all duration-150 p-[2px] rounded hover:bg-slate-200 cursor-pointer"
                          title="Delete query"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
              {/* History toggle */}
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
              <button 
                className="flex items-center gap-[6px] bg-[#f8faff] border border-slate-200 rounded-lg text-slate-500 text-[12px] max-md:text-[11px] font-medium px-[12px] max-md:px-[8px] py-[7px] max-md:py-[5px] cursor-pointer transition-all duration-200 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50" 
                onClick={startNewChat}
              >
                <Plus size={13} />
                <span className="max-md:hidden">New Chat</span>
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
                <ChatMessage key={msg.id} message={msg} onConsult={handleConsult} doctorProfiles={doctorProfiles} />
              ))
            }

            {/* Dynamic Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-[12px] animate-[fadeInUp_0.3s_ease] self-start">
                <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 mt-1 bg-blue-50 text-[#2793ef] border border-blue-100">
                  <Stethoscope size={18} />
                </div>
                <div className="bg-white border border-slate-100 rounded-[18px] rounded-tl-[4px] py-[11px] px-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] flex items-center gap-[10px] min-w-[220px]">

                  <span
                    key={loadingTextIdx}
                    className="text-[12.5px] text-slate-500 font-medium animate-[fadeIn_0.4s_ease]"
                  >
                    {LOADING_TEXTS[loadingTextIdx]}
                  </span>
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
            <div className="flex items-center gap-[10px] bg-[#f8faff] border-2 border-slate-200 rounded-[14px] py-[10px] px-[14px] transition-all duration-200 focus-within:border-[#2793ef] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]">
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
                disabled={!input.trim() || loading || !hasSavedContext || contextDirty || !hasMeaningfulContext}
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
            {(!hasSavedContext || contextDirty || !hasMeaningfulContext) && (
              <div className="mt-[8px] text-[11px] text-amber-600 font-medium">
                Update and save Patient Profile to enable medical query messages.
              </div>
            )}
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
                <button
                  className="bg-[#f8faff] border-[1.5px] border-slate-200 rounded-[10px] text-slate-500 text-[13px] font-semibold py-[9px] px-[18px] cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setConsultModal(null)}
                  disabled={consultLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex items-center gap-[7px] bg-[#2793ef] border-none rounded-[10px] text-white text-[13px] font-bold py-[9px] px-[22px] cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(99,102,241,0.4)] [&.sent]:from-emerald-500 [&.sent]:to-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleSendConsult}
                  disabled={consultLoading}
                >
                  {consultLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send to Doctor"
                  )}
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
