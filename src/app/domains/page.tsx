"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useAuth";

interface DomainItem {
  id: string;
  name: string;
  type: string;
  target: string;
  ssl: string;
  sslExpires: string;
  status: string;
  mailboxes: string;
  created: string;
  initial: string;
}

export default function MyDomainsPage() {
  const { authorized } = useRequireAuth(["SUPER_ADMIN", "ADMIN", "USER"]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requestModal, setRequestModal] = useState(false);
  const [requestedDomain, setRequestedDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const res = await api.user.domains();
      if (res.success && Array.isArray(res.data)) {
        const mapped: DomainItem[] = res.data.map((d: any, idx: number) => ({
          id: d.id,
          name: d.domainName,
          type: idx === 0 ? "Primary Domain" : "Secondary Domain",
          target: "mail.techsolutionor.com",
          ssl: d.status === "ACTIVE" ? "TLS/SSL Active" : "Pending DNS",
          sslExpires: "Auto-renewing",
          status: d.status === "ACTIVE" ? "Synced (Healthy)" : d.status,
          mailboxes: `${d.mailboxes?.length || 0} active`,
          created: d.created_at ? new Date(d.created_at).toLocaleDateString() : "Recent",
          initial: (d.domainName[0] || "D").toUpperCase(),
        }));
        setDomains(mapped);
      }
    } catch (err) {
      console.error("Failed to load user domains:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadDomains();
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
            Verifying Session Access...
          </p>
        </div>
      </div>
    );
  }

  const handleAddDomain = async () => {
    if (!requestedDomain) return;
    setIsSubmitting(true);
    try {
      const cleanDomain = requestedDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const res = await api.user.addDomain(cleanDomain);
      if (res.success) {
        alert(`Domain ${cleanDomain} registered successfully in DNS cluster!`);
        setRequestedDomain("");
        setRequestModal(false);
        loadDomains();
      } else {
        alert(res.error || "Failed to add domain.");
      }
    } catch (err: any) {
      alert(err.message || "Error adding domain.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDomains = domains.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">dns</span>
            <span>Core Infrastructure • Authoritative DNS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">My Domains</h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Register your domains with our central mail cluster (<strong className="text-indigo-300 font-mono">mail.techsolutionor.com</strong>) and manage mailboxes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRequestModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Register New Domain
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Assigned Capacity */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Capacity</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
              Live Quota
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-white">{loading ? "..." : domains.length}</span>
              <span className="text-sm text-slate-400 ml-1">/ 5 allowed</span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center text-xs font-bold text-white">
              {Math.min(100, Math.round((domains.length / 5) * 100))}%
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (domains.length / 5) * 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-indigo-400">info</span>
            {Math.max(0, 5 - domains.length)} domain slot(s) readily available
          </p>
        </div>

        {/* Card 2: Health & Security */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mail Routing</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              mail.techsolutionor.com
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black text-white">{domains.length} Domains</p>
              <p className="text-xs text-slate-400">Target MX: mail.techsolutionor.com</p>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-full rounded-full"></div>
          </div>
          <p className="text-xs text-slate-400">Automated DNS & DKIM sync active</p>
        </div>

        {/* Card 3: Mailboxes */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Webmail Portal</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
              Port 993/465
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black text-white">Dedicated Webmail</p>
              <p className="text-xs text-slate-400">https://mail.techsolutionor.com</p>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-full rounded-full"></div>
          </div>
          <p className="text-xs text-slate-400">Created users log in to check emails</p>
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domains..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Domain Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Mail Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Mailboxes</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading domains from database...
                  </td>
                </tr>
              ) : filteredDomains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No domains registered yet. Click &quot;Register New Domain&quot; to add your first domain.
                  </td>
                </tr>
              ) : (
                filteredDomains.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-sm">
                          {d.initial}
                        </div>
                        <div>
                          <Link href={`/domains/${d.id}`} className="font-bold text-white hover:text-indigo-400 text-sm">
                            {d.name}
                          </Link>
                          <p className="text-[11px] text-slate-400">MX: mail.techsolutionor.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">
                        {d.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-slate-300 text-xs">mail.techsolutionor.com</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-slate-200 font-semibold">
                        <span className="material-symbols-outlined text-indigo-400 text-base">mail</span>
                        <span>{d.mailboxes}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{d.created}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/domains/${d.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">settings</span>
                          <span>Manage & Mailboxes</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request / Register Domain Modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">domain_add</span> Register Domain
              </h3>
              <button onClick={() => setRequestModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Domain Name</label>
                <input
                  type="text"
                  value={requestedDomain}
                  onChange={(e) => setRequestedDomain(e.target.value)}
                  placeholder="e.g. mycompany.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 bg-indigo-950/50 border border-indigo-800/50 rounded-xl text-xs text-indigo-200">
                Adding your domain will automatically provision PowerDNS zone files and point incoming MX records to <strong className="text-white">mail.techsolutionor.com</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setRequestModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                {isSubmitting ? "Registering..." : "Register Domain"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
