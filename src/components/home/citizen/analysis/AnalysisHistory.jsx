"use client";
import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  ChevronRight,
  Clock,
  Loader2,
  Calendar,
  FileSearch,
  Scan,
} from "lucide-react";
import { getCitizenImageAnalyses } from "@/lib/api";

export default function AnalysisHistory({ citizenId, onSelectAnalysis }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadHistory() {
      if (!citizenId) return;
      setLoading(true);
      try {
        const res = await getCitizenImageAnalyses(citizenId);
        const data = Array.isArray(res) ? res : (res?.analyses || []);
        const sortedData = [...data].sort((a, b) =>
          new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
        );
        setAnalyses(sortedData);
      } catch (err) {
        console.error("Failed to load analysis history:", err);
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [citizenId]);

  const filteredAnalyses = analyses.filter((a) => {
    const type = (a.analysis_type || a.analysis?.modality || "").toLowerCase();
    return filter === "all" || type.includes(filter);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-[48px] bg-white border border-[#e8ecf4] rounded-[16px] shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
        <div className="w-[48px] h-[48px] rounded-full bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center mb-[12px]">
          <Loader2 size={22} className="animate-spin text-[#2793ef]" />
        </div>
        <p className="text-[13px] font-bold text-[#64748b]">Loading Clinical Archive…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-[12px]">
        <div>
          <div className="text-[15px] font-bold text-[#0f172a]">Imaging History</div>
          <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-widest mt-[2px]">Past clinical assessments</div>
        </div>
        {/* Filter Tabs */}
        <div className="flex p-[4px] bg-[#f1f5f9] rounded-[10px] border border-[#e2e8f0] gap-[2px]">
          {["all", "ecg", "xray"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-[14px] py-[6px] rounded-[7px] text-[11px] font-bold uppercase tracking-wider transition-all ${filter === type
                ? "bg-white text-[#2793ef] shadow-sm border border-[#e8ecf4]"
                : "text-[#64748b] hover:text-[#475569]"}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
        {filteredAnalyses.length === 0 ? (
          <div className="col-span-full py-[60px] flex flex-col items-center justify-center bg-white border border-dashed border-[#e2e8f0] rounded-[16px]">
            <div className="w-[52px] h-[52px] rounded-full bg-[#f1f5f9] flex items-center justify-center mb-[12px]">
              <FileSearch size={24} className="text-[#94a3b8]" />
            </div>
            <p className="text-[14px] font-bold text-[#475569]">No analysis records found</p>
            <p className="text-[12px] text-[#94a3b8] mt-[4px]">Upload your first scan to get started</p>
          </div>
        ) : (
          filteredAnalyses.map((analysis, index) => {
            const data = analysis.analysis || analysis;
            const typeLabel = (analysis.analysis_type || data.modality || "Report").toUpperCase();
            const date = new Date(analysis.created_at || analysis.timestamp || Date.now());
            const severity = (data.severity || "Normal").toLowerCase();
            const isSafe = !severity.includes("severe") && !severity.includes("critical") && !severity.includes("high");
            const isEcg = typeLabel.includes("ECG");

            return (
              <button
                key={analysis.analysis_id || index}
                onClick={() => onSelectAnalysis(analysis)}
                className="group bg-white border border-[#e8ecf4] py-[18px] px-[18px] rounded-[14px] text-left transition-all duration-200 hover:border-[#2793ef] hover:shadow-[0_4px_16px_rgba(39,147,239,0.1)] hover:-translate-y-[1px] flex flex-col gap-[14px] relative overflow-hidden"
              >
                {/* Top row */}
                <div className="flex justify-between items-start">
                  <div className={`w-[40px] h-[40px] rounded-[11px] flex items-center justify-center ${isEcg ? "bg-[#eff6ff] text-[#2793ef]" : "bg-[#ede9fe] text-[#7c3aed]"}`}>
                    {isEcg ? <Activity size={20} /> : <Scan size={20} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider py-[3px] px-[8px] rounded-[8px] border ${isSafe
                    ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                    : "bg-[#fef2f2] text-[#dc2626] border-[#fca5a5]"}`}>
                    {severity}
                  </span>
                </div>

                {/* Label & Date */}
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a] group-hover:text-[#2793ef] transition-colors">{typeLabel} Assessment</div>
                  <div className="flex items-center gap-[6px] text-[11px] font-medium text-[#94a3b8] mt-[4px]">
                    <Calendar size={10} />
                    {date.toLocaleDateString()}
                    <span className="text-[#cbd5e1]">·</span>
                    <Clock size={10} />
                    {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Footer row */}
                <div className="pt-[10px] border-t border-[#f1f5f9] flex items-center justify-between text-[11px] font-bold text-[#2793ef] uppercase tracking-widest">
                  View full report
                  <ChevronRight size={13} className="group-hover:translate-x-[3px] transition-transform" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
