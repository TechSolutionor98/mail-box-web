"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const role = localStorage.getItem("auth_role");
    if (token && (role === "SUPER_ADMIN" || role === "ADMIN")) {
      router.push("/admin");
    }
  }, [router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.auth.login(email.trim(), password);
      if (res.success && res.data) {
        const userRole = res.data.user.role;
        if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
          setErrorMsg("Access Denied: Administrative privileges required.");
          setLoading(false);
          return;
        }

        localStorage.setItem("auth_token", res.data.accessToken);
        localStorage.setItem("auth_role", res.data.user.role);
        localStorage.setItem("auth_email", res.data.user.email);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));

        setSuccessMsg("Authorization successful. Launching Admin Console...");
        setTimeout(() => {
          router.push("/admin");
        }, 700);
        return;
      }

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      setErrorMsg("Invalid credentials. Please verify your email and password.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to establish secure session with backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambience & Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-20"></div>
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-indigo-600/25 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-indigo-900/15 blur-[120px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 text-lg">shield_person</span>
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wider uppercase font-mono">
              SUPERADMIN<span className="text-cyan-400">PANEL</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">NODE: superadminpanel.techsolutionor.com</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">
            Root Secure
          </span>
        </div>
      </header>

      {/* Main Login Card - ONLY LOGIN */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl p-7 sm:p-9 space-y-6 relative overflow-hidden">
          {/* Top Decorative Light Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500"></div>

          {/* Heading */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-300 text-[10px] font-mono uppercase tracking-widest border border-indigo-700/50">
              <span className="material-symbols-outlined text-xs text-indigo-400">lock</span>
              <span>Restricted Root Gateway</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Super Admin Sign In
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Enter your administrative master credentials to manage infrastructure, users, and global tenants.
            </p>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 shadow-lg shadow-rose-950/40 animate-in fade-in">
              <span className="material-symbols-outlined text-rose-400 text-sm mt-0.5">error</span>
              <span className="flex-1 font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-400 text-sm animate-spin">progress_activity</span>
              <span className="flex-1 font-medium">{successMsg}</span>
            </div>
          )}

          {/* Pure Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-indigo-400">alternate_email</span>
                <span>Administrator Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@techsolutionor.com"
                  autoComplete="username"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-indigo-400">key</span>
                  <span>Master Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 transition"
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
                  autoComplete="current-password"
                  className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all transform active:scale-[0.99] disabled:opacity-50 mt-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Validating Master Credentials...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Sign In to Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-3 border-t border-slate-800/70 text-center">
            <p className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-slate-500">lock_clock</span>
              <span>Sessions are cryptographically signed & logged</span>
            </p>
          </div>
        </div>
      </main>

      {/* Security Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 py-3 text-center">
        <p className="text-[11px] text-slate-500 font-mono">
          🔒 TechSolutionor Enterprise Security Gateway • Authorized Root Personnel Only
        </p>
      </footer>
    </div>
  );
}
