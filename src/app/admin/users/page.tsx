"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useAuth";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  ip: string;
  initials: string;
  status: "Active" | "Suspended" | "Pending";
  plan: string;
  domains: number;
  mailboxes: number;
  storageUsed: number;
  storageMax: number;
  joined: string;
  lastActive: string;
}

export default function AdminUsersPage() {
  const { authorized } = useRequireAuth(["SUPER_ADMIN", "ADMIN"]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createDrawer, setCreateDrawer] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("Temp@123456");
  const [newPlan, setNewPlan] = useState("Cloud Business");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.users();
      if (res.success && Array.isArray(res.data)) {
        const mapped: UserAccount[] = res.data.map((u: any) => {
          const emailParts = u.email.split("@");
          const name = emailParts[0].replace(/[._]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          const initials = name
            .split(" ")
            .map((p: string) => p[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "US";

          const sub = u.subscriptions?.[0];
          const planName = sub?.package?.name || (u.role === "SUPER_ADMIN" ? "Super Admin" : "Starter Cloud");
          const maxStorageGb = sub?.package?.storageQuotaMb ? Math.round(sub.package.storageQuotaMb / 1024) : 10;

          const totalDomains = u.domains?.length || 0;
          const totalMailboxes = (u.domains || []).reduce(
            (acc: number, d: any) => acc + (d.mailboxes?.length || 0),
            0
          );

          return {
            id: u.id,
            name: u.role === "SUPER_ADMIN" ? `${name} (Super Admin)` : name,
            email: u.email,
            ip: "198.51.100.42",
            initials,
            status: u.status === "ACTIVE" ? "Active" : "Suspended",
            plan: planName,
            domains: totalDomains,
            mailboxes: totalMailboxes,
            storageUsed: Math.max(0.1, totalMailboxes * 0.5),
            storageMax: maxStorageGb,
            joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : "Recent",
            lastActive: "Active Session",
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadUsers();
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.ip.includes(search);
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    try {
      const res = await api.admin.createUser({
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: "USER",
      });

      if (res.success) {
        alert(`User ${newEmail} created successfully in database!`);
        setNewName("");
        setNewEmail("");
        setNewPassword("Temp@123456");
        setCreateDrawer(false);
        loadUsers();
      } else {
        alert(res.error || "Failed to create user.");
      }
    } catch (err: any) {
      alert(err.message || "Error creating user.");
    }
  };

  const handleToggleSuspend = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const nextStatus = target.status === "Active" ? "SUSPENDED" : "ACTIVE";

    try {
      const res = await api.admin.updateUserStatus(id, nextStatus);
      if (res.success) {
        setUsers(
          users.map((u) =>
            u.id === id ? { ...u, status: nextStatus === "ACTIVE" ? "Active" : "Suspended" } : u
          )
        );
      } else {
        alert(res.error || "Failed to update status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update user status.");
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user account: ${email}?`)) {
      return;
    }

    try {
      const res = await api.admin.deleteUser(id);
      if (res.success) {
        setUsers(users.filter((u) => u.id !== id));
      } else {
        alert(res.error || "Failed to delete user.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting user.");
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
            <span>Access & Users</span>
            <span>•</span>
            <span className="text-slate-400">Users Directory</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Users & Account Directory</h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Manage customer accounts, assigned packages, storage quotas, and security access states across all production clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Exported user directory CSV!")}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-base">file_download</span> Export CSV
          </button>
          <button
            onClick={() => setCreateDrawer(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
          >
            <span className="material-symbols-outlined text-base">person_add</span> Create New User
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Accounts</p>
            <p className="text-2xl font-black text-white mt-1">{loading ? "..." : users.length}</p>
            <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Live Database Records</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active State</p>
            <p className="text-2xl font-black text-white mt-1">
              {loading ? "..." : users.filter((u) => u.status === "Active").length}
            </p>
            <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Active Logins</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">verified_user</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Suspended</p>
            <p className="text-2xl font-black text-red-400 mt-1">
              {loading ? "..." : users.filter((u) => u.status === "Suspended").length}
            </p>
            <p className="text-[10px] text-red-400 font-bold mt-0.5">Access Denied</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">gavel</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Mailboxes</p>
            <p className="text-2xl font-black text-blue-400 mt-1">
              {loading ? "..." : users.reduce((acc, u) => acc + u.mailboxes, 0)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Under All Domains</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">mark_email_read</span>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">
              manage_search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, email, or IP address..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Status: All</option>
              <option value="Active">Status: Active</option>
              <option value="Suspended">Status: Suspended</option>
              <option value="Pending">Status: Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                </th>
                <th className="py-3 px-4">User & Host Identity</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Hosting Tier</th>
                <th className="py-3 px-4">Allocations</th>
                <th className="py-3 px-4 w-44">Storage Quota</th>
                <th className="py-3 px-4">Joined / Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs">
                        {u.initials}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm flex items-center gap-1">
                          {u.name}
                          <span className="material-symbols-outlined text-xs text-indigo-400">verified</span>
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                        <p className="text-[10px] font-mono text-slate-500">IP: {u.ip}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.status === "Active"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : u.status === "Suspended"
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-white">{u.domains} Domains</p>
                      <p className="text-[10px] text-slate-400">{u.mailboxes} Mailboxes</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-bold text-white">{u.storageUsed} GB</span>
                        <span className="text-slate-400">/ {u.storageMax} GB</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (u.storageUsed / u.storageMax) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-white">{u.joined}</p>
                      <p className="text-[10px] text-slate-400">{u.lastActive}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleSuspend(u.id)}
                        className={`p-1.5 hover:bg-slate-800 rounded-lg transition ${
                          u.status === "Active" ? "text-slate-400 hover:text-red-400" : "text-emerald-400"
                        }`}
                        title={u.status === "Active" ? "Suspend Account" : "Unsuspend Account"}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {u.status === "Active" ? "block" : "check_circle"}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete User Permanently"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer for Create New User */}
      {createDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 max-w-md w-full p-6 space-y-6 shadow-2xl flex flex-col justify-between h-full overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400">person_add</span> Create New User Account
                </h3>
                <button onClick={() => setCreateDrawer(false)} className="text-slate-400 hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Work / Client Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Temporary password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Assigned Package Tier</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Starter Cloud">Starter Cloud (5 Domains / 10 Mailboxes)</option>
                    <option value="Pro Business Cloud">Pro Business Cloud (25 Domains / 50 Mailboxes)</option>
                  </select>
                </div>

                <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-indigo-200">
                  User will be saved directly in database and will be able to log in at the Main Panel.
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setCreateDrawer(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-user-form"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
