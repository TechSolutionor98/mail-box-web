"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const role = localStorage.getItem("auth_role");
    if (token && role) {
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        router.push("/admin");
      } else if (role === "MAILBOX_USER") {
        router.push("/webmail");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

  // Dynamic Password Strength Calculation (for registration mode)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: "Weak", color: "bg-rose-500" };
    if (score <= 2) return { score: 50, label: "Fair", color: "bg-amber-500" };
    if (score <= 3) return { score: 75, label: "Good", color: "bg-blue-500" };
    return { score: 100, label: "Strong", color: "bg-emerald-400" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (authMode === "register") {
        if (password.length < 6) {
          setErrorMsg("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }

        const res = await api.auth.register(email.trim(), password);
        if (res.success && res.data) {
          localStorage.setItem("auth_token", res.data.accessToken);
          localStorage.setItem("auth_role", res.data.user.role);
          localStorage.setItem("auth_email", res.data.user.email);
          localStorage.setItem("auth_user", JSON.stringify(res.data.user));

          setSuccessMsg("Account successfully provisioned! Launching your control panel...");
          setTimeout(() => {
            router.push(res.data?.redirectUrl || "/dashboard");
          }, 800);
          return;
        } else {
          setErrorMsg(res.error || "Registration failed. This email may already be in use.");
          return;
        }
      }

      // Login Mode
      const res = await api.auth.login(email.trim(), password);
      if (res.success && res.data) {
        localStorage.setItem("auth_token", res.data.accessToken);
        localStorage.setItem("auth_role", res.data.user.role);
        localStorage.setItem("auth_email", res.data.user.email);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));

        setSuccessMsg("Authentication verified. Redirecting to your dashboard...");
        setTimeout(() => {
          router.push(res.data?.redirectUrl || "/dashboard");
        }, 600);
        return;
      }

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      setErrorMsg("Invalid credentials. Please verify your email and password.");
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambience & Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none"></div>
      <div className="absolute -top-40 left-1/4 w-[650px] h-[350px] bg-gradient-to-br from-indigo-600/20 via-blue-600/10 to-transparent blur-[130px] pointer-events-none"></div>
      <div className="absolute -bottom-40 right-1/4 w-[600px] h-[350px] bg-gradient-to-tl from-cyan-500/15 via-indigo-600/10 to-transparent blur-[130px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-2xl">dns</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-white tracking-tight leading-none text-lg">
                TechSolutionor<span className="text-cyan-400">Panel</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">
              CLOUD HOSTING & EMAIL INFRASTRUCTURE
            </p>
          </div>
        </Link>

        {/* Right Status & Webmail Link */}
        <div className="flex items-center gap-4">
          <Link
            href="/webmail"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-300 hover:text-white transition shadow-sm group"
          >
            <span className="material-symbols-outlined text-emerald-400 text-sm group-hover:scale-110 transition-transform">
              mark_email_unread
            </span>
            <span>Webmail Portal</span>
            <span className="material-symbols-outlined text-slate-500 text-xs">arrow_forward</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All Systems Normal</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 py-8 sm:py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero & Visual Mockup Showcase (5 cols on Desktop) */}
          <div className="lg:col-span-5 space-y-6 hidden lg:block">
            {/* Tagline */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-500/30">
                <span className="material-symbols-outlined text-xs text-cyan-400">speed</span>
                Next-Gen Cloud Panel
              </span>
              <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                Control your domains, DNS, and business emails in one place.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Connect your domains in seconds, automate SPF & DKIM records for zero-spam delivery, and provision enterprise mailboxes with high-speed IMAP/SMTP.
              </p>
            </div>

            {/* Interactive Domain & Node Preview Card */}
            <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/40 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4 relative overflow-hidden group hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-mono text-xs font-bold text-white tracking-wide">
                    connected-domain.com
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DNS Active
                </span>
              </div>

              {/* Live Metric Row */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">MX Cluster Node</div>
                  <div className="text-xs font-bold text-indigo-400 mt-1 truncate">mail.techsolutionor.com</div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase">Mailbox Inboxes</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1">12 of 25 Active</div>
                </div>
              </div>

              {/* Security Pill */}
              <div className="flex items-center justify-between text-[11px] bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-800/60 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-indigo-400">verified_user</span>
                  <span>SPF • DKIM • DMARC: Synchronized</span>
                </div>
                <span className="text-cyan-400 font-mono text-[10px]">100% Valid</span>
              </div>
            </div>

            {/* Micro Feature Highlights */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <p className="text-lg font-black text-white">99.99%</p>
                <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">Uptime SLA</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <p className="text-lg font-black text-cyan-400">&lt; 30ms</p>
                <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">DNS Latency</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/60">
                <p className="text-lg font-black text-emerald-400">TLS 1.3</p>
                <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">End-To-End</p>
              </div>
            </div>
          </div>

          {/* Right Form Card (7 cols on Desktop) */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl space-y-6 relative overflow-hidden">
              {/* Subtle Card Glow Header */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                    TPanel Cloud Console
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">tpanel.techsolutionor.com</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {authMode === "register" ? "Create Hosting Account" : "Sign In to Your Dashboard"}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {authMode === "register"
                    ? "Set up your credentials to register domains, manage DNS zones, and provision mailboxes."
                    : "Enter your registered email and password to access your domains and mail management suite."}
                </p>
              </div>

              {/* Modern Segmented Tab Switcher */}
              <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    authMode === "login"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">login</span>
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    authMode === "register"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span>Create Account</span>
                </button>
              </div>

              {/* Alerts */}
              {successMsg && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 animate-in fade-in">
                  <span className="material-symbols-outlined text-emerald-400 text-base animate-spin">
                    progress_activity
                  </span>
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 shadow-lg shadow-rose-950/40 animate-in fade-in">
                  <span className="material-symbols-outlined text-rose-400 text-base mt-0.5">error</span>
                  <span className="font-medium flex-1">{errorMsg}</span>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-indigo-400">alternate_email</span>
                    <span>Account Email Address</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@yourdomain.com"
                      autoComplete="email"
                      className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-indigo-400">lock</span>
                      <span>Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-slate-400 hover:text-indigo-400 transition"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete={authMode === "register" ? "new-password" : "current-password"}
                      className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-mono"
                    />
                  </div>

                  {/* Password Strength Meter (Only on Registration) */}
                  {authMode === "register" && password && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">Password Strength:</span>
                        <span className={`font-bold ${
                          strength.label === "Strong" ? "text-emerald-400" :
                          strength.label === "Good" ? "text-blue-400" :
                          strength.label === "Fair" ? "text-amber-400" : "text-rose-400"
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                          style={{ width: `${strength.score}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remember Me Option (Login Mode) */}
                {authMode === "login" && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>
                )}

                {/* Registration Checklist */}
                {authMode === "register" && (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <span className="material-symbols-outlined text-xs text-indigo-400">check_circle</span>
                      <span>Account includes:</span>
                    </div>
                    <p className="pl-4">• 5 Custom Domain slots with PowerDNS zone automation</p>
                    <p className="pl-4">• 25 Business Mailboxes with IMAP/SMTP access</p>
                    <p className="pl-4">• Free TLS/SSL auto-provisioning</p>
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all transform active:scale-[0.99] disabled:opacity-50 mt-3"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>
                        {authMode === "register" ? "Creating Account..." : "Signing in..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        {authMode === "register" ? "person_add" : "login"}
                      </span>
                      <span>
                        {authMode === "register" ? "Register Hosting Account" : "Sign In to Control Panel"}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Webmail Redirect Card */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-400">mail</span>
                  <span>Looking to access your email mailbox?</span>
                </span>
                <Link
                  href="/webmail"
                  className="font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition group"
                >
                  <span>mail.techsolutionor.com</span>
                  <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 py-3 text-center">
        <p className="text-[11px] text-slate-500 font-mono">
          © 2026 TechSolutionor Cloud Suite • High-Performance Cloud Hosting & Webmail Infrastructure
        </p>
      </footer>
    </div>
  );
}
