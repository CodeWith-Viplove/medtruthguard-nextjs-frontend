"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Activity,
  History,
  Plus,
  X,
  Heart,
  Pill,
  Baby,
  ChevronDown,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  Loader2,
  CheckCircle2
} from "lucide-react";
import AnalysisForm from "@/components/home/citizen/analysis/AnalysisForm";
import AnalysisResultView from "@/components/home/citizen/analysis/AnalysisResultView";
import AnalysisHistory from "@/components/home/citizen/analysis/AnalysisHistory";
import { getImageAnalysis } from "@/lib/api";

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

export const dynamic = "force-dynamic";

export default function ImageAnalysisPage() {
  const { data: session } = useSession();
  const citizenId = session?.user?.id || "anonymous";

  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
    setTimeout(() => {
      setContextSaved(false);
      setSidebarOpen(false);
    }, 800);
  };

  const onAnalysisComplete = (result) => {
    setActiveAnalysis(result);
    setRefreshHistory(prev => prev + 1);
  };

  const handleSelectAnalysis = async (analysis) => {
    const analysisId = analysis.analysis_id || analysis.id;
    if (!analysisId) {
      setActiveAnalysis(analysis);
      return;
    }

    setLoadingDetails(true);
    try {
      const fullAnalysis = await getImageAnalysis(analysisId);
      setActiveAnalysis(fullAnalysis);
    } catch (err) {
      console.error("Failed to fetch full analysis details:", err);
      // Fallback to what we have if fetch fails
      setActiveAnalysis(analysis);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans bg-[#f0f4ff] overflow-hidden">
      {/* Patient Profile Modal — matching ChatPage style */}
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
                className="bg-slate-100 border border-slate-200 rounded-md w-9 h-9 flex items-center justify-center cursor-pointer text-slate-400 transition-all duration-200 shrink-0 hover:text-red-500 hover:border-red-400 hover:bg-red-50"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body — Scrollable */}
            <div className="flex-1 overflow-y-auto p-[24px] flex flex-col gap-[20px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {/* Demographics Card */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-[14px] p-[20px]">
                <div className="flex items-center gap-[8px] text-slate-500 text-[11px] font-bold tracking-[0.1em] uppercase mb-[18px] [&_svg]:text-[#2793ef]">
                  <User size={13} />
                  Basic Information
                </div>

                <div className="flex gap-[14px] mb-[16px]">
                  <div className="flex-1 flex flex-col gap-[6px]">
                    <label className="text-slate-700 text-[12px] font-medium">Age</label>
                    <input
                      className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)]"
                      type="number"
                      placeholder="e.g. 30"
                      value={patientContext.age}
                      onChange={(e) => setPatientContext((p) => ({ ...p, age: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-[6px]">
                    <label className="text-slate-700 text-[12px] font-medium">Gender</label>
                    <select
                      className="bg-white border border-slate-300 rounded-lg text-slate-900 py-[10px] px-[12px] text-[13px] w-full outline-none transition-colors duration-200 focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.1)]"
                      value={patientContext.gender}
                      onChange={(e) => setPatientContext((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div
                  className="flex items-center gap-[10px] cursor-pointer select-none"
                  onClick={() => setPatientContext((p) => ({ ...p, isPregnant: !p.isPregnant }))}
                >
                  <div className={`w-[40px] h-[22px] rounded-full relative transition-colors duration-200 shrink-0 ${patientContext.isPregnant ? "bg-[#2793ef]" : "bg-slate-300"}`}>
                    <div className={`w-[16px] h-[16px] rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${patientContext.isPregnant ? "left-[21px]" : "left-[3px]"}`} />
                  </div>
                  <Baby size={14} className={patientContext.isPregnant ? "text-[#3b82f6]" : "text-[#64748b]"} />
                  <span className="text-slate-600 text-[13px]">Currently Pregnant</span>
                </div>
              </div>

              {/* Conditions Card */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-[14px] p-[20px]">
                <div className="flex items-center gap-[8px] text-slate-600 text-[13px] font-semibold mb-[14px]">
                  <Heart size={13} color="#ef4444" />
                  Health Conditions
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CONDITIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleCondition(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${patientContext.conditions.includes(item)
                        ? "bg-[#2793ef] border-[#2793ef] text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medications Card */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-[14px] p-[20px]">
                <div className="flex items-center gap-[8px] text-slate-600 text-[13px] font-semibold mb-[14px]">
                  <Pill size={13} color="#8b5cf6" />
                  Current Medications
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_MEDICATIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleMedication(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${patientContext.medications.includes(item)
                        ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-[10px] p-[16px_24px] border-t border-slate-100 bg-white shrink-0">
              <button
                className="bg-slate-100 border border-slate-200 rounded-md text-slate-500 text-[13px] font-semibold py-[10px] px-[20px] cursor-pointer transition-all duration-200 hover:border-slate-400 hover:text-slate-800"
                onClick={() => setSidebarOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`flex items-center gap-[8px] bg-[#2793ef] border-none rounded-md text-white p-[10px_24px] text-[14px] font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(59,130,246,0.35)] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(59,130,246,0.45)] ${contextSaved ? "bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.35)]" : ""}`}
                onClick={saveContext}
              >
                {contextSaved ? (
                  <>
                    <CheckCircle2 size={16} />
                    Context Saved!
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Save Patient Context
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header — matching Chat Header style */}
      <header className="bg-white border-b border-[#e8ecf4] py-[14px] px-[22px] max-md:pl-[60px] max-md:px-[14px] flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.05)] gap-[10px] shrink-0">
        <div className="flex items-center gap-[12px] max-md:gap-[8px]">
          <div className="w-[38px] h-[38px] max-md:w-[32px] max-md:h-[32px] bg-[#2793ef] rounded-md max-md:rounded-md flex items-center justify-center text-white shadow-[0_3px_10px_rgba(99,102,241,0.3)] shrink-0">
            <Activity size={18} className="max-md:hidden" />
            <Activity size={15} className="md:hidden" />
          </div>
          <div>
            <div className="text-[16px] max-md:text-[13px] font-bold text-slate-900">Medical Image Analysis</div>
            <div className="text-[12px] max-md:text-[10px] text-slate-400 max-md:hidden">Upload scans or ECG for clinical AI verification</div>
          </div>
        </div>
        <div className="flex items-center gap-[8px] shrink-0">
          <button
            className="flex items-center gap-[7px] max-md:gap-[5px] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-[1.5px] border-blue-500/25 rounded-md text-[#2793ef] text-[12px] max-md:text-[11px] font-semibold px-[14px] max-md:px-[10px] py-[7px] max-md:py-[5px] cursor-pointer transition-all duration-250 whitespace-nowrap hover:from-blue-500/20 hover:to-indigo-500/20 hover:border-blue-500 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(59,130,246,0.2)]"
            onClick={() => setSidebarOpen(true)}
          >
            <User size={14} />
            <span className="max-md:hidden">Patient Profile</span>
            <span className="md:hidden">Profile</span>
          </button>
        </div>
      </header>

      {/* Main Content — scrollable area inside root */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent bg-[#f8faff]">
        <div className="max-w-7xl mx-auto pb-10">
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
              <Loader2 size={48} className="animate-spin text-[#2793ef] mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">
                Retrieving Clinical Dataset...<br />
                <span className="text-[10px] opacity-70">Synchronizing neural analysis patterns</span>
              </p>
            </div>
          ) : !activeAnalysis ? (
            <div className="space-y-8 animate-[fadeIn_0.3s_ease]">
              {/* Intro Section */}
              <div className="bg-white border border-[#e8ecf4] rounded-2xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="max-w-4xl">
                  <h2 className="text-xl font-bold text-slate-900 mb-3">Welcome to diagnostic support.</h2>
                  <p className="text-slate-600 leading-relaxed font-semibold mb-6 text-sm">
                    Upload clinical scans or ECG images for high-precision neural analysis. Our AI provides technical observations to help you and your doctor coordinate the best care plan.
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#2793ef] text-sm" /> HIPAA Compliant</span>
                    <span className="flex items-center gap-1.5"><Activity size={14} className="text-[#2793ef] text-sm" /> Real-time Processing</span>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <AnalysisForm
                citizenId={citizenId}
                patientContext={{
                  ...patientContext,
                  currentDisease: patientContext.conditions.join(", "),
                  medication: patientContext.medications.join(", ")
                }}
                onAnalysisComplete={onAnalysisComplete}
              />

              {/* History Section */}
              <AnalysisHistory
                key={refreshHistory}
                citizenId={citizenId}
                onSelectAnalysis={handleSelectAnalysis}
              />
            </div>
          ) : (
            <div className="animate-[fadeInUp_0.3s_ease]">
              <AnalysisResultView
                result={activeAnalysis}
                onBack={() => setActiveAnalysis(null)}
              />
            </div>
          )}
        </div>

        {/* Local Footer — consistent style */}
        <footer className="py-8 text-center border-t border-slate-200 mt-auto">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            MedTruth Guard &bull; Institutional Diagnostic Standard &bull; &copy; 2026 All Rights Reserved
          </p>
        </footer>
      </main>
    </div>
  );
}
