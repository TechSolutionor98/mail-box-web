"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@techsolutionor.com");
  const [password, setPassword] = useState("Admin@123456");
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
      const res = await api.auth.login(email, password);
      if (res.success && res.data) {
        const userRole = res.data.user.role;
        if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
          setErrorMsg("Access Denied: This portal requires Super Admin or Admin authorization.");
          setLoading(false);
          return;
        }

        localStorage.setItem("auth_token", res.data.accessToken);
        localStorage.setItem("auth_role", res.data.user.role);
        localStorage.setItem("auth_email", res.data.user.email);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));

        setSuccessMsg("Master Authentication Successful. Launching Root Console...");
        setTimeout(() => {
          router.push("/admin");
        }, 800);
        return;
      }

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to establish secure session with backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Glows & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none"></div>

      {/* Top Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-400 text-lg">admin_panel_settings</span>
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wide">
              SUPERADMIN<span className="text-cyan-400">PANEL</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">NODE: superadminpanel.techsolutionor.com</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-mono font-bold text-emerald-400 tracking-wider">SYSTEM SECURE</span>
        </div>
      </header>

      {/* Center Console Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-8 space-y-7 relative">
          {/* Top Badge */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-xs text-indigo-400">shield</span>
              <span>Root Security Gateway</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">v2.4.0 • TLS 1.3</span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Super Admin Login</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authenticate with administrative credentials to access global tenant directory, telemetry, and system controls.
            </p>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 shadow-lg shadow-rose-950/40">
              <span className="material-symbols-outlined text-rose-400 text-sm mt-0.5">error</span>
              <span className="flex-1 font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/70 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40">
              <span className="material-symbols-outlined text-emerald-400 text-sm animate-spin">progress_activity</span>
              <span className="flex-1 font-medium">{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-indigo-400">alternate_email</span>
                <span>Administrator Identity</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@techsolutionor.com"
                className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-indigo-400">key</span>
                  <span>Master Access Key</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Validating Master Key...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Authenticate Root Session</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Chips */}
          <div className="pt-2 border-t border-slate-800/70 space-y-2.5">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Quick Administrative Profiles:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("superadmin@techsolutionor.com");
                  setPassword("Admin@123456");
                  setErrorMsg("");
                }}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 text-left transition text-[11px] font-mono group"
              >
                <div className="text-white font-bold group-hover:text-indigo-400">Super Admin</div>
                <div className="text-[9px] text-slate-400 truncate">superadmin@techsolutionor.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("admin@techsolutionor.com");
                  setPassword("Admin@123456");
                  setErrorMsg("");
                }}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 text-left transition text-[11px] font-mono group"
              >
                <div className="text-white font-bold group-hover:text-cyan-400">Operations Admin</div>
                <div className="text-[9px] text-slate-400 truncate">admin@techsolutionor.com</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Security Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-3 text-center">
        <p className="text-[11px] text-slate-500 font-mono">
          🔒 Restricted Administrative System. Unauthorized connection attempts are logged to immutable audit trail.
        </p>
      </footer>
    </div>
  );
}
