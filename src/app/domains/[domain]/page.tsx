"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/useAuth";

interface DnsRecord {
  id: string;
  type: string;
  name: string;
  value: string;
  ttl: string;
  priority: string;
  status: string;
}

interface MailboxAccount {
  id: string;
  email: string;
  quotaMb: number;
  status: "Active" | "Suspended";
  created: string;
}

const DEFAULT_DNS_TEMPLATE: DnsRecord[] = [
  { id: "1", type: "A", name: "@", value: "198.51.100.42", ttl: "14400s", priority: "-", status: "Active" },
  { id: "2", type: "CNAME", name: "www", value: "@", ttl: "14400s", priority: "-", status: "Active" },
  { id: "3", type: "MX", name: "@", value: "mail.techsolutionor.com", ttl: "14400s", priority: "10", status: "Active" },
  { id: "4", type: "CNAME", name: "webmail", value: "mail.techsolutionor.com", ttl: "14400s", priority: "-", status: "Active" },
  { id: "5", type: "TXT", name: "@", value: '"v=spf1 mx include:techsolutionor.com ~all"', ttl: "14400s", priority: "-", status: "Active" },
  { id: "6", type: "TXT", name: "default._domainkey", value: '"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3..."', ttl: "14400s", priority: "-", status: "Active" },
];

export default function DomainDetailPage() {
  const { authorized } = useRequireAuth(["SUPER_ADMIN", "ADMIN", "USER"]);
  const params = useParams();
  const router = useRouter();
  const domainName = (params?.domain as string) || "apexdesign.io";

  const [activeTab, setActiveTab] = useState<"dns" | "mailboxes">("mailboxes");

  // DNS State
  const [records, setRecords] = useState<DnsRecord[]>(DEFAULT_DNS_TEMPLATE);
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [newType, setNewType] = useState("A");
  const [newName, setNewName] = useState("@");
  const [newValue, setNewValue] = useState("");
  const [newPriority, setNewPriority] = useState("10");
  const [newTtl, setNewTtl] = useState("14400");

  // Mailboxes State
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([]);
  const [createMailboxModal, setCreateMailboxModal] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    email: string;
    password: string;
    quotaMb: number;
    webmailUrl: string;
    imapServer: string;
    smtpServer: string;
  } | null>(null);
  const [mailboxUsername, setMailboxUsername] = useState("");
  const [mailboxPassword, setMailboxPassword] = useState("");
  const [mailboxQuota, setMailboxQuota] = useState("2048");
  const [copiedText, setCopiedText] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const loadDomainData = async () => {
    try {
      const [dnsRes, mbRes] = await Promise.all([
        api.user.dnsRecords(domainName).catch(() => null),
        api.user.mailboxes().catch(() => null),
      ]);

      if (dnsRes?.success && Array.isArray(dnsRes.data) && dnsRes.data.length > 0) {
        setRecords(
          dnsRes.data.map((r: any) => ({
            id: r.id,
            type: r.type,
            name: r.name,
            value: r.value,
            ttl: `${r.ttl}s`,
            priority: r.type === "MX" ? r.priority.toString() : "-",
            status: "Active",
          }))
        );
      }

      if (mbRes?.success && Array.isArray(mbRes.data)) {
        const domainMbs = mbRes.data
          .filter((m: any) => !domainName || m.emailAddress.endsWith(`@${domainName}`))
          .map((m: any) => ({
            id: m.id,
            email: m.emailAddress,
            quotaMb: m.quotaMb,
            status: m.status === "ACTIVE" ? ("Active" as const) : ("Suspended" as const),
            created: m.created_at ? new Date(m.created_at).toLocaleDateString() : "Active",
          }));
        setMailboxes(domainMbs);
      }
    } catch (err) {
      console.error("Error loading domain data:", err);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadDomainData();
    }
  }, [authorized, domainName]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
          </div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Verifying Domain Owner Permissions...
          </p>
        </div>
      </div>
    );
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue) return;

    try {
      const res = await api.user.addDnsRecord({
        domainId: domainName,
        type: newType,
        name: newName || "@",
        value: newValue.trim(),
        ttl: parseInt(newTtl, 10) || 14400,
        priority: newType === "MX" ? parseInt(newPriority, 10) || 10 : 10,
      });

      if (res.success) {
        setNewValue("");
        loadDomainData();
        alert(`Added new ${newType} record for ${domainName}!`);
      } else {
        alert(res.error || "Failed to add DNS record.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to add DNS record.");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm("Are you sure you want to delete this DNS record?")) {
      try {
        await api.user.deleteDnsRecord(id);
        setRecords(records.filter((r) => r.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete record.");
      }
    }
  };

  const handleCreateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailboxUsername || !mailboxPassword) return;

    const fullEmail = `${mailboxUsername.trim().toLowerCase()}@${domainName}`;

    try {
      const res = await api.user.createMailbox({
        domainId: domainName,
        emailAddress: fullEmail,
        password: mailboxPassword,
        quotaMb: parseInt(mailboxQuota, 10) || 2048,
      });

      if (res.success) {
        setCreatedAccount({
          email: fullEmail,
          password: mailboxPassword,
          quotaMb: parseInt(mailboxQuota, 10) || 2048,
          webmailUrl: "https://mail.techsolutionor.com",
          imapServer: "mail.techsolutionor.com:993 (SSL/TLS)",
          smtpServer: "mail.techsolutionor.com:465 (SSL/TLS)",
        });
        setCreateMailboxModal(false);
        setSuccessNotice(
          `✓ Mailbox ${fullEmail} created! Hand over login details for mail.techsolutionor.com.`
        );
        setMailboxUsername("");
        setMailboxPassword("");
        loadDomainData();
      } else {
        alert(res.error || "Failed to create mailbox.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create mailbox.");
    }
  };

  const handleDeleteMailbox = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to delete mailbox ${email}?`)) {
      try {
        await api.user.deleteMailbox(id);
        setMailboxes(mailboxes.filter((m) => m.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete mailbox.");
      }
    }
  };

  const handleCopyCredentials = () => {
    if (!createdAccount) return;
    const text = `Mailbox Credentials for ${createdAccount.email}:\nWebmail URL: ${createdAccount.webmailUrl}\nEmail: ${createdAccount.email}\nPassword: ${createdAccount.password}\nIMAP: ${createdAccount.imapServer}\nSMTP: ${createdAccount.smtpServer}`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleLoginAsMailbox = (mbEmail: string) => {
    localStorage.setItem("auth_role", "MAILBOX_USER");
    localStorage.setItem("auth_email", mbEmail);
    localStorage.setItem(
      "auth_user",
      JSON.stringify({
        id: "mb_session",
        email: mbEmail,
        role: "MAILBOX_USER",
      })
    );
    router.push("/webmail");
  };

  const filteredRecords = records.filter((r) => {
    const matchesFilter = filterType === "ALL" || r.type === filterType;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.value.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2 text-slate-400">
          <Link href="/domains" className="hover:text-white flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">dns</span>
            Domains & Infrastructure
          </Link>
          <span>/</span>
          <span className="font-bold text-white">{domainName}</span>
          <span>/</span>
          <span className="text-indigo-400">Management Console</span>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1.5 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Domain Active & Mailcow Provisioned
        </span>
      </div>

      {/* Domain Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg font-black text-2xl shrink-0">
              <span className="material-symbols-outlined text-3xl">language</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{domainName}</h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  Active
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">mail</span> {mailboxes.length} Active Mailboxes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Domain Owner: <strong className="text-slate-200">user@apexdesign.io</strong> • Authoritative Nameservers Synced
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCreateMailboxModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30"
            >
              <span className="material-symbols-outlined text-base">add_circle</span> Create New Mailbox
            </button>
            <Link
              href="/webmail"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <span className="material-symbols-outlined text-base text-indigo-400">open_in_new</span> Launch Webmail
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pt-2">
          <button
            onClick={() => setActiveTab("mailboxes")}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "mailboxes"
                ? "border-indigo-500 text-white bg-indigo-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-base">mark_email_unread</span>
            <span>Domain Mailboxes ({mailboxes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("dns")}
            className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "dns"
                ? "border-indigo-500 text-white bg-indigo-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-base">dns</span>
            <span>DNS Zone Records ({records.length})</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* TAB 1: MAILBOXES & EMAIL ACCOUNTS */}
      {activeTab === "mailboxes" && (
        <div className="space-y-6">
          {/* Dedicated Webmail Node Architecture Banner */}
          <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">alternate_email</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">Dedicated Webmail Portal</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                    mail.techsolutionor.com
                  </span>
                  <span className="text-[10px] text-slate-400">or webmail.{domainName}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Mail users created here do not manage domains; they log in directly at{" "}
                  <strong className="text-indigo-300 font-mono">https://mail.techsolutionor.com</strong> using their email address and assigned password to send & receive emails.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/webmail"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-indigo-600/30"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                <span>Open mail.techsolutionor.com</span>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400">forward_to_inbox</span>
                  Configured Email Accounts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Users created here can log in directly at <strong className="text-slate-300">mail.techsolutionor.com</strong> with their mailbox password.
                </p>
              </div>

              <button
                onClick={() => setCreateMailboxModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Create Email Account
              </button>
            </div>

            {/* Mailboxes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Storage Quota</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mailboxes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No mailboxes created under @{domainName} yet. Click &quot;Create Email Account&quot; to provision one.
                      </td>
                    </tr>
                  ) : (
                    mailboxes.map((mb) => (
                      <tr key={mb.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                              @
                            </div>
                            <div>
                              <div className="font-bold text-white font-mono">{mb.email}</div>
                              <div className="text-[10px] text-slate-400">Can log in directly to Webmail</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-300">{mb.quotaMb} MB</div>
                          <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-indigo-500 h-full w-1/4"></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {mb.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">{mb.created}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleLoginAsMailbox(mb.email)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                              title="Direct Login as this Mailbox user"
                            >
                              <span className="material-symbols-outlined text-sm">login</span>
                              <span>Login to Webmail</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMailbox(mb.id, mb.email)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                              title="Delete Mailbox"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DNS RECORDS */}
      {activeTab === "dns" && (
        <div className="space-y-6">
          {/* Add New Record Form */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">add_circle</span>
              Add New Resource Record
            </h3>
            <form onSubmit={handleAddRecord} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="MX">MX</option>
                  <option value="TXT">TXT</option>
                  <option value="SRV">SRV</option>
                </select>
              </div>

              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Name (Host)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="@"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Value / Target</label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="198.51.100.42 or mail.domain.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="sm:col-span-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">TTL</label>
                <select
                  value={newTtl}
                  onChange={(e) => setNewTtl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="300">300s (Auto)</option>
                  <option value="3600">3600s (1h)</option>
                  <option value="14400">14400s (4h)</option>
                  <option value="86400">86400s (1d)</option>
                </select>
              </div>

              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>

          {/* DNS Records Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search DNS records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["ALL", "A", "CNAME", "MX", "TXT"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      filterType === type
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">TTL</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-indigo-400">{r.type}</td>
                      <td className="py-3 px-4 text-white">{r.name}</td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{r.value}</td>
                      <td className="py-3 px-4 text-slate-400">{r.ttl}</td>
                      <td className="py-3 px-4 text-slate-400">{r.priority}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MAILBOX MODAL */}
      {createMailboxModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">mark_email_read</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Mailbox</h3>
                  <p className="text-xs text-slate-400">Under @{domainName}</p>
                </div>
              </div>
              <button
                onClick={() => setCreateMailboxModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateMailbox} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Email Username</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={mailboxUsername}
                    onChange={(e) => setMailboxUsername(e.target.value)}
                    placeholder="sales or contact or billing"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-l-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="px-3 py-2.5 bg-slate-800 border border-l-0 border-slate-800 rounded-r-xl text-xs text-slate-300 font-mono">
                    @{domainName}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Mailbox Password</label>
                <input
                  type="password"
                  required
                  value={mailboxPassword}
                  onChange={(e) => setMailboxPassword(e.target.value)}
                  placeholder="Create password for email user"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">The user will use this password to log in to Webmail.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Storage Quota</label>
                <select
                  value={mailboxQuota}
                  onChange={(e) => setMailboxQuota(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1024">1,024 MB (1 GB)</option>
                  <option value="2048">2,048 MB (2 GB)</option>
                  <option value="5120">5,120 MB (5 GB)</option>
                  <option value="10240">10,240 MB (10 GB)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateMailboxModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  Create Mailbox Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CREATED MAILBOX ONBOARDING MODAL */}
      {createdAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Mailbox Created!</h3>
                  <p className="text-xs text-slate-400">Ready to log in at mail.techsolutionor.com</p>
                </div>
              </div>
              <button
                onClick={() => setCreatedAccount(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Webmail Portal:</span>
                <span className="text-indigo-400 font-bold">{createdAccount.webmailUrl}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Email Account:</span>
                <span className="text-white font-bold">{createdAccount.email}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Password:</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {createdAccount.password}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Storage Quota:</span>
                <span className="text-slate-200">{createdAccount.quotaMb} MB</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-sans">IMAP Incoming:</span>
                <span className="text-slate-300">{createdAccount.imapServer}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">SMTP Outgoing:</span>
                <span className="text-slate-300">{createdAccount.smtpServer}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2 font-sans">
              <span className="material-symbols-outlined text-base mt-0.5">info</span>
              <span>
                Domain owners create mailboxes here in the Main Panel. The end-user logs in at{" "}
                <strong>mail.techsolutionor.com</strong> to read and send messages.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <span className="material-symbols-outlined text-base">
                  {copiedText ? "check" : "content_copy"}
                </span>
                <span>{copiedText ? "Copied to Clipboard!" : "Copy Details"}</span>
              </button>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleLoginAsMailbox(createdAccount.email);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Test Webmail Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedAccount(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
