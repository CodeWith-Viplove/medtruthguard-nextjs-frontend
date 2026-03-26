"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Activity,
  Image as ImageIcon,
  ShieldCheck,
  UploadCloud,
  Loader2,
  Info,
  User,
  Stethoscope,
  Heart,
  Pill,
  Baby,
  ArrowRight,
  Plus
} from "lucide-react";
import { analyzeEcg, analyzeXray } from "@/lib/api";

export default function AnalysisForm({ citizenId, patientContext, onAnalysisComplete }) {
  const [analysisType, setAnalysisType] = useState("ecg");
  const [xrayType, setXrayType] = useState("chest");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync with context
  const [symptoms, setSymptoms] = useState(patientContext?.symptoms || "");
  const [history, setHistory] = useState(patientContext?.history || "");

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image to analyze.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("citizen_id", citizenId);

    if (analysisType === "xray") {
      formData.append("xray_type", xrayType);
    }

    if (patientContext.age) formData.append("age", patientContext.age);
    if (patientContext.gender) formData.append("gender", patientContext.gender);
    if (symptoms) formData.append("symptoms", symptoms);
    if (patientContext.currentDisease) formData.append("currentDisease", patientContext.currentDisease);
    if (patientContext.medication) formData.append("medication", patientContext.medication);
    if (history) formData.append("history", history);
    formData.append("isPregnant", patientContext.isPregnant);

    try {
      let result;
      if (analysisType === "ecg") {
        result = await analyzeEcg(formData);
      } else {
        result = await analyzeXray(formData);
      }
      onAnalysisComplete(result);
      removeFile();
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "Failed to analyze image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#e8ecf4] rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-auto md:min-h-[500px]">

      {/* Left Column: Upload & Config */}
      <div className="md:w-5/12 p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 flex flex-col gap-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Configuration</h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Select analysis type</p>
        </div>

        <div className="space-y-4">
          <div className="flex p-1 bg-white border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={() => setAnalysisType("ecg")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${analysisType === "ecg" ? "bg-[#2793ef] text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              <Activity size={18} /> ECG
            </button>
            <button
              type="button"
              onClick={() => setAnalysisType("xray")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${analysisType === "xray" ? "bg-[#2793ef] text-white shadow-md shadow-blue-100" : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              <ImageIcon size={18} /> X-ray
            </button>
          </div>

          {analysisType === "xray" && (
            <div className="flex flex-wrap gap-2 animate-[fadeIn_0.3s_ease]">
              {["chest", "abdomen", "bone"].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setXrayType(type)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${xrayType === type ? "bg-white border-[#2793ef] text-[#2793ef] ring-4 ring-blue-50" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image File</label>
          {!preview ? (
            <div className="relative group flex-1 h-32 md:h-full min-h-[160px]">
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div className="h-full border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center gap-3 transition-all group-hover:border-[#2793ef] group-hover:bg-blue-50/20">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-slate-300 group-hover:text-[#2793ef] transition-colors">
                  <UploadCloud size={32} />
                </div>
                <div className="text-center">
                  <p className="text-slate-800 text-xs font-bold">Choose a file</p>
                  <p className="text-slate-400 text-[10px] font-medium mt-1">PNG, JPEG, DICOM</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32 md:h-full min-h-[160px] group bg-slate-900">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-contain cursor-pointer transition-opacity group-hover:opacity-80" 
                onClick={() => setShowFullPreview(true)}
              />
              
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={removeFile}
                  className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  title="Remove File"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 60% Width Preview Modal */}
      {showFullPreview && (
        <div 
          className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]"
          onClick={() => setShowFullPreview(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-[60%] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-[scaleIn_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[#e0f2fe] rounded-xl flex items-center justify-center text-[#2793ef]">
                    <ImageIcon size={20} />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-slate-900">Image Inspection</h3>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Clinical Pattern Analysis</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowFullPreview(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden bg-slate-900 flex items-center justify-center p-4">
               <img 
                 src={preview} 
                 alt="Full Assessment View" 
                 className="max-w-full max-h-full object-contain shadow-2xl" 
               />
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                     <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{file?.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{(file?.size / 1024 / 1024).toFixed(2)} MB</span>
               </div>
               
               <div className="flex items-center gap-2 text-[10px] font-black text-[#2793ef] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  <ShieldCheck size={12} /> Institutional Quality Verified
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Column: Context & Action */}
      <div className="md:w-7/12 p-8 flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Clinical Context</h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Details help AI accuracy</p>
        </div>

        <div className="space-y-4 flex-1">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 px-1">
              <Stethoscope size={13} className="text-[#2793ef]" /> Current Symptoms
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#2793ef] focus:bg-white transition-all h-24 resize-none"
              placeholder="e.g. Chest pain, shortness of breath, palpitations..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5 px-1">
              <Activity size={13} className="text-[#2793ef]" /> Medical History
            </label>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:border-[#2793ef] focus:bg-white transition-all h-24 resize-none"
              placeholder="e.g. Prior surgeries, chronic conditions, family history..."
            />
          </div>

          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <Info size={16} className="text-blue-500 shrink-0" />
            <p className="text-[12px] text-blue-700 font-medium leading-normal">
              AI models use your <span className="font-bold underline cursor-help" title="Age, Gender, Weight, Conditions">Patient Context Profile</span> for higher accuracy. Ensure it's updated.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-[fadeIn_0.3s_ease]">
            <X size={18} className="text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${loading || !file
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-[#2793ef] text-white shadow-lg shadow-blue-200 hover:bg-[#1a85e2] hover:-translate-y-0.5 active:translate-y-0"
            }`}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing Image...
            </>
          ) : (
            <>
              Analyze Scan <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
