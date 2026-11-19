"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useAuth";

export default function UserDashboardPage() {
  const { authorized, user } = useRequireAuth(["SUPER_ADMIN", "ADMIN", "USER"]);
  const [userEmail, setUserEmail] = useState("");
  const [domains, setDomains] = useState<any[]>([]);
  const [mailboxes, setMailboxes] = useState<any[]>([]);
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
          setDomains(dRes.data);
        }
        if (mRes?.success && Array.isArray(mRes.data)) {
          setMailboxes(mRes.data);
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
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
            Authorizing Client Console...
          </p>
        </div>
      </div>
    );
  }

  const displayName = userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ") : "Domain Owner";
  const domainsCount = domains.length;
  const mailboxesCount = mailboxes.length;
  const maxDomains = 5;
  const maxMailboxes = 25;
  const storageUsedGb = (mailboxesCount * 0.25).toFixed(1);
  const storageTotalGb = "10.0";

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Node: Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
                <span className="material-symbols-outlined text-xs">verified</span>
                {planName}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono border border-slate-700/60">
                SSL Auto-Renew Enabled
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight capitalize flex items-center gap-2.5">
              <span>Welcome back, {displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Manage your domain registrations, provision secure business inboxes, configure DNS zones, and monitor email delivery telemetry.
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Link
              href="/domains"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 transform active:scale-95"
            >
              <span className="material-symbols-outlined text-base">domain_add</span>
              <span>Manage Domains</span>
            </Link>
            <Link
              href="/webmail"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all border border-emerald-500/30 shadow-lg shadow-emerald-950/20"
            >
              <span className="material-symbols-outlined text-base">mark_email_unread</span>
              <span>Launch Webmail</span>
            </Link>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700/80"
            >
              <span className="material-symbols-outlined text-base text-cyan-400">tune</span>
              <span>Resource Tiers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Cluster Health Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: "dns",
            label: "Webmail Node",
            val: "mail.techsolutionor.com",
            color: "text-indigo-400",
            bg: "bg-indigo-500/10 border-indigo-500/20",
          },
          {
            icon: "hub",
            label: "Authoritative DNS",
            val: "PowerDNS REST Driver",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10 border-cyan-500/20",
          },
          {
            icon: "mark_email_read",
            label: "IMAP / SMTP TLS",
            val: "Ports 993 / 465 Active",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
          {
            icon: "verified_user",
            label: "Anti-Spam Security",
            val: "SPF • DKIM • DMARC",
            color: "text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-3.5 backdrop-blur-md hover:border-slate-700 transition"
          >
            <div className={`p-2.5 rounded-xl border ${item.bg}`}>
              <span className={`material-symbols-outlined text-xl ${item.color}`}>{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{item.label}</p>
              <p className="text-xs font-bold text-white truncate mt-0.5">{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Resource Metering & Active Mailboxes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Resource Allocation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/90 p-6 sm:p-7 rounded-3xl space-y-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                  Capacity & Quotas
                </span>
                <h2 className="text-lg font-extrabold text-white">Resource Allocation</h2>
              </div>
              <span className="text-xs px-3 py-1 bg-slate-950 text-slate-300 rounded-full font-mono text-[11px] flex items-center gap-1.5 border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live Telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Domain Slots */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Domain Slots</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {loading ? "..." : domainsCount} <span className="text-xs font-normal text-slate-500">/ {maxDomains}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {Math.round((domainsCount / maxDomains) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (domainsCount / maxDomains) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {Math.max(0, maxDomains - domainsCount)} spare domain slot(s)
                </p>
              </div>

              {/* Active Mailboxes */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Mailboxes</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {loading ? "..." : mailboxesCount} <span className="text-xs font-normal text-slate-500">/ {maxMailboxes}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {Math.round((mailboxesCount / maxMailboxes) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (mailboxesCount / maxMailboxes) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {Math.max(0, maxMailboxes - mailboxesCount)} inboxes available
                </p>
              </div>

              {/* Storage Headroom */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">NVMe Storage</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {storageUsedGb} <span className="text-xs font-normal text-slate-500">/ {storageTotalGb} GB</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {Math.round((parseFloat(storageUsedGb) / 10) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (parseFloat(storageUsedGb) / 10) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {(10 - parseFloat(storageUsedGb)).toFixed(1)} GB NVMe headroom
                </p>
              </div>
            </div>
          </div>

          {/* Quick Domain Overview List */}
          <div className="bg-slate-900/80 border border-slate-800/90 p-6 sm:p-7 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-lg">language</span>
                <span>Active Registered Domains</span>
              </h3>
              <Link href="/domains" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">
                View All →
              </Link>
            </div>

            {domains.length === 0 ? (
              <div className="text-center py-8 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <span className="material-symbols-outlined text-3xl text-slate-600">domain_disabled</span>
                <p className="text-xs text-slate-400">No domains registered yet on your account.</p>
                <Link
                  href="/domains"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Register First Domain
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {domains.slice(0, 3).map((d: any) => (
                  <div
                    key={d.id || d.domainName}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {d.domainName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{d.domainName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">DNS Zone: Active</p>
                      </div>
                    </div>

                    <Link
                      href={`/domains/${d.domainName}`}
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1"
                    >
                      <span>Manage DNS & Mail</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Navigation & DNS Assistant (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-slate-900/80 border border-slate-800/90 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="material-symbols-outlined text-indigo-400 text-lg">bolt</span>
              <span>Fast Actions</span>
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/domains"
                className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Add New Domain</p>
                    <p className="text-[10px] text-slate-400">Sync with PowerDNS zone</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 text-sm group-hover:text-white transition">arrow_forward</span>
              </Link>

              <Link
                href="/webmail"
                className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">mark_email_unread</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Open Webmail Client</p>
                    <p className="text-[10px] text-slate-400">mail.techsolutionor.com</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 text-sm group-hover:text-white transition">open_in_new</span>
              </Link>

              <Link
                href="/packages"
                className="p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">upgrade</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Subscription & Limits</p>
                    <p className="text-[10px] text-slate-400">Active tier: {planName}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 text-sm group-hover:text-white transition">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* DNS Quick Integration Card */}
          <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-700/40 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-lg">dns</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">DNS Integration Records</h4>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              To route emails through TechSolutionor mail cluster, point your domain registrar to these records:
            </p>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">MX @:</span>
                <span className="text-indigo-400 font-bold">mail.techsolutionor.com</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">CNAME webmail:</span>
                <span className="text-indigo-400 font-bold">mail.techsolutionor.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
