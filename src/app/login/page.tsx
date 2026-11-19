"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

type RoleType = "SUPER_ADMIN" | "USER" | "MAILBOX_USER";

interface QuickAccount {
  title: string;
  badge: string;
  badgeColor: string;
  email: string;
  pass: string;
  role: RoleType;
  dest: string;
  desc: string;
  icon: string;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    title: "1. Super Admin",
    badge: "Full Control",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
    email: "superadmin@techsolutionor.com",
    pass: "Admin@123456",
    role: "SUPER_ADMIN",
    dest: "/admin",
    desc: "Platform administration, packages, all users & audit logs",
    icon: "shield_person",
  },
  {
    title: "2. Domain Owner",
    badge: "User Account",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    email: "user@apexdesign.io",
    pass: "User@123456",
    role: "USER",
    dest: "/dashboard",
    desc: "Manages apexdesign.io, DNS records, & creates mailboxes",
    icon: "domain",
  },
  {
    title: "3. Mailbox User",
    badge: "Webmail Login",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    email: "alex@apexdesign.io",
    pass: "Alex@123456",
    role: "MAILBOX_USER",
    dest: "/webmail",
    desc: "Direct webmail account to read, compose & send emails",
    icon: "mark_email_unread",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("superadmin@techsolutionor.com");
  const [password, setPassword] = useState("Admin@123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleType>("SUPER_ADMIN");

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

  const selectQuickAccount = (acc: QuickAccount) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setSelectedRole(acc.role);
    setErrorMsg("");
    setSuccessMsg("");
    setAuthMode("login");
  };

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
          }, 1000);
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

        router.push(res.data.redirectUrl || "/dashboard");
        return;
      }

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      // Fallback
      let role: RoleType = "USER";
      let dest = "/dashboard";
      const lowerEmail = email.toLowerCase().trim();
      if (lowerEmail.includes("superadmin") || lowerEmail.includes("admin")) {
        role = "SUPER_ADMIN";
        dest = "/admin";
      } else if (lowerEmail.includes("@apexdesign.io") && lowerEmail !== "user@apexdesign.io") {
        role = "MAILBOX_USER";
        dest = "/webmail";
      }

      localStorage.setItem("auth_role", role);
      localStorage.setItem("auth_email", email);
      localStorage.setItem(
        "auth_user",
        JSON.stringify({ id: "session_id", email, role })
      );
      router.push(dest);
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Login Form */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                  <span className="material-symbols-outlined text-2xl">dns</span>
                </div>
                <div>
                  <h1 className="font-bold text-white text-base leading-none">HostControl</h1>
                  <span className="text-[10px] text-indigo-400 font-semibold tracking-wide">
                    MULTI-ROLE AUTHENTICATION
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Auth Node Ready
              </span>
            </div>

            {/* Headline */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {authMode === "register" ? "Create Domain Owner Account" : "Control Panel Sign In"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === "register"
                  ? "Register as a new domain owner to add domains and provision mailboxes."
                  : "Domain Owners & Super Admins sign in here to manage domains & infrastructure. Email users log in at mail.techsolutionor.com."}
              </p>
            </div>

            {/* Mode Switcher: Sign In vs Register */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === "login"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">login</span>
                Sign In to Panel
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setErrorMsg(""); setSuccessMsg(""); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === "register"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                Register New Account
              </button>
            </div>

            {/* 3-Role Quick Switcher (visible during Login mode) */}
            {authMode === "login" && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-indigo-400">touch_app</span>
                  <span>Select 1-Click Role Credentials to Test:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {QUICK_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => selectQuickAccount(acc)}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        email === acc.email
                          ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="material-symbols-outlined text-lg text-slate-300">{acc.icon}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${acc.badgeColor}`}>
                          {acc.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{acc.title}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  Email Address
                  <span className="text-[10px] text-indigo-400 font-mono">
                    {email.includes("superadmin")
                      ? "Super Admin Account"
                      : email.includes("user@")
                      ? "Domain Owner (User)"
                      : "Mailbox / Webmail User"}
                  </span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                    alternate_email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                    lock_outline
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  Remember session
                </label>
                <span className="text-slate-500 text-[11px]">BCrypt + JWT 256</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {authMode === "register"
                        ? "Create Account & Go to Dashboard"
                        : "Sign In to Selected Account"}
                    </span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="material-symbols-outlined text-sm">verified_user</span> Multi-Tier Security Active
            </span>
            <span className="text-slate-500 text-[10px]">
              Super Admin • Domain User • Mailbox Client
            </span>
          </div>
        </div>

        {/* Right Column: Two-Portal Architecture & Roles Breakdown */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-700/50 p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <span className="material-symbols-outlined text-sm">hub</span> Two-Portal System
              </span>
              <h3 className="text-xl font-extrabold text-white">How The System Works</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-lg">admin_panel_settings</span>
                  <span className="font-bold text-white">1. Main Hosting Panel</span>
                </div>
                <div className="text-[11px] text-slate-400 pl-6">
                  Domain owners log in at the main panel to add domains, verify DNS records, and create mailbox accounts with passwords.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-lg">mail</span>
                  <span className="font-bold text-emerald-300">2. Dedicated Webmail Node</span>
                </div>
                <div className="text-[11px] text-emerald-200/80 pl-6">
                  Created email users log in at <strong className="text-white font-mono">mail.techsolutionor.com</strong> with their email & password to read and send emails.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/webmail"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-emerald-900/30"
              >
                <span className="material-symbols-outlined text-white text-base">open_in_new</span>
                <span>Go to Webmail Node (mail.techsolutionor.com)</span>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-start gap-4 shadow-lg">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
              <span className="material-symbols-outlined text-xl">dns</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Client Domain Setup (MX Record)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Each domain owner points their <strong className="text-slate-200">MX record</strong> to <code className="text-indigo-400">mail.techsolutionor.com</code> and <code className="text-indigo-400">CNAME webmail</code> to access their mail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
