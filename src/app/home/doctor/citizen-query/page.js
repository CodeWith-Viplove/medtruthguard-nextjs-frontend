"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getDoctorAssignedQueries, submitDoctorReview, getAiResponse } from "@/lib/api";
import {
  Stethoscope, User, Users, Clock, CheckCircle2, AlertTriangle, ShieldCheck,
  MessageSquare, Send, ArrowLeft, X, Search, Bell, Shield,
  ChevronRight, Sparkles, BookOpen, Activity, Award, Building2,
  Star, Loader2, Info, FileText,
} from "lucide-react";

// ─── Simulated doctor reply generator ───────────────────────────────────────────
const autoReply = (query = "", note = "") => {
  const q = query.toLowerCase();
  if (q.includes("dengue"))
    return "Rest and oral rehydration (2–3L/day) are essential. Use paracetamol for fever — avoid NSAIDs and aspirin due to bleeding risk. Monitor platelets every 12 hrs. If platelet count drops below 20,000/μL or warning signs appear (persistent vomiting, severe abdominal pain, bleeding), visit ER immediately.";
  if (q.includes("fever") && q.includes("pregnan"))
    return "Paracetamol (500mg every 4–6 hrs, max 4g/day) is safe in pregnancy for fever management. Avoid ibuprofen and aspirin. Ensure adequate hydration and rest. If fever exceeds 38.5°C or persists beyond 24 hours, please visit your OB-GYN or nearest hospital immediately.";
  if (q.includes("metformin") || q.includes("diabetes"))
    return "Metformin is safe with your profile provided eGFR > 30. Continue monitoring HbA1c every 3 months and kidney function every 6 months. Maintain a low-glycemic diet and 30 min moderate exercise daily. ACE inhibitors or ARBs provide additional renal protection in diabetic hypertensive patients.";
  if (q.includes("warfarin") || q.includes("ibuprofen"))
    return "⚠️ Do NOT take NSAIDs with Warfarin — this significantly increases bleeding risk. Use paracetamol (500–1000mg up to 4x/day) for pain. Get INR checked urgently if NSAIDs were already taken. Topical diclofenac gel may be used cautiously. Please consult your prescribing physician before any medication changes.";
  if (q.includes("iron") || q.includes("anaemi"))
    return "Increase iron-rich foods: spinach, lentils, red meat, fortified cereals. Pair with Vitamin C for enhanced absorption. Avoid tea/coffee within 1 hour of meals. If dietary correction is insufficient, ferrous sulphate 200mg once daily may be considered. Repeat CBC in 6 weeks.";
  return `Thank you for your query. Based on your patient context, I recommend following standard clinical guidelines for your condition. ${note ? `Regarding your additional note: "${note}" — I would recommend a direct consultation.` : ""} Monitor your symptoms closely and visit in person if there is no improvement within 48 hours.`;
};



const urgencyConfig = {
  high: { label: "High Priority", color: "#ef4444", bg: "#fef2f2", border: "#fca5a5" },
  moderate: { label: "Moderate", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d" },
  low: { label: "Routine", color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7" },
};

// ─── Query List Card ──────────────────────────────────────────────────────────────
const QueryCard = ({ item, selected, onSelect }) => {
  const u = urgencyConfig[item.urgency] || urgencyConfig.moderate;
  const isPending = item.status === "pending";
  return (
    <div
      className={`bg-white border-[1.5px] border-[#e8ecf4] rounded-[14px] p-[16px] cursor-pointer transition-all duration-200 relative ${selected ? "border-[#3b82f6] bg-[#f8faff] shadow-[0_4px_16px_rgba(59,130,246,0.12)]" : ""} ${!item.read ? "before:content-[''] before:absolute before:top-1/2 before:-left-[1px] before:-translate-y-1/2 before:w-[3px] before:h-[28px] before:bg-[#3b82f6] before:rounded-[0_3px_3px_0]" : ""}`}
      onClick={onSelect}
    >
      {!item.read && <div className="w-[8px] h-[8px] rounded-full bg-[#3b82f6] absolute top-[16px] right-[16px]" />}
      <div className="flex items-start gap-[12px] mb-[10px]">
        <div className="w-[40px] h-[40px] rounded-full bg-[#1f97ef] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
          {(item.patient || "P").split(" ").map(w => w[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-[#0f172a] truncate">{item.patient}</div>
          <div className="text-[11.5px] text-[#64748b] mt-[2px] truncate">Age: {item.patientContext?.age} · {item.patientContext?.gender}</div>
        </div>
        <div className={`text-[10px] font-bold py-[3px] px-[8px] rounded-[12px] uppercase tracking-[0.04em] shrink-0 border ${u.bg} ${u.color} ${u.border}`}>
          {u.label}
        </div>
      </div>
      <p className="text-[13px] text-[#475569] leading-relaxed mb-[12px] line-clamp-2 overflow-hidden">"{item.query}"</p>
      <div className="flex items-center justify-between pt-[10px] border-t border-[#f1f5f9]">
        <div className={`flex items-center gap-[4px] text-[11px] font-semibold ${isPending ? "text-[#d97706] bg-[#fffbeb] py-[3px] px-[8px] rounded-[12px]" : "text-[#059669] bg-[#ecfdf5] py-[3px] px-[8px] rounded-[12px]"}`}>
          {isPending ? <><Loader2 size={10} className="animate-[spin_1s_linear_infinite]" /> Awaiting Response</> : <><CheckCircle2 size={10} /> Responded</>}
        </div>
        <div className="flex items-center gap-[4px] text-[10.5px] text-[#94a3b8]"><Clock size={10} /> {isPending ? item.sentAt : item.respondedAt}</div>
      </div>
    </div >
  );
};

// ─── Detail + Response Panel ──────────────────────────────────────────────────────
const DetailPanel = ({ item, onRespond, onBackToDashboard }) => {
  const [recommendation, setRecommendation] = useState("");
  const [doctorView, setDoctorView] = useState("");
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [smsResult, setSmsResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const u = urgencyConfig[item.urgency] || urgencyConfig.moderate;
  const isPending = item.status === "pending";
  const ctx = item.patientContext || {};

  const handleAutoFill = () => setRecommendation(autoReply(item.query, item.note));

  const handleSend = async () => {
    if (!recommendation.trim()) return;
    setSending(true);
    setApiError(null);
    setSmsResult(null);

    try {
      const qId = item.query_id || item._id || item.id;
      const dId = item.doctor?.id || item.doctor_id;

      if (qId && dId && !item.isDemo && !item.isFromStorage) {
        // Build the full review payload matching the API spec
        const reviewPayload = {
          doctor_id: dId,
          status: reviewStatus,
          recommendation: recommendation,
          doctor_view: doctorView.trim() || recommendation.slice(0, 200),
        };

        // Attach modified_response if the AI response exists
        // This allows the doctor to implicitly confirm or adjust the AI response
        if (item.ai_response) {
          reviewPayload.modified_response = {
            medical_analysis: item.ai_response.medical_analysis || "",
            recommendation: recommendation,
            risk_level: item.ai_response.risk_level || "low",
            required_specialization: item.ai_response.required_specialization || "general",
            confidence_score: item.ai_response.confidence_score || 0,
            citations: item.ai_response.citations || [],
            disclaimer: "This is not a substitute for professional medical advice.",
          };
        }

        const result = await submitDoctorReview(qId, reviewPayload);

        // Capture SMS notification result for display
        if (result?.sms_notification) {
          setSmsResult(result.sms_notification);
        }
      }
    } catch (err) {
      console.error("Failed to submit review via API:", err);
      setApiError(err.message || "Failed to submit. Review saved locally.");
      // Continue — update local state regardless
    }

    onRespond(item.id, recommendation, reviewStatus, doctorView);
    setSent(true);
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="py-[16px] px-[22px] bg-gradient-to-br from-[#f8faff] to-[#f0f4ff] border-b border-[#e8ecf4] flex items-center justify-between gap-[10px] shrink-0">
        <div className="flex items-center gap-[10px]">

          <div>
            <div className="text-[14px] font-bold text-[#0f172a]">{isPending ? "Respond to Patient" : "Consultation Record"}</div>
            <div className="text-[11px] text-[#94a3b8] mt-[1px]">AI-assisted medical consultation</div>
          </div>
        </div>
        <div className={`text-[10.5px] font-bold py-[4px] px-[10px] rounded-[14px] uppercase tracking-[0.04em] border ${u.bg} ${u.color} ${u.border}`}>
          {u.label}
        </div>
      </div>

      <div className="py-[20px] px-[22px] flex flex-col gap-[18px] flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#e2e8f0] scrollbar-track-transparent">
        {/* Patient Info */}
        <div className="bg-white border-[1.5px] border-[#e8ecf4] rounded-[14px] p-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <div className="flex gap-[14px] items-start">
            <div className="w-[48px] h-[48px] max-md:w-[40px] max-md:h-[40px] rounded-full bg-[#1f97ef] text-white text-[15px] max-md:text-[13px] font-bold flex items-center justify-center shrink-0">
              {(item.patient || "P").split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-[8px] flex-wrap">
                <div className="text-[14px] font-bold text-[#0f172a]">{item.patient}</div>
                <div className="flex items-center gap-[4px] text-[11px] text-[#94a3b8] shrink-0"><Clock size={12} /> {item.sentAt}</div>
              </div>

              {/* Demographics row */}
              <div className="flex flex-wrap gap-[6px] mt-[8px]">
                {ctx.age && (
                  <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">Age: {ctx.age}</span>
                )}
                {ctx.gender && (
                  <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">{ctx.gender}</span>
                )}
                {ctx.isPregnant && (
                  <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#fef2f2] text-[#ef4444] border border-[#fca5a5]">Pregnant</span>
                )}
                {(ctx.conditions || []).map((c, i) => (
                  <span key={i} className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#ecfdf5] text-[#059669] border border-[#6ee7b7]">{c}</span>
                ))}
              </div>

              {/* Medications */}
              {(ctx.medications || []).length > 0 && (
                <div className="mt-[8px]">
                  <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.06em] mb-[6px]">Medications</div>
                  <div className="flex flex-wrap gap-[6px]">
                    {ctx.medications.map((m, i) => (
                      <span key={i} className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#faf5ff] text-[#7c3aed] border border-[#e9d5ff]">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Symptoms / Allergies / History */}
              {(ctx.symptoms || ctx.allergies || ctx.history) && (
                <div className="flex flex-wrap gap-[6px] mt-[8px]">
                  {ctx.symptoms && (
                    <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">💊 {ctx.symptoms}</span>
                  )}
                  {ctx.allergies && (
                    <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#fef2f2] text-[#ef4444] border border-[#fca5a5]">⚠️ {ctx.allergies}</span>
                  )}
                  {ctx.history && (
                    <span className="text-[11px] font-medium py-[3px] px-[10px] rounded-[20px] bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">📋 {ctx.history}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient Query */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]"><MessageSquare size={13} /> Patient's Question</div>
          <div className="bg-white border-[1.5px] border-[#e8ecf4] rounded-[14px] p-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <p className="text-[13.5px] font-semibold text-[#0f172a] leading-[1.6] m-0">"{item.query}"</p>
            {item.note && (
              <div className="flex items-start gap-[6px] text-[12.5px] text-[#64748b] mt-[10px] pt-[10px] border-t border-[#f1f5f9] leading-[1.5]"><Info size={12} /> <span>{item.note}</span></div>
            )}
          </div>
        </div>

        {/* MedTruth AI Analysis — shown to doctor for reference */}
        {item.ai_response && (item.ai_response.recommendation || item.ai_response.medical_analysis) && (
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]"><Shield size={13} className="text-[#6366f1]" /> MedTruth AI Analysis</div>
            <div className="bg-[#f8faff] border-[1.5px] border-[#c7d2fe] rounded-[14px] overflow-hidden">
              <div className="py-[10px] px-[16px] flex items-center justify-between border-b border-[#e0e7ff] bg-gradient-to-r from-[#eef2ff] to-[#f8faff]">
                <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#6366f1]">
                  <Sparkles size={13} className="text-[#6366f1]" />
                  <span>AI Recommendation</span>
                </div>
                <div className="flex items-center gap-[8px]">
                  {item.ai_response.risk_level && (
                    <span className={`text-[10px] font-bold py-[3px] px-[8px] rounded-[10px] uppercase ${item.ai_response.risk_level === "high" ? "bg-[#fef2f2] text-[#ef4444]" : item.ai_response.risk_level === "medium" ? "bg-[#fffbeb] text-[#f59e0b]" : "bg-[#ecfdf5] text-[#10b981]"}`}>
                      Risk: {item.ai_response.risk_level}
                    </span>
                  )}
                  {item.ai_response.confidence_score != null && (
                    <span className="text-[11px] font-semibold text-[#6366f1] bg-[#eef2ff] py-[2px] px-[8px] rounded-[8px]">
                      Confidence: {item.ai_response.confidence_score}%
                    </span>
                  )}
                </div>
              </div>
              <div className="py-[14px] px-[16px]">
                <p className="text-[13px] text-[#374151] leading-[1.7] whitespace-pre-wrap m-0">
                  {item.ai_response.recommendation || item.ai_response.medical_analysis}
                </p>
                {item.ai_response.medical_analysis && item.ai_response.recommendation && (
                  <div className="mt-[10px] pt-[10px] border-t border-[#e0e7ff]">
                    <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.06em] mb-[4px]">Medical Analysis</div>
                    <p className="text-[12.5px] text-[#64748b] leading-[1.6] m-0">{item.ai_response.medical_analysis}</p>
                  </div>
                )}
              </div>
              {(item.ai_response.citations || []).length > 0 && (
                <div className="flex flex-wrap gap-[6px] py-[10px] px-[16px] border-t border-[#e0e7ff]">
                  {item.ai_response.citations.map((c, i) => (
                    <span key={i} className="text-[11px] font-medium py-[3px] px-[10px] rounded-[12px] bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe]">
                      {typeof c === "string" ? c : c.title || JSON.stringify(c)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* If already responded */}
        {!isPending ? (
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]"><CheckCircle2 size={13} className="text-[#10b981]" /> Your Response</div>
            <div className="bg-[#f0fdf4] border-[1.5px] border-[#a7f3d0] rounded-[14px] overflow-hidden">
              <div className="py-[10px] px-[16px] flex items-center justify-between border-b border-[#a7f3d0] bg-white/50">
                <span className="flex items-center gap-[6px] text-[12px] font-bold text-[#6366f1]"><Sparkles size={12} className="text-[#6366f1]" /> Dr. {item.doctor?.name?.replace("Dr. ", "")}</span>
                <span className="flex items-center gap-[4px] text-[11px] text-[#94a3b8]"><Clock size={11} /> {item.respondedAt}</span>
              </div>
              <p className="py-[14px] px-[16px] text-[13.5px] text-[#374151] leading-[1.7] whitespace-pre-wrap m-0">{item.response}</p>
            </div>
          </div>
        ) : sent ? (
          <div className="flex flex-col items-center gap-[12px] bg-white border border-[#6ee7b7] rounded-[16px] py-[32px] px-[24px] text-center shadow-[0_2px_12px_rgba(16,185,129,0.08)]">
            <div className="w-[56px] h-[56px] rounded-full bg-[#ecfdf5] border-2 border-[#6ee7b7] flex items-center justify-center animate-[bIn_0.4s_ease]"><CheckCircle2 size={28} color="#10b981" /></div>
            <div className="text-[16px] font-bold text-[#0f172a]">Review Submitted Successfully!</div>
            <div className="text-[13px] text-[#64748b] leading-[1.5] max-w-[360px]">
              Your {reviewStatus === "approved" ? "approval" : "rejection"} and recommendation have been recorded. The patient will be notified.
            </div>
            {/* SMS Notification Status */}
            {smsResult && (
              <div className={`flex items-center gap-[6px] text-[12px] font-medium py-[6px] px-[14px] rounded-[10px] ${smsResult.sent ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#fffbeb] text-[#d97706]"}`}>
                {smsResult.sent ? (
                  <><CheckCircle2 size={13} /> SMS sent to patient ({smsResult.to})</>
                ) : (
                  <><AlertTriangle size={13} /> SMS not sent: {smsResult.error || "Patient mobile not found"}</>
                )}
              </div>
            )}
            {apiError && (
              <div className="flex items-center gap-[6px] text-[12px] font-medium py-[6px] px-[14px] rounded-[10px] bg-[#fef2f2] text-[#ef4444]">
                <AlertTriangle size={13} /> {apiError}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {/* Review Status Toggle */}
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]">
                <Activity size={13} /> Review Decision
              </div>
              <div className="flex gap-[8px]">
                <button
                  className={`flex-1 flex items-center justify-center gap-[6px] py-[10px] px-[16px] rounded-[10px] text-[13px] font-bold border-[1.5px] cursor-pointer transition-all duration-200 ${reviewStatus === "approved" ? "bg-[#ecfdf5] border-[#059669] text-[#059669] shadow-[0_2px_8px_rgba(5,150,105,0.15)]" : "bg-white border-[#e2e8f0] text-[#94a3b8] hover:border-[#a7f3d0] hover:text-[#059669]"}`}
                  onClick={() => setReviewStatus("approved")}
                >
                  <CheckCircle2 size={15} /> Approve
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-[6px] py-[10px] px-[16px] rounded-[10px] text-[13px] font-bold border-[1.5px] cursor-pointer transition-all duration-200 ${reviewStatus === "rejected" ? "bg-[#fef2f2] border-[#ef4444] text-[#ef4444] shadow-[0_2px_8px_rgba(239,68,68,0.15)]" : "bg-white border-[#e2e8f0] text-[#94a3b8] hover:border-[#fca5a5] hover:text-[#ef4444]"}`}
                  onClick={() => setReviewStatus("rejected")}
                >
                  <AlertTriangle size={15} /> Reject
                </button>
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]">
                <Stethoscope size={13} /> Your Recommendation
              </div>
              <textarea
                className="w-full border-[1.5px] border-[#e2e8f0] rounded-[12px] bg-white text-[#1e293b] text-[13.5px] font-sans py-[12px] px-[14px] resize-none outline-none leading-[1.6] transition-colors duration-200 shadow-[0_1px_6px_rgba(0,0,0,0.04)] focus:border-[#3b82f6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] placeholder:text-[#94a3b8]"
                placeholder="Type your medical recommendation here… Be specific, evidence-based, and include dosage instructions or next steps where applicable."
                value={recommendation}
                onChange={e => setRecommendation(e.target.value)}
                rows={5}
              />
            </div>

            {/* Doctor View / Clinical Opinion */}
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#64748b] uppercase tracking-[0.04em]">
                <BookOpen size={13} /> Clinical Assessment <span className="font-normal text-[#94a3b8]">(doctor_view)</span>
              </div>
              <textarea
                className="w-full border-[1.5px] border-[#e2e8f0] rounded-[12px] bg-white text-[#1e293b] text-[13px] font-sans py-[10px] px-[14px] resize-none outline-none leading-[1.6] transition-colors duration-200 shadow-[0_1px_6px_rgba(0,0,0,0.04)] focus:border-[#6366f1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-[#94a3b8]"
                placeholder="Your clinical opinion/assessment on this case (e.g., 'Low risk based on current symptoms and history'). If left empty, a summary of your recommendation will be used."
                value={doctorView}
                onChange={e => setDoctorView(e.target.value)}
                rows={3}
              />
            </div>

            {/* API Error */}
            {apiError && (
              <div className="flex items-center gap-[6px] text-[12px] font-medium py-[8px] px-[14px] rounded-[10px] bg-[#fef2f2] text-[#ef4444] border border-[#fca5a5]">
                <AlertTriangle size={13} /> {apiError}
              </div>
            )}

            {/* Submit bar */}
            <div className="flex items-center justify-between flex-wrap gap-[10px]">
              <div className="flex items-center gap-[5px] text-[11.5px] text-[#64748b]">
                <Shield size={12} color="#3b82f6" />
                Response will be AI-verified before delivery to patient
              </div>
              <button
                className={`flex items-center gap-[8px] border-none rounded-[10px] text-white text-[13px] font-bold py-[10px] px-[22px] cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${reviewStatus === "approved" ? "bg-[#059669] shadow-[0_4px_14px_rgba(5,150,105,0.35)] hover:not(.disabled):-translate-y-[1px]" : "bg-[#ef4444] shadow-[0_4px_14px_rgba(239,68,68,0.35)] hover:not(.disabled):-translate-y-[1px]"}`}
                onClick={handleSend}
                disabled={!recommendation.trim() || sending}
              >
                {sending ? <Loader2 size={15} className="animate-[spin_1s_linear_infinite]" /> : <Send size={15} />}
                {sending ? "Submitting…" : reviewStatus === "approved" ? "Approve & Send" : "Reject & Send"}
              </button>
            </div>
          </div>
        )}

        {/* AI Guideline Reminder */}
        <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-[12px] py-[14px] px-[16px]">
          <div className="flex items-center gap-[6px] text-[12px] font-bold text-[#0369a1] mb-[6px]"><BookOpen size={13} className="text-[#1d6fa8]" /> Clinical Guidelines Reminder</div>
          <p className="text-[12.5px] text-[#075985] leading-[1.6] my-[0] mx-[0] mb-[10px]">
            All responses are cross-checked against WHO, ADA, NHS, and CDC clinical guidelines by the MedTruth AI engine before delivery.
            Ensure your recommendations are evidence-based and include escalation criteria where appropriate.
          </p>
          <div className="flex flex-wrap gap-[6px]">
            {["WHO Clinical Guidelines", "ADA Standards 2024", "NHS Protocols", "CDC Recommendations"].map((s, i) => (
              <span key={i} className="bg-white border border-[#bae6fd] rounded-[20px] text-[11px] text-[#0369a1] py-[3px] px-[10px]">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const dynamic = "force-dynamic";

// ─── Main Page ───────────────────────────────────────────────────────────────────
export default function CitizenQueryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const doctorId = session?.user?.id;
  const [allItems, setAllItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loadingApi, setLoadingApi] = useState(false);

  // Normalize patientContext from backend format to display format
  const normalizePatientContext = (ctx) => {
    if (!ctx) return {};
    return {
      age: ctx.age || null,
      gender: ctx.gender || null,
      isPregnant: ctx.isPregnant || false,
      conditions: ctx.conditions || (ctx.currentDisease && ctx.currentDisease !== "none" ? [ctx.currentDisease] : []),
      medications: ctx.medications || (ctx.medication && ctx.medication !== "none" ? ctx.medication.split(", ").filter(Boolean) : []),
      symptoms: ctx.symptoms || null,
      allergies: ctx.allergies && ctx.allergies !== "none" ? ctx.allergies : null,
      history: ctx.history && ctx.history !== "no chronic conditions" ? ctx.history : null,
    };
  };

  useEffect(() => {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem("medtruth_consultations") || "[]");
    } catch (e) { }
    const enriched = stored
      .filter(s => s.doctor?.id && doctorId && String(s.doctor.id) === String(doctorId))
      .map(c => ({
        ...c,
        patient: c.patientContext?.age ? `Patient (${c.patientContext.age}y)` : "Anonymous Patient",
        urgency: c.urgency || "moderate",
        isFromStorage: true,
        // Map aiResponse (camelCase from chat page) to ai_response (snake_case for detail panel)
        ai_response: c.ai_response || c.aiResponse || null,
        patientContext: normalizePatientContext(c.patientContext),
      }));

    // Fetch real assigned queries from backend
    const fetchAssigned = async () => {
      if (!doctorId) {
        setAllItems([...enriched]);
        return;
      }
      setLoadingApi(true);
      try {
        const data = await getDoctorAssignedQueries(doctorId);
        const queries = Array.isArray(data) ? data : (data?.queries || data?.assigned_queries || []);
        const backendItems = queries.map((q) => {
          const myConsult = (q.consult_requests || []).find(cr => String(cr.doctor_id) === String(doctorId)) || {};
          const isResponded = ["approved", "rejected", "reviewed", "completed"].includes(myConsult.consult_status);
          const aiResp = getAiResponse(q);
          return {
            id: q._id || q.query_id,
            query_id: q._id || q.query_id,
            isBackend: true,
            doctor: {
              id: doctorId,
              name: session?.user?.name || "Doctor",
              specialty: session?.user?.specialization || "General",
            },
            doctor_id: doctorId,
            patient: q.citizen_id || "Patient",
            status: isResponded ? "responded" : "pending",
            urgency: (aiResp?.risk_level || "low") === "high" ? "high" : (aiResp?.risk_level || "low") === "medium" ? "moderate" : "low",
            query: q.query || "Medical Query",
            note: "",
            sentAt: q.created_at ? new Date(q.created_at).toLocaleString() : "Recently",
            respondedAt: myConsult.reviewed_at ? new Date(myConsult.reviewed_at).toLocaleString() : null,
            response: myConsult.doctor_recommendation || null,
            patientContext: normalizePatientContext(q.patient_context || q.patientContext || {}),
            ai_response: aiResp,
            read: isResponded,
          };
        });

        const combined = [...enriched, ...backendItems];
        setAllItems(combined);
      } catch (err) {
        console.error("Failed to fetch assigned queries:", err);
        setAllItems([...enriched]);
      } finally {
        setLoadingApi(false);
      }
    };

    fetchAssigned();
  }, [doctorId]);

  const filtered = useMemo(() => {
    return allItems.filter(r => {
      const q = search.toLowerCase();
      const matchQ = !q || (r.query || "").toLowerCase().includes(q) || (r.patient || "").toLowerCase().includes(q);
      const matchF = filter === "all" || r.status === filter;
      return matchQ && matchF;
    });
  }, [allItems, search, filter]);

  const handleSelect = (id) => {
    setSelectedId(id);
    setAllItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const handleRespond = (id, response, reviewStatus, doctorView) => {
    const now = new Date().toLocaleString();
    setAllItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: "responded", response, respondedAt: now, read: true, reviewStatus, doctorView } : i
    ));
    // Update localStorage for real consultations
    try {
      const ls = JSON.parse(localStorage.getItem("medtruth_consultations") || "[]");
      const updated = ls.map(c =>
        c.id === id ? { ...c, status: "responded", response, respondedAt: now, reviewStatus, doctorView } : c
      );
      localStorage.setItem("medtruth_consultations", JSON.stringify(updated));
    } catch (e) { }
  };

  const selectedItem = allItems.find(r => r.id === selectedId);
  const pendingCount = allItems.filter(r => r.status === "pending").length;
  const unreadCount = allItems.filter(r => !r.read).length;

  return (
    <>


      <div className="flex flex-col h-full font-sans bg-[#f0f4ff] overflow-hidden">
        {/* ── Top Bar ── */}
        <div className="bg-white border-b border-[#e8ecf4] py-[16px] px-[28px] max-md:pl-[60px] max-md:px-[14px] flex items-center justify-between shrink-0 shadow-[0_1px_6px_rgba(0,0,0,0.04)] flex-wrap gap-[10px]">
          <div className="flex items-center gap-[14px] max-md:gap-[10px]">
            <div className="w-[40px] h-[40px] max-md:w-[34px] max-md:h-[34px] bg-[#1f97ef] rounded-[12px] max-md:rounded-[10px] flex items-center justify-center text-white shadow-[0_3px_12px_rgba(139,92,246,0.3)] shrink-0">
              <Users size={19} className="max-md:hidden" />
              <Users size={16} className="md:hidden" />
            </div>
            <div>
              <div className="text-[16px] max-md:text-[14px] font-bold text-[#0f172a]">Patient Queries</div>
              <div className="text-[11.5px] max-md:text-[10px] text-[#94a3b8] mt-[1px] max-md:hidden">Citizen medical consultations</div>
            </div>
          </div>
          <div className="hidden md:flex gap-[6px]">
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#f1f5f9] border-[#e2e8f0] text-[#475569]"><FileText size={12} /> {allItems.length} Total</div>
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#fffbeb] border-[#fde68a] text-[#d97706]"><Clock size={12} /> {pendingCount} Pending</div>
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#eff6ff] border-[#bfdbfe] text-[#3b82f6]"><Bell size={12} /> {unreadCount} Unread</div>
            <div className="flex items-center gap-[5px] py-[6px] px-[14px] rounded-[20px] text-[12px] font-semibold border bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]"><CheckCircle2 size={12} /> {allItems.filter(r => r.status === "responded").length} Answered</div>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="py-[14px] px-[28px] max-md:px-[14px] flex items-center gap-[12px] max-md:gap-[8px] bg-white border-b border-[#f1f5f9] shrink-0 flex-wrap">
          <div className="flex-1 min-w-[140px] flex items-center gap-[8px] bg-[#f8faff] border-[1.5px] border-[#e2e8f0] rounded-[10px] py-[8px] max-md:py-[6px] px-[14px] max-md:px-[10px] transition-colors duration-200 focus-within:border-[#3b82f6] focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]">
            <Search size={14} className="text-[#94a3b8] shrink-0" />
            <input className="flex-1 border-none bg-transparent outline-none text-[13px] max-md:text-[12px] text-[#1e293b] placeholder:text-[#94a3b8] min-w-0" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")} className="bg-transparent border-none cursor-pointer text-[#94a3b8] flex"><X size={13} /></button>}
          </div>
          <div className="flex gap-[4px]">
            {[["all", "All"], ["pending", "Pending"], ["responded", "Done"]].map(([v, l]) => (
              <button key={v} className={`bg-[#f1f5f9] border-[1.5px] border-transparent rounded-[8px] py-[7px] max-md:py-[5px] px-[14px] max-md:px-[10px] text-[12px] max-md:text-[11px] font-semibold text-[#64748b] cursor-pointer transition-all duration-200 hover:not(.active):bg-[#e2e8f0] ${filter === v ? "active !bg-gradient-to-br !from-[#eff6ff] !to-[#ede9fe] !text-[#3b82f6] !border-[#3b82f6]/25" : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* ── Card List ── */}
        <div className="flex-1 overflow-y-auto py-[20px] px-[28px] max-md:py-[12px] max-md:px-[14px] flex flex-col gap-[12px] bg-white scrollbar-thin scrollbar-thumb-[#cbd5e1] scrollbar-track-transparent">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-[8px] py-[60px] px-[20px] text-center">
              <div className="w-[56px] h-[56px] bg-gradient-to-br from-[#dbeafe] to-[#ede9fe] rounded-[16px] flex items-center justify-center"><MessageSquare size={28} color="#6366f1" /></div>
              <div className="text-[15px] font-bold text-[#0f172a]">No queries found</div>
              <div className="text-[12.5px] text-[#94a3b8] max-w-[320px]">Try adjusting your search or filters</div>
            </div>
          ) : (
            filtered.map(item => {
              const initials = (item.patient || "Patient")
                .split(" ")
                .map(w => w[0])
                .join("")
                .slice(0, 2);
              const ctx = item.patientContext || {};
              return (
                <div
                  key={item.id}
                  className={`group bg-white border-[1.5px] border-[#e8ecf4] rounded-[14px] py-[18px] px-[20px] cursor-pointer transition-all duration-200 flex items-start gap-[14px] relative hover:border-[#bfdbfe] hover:shadow-[0_4px_16px_rgba(59,130,246,0.08)] hover:-translate-y-[1px] ${selectedId === item.id ? "border-[#3b82f6] bg-[#f8faff] shadow-[0_4px_16px_rgba(59,130,246,0.12)]" : ""} ${!item.read ? "before:content-[''] before:absolute before:top-1/2 before:-left-[1px] before:-translate-y-1/2 before:w-[3px] before:h-[28px] before:bg-[#3b82f6] before:rounded-[0_3px_3px_0]" : ""}`}
                  onClick={() => handleSelect(item.id)}
                >
                  <div className="w-[44px] h-[44px] rounded-full bg-[#1f97ef] text-white text-[14px] font-bold flex items-center justify-center shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-[8px] mb-[4px]">
                      <span className="text-[14px] font-bold text-[#0f172a]">{item.patient || "Unknown Patient"}</span>
                      <div className="flex gap-[5px] shrink-0">
                        <span className={`text-[10px] font-semibold py-[3px] px-[8px] rounded-[12px] uppercase tracking-[0.03em] ${item.status === "pending" ? "bg-[#fffbeb] text-[#d97706]" : "bg-[#ecfdf5] text-[#059669]"}`}>
                          {item.status === "pending" ? "Pending" : "Responded"}
                        </span>
                        <span className={`text-[10px] font-semibold py-[3px] px-[8px] rounded-[12px] uppercase tracking-[0.03em] ${(item.urgency || "moderate") === "high" ? "bg-[#fef2f2] text-[#dc2626]" : (item.urgency || "moderate") === "moderate" ? "bg-[#fff7ed] text-[#ea580c]" : "bg-[#f0fdf4] text-[#16a34a]"}`}>
                          {(item.urgency || "moderate") === "high" ? "⚡ Urgent" : (item.urgency || "moderate") === "moderate" ? "Moderate" : "Routine"}
                        </span>
                      </div>
                    </div>
                    <div className="text-[12px] text-[#3b82f6] font-medium mb-[6px]">
                      {ctx.age && `${ctx.age} yrs`}{ctx.gender && ` · ${ctx.gender}`}
                      {ctx.conditions?.length > 0 && ` · ${ctx.conditions.join(", ")}`}
                    </div>
                    <div className="text-[13px] text-[#475569] leading-[1.5] overflow-hidden line-clamp-2">{item.query}</div>
                    <div className="flex items-center gap-[12px] mt-[8px]">
                      <span className="flex items-center gap-[4px] text-[11px] text-[#94a3b8]"><Clock size={11} /> {item.sentAt || "Recently"}</span>
                      {item.note && <span className="flex items-center gap-[4px] text-[11px] text-[#6366f1]"><Info size={11} /> Has note</span>}
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
          <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-[4px] z-[199] flex items-center justify-center animate-[cqFadeIn_0.2s_ease]" onClick={() => setSelectedId(null)}>
            <div className="relative w-[720px] max-w-[92vw] max-h-[88vh] bg-white z-[200] shadow-[0_20px_60px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)] rounded-[20px] flex flex-col overflow-hidden animate-[cqModalIn_0.25s_cubic-bezier(0.4,0,0.2,1)] md:max-w-[96vw] md:max-h-[92vh] md:rounded-[14px]" onClick={e => e.stopPropagation()}>
              <div className="py-[18px] px-[24px] border-b border-[#e8ecf4] flex items-center justify-between bg-gradient-to-br from-[#f8faff] to-[#f0f4ff] shrink-0 rounded-t-[20px] md:rounded-t-[14px]">
                <div className="flex items-center gap-[10px]">
                  <MessageSquare size={17} color="#3b82f6" />
                  <div>
                    <div className="text-[16px] font-bold text-[#0f172a]">Patient Query Detail</div>
                    <div className="text-[11.5px] text-[#94a3b8] mt-[1px]">{selectedItem.patient} · {selectedItem.sentAt || "Recently"}</div>
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
                  onRespond={handleRespond}
                  onBackToDashboard={() => router.push("/home/doctor/dashboard")}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
