"use client";

import { useState } from "react";
import { useRequireAuth } from "@/lib/useAuth";

export default function PackagesPage() {
  const { authorized } = useRequireAuth(["SUPER_ADMIN", "ADMIN", "USER"]);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Cloud Pro / Enterprise");

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Authenticating access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
            <span>Subscription & Resources</span>
            <span>•</span>
            <span className="text-slate-400">Billing Cycle: Monthly Auto-Renew</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Packages & Hosting Plans</h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Review your current resource limits or upgrade to a higher performance tier with zero downtime.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="material-symbols-outlined text-emerald-400 text-2xl">verified_user</span>
          <div>
            <p className="text-xs font-bold text-white">99.99% Uptime SLA</p>
            <p className="text-[10px] text-slate-400">Backed with immediate compute failover</p>
          </div>
        </div>
      </div>

      {/* Active Plan Overview */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-base font-bold text-white">Current Active Plan: Cloud Business</span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              $24.00 / month
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-indigo-400">autorenew</span>
            Next renewal: Oct 18, 2026 via MasterCard ending in 4092
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-indigo-400">language</span> Domain Slots
              </span>
              <span className="text-white font-bold">2 of 5 used (40%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[40%] rounded-full"></div>
            </div>
            <p className="text-[11px] text-slate-400">3 domain slots spare</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-indigo-400">mail</span> Mailboxes
              </span>
              <span className="text-white font-bold">12 of 25 used (48%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[48%] rounded-full"></div>
            </div>
            <p className="text-[11px] text-slate-400">13 available inboxes</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-indigo-400">database</span> NVMe Storage
              </span>
              <span className="text-white font-bold">3.2 of 10 GB used (32%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[32%] rounded-full"></div>
            </div>
            <p className="text-[11px] text-slate-400">6.8 GB NVMe headroom</p>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Starter Cloud */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                Entry Level
              </span>
              <span className="material-symbols-outlined text-slate-500">cloud_queue</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Starter Cloud</h3>
              <p className="text-xs text-slate-400 mt-1">Ideal for single domain projects and personal sites.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">$9</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-300">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> 1 Domain Included
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> 5 Email Accounts
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> 5 GB NVMe Storage
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> Standard Anycast DNS
              </p>
            </div>
          </div>

          <button
            disabled
            className="w-full py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold opacity-60 cursor-not-allowed"
          >
            Starter Tier
          </button>
        </div>

        {/* Cloud Business (Active) */}
        <div className="bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/80 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-2xl relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-600 px-3 py-1 rounded-full shadow-md">
                Current Active Plan
              </span>
              <span className="material-symbols-outlined text-indigo-400">domain</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Cloud Business</h3>
              <p className="text-xs text-slate-300 mt-1">Perfect for growing businesses and active mailboxes.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">$24</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>

            <div className="border-t border-indigo-900/60 pt-4 space-y-2 text-xs text-slate-200">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">check_circle</span> Up to 5 Domains Included
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">check_circle</span> 25 Email Accounts (IMAP/SMTP)
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">check_circle</span> 10 GB NVMe Storage
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">check_circle</span> Anycast High-Speed DNS
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-base">check_circle</span> Daily Automated Backups
              </p>
            </div>
          </div>

          <button disabled className="w-full py-2.5 bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold cursor-default">
            Current Active Tier
          </button>
        </div>

        {/* Cloud Pro / Enterprise (Upgrade) */}
        <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl hover:border-emerald-500 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 border border-emerald-500/50 px-3 py-1 rounded-full">
                Recommended Upgrade
              </span>
              <span className="material-symbols-outlined text-emerald-400">rocket_launch</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Cloud Pro / Enterprise</h3>
              <p className="text-xs text-slate-300 mt-1">Uncapped power, dedicated IP, and 50GB storage.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">$49</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-200">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> Unlimited Domains
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> 100 Email Accounts
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> 50 GB NVMe Storage
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> Dedicated IPv4 Address
              </p>
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span> Priority 24/7 Phone Support
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPlan("Cloud Pro / Enterprise ($49/mo)");
              setUpgradeModal(true);
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Upgrade to Cloud Pro</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">rocket_launch</span> Confirm Plan Upgrade
              </h3>
              <button onClick={() => setUpgradeModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Selected Target Plan</p>
                <p className="text-sm font-bold text-white">{selectedPlan}</p>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">bolt</span> Zero-Downtime ZFS Resizing
                </p>
                <p className="text-[11px]">
                  Your NVMe storage will instantly expand from 10 GB to 50 GB without restarting server daemons.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setUpgradeModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Upgrade confirmed! ZFS storage pool resized to 50 GB NVMe.");
                  setUpgradeModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
