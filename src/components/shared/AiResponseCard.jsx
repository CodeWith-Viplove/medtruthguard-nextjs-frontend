"use client";
import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  User,
  Stethoscope,
  Send,
} from "lucide-react";
import { Tag } from "antd";

/**
 * AiResponseCard — Shared structured AI response card.
 *
 * Props:
 *   - queryText     {string}  The user's original query.
 *   - content       {string}  The AI recommendation / main response text.
 *   - verification  {object}  Verification object (status, justification, confidenceScore,
 *                              safeLabel, patientContextStr, sources, verification_sources).
 *   - rawAiResponse {object}  Raw AI response (may contain pmids, citations, etc.).
 *   - time          {string}  Timestamp to display.
 *   - compact       {boolean} When true, renders a slightly smaller/tighter version (for doctor view).
 */
export default function AiResponseCard({
  queryText,
  content,
  verification,
  rawAiResponse,
  time,
  compact = false,
  doctors,
  onConsult,
  queryId,
  aiResponse,
}) {
  if (!verification) return null;

  const statusConfig = {
    safe: {
      color: "#10b981",
      bg: "#ecfdf5",
      border: "#6ee7b7",
      icon: <ShieldCheck size={compact ? 18 : 20} />,
      label: "Verified Safe",
      ringClass: "bg-emerald-50 border-emerald-300 text-emerald-500",
      badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      textClass: "text-emerald-600",
    },
    caution: {
      color: "#f59e0b",
      bg: "#fffbeb",
      border: "#fcd34d",
      icon: <ShieldAlert size={compact ? 18 : 20} />,
      label: "Use with Caution",
      ringClass: "bg-amber-50 border-amber-300 text-amber-500",
      badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
      textClass: "text-amber-600",
    },
    unsafe: {
      color: "#ef4444",
      bg: "#fef2f2",
      border: "#fca5a5",
      icon: <AlertTriangle size={compact ? 18 : 20} />,
      label: "Not Recommended",
      ringClass: "bg-red-50 border-red-300 text-red-500",
      badgeClass: "bg-red-100 text-red-700 border border-red-200",
      textClass: "text-red-500",
    },
  };

  const cfg = statusConfig[verification.status] || statusConfig.safe;
  const isSafe = verification.status === "safe";

  // ── Build source links ─────────────────────────────────────────────────────
  const badgeColors = [
    { bg: "bg-[#f0f9ff]", text: "text-[#0369a1]", border: "border-[#e0f2fe]", dot: "bg-[#0369a1]" },
    { bg: "bg-[#f0fdf4]", text: "text-[#15803d]", border: "border-[#dcfce7]", dot: "bg-[#15803d]" },
    { bg: "bg-[#fdf4ff]", text: "text-[#a21caf]", border: "border-[#fae8ff]", dot: "bg-[#a21caf]" },
    { bg: "bg-[#ffedd5]", text: "text-[#c2410c]", border: "border-[#fed7aa]", dot: "bg-[#c2410c]" },
    { bg: "bg-[#fce7f3]", text: "text-[#be185d]", border: "border-[#fbcfe8]", dot: "bg-[#be185d]" },
    { bg: "bg-[#f3f4f6]", text: "text-[#374151]", border: "border-[#e5e7eb]", dot: "bg-[#374151]" },
    { bg: "bg-[#ecfeff]", text: "text-[#0f766e]", border: "border-[#ccfbf1]", dot: "bg-[#0f766e]" },
  ];

  const getLinkText = (link) => {
    try {
      const url = new URL(link);
      let domain = url.hostname.replace(/^www\./, "");
      let path = url.pathname === "/" ? "" : url.pathname;
      if (path.endsWith("/")) path = path.slice(0, -1);
      let text = domain + path;
      return text.length > 40 ? text.substring(0, 40) + "..." : text;
    } catch {
      const clean = link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      return clean.length > 40 ? clean.substring(0, 40) + "..." : clean;
    }
  };

  const sources = verification.verification_sources;
  // `citations` from mapAiResponseToChat are already mapped to title strings or raw URLs
  const rawCitations = verification.sources || []; // may be strings (titles or URLs)
  // `pmids` from the raw API response (numeric IDs or full URLs)
  const rawPmids = (rawAiResponse || {}).pmids || [];
  const rawCitationsFromAi = (rawAiResponse || {}).citations || []; // objects or strings from backend

  // ── Helper: extract PMID number from strings like "PMID: 11083703" or "PMID 11083703"
  const extractPmid = (str) => {
    const m = String(str).match(/PMID[:\s]+(\d+)/i);
    return m ? m[1] : null;
  };

  // ── Always start with verification_sources if available
  let pubmedLinks = [...(sources?.pubmed?.links || [])];
  let whoLinks = [...(sources?.who?.links || [])];

  // ── 1. explicit pmids array → always PubMed links
  rawPmids.forEach((id) => {
    const url = typeof id === "string" && id.startsWith("http")
      ? id
      : `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
    if (!pubmedLinks.includes(url)) pubmedLinks.push(url);
  });

  // ── 2. rawCitationsFromAi — backend objects or strings
  const remainingCitations = [];
  rawCitationsFromAi.forEach((c) => {
    const rawLink = typeof c === "string" ? c : (c?.url || c?.link || "");
    const rawLabel = typeof c === "string" ? c : (c?.title || rawLink || "Source");

    // Check PMID pattern in title or link first
    const pmid = extractPmid(rawLabel) || extractPmid(rawLink);

    if (rawLink && rawLink.includes("pubmed.ncbi")) {
      if (!pubmedLinks.includes(rawLink)) pubmedLinks.push(rawLink);
    } else if (pmid) {
      // Build proper PubMed URL from PMID in title/link
      const url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      if (!pubmedLinks.includes(url)) pubmedLinks.push(url);
    } else if (rawLink && rawLink.includes("who.int")) {
      if (!whoLinks.includes(rawLink)) whoLinks.push(rawLink);
    } else {
      remainingCitations.push({ link: rawLink, label: rawLabel });
    }
  });

  // ── 3. rawCitations (pre-mapped strings)
  rawCitations.forEach((c) => {
    if (typeof c !== "string") return;
    const pmid = extractPmid(c);
    if (c.startsWith("http") && c.includes("pubmed")) {
      if (!pubmedLinks.includes(c)) pubmedLinks.push(c);
    } else if (c.startsWith("http") && c.includes("who.int")) {
      if (!whoLinks.includes(c)) whoLinks.push(c);
    } else if (pmid) {
      const url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      if (!pubmedLinks.includes(url)) pubmedLinks.push(url);
    }
  });

  // ── Display helper: show clean label for PubMed URLs
  const getPubmedLabel = (url) => {
    const m = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i);
    return m ? `pubmed.ncbi.nlm.nih.gov/${m[1]}` : getLinkText(url);
  };

  const hasSources = pubmedLinks.length > 0 || whoLinks.length > 0 || remainingCitations.length > 0;

  return (
    <div className="bg-white border border-[#e8ecf4] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden animate-[fadeInUp_0.35s_ease] max-w-full">

      {/* ── Title ── */}
      <div className={`font-bold text-slate-900 pt-[18px] px-[22px] ${compact ? "text-[16px]" : "text-[20px]"}`}>
        Verification Results
      </div>

      {/* ── Status Row ── */}
      <div className="flex items-center justify-between py-[14px] px-[22px] flex-wrap gap-[8px]">
        <div className="flex items-center gap-[14px]">
          <div className={`w-[42px] h-[42px] rounded-full border-2 flex items-center justify-center shrink-0 ${cfg.ringClass}`}>
            {cfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-[8px] mb-[4px]">
              <span className={`inline-block rounded-full text-[11px] font-bold py-[4px] px-[12px] uppercase tracking-[0.05em] ${cfg.badgeClass}`}>
                {cfg.label}
              </span>
              {(verification.confidenceScore != null || true) && (
                <span className="inline-flex items-center gap-[4px] rounded-full text-[11px] font-bold py-[4px] px-[10px] uppercase tracking-[0.05em] bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-[0_1px_2px_rgba(79,70,229,0.1)]">
                  <Sparkles size={12} className="text-indigo-500" />
                  {verification.confidenceScore != null ? verification.confidenceScore : 100}% Confidence
                </span>
              )}
            </div>
            <div className={`flex items-center gap-[5px] text-[13px] font-semibold ${cfg.textClass}`}>
              {isSafe && <CheckCircle2 size={14} className="shrink-0" />}
              {verification.status === "caution" && <Info size={14} className="shrink-0" />}
              {verification.status === "unsafe" && <AlertTriangle size={14} className="shrink-0" />}
              {verification.safeLabel &&
                verification.safeLabel.toLowerCase() !== cfg.label.toLowerCase()
                ? verification.safeLabel
                : isSafe
                  ? "Safe for this patient"
                  : verification.status === "caution"
                    ? "Caution advised for this patient"
                    : "Not safe for this patient"}
            </div>
          </div>
        </div>
        {time && (
          <span className="text-[12px] text-slate-400 whitespace-nowrap">{time}</span>
        )}
      </div>

      {/* ── QUERY ── */}
      {queryText && (
        <div className="py-[10px] px-[22px] border-t border-slate-100">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-[6px]">
            Query
          </div>
          <p className="text-[14px] text-slate-800 leading-relaxed">{queryText}</p>
        </div>
      )}

      {/* ── Medical Analysis ── */}
      {verification.justification && (
        <div className="py-[10px] px-[22px] border-t border-slate-100">
          <div className="flex items-center gap-[8px] mb-[6px]">
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 h-fit mt-[2px]">
              Medical Analysis
            </span>
            {pubmedLinks.length > 0 && (
              <Tag color="blue" className="rounded-full font-bold m-0 px-[8px] tracking-[0.05em] text-[10px] h-fit">
                PUBMED
              </Tag>
            )}
            {whoLinks.length > 0 && (
              <Tag color="green" className="rounded-full font-bold m-0 px-[8px] tracking-[0.05em] text-[10px] h-fit">
                WHO
              </Tag>
            )}
          </div>
          <p className="text-[13.5px] text-slate-700 leading-relaxed break-words">{verification.justification}</p>
        </div>
      )}

      {/* ── AI Suggestion ── */}
      {content && (
        <div className="py-[12px] px-[22px] border-t border-slate-100">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-[8px]">
            Medtruth Guard AI Suggestion
          </div>
          <p className="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{content}</p>
        </div>
      )}

      {/* ── Verification Sources ── */}
      {hasSources && (
        <div className="py-[16px] px-[22px] border-t border-slate-100 bg-[#f8faff]">
          <div className="text-[14px] font-bold text-slate-800 mb-[16px]">Verification Sources</div>
          <div className="flex flex-col gap-[20px]">
            {pubmedLinks.length > 0 && (
              <div>
                <div className="text-[13px] font-semibold text-slate-700 mb-[10px]">PubMed References:</div>
                <div className="flex flex-wrap gap-[10px]">
                  {pubmedLinks.map((link, i) => {
                    const c = badgeColors[i % badgeColors.length];
                    return (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-[8px] text-[12.5px] ${c.text} font-medium transition-all ${c.bg} py-[6px] px-[16px] rounded-full border ${c.border} hover:opacity-80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
                      >
                        <span className={`w-[6px] h-[6px] rounded-full ${c.dot}`} />
                        {getPubmedLabel(link)}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            {whoLinks.length > 0 && (
              <div>
                <div className="text-[13px] font-semibold text-slate-700 mb-[10px]">WHO References:</div>
                <div className="flex flex-wrap gap-[10px]">
                  {whoLinks.map((link, i) => {
                    const c = badgeColors[(i + 2) % badgeColors.length];
                    return (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-[8px] text-[12.5px] ${c.text} font-medium transition-all ${c.bg} py-[6px] px-[16px] rounded-full border ${c.border} hover:opacity-80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
                      >
                        <span className={`w-[6px] h-[6px] rounded-full ${c.dot}`} />
                        {getLinkText(link)}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            {remainingCitations.length > 0 && (
              <div>
                <div className="text-[13px] font-semibold text-slate-700 mb-[10px]">Other References:</div>
                <div className="flex flex-wrap gap-[10px]">
                  {remainingCitations.map(({ link, label }, i) => {
                    const c = badgeColors[(i + 4) % badgeColors.length];
                    return (
                      <a
                        key={i}
                        href={link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-[8px] text-[12.5px] ${c.text} font-medium transition-all ${c.bg} py-[6px] px-[16px] rounded-full border ${c.border} hover:opacity-80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
                      >
                        <span className={`w-[6px] h-[6px] rounded-full ${c.dot}`} />
                        {label || getLinkText(link) || "Source Link"}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Patient Context Applied ── */}
      {verification.patientContextStr && (
        <div className="flex items-center gap-[12px] bg-[#f8faff] border border-[#e8ecf4] rounded-[0px] mx-[0px] mb-[0px] p-[12px_14px]">
          <User size={16} className="text-slate-500 shrink-0" />
          <div>
            <div className="text-[13px] font-bold text-slate-800">Patient Context Applied</div>
            <div className="text-[12px] text-slate-500 mt-[2px]">{verification.patientContextStr}</div>
          </div>
        </div>
      )}
      {/* ── Recommended Doctors ── */}
      {doctors && doctors.length > 0 && (
        <div className="border-t border-slate-100 p-[14px_22px_18px]">
          <div className="flex items-center gap-[7px] text-[12px] font-bold tracking-[0.06em] uppercase text-slate-500 mb-[12px]">
            <Stethoscope size={14} />
            Recommended Doctors
          </div>
          <div className="flex flex-col gap-[8px]">
            {doctors.map((doc, i) => (
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
                {onConsult && (
                  <button
                    className="flex items-center gap-[5px] bg-[#2793ef] border-none rounded-lg text-white text-[11px] font-semibold py-[6px] px-[10px] cursor-pointer shrink-0 transition-all duration-200 shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(99,102,241,0.4)]"
                    onClick={() => onConsult(doc, queryText, queryId, aiResponse)}
                    title="Send query to this doctor"
                  >
                    <Send size={12} />
                    Consult
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
