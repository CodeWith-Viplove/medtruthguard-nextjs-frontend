"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const specializationOptions = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Neurology",
  "Psychiatry",
  "Other",
];

const experienceOptions = [
  "0-1 years",
  "2-5 years",
  "6-10 years",
  "11-15 years",
  "16+ years",
];

const licenseRegex = /^[A-Z]{3,4}\/\d{4}\/\d{4,6}$/;
const mobileRegex = /^[0-9+() -]{8,18}$/;

const initialState = {
  name: "",
  licenseNumber: "",
  mobile: "",
  email: "",
  specialization: "",
  specializationOther: "",
  experience: "",
  password: "",
};

export default function DoctorLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (form.licenseNumber && !licenseRegex.test(form.licenseNumber)) {
      setError("License number must match format: e.g. MHMC/2018/123456");
      return;
    }

    if (!mobileRegex.test(form.mobile)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (form.specialization === "Other" && !form.specializationOther.trim()) {
      setError("Please enter your specialization.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/register/doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Unable to create doctor account.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
      role: "doctor",
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created, but login failed. Please sign in.");
      setMode("login");
      return;
    }

    router.push("/home/doctor/dashboard");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
      role: "doctor",
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/home/doctor/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.2),transparent_55%)]" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-stretch gap-10 px-6 py-16 lg:flex-row lg:items-center lg:py-20">
        <div className="flex-1 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
            Doctor Access
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Share your expertise with verified medical answers.
          </h1>
          <p className="max-w-xl text-sm text-slate-200/80 sm:text-base">
            Join MedTruth Guard as a medical professional. Review AI responses,
            guide citizens, and build credibility in a trusted community.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-200/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Credentialed access
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Clinical impact
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Secure workflow
            </span>
          </div>
        </div>

        <div className="flex w-full max-w-lg flex-col gap-6 rounded-3xl border border-white/10 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {mode === "register" ? "Doctor Registration" : "Doctor Sign In"}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "register"
                  ? "Provide your professional details."
                  : "Continue to your dashboard."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode(mode === "register" ? "login" : "register")}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
            >
              {mode === "register" ? "Have an account?" : "New here?"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-600">
            <Link
              href="/login/citizen"
              className="rounded-xl px-3 py-2 text-center text-slate-500 transition hover:bg-white hover:text-cyan-600"
            >
              Citizen Login
            </Link>
            <Link
              href="/login/doctor"
              className="rounded-xl bg-white px-3 py-2 text-center text-emerald-600 shadow-sm"
            >
              Doctor Login
            </Link>
          </div>

          <form
            className="space-y-4"
            onSubmit={mode === "register" ? handleRegister : handleLogin}
          >
            {mode === "register" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Full Name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Dr. Rohan Mehta"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      License Number
                    </label>
                    <input
                      name="licenseNumber"
                      value={form.licenseNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g. MHMC/2018/123456"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    />
                    <p className="mt-2 text-[11px] text-slate-400">
                      Format: STATE/YEAR/NUMBER (e.g. MHMC/2018/123456)
                    </p>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="doctor@hospital.com"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {mode === "register" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Mobile
                    </label>
                    <input
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      required
                      placeholder="+1 555 909 7788"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Experience
                    </label>
                    <select
                      name="experience"
                      value={form.experience}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value="" disabled>
                        Select experience
                      </option>
                      {experienceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">
                      Specialization
                    </label>
                    <select
                      name="specialization"
                      value={form.specialization}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value="" disabled>
                        Select specialization
                      </option>
                      {specializationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.specialization === "Other" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600">
                        Your Specialization
                      </label>
                      <input
                        name="specializationOther"
                        value={form.specializationOther}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Endocrinology"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Secure password"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "register"
                  ? "Submit doctor profile"
                  : "Sign in"}
            </Button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Your account will be marked as pending until verified by our team.
            You can still review your dashboard access after approval.
          </div>
        </div>
      </div>
    </div>
  );
}
