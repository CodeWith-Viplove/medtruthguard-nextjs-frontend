"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getDoctorAssignedQueries } from "@/lib/api";
import {
  Users, MessageSquare, CheckCircle2, Clock, TrendingUp,
  ShieldCheck, ChevronRight, Bell, Activity, Calendar,
  Shield, BarChart2, ArrowRight, Stethoscope,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const urgColor = { high: "#ef4444", moderate: "#f59e0b", low: "#10b981" };
const urgBg = { high: "#fef2f2", moderate: "#fffbeb", low: "#ecfdf5" };

// Build category breakdown
const buildCategories = (consultations) => {
  const map = { Medication: 0, Diagnosis: 0, Preventive: 0, Emergency: 0, Other: 0 };
  consultations.forEach((c) => {
    const q = (c.query || "").toLowerCase();
    if (q.includes("medication") || q.includes("drug") || q.includes("warfarin") || q.includes("metformin") || q.includes("ibuprofen") || q.includes("tablet") || q.includes("pill"))
      map.Medication++;
    else if (q.includes("fever") || q.includes("dengue") || q.includes("anaemi") || q.includes("pain"))
      map.Diagnosis++;
    else if (q.includes("diet") || q.includes("lifestyle") || q.includes("iron") || q.includes("calcium"))
      map.Preventive++;
    else if (q.includes("urgent") || q.includes("platelet") || q.includes("emergency") || q.includes("bleed"))
      map.Emergency++;
    else
      map.Other++;
  });
  const COLORS = [
    { hex: "#3b82f6", bg: "bg-[#3b82f6]", text: "text-[#3b82f6]" },
    { hex: "#10b981", bg: "bg-[#10b981]", text: "text-[#10b981]" },
    { hex: "#f59e0b", bg: "bg-[#f59e0b]", text: "text-[#f59e0b]" },
    { hex: "#ef4444", bg: "bg-[#ef4444]", text: "text-[#ef4444]" },
    { hex: "#8b5cf6", bg: "bg-[#8b5cf6]", text: "text-[#8b5cf6]" },
  ];
  return Object.entries(map).map(([name, value], i) => ({ name, value, color: COLORS[i] }));
};

// Build response time distribution
const buildRespTime = (consultations) => {
  const responded = consultations.filter(c => c.status === "responded").length;
  return [
    { name: "< 1 hr", count: responded > 0 ? 100 : 0, fill: "#10b981" },
    { name: "1–3 hr", count: 0, fill: "#3b82f6" },
    { name: "3–6 hr", count: 0, fill: "#f59e0b" },
    { name: "> 6 hr", count: 0, fill: "#ef4444" },
  ];
};

// Build monthly trend (last 6 months + real this month)
const buildMonthly = (consultations) => {
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const base = [0, 0, 0, 0, 0, consultations.length];
  const responded = consultations.filter(c => c.status === "responded").length;
  return months.map((m, i) => ({
    month: m,
    queries: base[i],
    responded: i === 5 ? responded : 0
  }));
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const colorMap = {
    "#3b82f6": "text-[#3b82f6]",
    "#10b981": "text-[#10b981]",
    "#f59e0b": "text-[#f59e0b]",
    "#ef4444": "text-[#ef4444]",
    "#8b5cf6": "text-[#8b5cf6]"
  };
  return (
    <div className="bg-white border border-[#e8ecf4] rounded-[10px] text-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.1)] py-[8px] px-[12px]">
      <div className="font-bold text-[#0f172a] mb-[4px]">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className={`text-[12px] ${colorMap[p.color] || "text-[#64748b]"}`}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const doctorId = session?.user?.id;
  const [consultations, setConsultations] = useState([]);
  const [now, setNow] = useState("");

  useEffect(() => {
    setNow(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    );

    // Load from localStorage as a baseline
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem("medtruth_consultations") || "[]");
    } catch (_) { }

    // Fetch from backend if doctor is logged in
    const fetchAssigned = async () => {
      if (!doctorId) {
        // Only show consultations for this doctor (none if no id yet)
        setConsultations(stored.filter(s => s.doctor?.id && String(s.doctor.id) === String(doctorId)));
        return;
      }
      try {
        const data = await getDoctorAssignedQueries(doctorId);
        const queries = Array.isArray(data) ? data : (data?.queries || data?.assigned_queries || []);
        const backendItems = queries.map((q) => {
          const myConsult = (q.consult_requests || []).find(cr => String(cr.doctor_id) === String(doctorId)) || {};
          const isResponded = ["approved", "rejected", "reviewed", "completed"].includes(myConsult.consult_status);
          return {
            id: q._id || q.query_id,
            query: q.query || "Medical Query",
            status: isResponded ? "responded" : "pending",
            urgency: (q.ai_draft_response?.risk_level || q.ai_response?.risk_level || "low") === "high" ? "high" : (q.ai_draft_response?.risk_level || q.ai_response?.risk_level || "low") === "medium" ? "moderate" : "low",
            sentAt: q.created_at ? new Date(q.created_at).toLocaleString() : "Recently",
            patient: q.citizen_id || "Patient",
            isBackend: true,
          };
        });

        const combined = [
          ...stored.filter(s => s.doctor?.id && doctorId && String(s.doctor.id) === String(doctorId)),
          ...backendItems
        ];
        setConsultations(combined);
      } catch (err) {
        console.error("Failed to fetch assigned queries for dashboard:", err);
        setConsultations(stored.filter(s => s.doctor?.id && doctorId && String(s.doctor.id) === String(doctorId)));
      }
    };

    fetchAssigned();
  }, [doctorId]);

  const categoryData = useMemo(() => buildCategories(consultations), [consultations]);
  const respTimeData = useMemo(() => buildRespTime(consultations), [consultations]);
  const monthlyData = useMemo(() => buildMonthly(consultations), [consultations]);

  const total = consultations.length;
  const pending = consultations.filter(c => c.status === "pending").length;
  const responded = consultations.filter(c => c.status === "responded").length;
  const verifyPct = total > 0 ? Math.round((responded / total) * 100) : 0;

  const recentItems = consultations
    .slice()
    .reverse()
    .slice(0, 5);

  const STATS = [
    { label: "Total Queries", value: String(total), sub: `${pending} pending`, Icon: MessageSquare, color: "#3b82f6", bg: "bg-[#eff6ff]", text: "text-[#3b82f6]" },
    { label: "Queries Responded", value: String(responded), sub: "From this session", Icon: CheckCircle2, color: "#10b981", bg: "bg-[#ecfdf5]", text: "text-[#10b981]" },
    { label: "Pending Queries", value: String(pending), sub: "Awaiting your response", Icon: Clock, color: "#f59e0b", bg: "bg-[#fffbeb]", text: "text-[#f59e0b]" },
    { label: "Response Rate", value: `${verifyPct}%`, sub: "Completion rate", Icon: ShieldCheck, color: "#8b5cf6", bg: "bg-[#f5f3ff]", text: "text-[#8b5cf6]" },
  ];

  return (
    <>


      <div className="min-h-full bg-white font-sans overflow-y-auto">
        {/* ── Header ── */}
        <div className="bg-white border-b border-[#e2e8f0] py-[18px] px-[28px] max-md:pl-[60px] max-md:px-[16px] flex items-center justify-between sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex-wrap gap-[12px]">
          <div className="flex items-center gap-[14px]">
            <div className="w-[46px] h-[46px] max-md:w-[38px] max-md:h-[38px] rounded-full bg-[#1f97ef] text-white text-[17px] max-md:text-[14px] font-bold flex items-center justify-center shadow-[0_4px_12px_rgba(31,151,239,0.3)] shrink-0">
              {session?.user?.name ? session.user.name.split(" ").filter(w => w !== "Dr.").map(w => w[0]).join("").slice(0, 2) : "DR"}
            </div>
            <div>
              <div className="text-[16px] max-md:text-[14px] font-bold text-[#0f172a]">{session?.user?.name || "Doctor"}</div>
              <div className="text-[12px] max-md:text-[11px] text-[#64748b] mt-[1px]">{session?.user?.specialization || "Medical Professional"}</div>
              <div className="text-[11px] max-md:text-[10px] text-[#475569] mt-[2px] flex items-center gap-[4px]">🏥 MedTruth Network</div>
            </div>
          </div>
          <div className="flex items-center gap-[10px] max-md:gap-[8px]">
            <div className="flex items-center gap-[6px] bg-[#f8fafc] border border-[#e2e8f0] rounded-[20px] py-[6px] px-[14px] text-[12px] text-[#475569] font-medium max-md:hidden"><Calendar size={13} /> {now}</div>
            <button className="relative bg-white border border-[#1f97ef] rounded-[10px] p-[8px] cursor-pointer text-[#1f97ef] flex items-center transition-colors duration-200 hover:bg-[#1f97ef] hover:text-white">
              <Bell size={16} /><div className="absolute -top-[3px] -right-[3px] w-[10px] h-[10px] rounded-full bg-[#ef4444] border-2 border-white animate-[pulse_2s_infinite]" />
            </button>
            <button className="flex items-center gap-[7px] bg-[#1f97ef] border-none rounded-[10px] text-white text-[12.5px] max-md:text-[11px] font-semibold py-[8px] px-[16px] max-md:py-[6px] max-md:px-[12px] cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(31,151,239,0.3)] hover:-translate-y-[1px] hover:shadow-[0_6px_16px_rgba(31,151,239,0.4)]" onClick={() => router.push("/home/doctor/citizen-query")}>
              <MessageSquare size={14} />
              <span className="max-md:hidden">Patient Queries</span>
              <span className="md:hidden">Queries</span>
              {pending > 0 && <span className="bg-[#ef4444] text-white rounded-[20px] text-[10px] font-bold py-[1px] px-[7px]">{pending}</span>}
            </button>
          </div>
        </div>

        <div className="py-[24px] px-[28px] flex flex-col gap-[20px] lg:p-[16px]">
          {/* Empty-state hint if no real data */}
          {total === 0 && (
            <div className="bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff] border border-[#bfdbfe] rounded-[14px] py-[16px] px-[20px] flex items-center gap-[12px] text-[13.5px] text-[#1f97ef] [&_strong]:font-bold">
              <Shield size={22} color="#3b82f6" />
              <div>
                <strong>Welcome to your clinical dashboard.</strong> Your analytics and practice trends will automatically populate here as soon as you receive and respond to patient consultations via the citizen portal. Incoming requests will appear in your <strong>Patient Queries</strong> section.
              </div>
            </div>
          )}

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
            {STATS.map((s, i) => (
              <div key={i} className="bg-white border border-[#e8ecf4] rounded-[16px] p-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-200 animate-[fadeUp_0.4s_ease] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)]">
                <div className="flex items-center justify-between mb-[12px]">
                  <div className={`w-[40px] h-[40px] rounded-[11px] flex items-center justify-center ${s.bg}`}>
                    <s.Icon size={20} className={s.text} />
                  </div>
                  <TrendingUp size={14} className={s.text} />
                </div>
                <div className={`text-[28px] font-extrabold tracking-[-0.5px] ${s.text}`}>{s.value}</div>
                <div className="text-[12px] text-[#64748b] mt-[2px]">{s.label}</div>
                <div className="text-[11px] text-[#94a3b8] mt-[6px]">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Charts Row 1: Monthly Trend (full width) ── */}
          <div>
            <div className="bg-white border border-[#e8ecf4] rounded-[16px] py-[18px] px-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] animate-[fadeUp_0.4s_ease]">
              <div className="flex items-start justify-between mb-[16px]">
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">Monthly Trend</div>
                  <div className="text-[11.5px] text-[#94a3b8] mt-[2px]">Queries received vs. responded (last 6 months)</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
                  <Line type="monotone" dataKey="queries" name="Received" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#fff", stroke: "#3b82f6", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="responded" name="Responded" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#fff", stroke: "#10b981", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Charts Row 2: Bar + Monthly Line ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-[16px]">
            {/* Response time bar */}
            <div className="lg:col-span-2 bg-white border border-[#e8ecf4] rounded-[16px] py-[18px] px-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] animate-[fadeUp_0.4s_ease]">
              <div className="flex items-start justify-between mb-[16px]">
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">Response Time</div>
                  <div className="text-[11.5px] text-[#94a3b8] mt-[2px]">Speed of query resolution (%)</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={respTimeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="%" radius={[6, 6, 0, 0]}>
                    {respTimeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Query Categories pie */}
            <div className="lg:col-span-3 bg-white border border-[#e8ecf4] rounded-[16px] py-[18px] px-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] animate-[fadeUp_0.4s_ease]">
              <div className="flex items-start justify-between mb-[16px]">
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">Query Categories</div>
                  <div className="text-[11.5px] text-[#94a3b8] mt-[2px]">Breakdown by topic</div>
                </div>
              </div>
              <div className="flex items-center gap-[16px] h-[200px]">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={38} outerRadius={68} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color.hex} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ background: "#fff", border: "1px solid #e8ecf4", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", padding: "8px 12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-[7px] flex-1">
                  {categoryData.map((c, i) => (
                    <div key={i} className="flex items-center gap-[8px] text-[12px] text-[#475569]">
                      <div className={`w-[10px] h-[10px] rounded-full shrink-0 ${c.color.bg}`} />
                      <span className="flex-1">{c.name}</span>
                      <strong className={c.color.text}>{c.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Row: Recent + Urgency Radial + Quick Actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px]">
            {/* Recent consultations from localStorage */}
            <div className="bg-white border border-[#e8ecf4] rounded-[16px] py-[18px] px-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] animate-[fadeUp_0.4s_ease]">
              <div className="flex items-start justify-between mb-[16px]">
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">Recent Consultations</div>
                  <div className="text-[11.5px] text-[#94a3b8] mt-[2px]">From citizen queries (live data)</div>
                </div>
                <button
                  onClick={() => router.push("/home/doctor/citizen-query")}
                  className="flex items-center gap-[4px] bg-transparent border-none cursor-pointer text-[12px] text-[#3b82f6] font-semibold"
                >
                  View All <ChevronRight size={13} />
                </button>
              </div>
              {recentItems.length === 0 ? (
                <div className="text-center py-[24px] px-0 text-[#94a3b8] text-[13px]">
                  No consultations yet. Data will appear here once citizens send queries.
                </div>
              ) : recentItems.map((r, i) => (
                <div key={i} className="flex items-center gap-[12px] py-[10px] px-0 border-b border-[#f8faff] cursor-pointer transition-transform duration-150 last:border-b-0 hover:translate-x-[3px]" onClick={() => router.push("/home/doctor/citizen-query")}>
                  <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#dbeafe] to-[#e0e7ff] text-[#3b82f6] text-[12px] font-bold flex items-center justify-center shrink-0">
                    {r.patientContext?.age ? `${r.patientContext.age}y` : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold text-[#1e293b]">
                      {r.patientContext?.age ? `Patient, ${r.patientContext.age}yo ${r.patientContext.gender || ""}` : "Patient"}
                    </div>
                    <div className="text-[11.5px] text-[#64748b] overflow-hidden text-ellipsis whitespace-nowrap">{r.query}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-[#94a3b8] mb-[4px]">{r.sentAt}</div>
                    <div className={`text-[10px] font-semibold rounded-[20px] py-[2px] px-[8px] ${r.status === "responded" ? "bg-[#ecfdf5] text-[#10b981]" :
                      r.urgency === "high" ? "bg-[#fef2f2] text-[#ef4444]" :
                        r.urgency === "low" ? "bg-[#ecfdf5] text-[#10b981]" :
                          "bg-[#fffbeb] text-[#f59e0b]"
                      }`}>
                      {r.status === "responded" ? "✓ Responded" : "⏳ Pending"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-[#e8ecf4] rounded-[16px] py-[18px] px-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] animate-[fadeUp_0.4s_ease]">
              <div className="flex items-start justify-between mb-[16px]">
                <div className="text-[14px] font-bold text-[#0f172a]">Quick Actions</div>
              </div>
              <div className="grid grid-cols-2 gap-[8px]">
                {[
                  { label: "Pending Queries", Icon: Clock, color: "text-[#f59e0b]", bg: "bg-[#fffbeb]", path: "/home/doctor/citizen-query" },
                  { label: "All Consultations", Icon: MessageSquare, color: "text-[#3b82f6]", bg: "bg-[#eff6ff]", path: "/home/doctor/citizen-query" },
                  { label: "Responded", Icon: CheckCircle2, color: "text-[#10b981]", bg: "bg-[#ecfdf5]", path: "/home/doctor/citizen-query" },
                  { label: "Refresh Data", Icon: Activity, color: "text-[#8b5cf6]", bg: "bg-[#f5f3ff]", path: null },
                ].map((a, i) => (
                  <button key={i} className="flex items-center gap-[10px] bg-[#f8faff] border-[1.5px] border-[#e2e8f0] rounded-[12px] py-[12px] px-[14px] cursor-pointer text-[12.5px] font-semibold text-[#334155] transition-all duration-200 text-left w-full hover:border-[#3b82f6] hover:text-[#3b82f6] hover:bg-[#eff6ff] hover:-translate-y-[1px]" onClick={() => a.path ? router.push(a.path) : window.location.reload()}>
                    <div className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0 ${a.bg}`}>
                      <a.Icon size={15} className={a.color} />
                    </div>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}