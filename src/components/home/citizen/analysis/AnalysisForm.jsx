"use client";
import React, { useState } from "react";
import {
  X,
  Activity,
  Image as ImageIcon,
  ShieldCheck,
  UploadCloud,
  Loader2,
  Info,
  Stethoscope,
  ArrowRight,
  Scan,
  AlertTriangle,
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

    if (analysisType === "xray") formData.append("xray_type", xrayType);
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
    <>
      {/* Full Preview Modal */}
      {showFullPreview && (
        <div
          className="fixed inset-0 z-[2000] bg-[#0f172a]/70 backdrop-blur-[6px] flex items-center justify-center p-[20px] animate-[fadeIn_0.2s_ease]"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[70%] max-h-[88vh] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-[cqModalIn_0.25s_cubic-bezier(0.4,0,0.2,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between py-[16px] px-[22px] border-b border-[#e8ecf4] bg-gradient-to-br from-[#f8faff] to-[#f0f4ff]">
              <div className="flex items-center gap-[10px]">
                <div className="w-[38px] h-[38px] bg-[#eff6ff] border border-[#bfdbfe] rounded-[10px] flex items-center justify-center text-[#2793ef]">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">Image Inspection</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Clinical Pattern Analysis</div>
                </div>
              </div>
              <button
                onClick={() => setShowFullPreview(false)}
                className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[10px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer text-[#64748b] transition-all hover:text-[#ef4444] hover:border-[#ef4444] hover:bg-[#fef2f2]"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-[#0f172a] flex items-center justify-center p-[16px]">
              <img src={preview} alt="Full Assessment View" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
            </div>
            <div className="py-[14px] px-[22px] bg-[#f8faff] border-t border-[#e8ecf4] flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <span className="text-[12px] font-semibold text-[#475569]">{file?.name}</span>
                <span className="text-[11px] text-[#94a3b8]">{(file?.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex items-center gap-[5px] text-[10px] font-bold text-[#2793ef] uppercase tracking-widest bg-[#eff6ff] px-[10px] py-[4px] rounded-full border border-[#bfdbfe]">
                <ShieldCheck size={11} /> Quality Verified
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#e8ecf4] rounded-[16px] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row">

        {/* ── Left: Upload & Config ── */}
        <div className="md:w-[42%] p-[24px] border-b md:border-b-0 md:border-r border-[#f1f5f9] bg-[#f8faff] flex flex-col gap-[20px]">
          <div>
            <div className="text-[13px] font-bold text-[#0f172a]">Configuration</div>
            <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-widest mt-[2px]">Select analysis type</div>
          </div>

          {/* Type Toggle */}
          <div className="flex p-[4px] bg-white border border-[#e2e8f0] rounded-[12px] gap-[4px]">
            <button
              type="button"
              onClick={() => setAnalysisType("ecg")}
              className={`flex-1 py-[10px] px-[14px] rounded-[9px] text-[13px] font-bold flex items-center justify-center gap-[6px] transition-all ${analysisType === "ecg"
                ? "bg-[#2793ef] text-white shadow-[0_2px_8px_rgba(39,147,239,0.3)]"
                : "text-[#64748b] hover:bg-[#f1f5f9]"}`}
            >
              <Activity size={16} /> ECG
            </button>
            <button
              type="button"
              onClick={() => setAnalysisType("xray")}
              className={`flex-1 py-[10px] px-[14px] rounded-[9px] text-[13px] font-bold flex items-center justify-center gap-[6px] transition-all ${analysisType === "xray"
                ? "bg-[#2793ef] text-white shadow-[0_2px_8px_rgba(39,147,239,0.3)]"
                : "text-[#64748b] hover:bg-[#f1f5f9]"}`}
            >
              <Scan size={16} /> X-ray
            </button>
          </div>

          {/* X-ray sub-type */}
          {analysisType === "xray" && (
            <div className="flex flex-wrap gap-[8px] animate-[fadeIn_0.3s_ease]">
              {["chest", "abdomen", "bone"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setXrayType(type)}
                  className={`px-[14px] py-[7px] rounded-[10px] text-[12px] font-bold uppercase tracking-wider border transition-all ${xrayType === type
                    ? "bg-white border-[#2793ef] text-[#2793ef] shadow-[0_0_0_3px_rgba(39,147,239,0.08)]"
                    : "bg-white border-[#e2e8f0] text-[#94a3b8] hover:border-[#2793ef] hover:text-[#2793ef]"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* File Upload */}
          <div className="flex-1 flex flex-col gap-[8px]">
            <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Image File</div>
            {!preview ? (
              <div className="relative group flex-1 min-h-[180px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                />
                <div className="h-full border-2 border-dashed border-[#e2e8f0] rounded-[14px] bg-white flex flex-col items-center justify-center gap-[10px] transition-all group-hover:border-[#2793ef] group-hover:bg-[#eff6ff]/30 min-h-[180px]">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8] group-hover:text-[#2793ef] group-hover:bg-[#eff6ff] transition-all">
                    <UploadCloud size={26} />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-bold text-[#475569]">Drop file here or click to browse</p>
                    <p className="text-[11px] text-[#94a3b8] mt-[2px]">PNG, JPEG, DICOM supported</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-[14px] overflow-hidden border border-[#e2e8f0] flex-1 min-h-[180px] group bg-[#0f172a]">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain cursor-pointer transition-opacity group-hover:opacity-80 min-h-[180px]"
                  onClick={() => setShowFullPreview(true)}
                />
                <div className="absolute top-[10px] right-[10px]">
                  <button
                    type="button"
                    onClick={removeFile}
                    className="w-[32px] h-[32px] rounded-full bg-[#ef4444] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="absolute bottom-[10px] left-[10px] right-[10px]">
                  <div className="bg-[#0f172a]/70 backdrop-blur-sm rounded-[8px] py-[5px] px-[10px] text-[10px] font-medium text-white text-center">
                    Click to inspect full size
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Context & Submit ── */}
        <div className="md:w-[58%] p-[24px] flex flex-col gap-[18px]">
          <div>
            <div className="text-[13px] font-bold text-[#0f172a]">Clinical Context</div>
            <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-widest mt-[2px]">Additional details improve AI accuracy</div>
          </div>

          <div className="flex flex-col gap-[14px] flex-1">
            {/* Symptoms */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-[5px]">
                <Stethoscope size={12} className="text-[#2793ef]" /> Current Symptoms
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full bg-[#f8faff] border border-[#e2e8f0] rounded-[12px] py-[12px] px-[14px] text-[13px] text-[#1e293b] outline-none transition-all focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.08)] focus:bg-white h-[90px] resize-none placeholder:text-[#94a3b8]"
                placeholder="e.g. Chest pain, shortness of breath, palpitations…"
              />
            </div>

            {/* History */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-[5px]">
                <Activity size={12} className="text-[#2793ef]" /> Medical History
              </label>
              <textarea
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                className="w-full bg-[#f8faff] border border-[#e2e8f0] rounded-[12px] py-[12px] px-[14px] text-[13px] text-[#1e293b] outline-none transition-all focus:border-[#2793ef] focus:shadow-[0_0_0_3px_rgba(39,147,239,0.08)] focus:bg-white h-[90px] resize-none placeholder:text-[#94a3b8]"
                placeholder="e.g. Prior surgeries, chronic conditions, family history…"
              />
            </div>

            {/* Info Notice */}
            <div className="flex items-center gap-[10px] bg-[#eff6ff] border border-[#bfdbfe] py-[10px] px-[14px] rounded-[12px]">
              <Info size={14} className="text-[#2793ef] shrink-0" />
              <p className="text-[12px] text-[#1d4ed8] font-medium leading-[1.5]">
                AI models use your <span className="font-bold underline cursor-help" title="Age, Gender, Conditions, Medications">Patient Context Profile</span> for higher accuracy. Tap "Patient Profile" to update it.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-[10px] bg-[#fef2f2] border border-[#fca5a5] py-[10px] px-[14px] rounded-[12px] animate-[fadeIn_0.3s_ease]">
              <AlertTriangle size={15} className="text-[#ef4444] shrink-0" />
              <p className="text-[12px] font-semibold text-[#dc2626]">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !file}
            className={`w-full py-[13px] rounded-[12px] text-[14px] font-bold flex items-center justify-center gap-[8px] transition-all duration-200 ${loading || !file
              ? "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed"
              : "bg-[#2793ef] text-white shadow-[0_4px_14px_rgba(39,147,239,0.35)] hover:bg-[#1a85e2] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(39,147,239,0.45)] active:translate-y-0"}`}
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin" /> Processing Image…</>
            ) : (
              <>Analyze Scan <ArrowRight size={17} /></>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
