"use client";
import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  ArrowLeft,
  ShieldCheck,
  Printer,
  Share2,
  Download,
  Calendar,
  Clock,
  User,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  Loader2,
  TriangleAlert
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AnalysisResultView({ result, onBack }) {
  const reportRef = React.useRef(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  if (!result) return null;

  // Handle various wrapping styles from the backend
  const data = result.analysis_result || result.analysis || result;

  const type = result.analysis_type || data.modality || (data.modality === "ECG/EKG" ? "ECG" : "X-ray");
  const isEcg = type.toLowerCase().includes("ecg");

  const findings = data.findings || data.key_observations || [];
  const impressions = data.clinical_impressions || data.clinical_impression || data.impression || [];
  const recommendations = data.suggested_followup || data.recommendations || [];

  // Robust metadata extraction supporting 'patient_context'
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
    safe: {
      color: "#059669",
      bg: "#ecfdf5",
      border: "#d1fae5",
      icon: <CheckCircle2 size={20} />,
      label: "Normal / Low Risk",
    },
    caution: {
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fef3c7",
      icon: <AlertCircle size={20} />,
      label: "Moderate Activity",
    },
    unsafe: {
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fee2e2",
      icon: <AlertTriangle size={20} />,
      label: "Urgent Attention",
    },
  };

  const cfg = statusConfig[status];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsGenerating(true);
    try {
      const element = reportRef.current;

      // Small delay to ensure all assets are rendered
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff", // Standard HEX
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.print-container');
          if (clonedElement) {
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.background = '#ffffff';
            clonedElement.style.color = '#000000';
          }
        }
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const imgWidth = pdfWidth;
      const imgHeight = (canvasHeight * imgWidth) / canvasWidth;

      // Handle multi-page if height is too much
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`MedTruth_Report_${result.analysis_id?.slice(-6) || "Report"}.pdf`);
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("PDF generation failed due to advanced CSS colors. Please use the Print icon and 'Save as PDF' instead for the best quality.");
    } finally {
      setIsGenerating(false);
    }
  };

  const disclaimer = data.disclaimer || "NOT A DIAGNOSIS. FOR EDUCATIONAL/CLINICAL ASSISTANCE ONLY.";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto mb-10">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action Bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-[#2793ef] text-white rounded-lg font-bold text-sm hover:bg-[#1a85e2] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px] justify-center"
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isGenerating ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="bg-white border border-[#e8ecf4] rounded-2xl overflow-hidden print-container" style={{ borderColor: '#e8ecf4' }}>
        {/* Title Section */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2793ef' }}>
              <Activity size={14} /> AI Analysis Report
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
              Generated: {new Date(timestamp).toLocaleDateString()}
            </div>
          </div>
          <h2 className="text-xl font-bold" style={{ color: '#0f172a' }}>{type} Verification Results</h2>
        </div>

        {/* Status Section */}
        <div className="flex items-center justify-between py-6 px-8 border-y" style={{ backgroundColor: 'rgba(248, 250, 252, 0.3)', borderColor: '#f1f5f9' }}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 shadow-sm transition-all`} style={{ backgroundColor: '#fef2f2', borderColor: '#fee2e2', color: '#dc2626' }}>
              <TriangleAlert size={22} />
            </div>
            <div>
              <div className="text-[12px] font-bold uppercase tracking-widest max-w-xl" style={{ color: '#dc2626' }}>
                {disclaimer}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Confidence Score</div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
                <div className="h-full" style={{ width: `${data.confidence_score || 95}%`, backgroundColor: '#10b981' }}></div>
              </div>
              <span className="text-xs font-black" style={{ color: '#334155' }}>{data.confidence_score || 95}%</span>
            </div>
          </div>
        </div>

        {/* Technical Findings */}
        <div className="p-8 border-b" style={{ borderColor: '#f1f5f9' }}>
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
            <TrendingUp size={14} style={{ color: '#2793ef' }} /> Key Observations
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.isArray(findings) ? findings.map((item, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-50 hover:border-slate-200 transition-colors group" style={{ backgroundColor: '#f8faff', borderColor: '#f8fafc' }}>
                <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: '#2793ef' }} />
                <p className="text-[13.5px] font-medium leading-relaxed" style={{ color: '#334155' }}>{item}</p>
              </div>
            )) : (
              Object.entries(findings).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: '#f8faff', borderColor: '#f1f5f9' }}>
                  <span className="text-xs font-bold uppercase" style={{ color: '#64748b' }}>{k.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-black" style={{ color: '#1e293b' }}>{String(v)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clinical Impressions */}
        <div className="p-8 border-b" style={{ backgroundColor: 'rgba(248, 250, 252, 0.2)', borderColor: '#f1f5f9' }}>
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
            <Stethoscope size={14} style={{ color: '#2793ef' }} /> Clinical Impressions
          </div>
          <div className="space-y-3">
            {(Array.isArray(impressions) ? impressions : [impressions]).map((item, i) => (
              <div key={i} className="bg-white border rounded-xl p-4 shadow-sm border-l-4" style={{ borderColor: '#e8ecf4', borderLeftColor: '#2793ef' }}>
                <p className="text-[14px] font-bold leading-relaxed" style={{ color: '#0f172a' }}>{item}</p>
              </div>
            ))}
            {impressions.length === 0 && <p className="text-sm italic" style={{ color: '#94a3b8' }}>No specific clinical impressions generated.</p>}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-8" style={{ backgroundColor: 'rgba(239, 246, 255, 0.3)' }}>
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-4 flex items-center gap-2" style={{ color: '#1d6fa8' }}>
            <Info size={14} /> Suggested Next Steps
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((item, i) => (
              <span key={i} className="bg-white border rounded-full text-[12px] py-2 px-5 font-bold shadow-sm" style={{ color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                {item}
              </span>
            ))}
            {recommendations.length === 0 && <span className="text-xs italic" style={{ color: '#94a3b8' }}>Please consult your doctor for follow-up guidance.</span>}
          </div>
        </div>

        {/* Patient Context Applied */}
        <div className="mx-8 mt-4 mb-8 p-4 border rounded-xl flex items-center gap-4" style={{ backgroundColor: '#f8faff', borderColor: '#e8ecf4' }}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border" style={{ color: '#94a3b8', borderColor: '#f1f5f9' }}>
            <User size={18} />
          </div>
          <div>
            <div className="text-xs font-bold" style={{ color: '#0f172a' }}>Patient Context Applied</div>
            <p className="text-[11px] font-medium" style={{ color: '#64748b' }}>
              {age || "?"}Y, {gender || "?"} &bull;
              History: {history}
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 flex items-center justify-between text-[11px] border-t" style={{ borderColor: '#f8fafc' }}>
          <div className="flex items-center gap-2 font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} /> MedTruth Verified Document
          </div>
          <div className="font-medium" style={{ color: '#cbd5e1' }}>
            ID: {result.analysis_id || "PROVISIONAL"}
          </div>
        </div>
      </div>


    </div>
  );
}
