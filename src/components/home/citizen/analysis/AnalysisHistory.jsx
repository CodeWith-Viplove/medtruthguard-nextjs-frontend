"use client";
import React, { useState, useEffect } from "react";
import { 
  Activity, 
  TrendingUp, 
  ArrowRight,
  Clock, 
  Loader2,
  Calendar,
  Layers,
  FileSearch,
  CheckCircle2,
  ChevronRight
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

  const filteredAnalyses = analyses.filter(a => {
    const type = (a.analysis_type || a.analysis?.modality || "").toLowerCase();
    return filter === "all" || type.includes(filter);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e8ecf4] rounded-2xl">
         <Loader2 size={32} className="animate-spin text-[#2793ef] mb-4" />
         <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Clinical Archive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Imaging History</h2>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Past clinical assessments</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          {["all", "ecg", "xray"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === type
                  ? "bg-white text-[#2793ef] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAnalyses.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <FileSearch size={32} className="text-slate-300 mb-3" />
            <p className="text-slate-500 font-bold text-sm">No analysis records found.</p>
          </div>
        ) : (
          filteredAnalyses.map((analysis, index) => {
            const data = analysis.analysis || analysis;
            const typeLabel = (analysis.analysis_type || data.modality || "Report").toUpperCase();
            const date = new Date(analysis.created_at || analysis.timestamp || Date.now());
            const severity = (data.severity || "Normal").toLowerCase();
            const isSafe = !severity.includes("severe") && !severity.includes("critical");
            
            return (
              <button
                key={analysis.analysis_id || index}
                onClick={() => onSelectAnalysis(analysis)}
                className="group bg-white border border-[#e8ecf4] p-5 rounded-xl text-left transition-all hover:border-[#2793ef] hover:shadow-lg hover:shadow-blue-50 active:scale-[0.98] flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeLabel.includes("ECG") ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"}`}>
                    {typeLabel.includes("ECG") ? <Activity size={20} /> : <TrendingUp size={20} />}
                  </div>
                  <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${isSafe ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                    {severity}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-[#2793ef] transition-colors">{typeLabel} Assessment</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    <Calendar size={10} /> {date.toLocaleDateString()} &bull; <Clock size={10} /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="mt-2 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] font-black text-[#2793ef] uppercase tracking-widest">
                  View full report
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
