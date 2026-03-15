"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  mobile: "",
};

const mobileRegex = /^[0-9+() -]{8,18}$/;

export default function CitizenLoginPage() {
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

    if (!mobileRegex.test(form.mobile)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/register/citizen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        mobile: form.mobile,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Unable to create account.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
      role: "citizen",
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created, but login failed. Please sign in.");
      setMode("login");
      return;
    }

    router.push("/home/citizen/chat");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
      role: "citizen",
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/home/citizen/chat");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),transparent_55%)]" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-stretch gap-10 px-6 py-16 lg:flex-row lg:items-center lg:py-20">
        <div className="flex-1 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Citizen Portal
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Verify medical AI answers with confidence.
          </h1>
          <p className="max-w-xl text-sm text-slate-200/80 sm:text-base">
            Access trusted, doctor-reviewed insights. Create your citizen account
            to submit questions, review responses, and keep your family informed.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-200/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Secure profile
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Verified answers
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              24/7 access
            </span>
          </div>
        </div>

        <div className="flex w-full max-w-lg flex-col gap-6 rounded-3xl border border-white/10 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {mode === "register" ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "register"
                  ? "Start your citizen journey in minutes."
                  : "Sign in to continue your verification."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode(mode === "register" ? "login" : "register")}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-600"
            >
              {mode === "register" ? "Have an account?" : "New here?"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-600">
            <Link
              href="/login/citizen"
              className="rounded-xl bg-white px-3 py-2 text-center text-cyan-600 shadow-sm"
            >
              Citizen Login
            </Link>
            <Link
              href="/login/doctor"
              className="rounded-xl px-3 py-2 text-center text-slate-500 transition hover:bg-white hover:text-emerald-600"
            >
              Doctor Login
            </Link>
          </div>

          <form
            className="space-y-4"
            onSubmit={mode === "register" ? handleRegister : handleLogin}
          >
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Anita"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Sharma"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Mobile
                </label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                  placeholder="+1 555 222 1010"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                />
              </div>
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
                placeholder="Create a strong password"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
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
              className="w-full rounded-xl bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "register"
                  ? "Create citizen account"
                  : "Sign in"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/home/citizen/chat" })}
              className="w-full rounded-xl border border-slate-200 bg-white py-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 relative flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Your credentials are encrypted and stored securely. By continuing you
            agree to our privacy and data handling policy.
          </div>
        </div>
      </div>
    </div>
  );
}
