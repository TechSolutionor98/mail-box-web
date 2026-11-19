"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useAuth";

export default function UserDashboardPage() {
  const { authorized, user } = useRequireAuth(["SUPER_ADMIN", "ADMIN", "USER"]);
  const [userEmail, setUserEmail] = useState("");
  const [domainsCount, setDomainsCount] = useState(0);
  const [mailboxesCount, setMailboxesCount] = useState(0);
  const [planName, setPlanName] = useState("Pro Business Cloud");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    const email = user?.email || localStorage.getItem("auth_email") || "";
    setUserEmail(email);

    async function loadData() {
      try {
        const [dRes, mRes, pRes] = await Promise.all([
          api.user.domains().catch(() => null),
          api.user.mailboxes().catch(() => null),
          api.user.profile().catch(() => null),
        ]);

        if (dRes?.success && Array.isArray(dRes.data)) {
          setDomainsCount(dRes.data.length);
        }
        if (mRes?.success && Array.isArray(mRes.data)) {
          setMailboxesCount(mRes.data.length);
        }
        if (pRes?.success && pRes.data?.package) {
          setPlanName(pRes.data.package.name);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authorized, user]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
          </div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Verifying User Session...
          </p>
        </div>
      </div>
    );
  }

  const displayName = userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ") : "Domain Owner";

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Account Status: Active
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              <span className="material-symbols-outlined text-xs">verified</span>
              {planName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight capitalize">
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-slate-400">
            Manage your registered domains, DNS records, enterprise mailboxes, and email deliverability.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            href="/domains"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            <span className="material-symbols-outlined text-lg">domain</span>
            My Domains
          </Link>
          <Link
            href="/webmail"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
          >
            <span className="material-symbols-outlined text-lg text-indigo-400">open_in_new</span>
            Launch Webmail
          </Link>
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all border border-slate-800"
          >
            <span className="material-symbols-outlined text-lg text-emerald-400">rocket_launch</span>
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "dns", title: "Central Mail Node", value: "mail.techsolutionor.com", color: "text-indigo-400" },
          { icon: "terminal", title: "Authoritative DNS", value: "PowerDNS REST API", color: "text-blue-400" },
          { icon: "speed", title: "Webmail Access", value: "IMAP (993) / SMTP (465)", color: "text-emerald-400" },
          { icon: "verified_user", title: "Security SLA", value: "SPF • DKIM • DMARC", color: "text-purple-400" },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{item.title}</p>
              <p className="text-xs font-bold text-white mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid: Resource Allocation & Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Resource Allocation (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resource Allocation</span>
              <h2 className="text-lg font-bold text-white">Provisioning Limits & Usage</h2>
            </div>
            <span className="text-xs px-3 py-1 bg-slate-800 text-slate-300 rounded-full font-medium flex items-center gap-1.5 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Domains */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Domains</p>
                  <p className="text-2xl font-extrabold text-white">
                    {loading ? "..." : domainsCount} <span className="text-xs font-normal text-slate-400">/ 5 Allocated</span>
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {Math.round((domainsCount / 5) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (domainsCount / 5) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">{Math.max(0, 5 - domainsCount)} available slot(s)</p>
            </div>

            {/* Mailboxes */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Mailboxes</p>
                  <p className="text-2xl font-extrabold text-white">
                    {loading ? "..." : mailboxesCount} <span className="text-xs font-normal text-slate-400">/ 25 Active</span>
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {Math.round((mailboxesCount / 25) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (mailboxesCount / 25) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">{Math.max(0, 25 - mailboxesCount)} available mailbox(es)</p>
            </div>

            {/* NVMe Storage */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">NVMe Storage</p>
                  <p className="text-2xl font-extrabold text-white">
                    {(mailboxesCount * 0.25).toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10.0 GB</span>
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {Math.round(((mailboxesCount * 0.25) / 10) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, ((mailboxesCount * 0.25) / 10) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">Mail storage allocated</p>
            </div>
          </div>
        </div>

        {/* Quick Launch (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-base">rocket</span>
              Quick Navigation
            </h3>
          </div>

          <div className="space-y-3">
            <Link
              href="/domains"
              className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-400">dns</span>
                <div>
                  <p className="text-xs font-bold text-white">Manage Domains & DNS</p>
                  <p className="text-[10px] text-slate-400">{domainsCount} registered domain(s)</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-500 text-sm">arrow_forward</span>
            </Link>

            <Link
              href="/webmail"
              className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400">mail</span>
                <div>
                  <p className="text-xs font-bold text-white">Open Webmail Client</p>
                  <p className="text-[10px] text-slate-400">mail.techsolutionor.com</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-500 text-sm">open_in_new</span>
            </Link>

            <Link
              href="/packages"
              className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-400">inventory_2</span>
                <div>
                  <p className="text-xs font-bold text-white">Subscription Packages</p>
                  <p className="text-[10px] text-slate-400">{planName}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-500 text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
