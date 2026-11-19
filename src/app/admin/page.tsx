"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useAuth";

export default function AdminDashboardPage() {
  const { authorized } = useRequireAuth(["SUPER_ADMIN", "ADMIN"]);
  const [newAccountModal, setNewAccountModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("Temp@123456");
  const [userPlan, setUserPlan] = useState("Starter Cloud");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalDomains: 0,
    activeDomains: 0,
    totalMailboxes: 0,
    activeMailboxes: 0,
    totalPackages: 0,
    recentUsers: [] as any[],
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.admin.stats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadStats();
    }
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
          </div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Verifying Super Admin Credentials...
          </p>
        </div>
      </div>
    );
  }

  const handleCreateAccount = async () => {
    if (!userEmail) return;
    try {
      const res = await api.admin.createUser({
        email: userEmail.trim().toLowerCase(),
        password: userPassword,
        role: "USER",
      });

      if (res.success) {
        alert(`Account created successfully for ${userEmail}!`);
        setUserEmail("");
        setUserPassword("Temp@123456");
        setNewAccountModal(false);
        loadStats();
      } else {
        alert(res.error || "Failed to create account.");
      }
    } catch (err: any) {
      alert(err.message || "Error creating account.");
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
            <span>Cluster Telemetry & Control</span>
            <span>•</span>
            <span className="text-slate-400">Node ID: central-mail-01</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">System Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of cluster health, active accounts, hosted domains, and provisioned mailboxes.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-base">group</span> View All Users ({stats.totalUsers})
          </Link>
          <button
            onClick={() => setNewAccountModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
          >
            <span className="material-symbols-outlined text-base">person_add</span> + New Account
          </button>
        </div>
      </div>

      {/* KPI Metrics 4-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Users */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span> Live DB
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{loading ? "..." : stats.totalUsers}</p>
            <p className="text-xs text-slate-400 mt-0.5">registered accounts</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-indigo-500 h-full"
              style={{
                width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 100}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>{stats.activeUsers} Active</span>
            <span>{stats.suspendedUsers} Suspended</span>
          </div>
        </div>

        {/* Card 2: Hosted Domains */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hosted Domains</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">dns</span> PowerDNS
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{loading ? "..." : stats.totalDomains}</p>
            <p className="text-xs text-slate-400 mt-0.5">live DNS zones</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-full"></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>{stats.activeDomains} Resolved</span>
            <span>0 Pending</span>
          </div>
        </div>

        {/* Card 3: Mailboxes */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Mailboxes</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              Mailcow Provisioned
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">{loading ? "..." : stats.totalMailboxes}</p>
            <p className="text-xs text-slate-400 mt-0.5">inboxes created</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-full"></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>{stats.activeMailboxes} Active</span>
            <span>Target: mail.techsolutionor.com</span>
          </div>
        </div>

        {/* Card 4: Cluster Storage & Health */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cluster Services</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span> Operational
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-white">100%</p>
            <p className="text-xs text-slate-400 mt-0.5">cluster health</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-full"></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Postfix • Dovecot • PowerDNS</span>
            <span className="text-emerald-400 font-bold">All Healthy</span>
          </div>
        </div>
      </div>

      {/* Recent Registered Users Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">recent_actors</span>
              Recent Registered Users
            </h3>
            <p className="text-xs text-slate-400">Users who registered through the portal or were provisioned by admin.</p>
          </div>
          <Link
            href="/admin/users"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Manage All Users</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stats.recentUsers && stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-white font-bold">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 font-sans font-bold border border-indigo-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold border ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleString() : "Recent"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 font-sans">
                    {loading ? "Loading registered accounts..." : "No users found in database."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cluster Resource Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hardware Cluster</span>
              <h2 className="text-lg font-bold text-white">Primary Telemetry & Services</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> mail.techsolutionor.com
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Mail Delivery Engine</span>
                <span className="text-indigo-400 font-bold font-mono">100%</span>
              </div>
              <p className="text-[10px] text-slate-400">Postfix MTA & Dovecot IMAP/POP3</p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-full rounded-full"></div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">Database Storage</span>
                <span className="text-blue-400 font-bold font-mono">Healthy</span>
              </div>
              <p className="text-[10px] text-slate-400">Sequelize ORM & SQL Store</p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[45%] rounded-full"></div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-bold">DNS Authoritative Sync</span>
                <span className="text-emerald-400 font-bold font-mono">Active</span>
              </div>
              <p className="text-[10px] text-slate-400">PowerDNS API Driver Sync</p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-full rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Services Health (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-base">dns</span>
              Core System Services
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <p className="text-xs font-bold text-white">PowerDNS Nameserver</p>
                  <p className="text-[10px] text-slate-400">Port 53 • UDP/TCP Sync</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                12ms
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <p className="text-xs font-bold text-white">Mailcow Engine (Postfix/Dovecot)</p>
                  <p className="text-[10px] text-slate-400">IMAP/SMTP TLS Active</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                99.9%
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <p className="text-xs font-bold text-white">Nginx Reverse Proxy & SSL</p>
                  <p className="text-[10px] text-slate-400">mail.techsolutionor.com</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: New Account */}
      {newAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">person_add</span> Provision New User Account
              </h3>
              <button onClick={() => setNewAccountModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">User Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Initial Password</label>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Initial Plan Tier</label>
                <select
                  value={userPlan}
                  onChange={(e) => setUserPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Starter Cloud">Starter Cloud (5 Domains / 10 Mailboxes)</option>
                  <option value="Pro Business Cloud">Pro Business Cloud (25 Domains / 50 Mailboxes)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setNewAccountModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Provision Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
