import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  MessageCircleMore,
  Users,
  Activity,
  Menu,
  X,
} from "lucide-react";

const DoctorPanelPage = ({ user, onGoToVerification, onLogout }) => {
  const [metrics, setMetrics] = useState({
    totalVerifications: 4,
    verifiedSafe: 1,
    flaggedUnsafe: 1,
    doctorFeedback: 3,
  });

  const [activeTab, setActiveTab] = useState("pending");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: "caution",
    notes: "",
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  const initials = (user?.name || "GA")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setReviewOpen(false);
    setMetrics((prev) => ({
      ...prev,
      doctorFeedback: prev.doctorFeedback + 1,
    }));
  };

  const handleRatingChange = (rating) => {
    setFeedbackForm((prev) => ({ ...prev, rating }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation matching verification navbar styling */}
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900" style={{ marginBottom: "0px" }}>
                MedTruth Guard
              </h1>
              <p className="text-xs text-slate-500">Medical AI Verification</p>
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            {/* Desktop nav */}
            <div className="hidden items-center gap-3 md:flex">
              <button
                type="button"
                onClick={onGoToVerification}
                className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-100"
              >
                Verification
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-semibold text-white shadow-md transition"
                style={{ backgroundColor: "#0084d1", color:"white" }}
              >
                Doctor Panel
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
                  style={{ backgroundColor: "#0084d1", color:"white"}}
                >
                  {initials}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white text-xs shadow-lg">
                    <div className="border-b border-slate-100 px-3 py-2 text-[11px] text-slate-500">
                      <div className="truncate font-medium text-slate-900">
                        {user?.name || "Doctor"}
                      </div>
                      <div className="truncate text-[10px] text-slate-400">
                        {user?.email || "doctor@example.com"}
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
                  onClick={() => {
                    setNavMenuOpen(false);
                    onGoToVerification && onGoToVerification();
                  }}
                >
                  <span>Verification</span>
                </button>

                <button
                  type="button"
                  className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setNavMenuOpen(false)}
                >
                  <span>Doctor Panel</span>
                </button>

                {user && (
                  <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="mb-1 text-[11px] font-semibold text-slate-500">
                      Signed in as
                    </div>
                    <div className="truncate text-[11px] font-medium text-slate-900">
                      {user.name || "Doctor"}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">
                      {user.email || "doctor@example.com"}
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
      </nav>

      <main className="py-8">
        <div className="mx-auto max-w-7xl px-6">
          {/* Page header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Doctor <span className="text-sky-600">Admin Panel</span>
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review and provide feedback on AI verification results.
            </p>
          </header>

          {/* Metric cards */}
          <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>Total Verifications</span>
                <Activity className="h-4 w-4 text-sky-500" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold text-slate-900">
                  {metrics.totalVerifications}
                </span>
                <span className="text-[11px] text-slate-400">
                  Today
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>Verified Safe</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold text-emerald-600">
                  {metrics.verifiedSafe}
                </span>
                <span className="text-[11px] text-emerald-500">Safe</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>Flagged Unsafe</span>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold text-rose-500">
                  {metrics.flaggedUnsafe}
                </span>
                <span className="text-[11px] text-rose-500">Needs review</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                <span>Doctor Feedback</span>
                <MessageCircleMore className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold text-amber-600">
                  {metrics.doctorFeedback}
                </span>
                <span className="text-[11px] text-amber-500">Submissions</span>
              </div>
            </div>
          </section>

          {/* Main grid: left = queue, right = reviewers + impact */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)]">
            {/* Review queue */}
            <div>
              {/* Tabs */}
              <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-medium text-slate-600">
                {[
                  { id: "pending", label: "Pending Review" },
                  { id: "reviewed", label: "Reviewed" },
                  { id: "all", label: "All Verifications" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-4 py-1.5 transition ${
                      activeTab === tab.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Single verification card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Caution
                    </span>
                    <span className="text-slate-400">1/15/2024</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewOpen(true);
                      setFeedbackSubmitted(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    <MessageCircleMore className="h-3.5 w-3.5" />
                    Review
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Query
                    </div>
                    <p className="text-slate-900">
                      Is papaya leaf juice effective for dengue?
                    </p>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      AI Response
                    </div>
                    <p className="text-slate-800">
                      Papaya leaf juice can help increase platelet count in
                      dengue patients.
                    </p>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      System Justification
                    </div>
                    <p className="text-slate-700">
                      While some studies show papaya leaf extract may help with
                      platelet recovery, WHO does not include it in official
                      treatment protocols. Evidence is limited.
                    </p>
                  </div>

                  {feedbackSubmitted && (
                    <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      Thank you. Your feedback has been recorded for this
                      verification.
                    </div>
                  )}
                </div>

                {/* Inline feedback panel (mock) */}
                {reviewOpen && (
                  <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                    <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          Your Rating
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleRatingChange("safe")}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              feedbackForm.rating === "safe"
                                ? "bg-emerald-500 text-white shadow"
                                : "bg-white text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            Safe / Appropriate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRatingChange("caution")}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              feedbackForm.rating === "caution"
                                ? "bg-amber-500 text-white shadow"
                                : "bg-white text-amber-700 hover:bg-amber-50"
                            }`}
                          >
                            Needs Caution
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRatingChange("unsafe")}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                              feedbackForm.rating === "unsafe"
                                ? "bg-red-400 text-white shadow"
                                : "bg-white text-white-700 hover:bg-rose-50"
                            }`}
                          >
                            Unsafe / Misleading
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          Brief justification
                        </label>
                        <textarea
                          rows={3}
                          value={feedbackForm.notes}
                          onChange={(e) =>
                            setFeedbackForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Explain why this response is safe, needs caution, or unsafe for most patients."
                          className="w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm outline-none ring-0 transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setReviewOpen(false)}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-md transition"
                          style={{ backgroundColor: "#0084d1", color:"white" }}
                        >
                          Submit Feedback
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              {/* Active reviewers */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">
                      Active Reviewers
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Medical professionals contributing feedback
                    </div>
                  </div>
                  <Users className="h-4 w-4 text-sky-500" />
                </div>

                <div className="space-y-3 text-xs">
                  {[{
                    initials: "SC",
                    name: "Dr. Sarah Chen",
                    specialty: "Internal Medicine",
                    reviews: 45,
                  },
                  {
                    initials: "MT",
                    name: "Dr. Michael Torres",
                    specialty: "Cardiology",
                    reviews: 32,
                  },
                  {
                    initials: "EW",
                    name: "Dr. Emily Watson",
                    specialty: "Obstetrics",
                    reviews: 28,
                  },
                  {
                    initials: "JL",
                    name: "Dr. James Liu",
                    specialty: "Pharmacology",
                    reviews: 51,
                  }].map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                          {doc.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {doc.specialty}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {doc.reviews} reviews
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback impact */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 text-xs">
                  <div className="font-semibold text-slate-900">
                    Feedback Impact
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Your feedback helps improve AI accuracy and patient safety.
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="text-slate-700">Correct ratings</span>
                    <span className="font-semibold text-emerald-600">2</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                    <span className="text-slate-700">Partial ratings</span>
                    <span className="font-semibold text-amber-600">1</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2">
                    <span className="text-slate-700">Wrong ratings</span>
                    <span className="font-semibold text-rose-600">0</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DoctorPanelPage;
