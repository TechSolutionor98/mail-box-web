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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (authMode === "register") {
        const res = await api.auth.register(email, password);
        if (res.success && res.data) {
          localStorage.setItem("auth_token", res.data.accessToken);
          localStorage.setItem("auth_role", res.data.user.role);
          localStorage.setItem("auth_email", res.data.user.email);
          localStorage.setItem("auth_user", JSON.stringify(res.data.user));

          setSuccessMsg("Account registered successfully! Redirecting to your dashboard...");
          setTimeout(() => {
            router.push(res.data?.redirectUrl || "/dashboard");
          }, 900);
          return;
        } else {
          setErrorMsg(res.error || "Registration failed.");
          return;
        }
      }

      // Login
      const res = await api.auth.login(email, password);
      if (res.success && res.data) {
        localStorage.setItem("auth_token", res.data.accessToken);
        localStorage.setItem("auth_role", res.data.user.role);
        localStorage.setItem("auth_email", res.data.user.email);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));

        setSuccessMsg("Signed in successfully. Launching console...");
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
      {/* Subtle Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute -top-32 left-1/4 w-[600px] h-[300px] bg-indigo-600/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[300px] bg-cyan-600/15 blur-[120px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-xl">dns</span>
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-tight leading-none text-base">
              TechSolutionor<span className="text-cyan-400">Panel</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-wide">HOSTING & EMAIL SUITE</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/webmail"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition"
          >
            <span className="material-symbols-outlined text-emerald-400 text-sm">mark_email_unread</span>
            <span>Webmail Portal</span>
          </Link>
          <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud Online
          </span>
        </div>
      </header>

      {/* Center Main Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Form Column (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                Client Control Console
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {authMode === "register" ? "Create Hosting Account" : "Sign In to Your Panel"}
              </h2>
              <p className="text-xs text-slate-400">
                {authMode === "register"
                  ? "Get started with custom domains, full DNS control, and high-deliverability mailboxes."
                  : "Access your dashboard to manage domains, configure DNS zones, and provision email inboxes."}
              </p>
            </div>

            {/* Mode Toggle (Sign In / Register) */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  authMode === "login"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  authMode === "register"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Create Account</span>
              </button>
            </div>

            {/* Alert Messages */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40">
                <span className="material-symbols-outlined text-emerald-400 text-base animate-spin">progress_activity</span>
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 shadow-lg shadow-rose-950/40">
                <span className="material-symbols-outlined text-rose-400 text-base mt-0.5">error</span>
                <span className="font-medium flex-1">{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Email Address</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@yourcompany.com"
                    className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-slate-400 hover:text-indigo-400 transition"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 transition-all transform active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing Authorization...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      {authMode === "register" ? "person_add" : "login"}
                    </span>
                    <span>{authMode === "register" ? "Create Free Account" : "Access Control Panel"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Help */}
            <div className="pt-2 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span>Looking for Webmail Client?</span>
              <Link
                href="/webmail"
                className="font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition"
              >
                <span>mail.techsolutionor.com</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Right Highlights Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Next-Gen Hosting
                </span>
                <h3 className="text-xl font-extrabold text-white">All-In-One Platform</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enterprise mail infrastructure with automated PowerDNS syncing and high-deliverability email clusters.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    icon: "domain",
                    title: "Domain Management",
                    desc: "Connect your custom domains with instant authoritative DNS zone provisioning.",
                    color: "text-indigo-400 bg-indigo-500/10",
                  },
                  {
                    icon: "mail",
                    title: "Mailbox Provisioning",
                    desc: "Create business email accounts with IMAP (993) & SMTP (465) secure TLS access.",
                    color: "text-emerald-400 bg-emerald-500/10",
                  },
                  {
                    icon: "security",
                    title: "Email Deliverability",
                    desc: "Automated SPF, DKIM, and DMARC record generation for zero-spam placement.",
                    color: "text-cyan-400 bg-cyan-500/10",
                  },
                ].map((feat, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${feat.color}`}>
                      <span className="material-symbols-outlined text-lg">{feat.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-3 text-center">
        <p className="text-[11px] text-slate-500 font-mono">
          © 2026 TechSolutionor Cloud Suite • Secure Multi-Tenant Hosting Platform
        </p>
      </footer>
    </div>
  );
}
