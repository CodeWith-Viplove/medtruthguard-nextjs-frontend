import React, { useState } from "react";
import { User, Sparkles, Heart, Pill, Send, ChevronDown, Menu, X } from "lucide-react";

const VerificationPage = ({ user, onGoToDoctorPanel, onLogout }) => {
  const [patientContext, setPatientContext] = useState({
    age: "30",
    gender: "male",
    pregnancyStatus: "not-pregnant",
    existingConditions: [],
    currentMedications: [],
  });
  const [medicalQuery, setMedicalQuery] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [showConditions, setShowConditions] = useState(false);
  const [showMedications, setShowMedications] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  const healthConditions = [
    "Diabetes Type 1", "Diabetes Type 2", "Hypertension",
    "Heart Disease", "Chronic Kidney Disease", "Asthma",
    "COPD", "Liver Disease", "Thyroid Disorder",
    "Arthritis", "Cancer", "HIV/AIDS",
    "Epilepsy", "Depression", "Anxiety"
  ];

  const medications = [
    "Aspirin", "Ibuprofen", "Metformin",
    "Lisinopril", "Atorvastatin", "Omeprazole",
    "Amlodipine", "Levothyroxine", "Metoprolol",
    "Losartan", "Gabapentin", "Prednisone",
    "Warfarin", "Clopidogrel", "Insulin"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientContext((prevContext) => ({
      ...prevContext,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setPatientContext((prevContext) => ({
      ...prevContext,
      [name]: value,
    }));
  };

  const handleRadioChange = (value) => {
    setPatientContext((prevContext) => ({
      ...prevContext,
      pregnancyStatus: value,
    }));
  };

  const handleConditionToggle = (condition) => {
    setPatientContext((prevContext) => {
      const exists = prevContext.existingConditions.includes(condition);
      return {
        ...prevContext,
        existingConditions: exists
          ? prevContext.existingConditions.filter(c => c !== condition)
          : [...prevContext.existingConditions, condition]
      };
    });
  };

  const handleMedicationToggle = (medication) => {
    setPatientContext((prevContext) => {
      const exists = prevContext.currentMedications.includes(medication);
      return {
        ...prevContext,
        currentMedications: exists
          ? prevContext.currentMedications.filter(m => m !== medication)
          : [...prevContext.currentMedications, medication]
      };
    });
  };

  const handleQueryChange = (e) => {
    setMedicalQuery(e.target.value);
  };

  const handleQuickQuery = (text) => {
    setMedicalQuery(text);
  };

  const handleVerifyResponse = () => {
    const mockResponse = {
      query: medicalQuery,
      patientContext: patientContext,
      verificationResult: {
        status: "Verified Safe",
        safe: true,
        timestamp: "12/13/2025, 3:19:51 PM",
        aiResponse: "For dengue fever: rest, hydration, paracetamol for pain/fever. Avoid aspirin and NSAIDs.",
        justification: "This recommendation aligns with WHO dengue treatment protocol. Paracetamol is safe, and the warning against aspirin/NSAIDs is crucial as they increase bleeding risk.",
        sources: [
          { name: "WHO Dengue Guidelines 2023", url: "https://www.who.int" },
          { name: "CDC Treatment Protocol", url: "https://www.cdc.gov" },
        ],
      },
    };
    setAiResponse(mockResponse);
  };

  const initials = (user?.name || "GA")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900" style={{marginBottom:"0px"}}>MedTruth Guard</h1>
                <p className="text-xs text-slate-500">Medical AI Verification</p>
              </div>
            </div>
            <div className="relative flex items-center gap-3">
              {/* Desktop nav */}
              <div className="hidden items-center gap-3 md:flex">
              <button
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-md transition-all hover:shadow-lg"
                style={{ backgroundColor: "#0084d1", color: "white" }}
              >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verification
                </button>
                {user?.role === "doctor" && (
                  <button
                    type="button"
                    onClick={onGoToDoctorPanel}
                    className="rounded-full border border-sky-100 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-100"
                  >
                    Doctor Panel
                  </button>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700 shadow-sm hover:bg-cyan-200"
                    style={{ background: "#0084d1", color: "white" }}
                  >
                    {initials}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white text-xs shadow-lg">
                      <div className="border-b border-slate-100 px-3 py-2 text-[11px] text-slate-500">
                        <div className="truncate font-medium text-slate-900">
                          {user?.name || "User"}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {user?.email || "user@example.com"}
                        </div>
                      </div>
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onLogout();
                          }}
                          className="block w-full px-3 py-2 text-left text-[11px] font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Logout
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile burger menu */}
              <button
                type="button"
                onClick={() => setNavMenuOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"
              >
                {navMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>

              {navMenuOpen && (
                <div className="absolute right-0 top-11 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-2 text-xs shadow-lg md:hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setNavMenuOpen(false)}
                  >
                    <span>Verification</span>
                  </button>

                  {user?.role === "doctor" && (
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setNavMenuOpen(false);
                        onGoToDoctorPanel && onGoToDoctorPanel();
                      }}
                    >
                      <span>Doctor Panel</span>
                    </button>
                  )}

                  {user && (
                    <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="mb-1 text-[11px] font-semibold text-slate-500">
                        Signed in as
                      </div>
                      <div className="truncate text-[11px] font-medium text-slate-900">
                        {user.name || "User"}
                      </div>
                      <div className="truncate text-[10px] text-slate-400">
                        {user.email || "user@example.com"}
                      </div>
                      {onLogout && (
                        <button
                          type="button"
                          className="mt-2 w-full rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-100"
                          onClick={() => {
                            setNavMenuOpen(false);
                            onLogout();
                          }}
                        >
                          Logout
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="mx-auto max-w-7xl px-6">
          {/* Page header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Medical AI <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent"style={{color:"#0084d1"}}>Verification System</span>
            </h1>
            <p className="mt-2 text-slate-600">
              Verify AI-generated medical responses with patient context and trusted sources
            </p>
          </header>

          {/* Top two-column layout: Patient Context fixed 450px, Medical Query fills remaining space */}
          <div className="grid gap-6 lg:grid-cols-[450px_minmax(0,1fr)]">
            {/* Patient Context card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-lg semi-bold text-slate-900" style={{marginBottom:"0px"}}>Patient Context</p>
                  <p className="text-xs text-slate-500">
                    Provide patient details for personalized verification
                  </p>
                </div>
              </div>

              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Age
                  </label>
                  <input
                    type="text"
                    placeholder="30"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    name="age"
                    value={patientContext.age}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                      value={patientContext.gender}
                      onChange={(e) => handleSelectChange("gender", e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Pregnancy Status
                  </label>
                  <div className={`flex h-10 items-center justify-center rounded-lg border px-3 text-xs transition-all ${
                    patientContext.gender === 'female' 
                      ? 'border-slate-300 bg-white' 
                      : 'border-slate-200 bg-slate-100 cursor-not-allowed'
                  }`}>
                    <label className={`flex cursor-pointer items-center gap-1.5 ${
                      patientContext.gender !== 'female' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}>
                      <input
                        type="checkbox"
                        checked={patientContext.pregnancyStatus === "pregnant"}
                        onChange={() => patientContext.gender === 'female' && handleRadioChange(
                          patientContext.pregnancyStatus === "pregnant" ? "not-pregnant" : "pregnant"
                        )}
                        disabled={patientContext.gender !== 'female'}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-slate-700">Currently Pregnant</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm semi-bold text-slate-900">
                    <Heart className="h-4 w-4 text-slate-600" />
                    <span>Existing Health Conditions</span>
                  </div>
                  <button
                    onClick={() => setShowConditions(!showConditions)}
                    className="text-xs font-semi-bold text-cyan-600 transition-colors hover:text-cyan-700"
                  >
                    {showConditions ? "Hide" : "Add Conditions"}
                  </button>
                </div>
                
                {showConditions && (
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {healthConditions.map((condition) => (
                      <label key={condition} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0"
                          checked={patientContext.existingConditions.includes(condition)}
                          onChange={() => handleConditionToggle(condition)}
                        />
                        <span>{condition}</span>
                      </label>
                    ))}
                  </div>
                )}
                {!showConditions && patientContext.existingConditions.length === 0 && (
                  <p className="text-xs text-slate-400">No conditions selected</p>
                )}
                {!showConditions && patientContext.existingConditions.length > 0 && (
                  <p className="text-xs text-slate-700">{patientContext.existingConditions.join(", ")}</p>
                )}
              </div>

              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm semi-bold text-slate-900">
                    <Pill className="h-4 w-4 text-slate-600" />
                    <span>Current Medications</span>
                  </div>
                  <button
                    onClick={() => setShowMedications(!showMedications)}
                    className="text-xs font-semi-bold text-cyan-600 transition-colors hover:text-cyan-700"
                  >
                    {showMedications ? "Hide" : "Add Medications"}
                  </button>
                </div>
                
                {showMedications && (
                  <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {medications.map((medication) => (
                      <label key={medication} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0"
                          checked={patientContext.currentMedications.includes(medication)}
                          onChange={() => handleMedicationToggle(medication)}
                        />
                        <span>{medication}</span>
                      </label>
                    ))}
                  </div>
                )}
                {!showMedications && patientContext.currentMedications.length === 0 && (
                  <p className="text-xs text-slate-400">No medications selected</p>
                )}
                {!showMedications && patientContext.currentMedications.length > 0 && (
                  <p className="text-xs text-slate-700">{patientContext.currentMedications.join(", ")}</p>
                )}
              </div>

              <button
                className="w-full rounded-xl py-3 text-sm font-semi-bold text-white shadow-md transition-all hover:shadow-lg"
                style={{ backgroundColor: "#0084d1", color:"white" }}
              >
                Save Patient Context
              </button>
            </div>

            {/* Medical Query card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50">
                  <Sparkles className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-lg semi-bold text-slate-900" style={{marginBottom:"0px"}}>Medical Query</p>
                  <p className="text-xs text-slate-500">
                    Enter a medical question to verify AI response
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <textarea
                  rows={6}
                  placeholder="Ask a medical question... (e.g., What medication is safe for fever during pregnancy?)"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  value={medicalQuery}
                  onChange={handleQueryChange}
                />
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  "What can I take for fever during pr...",
                  "Treatment options for dengue fever?",
                  "Can diabetic patient take Metformin...",
                ].map((text) => (
                  <button
                    key={text}
                    onClick={() => handleQuickQuery(text.replace("...", ""))}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-700 transition-all hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleVerifyResponse}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
                  style={{ backgroundColor: "#0084d1", color:"white"}}
                >
                  <Send className="h-4 w-4" />
                  Verify Response
                </button>
              </div>
            </div>
          </div>

          {aiResponse ? (
            // Bottom layout: match top with fixed Patient Context column and flexible Results column
            <div className="mt-6 grid gap-6 lg:grid-cols-[450px_minmax(0,1fr)]">
              {/* Patient Context Active - Bottom Left */}
              <div className="rounded-2xl border border-cyan-200 bg-to-br from-cyan-50 via-white to-cyan-50 p-5 shadow-md" style={{height:"fit-content"}}>
                <div className="mb-2 text-sm font-bold text-cyan-700">Patient Context Active</div>
                <div className="text-sm font-medium text-slate-700">
                  {aiResponse.patientContext.age}yo {aiResponse.patientContext.gender}
                </div>
              </div>

              {/* Verification Results - Right Side */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
                <h2 className="mb-6 text-2xl semi-bold text-slate-900" style={{fontWeight:"300"}}>Verification Results</h2>
                
                <div className="mb-6 flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                        {aiResponse.verificationResult.status}
                      </span>
                      <span className="text-xs text-slate-400">{aiResponse.verificationResult.timestamp}</span>
                    </div>
                    <div className="text-sm font-semibold text-green-700">✓ Safe for this patient</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Query</div>
                  <div className="text-sm text-slate-900">{aiResponse.query}</div>
                </div>

                <div className="mb-5">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">AI Response</div>
                  <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                    {aiResponse.verificationResult.aiResponse}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="mb-3 flex items-start gap-2">
                    <svg className="mt-0.5 h-5 w-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div className="flex-1">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Verification Justification</div>
                      <div className="text-sm leading-relaxed text-slate-800">
                        {aiResponse.verificationResult.justification}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex gap-3">
                  {aiResponse.verificationResult.sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      {source.name}
                    </a>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div className="flex-1">
                      <div className="mb-1 text-xs font-bold text-slate-900">Patient Context Applied</div>
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">Age: {aiResponse.patientContext.age}</span> • <span className="font-semibold">{aiResponse.patientContext.gender === "male" ? "Male" : "Female"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-md">
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Sparkles className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-900">
                  No verifications yet
                </p>
                <p className="text-sm text-slate-500">
                  Enter a medical query above to verify AI responses with patient context
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerificationPage;
