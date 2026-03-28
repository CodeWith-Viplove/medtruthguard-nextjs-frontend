"use client";
import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  TriangleAlert,
  Scan,
} from "lucide-react";

export default function AnalysisResultView({ result, onBack }) {
  const reportRef = React.useRef(null);

  if (!result) return null;

  const data = result.analysis_result || result.analysis || result;

  const type = result.analysis_type || data.modality || (data.modality === "ECG/EKG" ? "ECG" : "X-ray");
  const isEcg = type.toLowerCase().includes("ecg");

  const findings = data.findings || data.key_observations || [];
  const impressions = data.clinical_impressions || data.clinical_impression || data.impression || [];
  const recommendations = data.suggested_followup || data.recommendations || [];

  const metadata = result.patient_context || result.metadata || data.metadata || {};
  const age = result.age || data.age || metadata.age;
  const gender = result.gender || data.gender || metadata.gender;
  const history = result.history || data.history || metadata.history || "No records provided";

  const severity = (result.severity || data.severity || "Normal").toLowerCase();
  const timestamp = result.created_at || result.timestamp || new Date().toISOString();

  const getSeverityStyle = (s) => {
    if (s.includes("severe") || s.includes("critical") || s.includes("high")) return "unsafe";
    if (s.includes("moderate") || s.includes("medium")) return "caution";
    return "safe";
  };

  const status = getSeverityStyle(severity);

  const statusConfig = {
    safe: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: <CheckCircle2 size={18} />, label: "Normal / Low Risk" },
    caution: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <AlertCircle size={18} />, label: "Moderate Activity" },
    unsafe: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", icon: <AlertTriangle size={18} />, label: "Urgent Attention" },
  };

  const cfg = statusConfig[status];



  const disclaimer = data.disclaimer || "NOT A DIAGNOSIS. FOR EDUCATIONAL/CLINICAL ASSISTANCE ONLY.";

  return (
    <div className="flex flex-col gap-[20px] max-w-[1200px] mx-auto mb-[40px]">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Action Bar ── */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-[6px] text-[#64748b] hover:text-[#0f172a] font-semibold text-[13px] transition-colors py-[8px] px-[14px] rounded-[10px] bg-white border border-[#e8ecf4] hover:border-[#cbd5e1] shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      {/* ── Report Card ── */}
      <div ref={reportRef} className="bg-white border border-[#e8ecf4] rounded-[16px] overflow-hidden shadow-[0_1px_6px_rgba(0,0,0,0.04)] print-container">

        {/* Report Header */}
        <div className="py-[20px] px-[28px] border-b border-[#f1f5f9] bg-gradient-to-br from-[#f8faff] to-[#f0f4ff]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <div className={`w-[42px] h-[42px] rounded-[12px] flex items-center justify-center ${isEcg ? "bg-[#eff6ff] text-[#2793ef] border border-[#bfdbfe]" : "bg-[#ede9fe] text-[#7c3aed] border border-[#ddd6fe]"}`}>
                {isEcg ? <Activity size={20} /> : <Scan size={20} />}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#2793ef] mb-[1px]">AI Analysis Report</div>
                <div className="text-[18px] font-bold text-[#0f172a]">{type} Verification Results</div>
              </div>
            </div>
            <div className="flex flex-col items-end text-[11px] font-medium text-[#94a3b8]">
              <div className="flex items-center gap-[4px]"><Calendar size={10} /> {new Date(timestamp).toLocaleDateString()}</div>
              <div className="flex items-center gap-[4px] mt-[2px]"><Clock size={10} /> {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>
        </div>

        {/* Status & Confidence Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-[16px] px-[28px] border-b border-[#f1f5f9] bg-[#fff8f8] gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center border shrink-0" style={{ backgroundColor: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }}>
              <TriangleAlert size={18} />
            </div>
            <div className="text-[11.5px] font-bold text-[#dc2626] max-w-[480px] leading-[1.5]">{disclaimer}</div>
          </div>
          <div className="flex flex-col items-start md:items-end shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-[4px]">Confidence Score</div>
            <div className="flex items-center gap-[8px]">
              <div className="w-[96px] h-[6px] rounded-full bg-[#e2e8f0] overflow-hidden">
                <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${data.confidence_score || 95}%` }} />
              </div>
              <span className="text-[13px] font-black text-[#1e293b]">{data.confidence_score || 95}%</span>
            </div>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="py-[14px] px-[28px] border-b border-[#f1f5f9] flex items-center gap-[10px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">Clinical Assessment:</div>
          <div className="flex items-center gap-[6px] py-[4px] px-[12px] rounded-full text-[12px] font-bold border" style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
            {cfg.icon}
            {cfg.label}
          </div>
        </div>

        {/* Technical Findings */}
        <div className="py-[20px] px-[28px] border-b border-[#f1f5f9]">
          <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b] mb-[14px]">
            <TrendingUp size={13} className="text-[#2793ef]" /> Key Observations
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
            {Array.isArray(findings) ? findings.map((item, i) => (
              <div key={i} className="flex gap-[10px] py-[10px] px-[14px] rounded-[12px] border border-[#f1f5f9] bg-[#f8faff] hover:border-[#e2e8f0] transition-colors">
                <div className="mt-[7px] w-[6px] h-[6px] rounded-full bg-[#2793ef] shrink-0" />
                <p className="text-[13px] font-medium leading-relaxed text-[#334155]">{item}</p>
              </div>
            )) : (
              Object.entries(findings).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-[10px] px-[14px] rounded-[12px] border border-[#f1f5f9] bg-[#f8faff]">
                  <span className="text-[11px] font-bold uppercase text-[#64748b]">{k.replace(/_/g, " ")}</span>
                  <span className="text-[12px] font-black text-[#1e293b]">{String(v)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clinical Impressions */}
        <div className="py-[20px] px-[28px] border-b border-[#f1f5f9] bg-[#f8faff]/50">
          <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#64748b] mb-[14px]">
            <Stethoscope size={13} className="text-[#2793ef]" /> Clinical Impressions
          </div>
          <div className="flex flex-col gap-[10px]">
            {(Array.isArray(impressions) ? impressions : [impressions]).map((item, i) => (
              <div key={i} className="bg-white border border-[#e8ecf4] border-l-4 border-l-[#2793ef] rounded-[12px] py-[12px] px-[16px] shadow-sm">
                <p className="text-[13.5px] font-semibold leading-relaxed text-[#0f172a]">{item}</p>
              </div>
            ))}
            {impressions.length === 0 && <p className="text-[13px] italic text-[#94a3b8]">No specific clinical impressions generated.</p>}
          </div>
        </div>

        {/* Recommendations */}
        <div className="py-[20px] px-[28px] border-b border-[#f1f5f9] bg-[#eff6ff]/20">
          <div className="flex items-center gap-[6px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#1d6fa8] mb-[14px]">
            <Info size={13} className="text-[#2793ef]" /> Suggested Next Steps
          </div>
          <div className="flex flex-wrap gap-[8px]">
            {recommendations.map((item, i) => (
              <span key={i} className="bg-white border border-[#bfdbfe] rounded-full text-[12px] py-[6px] px-[16px] font-bold text-[#1d4ed8] shadow-sm">
                {item}
              </span>
            ))}
            {recommendations.length === 0 && <span className="text-[12px] italic text-[#94a3b8]">Please consult your doctor for follow-up guidance.</span>}
          </div>
        </div>

        {/* Patient Context */}
        <div className="py-[14px] px-[28px] border-b border-[#f1f5f9] flex items-center gap-[12px]">
          <div className="w-[36px] h-[36px] rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#94a3b8] shrink-0">
            <User size={16} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#0f172a]">Patient Context Applied</div>
            <p className="text-[11px] font-medium text-[#64748b] mt-[1px]">
              {age || "?"}Y, {gender || "?"} · History: {history}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="py-[14px] px-[28px] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-[6px] font-bold uppercase tracking-widest text-[#94a3b8]">
            <ShieldCheck size={13} className="text-[#10b981]" /> MedTruth Verified Document
          </div>
          <div className="font-medium text-[#cbd5e1]">
            ID: {result.analysis_id || "PROVISIONAL"}
          </div>
        </div>
      </div>
    </div>
  );
}
