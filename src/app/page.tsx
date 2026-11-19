"use client";

import { useState } from "react";

const STEPS = [
  {
    phase: 1,
    phaseTitle: "Phase 01: Admin Onboarding & Provisioning",
    phaseDesc: "Initial orchestration, workspace containment & multi-zone DNS routing setup",
    stepNum: "STEP 01",
    actor: "admin",
    actorBadge: "Manual Admin",
    icon: "admin_panel_settings",
    title: "Admin Authentication",
    actorName: "Enterprise SuperAdmin",
    description: "Privileged operator securely authenticates via Enterprise Portal applying FIDO2 WebAuthn & hardware token MFA.",
    module: "AUTH MODULE",
    status: "VERIFIED",
    statusColor: "text-emerald-400",
    code: "POST /auth/v2/super-mfa [200 OK]",
    actionHint: "creates & allocates"
  },
  {
    phase: 1,
    stepNum: "STEP 02",
    actor: "admin",
    actorBadge: "Manual Admin",
    icon: "person_add",
    title: "Tenant Creation & Allocation",
    actorName: "Enterprise SuperAdmin",
    description: "Provisions tenant identity profile alex@hyperlink.dev and binds Cloud Business Tier policy limits.",
    module: "POLICY BINDING",
    status: "10GB / 12 MBX",
    statusColor: "text-indigo-400",
    code: 'POST /api/v1/tenants {tier: "biz"}',
    actionHint: "assigns domain"
  },
  {
    phase: 1,
    stepNum: "STEP 03",
    actor: "admin",
    actorBadge: "Manual Admin",
    icon: "language",
    title: "Apex Domain Assignment",
    actorName: "Enterprise SuperAdmin",
    description: "Attaches host domain apexdesign.io to tenant cgroup isolation context with dedicated vhost configuration.",
    module: "VIRTUAL HOST",
    status: "ATTACHED",
    statusColor: "text-blue-400",
    code: "PUT /vhosts/apexdesign.io/bind",
    actionHint: "configures records"
  },
  {
    phase: 1,
    stepNum: "STEP 04",
    actor: "admin",
    actorBadge: "Manual Admin",
    icon: "alt_route",
    title: "Authoritative DNS Zone Config",
    actorName: "Enterprise SuperAdmin",
    description: "Generates comprehensive DNS zone bundle including Anycast A records, MX routing, DKIM-2048 keys, SPF, and DMARC enforcement.",
    module: "DNS CHIPS",
    status: "ZONE OK",
    statusColor: "text-emerald-400",
    code: "A: 198.51.100.42 | MX: 10 | DKIM: OK",
    actionHint: "zone propagated"
  },
  {
    phase: 2,
    phaseTitle: "Phase 02: Tenant Activation & Identity",
    phaseDesc: "Asynchronous cryptographic token distribution and first-time tenant perimeter onboarding",
    stepNum: "STEP 05",
    actor: "system",
    actorBadge: "Automated Daemon",
    icon: "forward_to_inbox",
    title: "Secure Credential Dispatch",
    actorName: "System Event Bus / Mailer",
    description: "Automated high-priority transactional worker generates ephemeral AES-256 activation token, issuing magic link and portal entry keys to alex@hyperlink.dev.",
    module: "TOKEN VALIDITY",
    status: "TTL: 24h",
    statusColor: "text-amber-400",
    code: "EVENT dispatch.invite [status: 250 Sent]",
    actionHint: "dispatches credentials"
  },
  {
    phase: 2,
    stepNum: "STEP 06",
    actor: "user",
    actorBadge: "Tenant Action",
    icon: "passkey",
    title: "Tenant Portal Authentication",
    actorName: "Authenticated Tenant User",
    description: "Tenant verifies single-use token, provisions primary master passphrase, initializes cryptographic session, and enters the self-service management console.",
    module: "SESSION VAULT",
    status: "ACTIVE JWT",
    statusColor: "text-emerald-400",
    code: "AUTH /session/start [role: client_owner]",
    actionHint: "authenticates session"
  },
  {
    phase: 3,
    phaseTitle: "Phase 03: Service Utilization & Automatic Provisioning",
    phaseDesc: "Self-service mailbox instantiations, real-time daemon filesystem allocation, and IMAP access",
    stepNum: "STEP 07",
    actor: "user",
    actorBadge: "Tenant Action",
    icon: "mark_email_read",
    title: "Mailbox Creation Request",
    actorName: "Tenant User",
    description: "Tenant configures mailbox identifier alex@apexdesign.io and assigns 2048MB quota boundary via interactive control.",
    module: "QUOTA SLIDER",
    status: "2,048 MB",
    statusColor: "text-indigo-400",
    code: "POST /api/v1/mailboxes {alloc: 2GB}",
    actionHint: "requests mailbox"
  },
  {
    phase: 3,
    stepNum: "STEP 08",
    actor: "system",
    actorBadge: "Automated Daemon",
    icon: "terminal",
    title: "Server Auto-Provisioning",
    actorName: "Dovecot / Postfix Daemon",
    description: "Background workers initialize Maildir directory tree, inject Postgres virtual_users tuple, and generate Let's Encrypt SNI TLS certificates.",
    module: "DAEMON RESPONSE",
    status: "200 PROVISIONED",
    statusColor: "text-emerald-400",
    code: "EXEC mkdir /var/mail/vhosts/apexdesign",
    actionHint: "provisions automatically"
  },
  {
    phase: 3,
    stepNum: "STEP 09",
    actor: "user",
    actorBadge: "Tenant Action",
    icon: "all_inbox",
    title: "Webmail & Client Access",
    actorName: "Tenant User",
    description: "User logs into webmail client or connects Apple Mail/Thunderbird over TLS (IMAP 993 / SMTP Submission 587) with instantaneous bidirectional sync.",
    module: "PROTOCOLS",
    status: "IMAPS / SMTPS",
    statusColor: "text-blue-400",
    code: "CONNECT imap.cloudhost.net:993",
    actionHint: "accesses webmail"
  },
  {
    phase: 3,
    stepNum: "STEP 10",
    actor: "user",
    actorBadge: "Tenant Action",
    icon: "tune",
    title: "Self-Service Security Mgmt",
    actorName: "Tenant User",
    description: "Direct self-service management: user updates mailbox credentials, manages sieve forwarding rules, spam thresholds, and vacation responders.",
    module: "SIEVE FILTERS",
    status: "ACTIVE",
    statusColor: "text-emerald-400",
    code: "PUT /api/v1/mailboxes/rules [204 OK]",
    actionHint: "manages settings"
  },
  {
    phase: 4,
    phaseTitle: "Phase 04: Scaling & Resource Lifecycle",
    phaseDesc: "Telemetry threshold triggering, upgrade workflows, and instantaneous storage re-partitioning",
    stepNum: "STEP 11",
    actor: "user",
    actorBadge: "Tenant Action",
    icon: "data_usage",
    title: "Quota Limit Alert & Upgrade Request",
    actorName: "Tenant User",
    description: "System flags 90% allocation limit on Cloud Business Tier. Tenant initiates self-service upgrade flow to Cloud Pro (50GB NVMe).",
    module: "STORAGE THRESHOLD",
    status: "9.1 GB / 10 GB (91%)",
    statusColor: "text-amber-400",
    code: "POST /api/v1/billing/upgrade {plan: 'pro'}",
    actionHint: "submits upgrade request"
  },
  {
    phase: 4,
    stepNum: "STEP 12",
    actor: "admin",
    actorBadge: "Admin / Auto Webhook",
    icon: "check_circle",
    title: "Approval & Dynamic Expansion",
    actorName: "SuperAdmin / Stripe Webhook Engine",
    description: "Payment clears via Stripe event hook or 1-click SuperAdmin authorization. ZFS filesystem pool expands quotas on-the-fly without downtime.",
    module: "SYSTEM STATUS",
    status: "EXPANSION APPLIED",
    statusColor: "text-emerald-400",
    code: "EXEC zfs set quota=50G pool/tenants/alex",
    actionHint: "lifecycle complete"
  }
];

export default function SystemOperationsPage() {
  const [filter, setFilter] = useState("all");

  const filteredSteps = STEPS.filter((s) => filter === "all" || s.actor === filter);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">
            <span>Architecture & Ops</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span>Orchestration</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-slate-200">End-to-End Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            End-to-End System Operational Workflow
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              v4.2-STABLE
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-3xl">
            Visualized operational execution plan detailing actor interactions, asynchronous server hooks, and deterministic lifecycle states from tenant provisioning to resource auto-scaling.
          </p>
        </div>

        {/* Live Telemetry Card */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3 px-5 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-200">Orchestrator Online</span>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Cluster Latency</p>
            <p className="text-sm font-extrabold text-emerald-400">18.4ms</p>
          </div>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actor Roles:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-200 text-xs font-semibold border border-indigo-700/50">
            <span className="material-symbols-outlined text-sm">shield_person</span> SuperAdmin
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-semibold border border-emerald-700/50">
            <span className="material-symbols-outlined text-sm">person</span> Tenant / User
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 text-blue-300 text-xs font-semibold border border-blue-700/50">
            <span className="material-symbols-outlined text-sm">precision_manufacturing</span> Automated Daemon
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: "all", label: "All 12 Steps" },
            { id: "admin", label: "Admin Only" },
            { id: "user", label: "Tenant Only" },
            { id: "system", label: "Automated Hooks" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === item.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Steps Grouped by Phase */}
      {[1, 2, 3, 4].map((phaseNum) => {
        const phaseSteps = filteredSteps.filter((s) => s.phase === phaseNum);
        if (phaseSteps.length === 0) return null;

        const firstStep = STEPS.find((s) => s.phase === phaseNum && s.phaseTitle);

        return (
          <section key={phaseNum} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  0{phaseNum}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white uppercase tracking-wide">
                    {firstStep?.phaseTitle || `Phase 0${phaseNum}`}
                  </h2>
                  <p className="text-xs text-slate-400">{firstStep?.phaseDesc}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                {phaseSteps.length} Units Visible
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {phaseSteps.map((s, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-0.5 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-400 tracking-wider">{s.stepNum}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          s.actor === "admin"
                            ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                            : s.actor === "user"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : "bg-blue-950 text-blue-300 border-blue-800"
                        }`}
                      >
                        {s.actorBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined">{s.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-snug">{s.title}</h3>
                        <p className="text-[11px] text-slate-400">{s.actorName}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">{s.module}</span>
                      <span className={`font-bold ${s.statusColor}`}>{s.status}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-md font-mono text-[11px] text-indigo-300 truncate border border-slate-800">
                      {s.code}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-indigo-400 pt-1">
                      <span>{s.actionHint}</span>
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Protocol Reference Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400">dataset</span>
            <h3 className="text-base font-bold text-white">Daemon & Protocol Execution Reference Matrix</h3>
          </div>
          <span className="text-xs text-slate-400">Target OS: Ubuntu 24.04 LTS / Postfix / Dovecot / ZFS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Lifecycle Phase</th>
                <th className="py-3 px-4">Subsystem</th>
                <th className="py-3 px-4">Daemon / Protocol</th>
                <th className="py-3 px-4">State Transition</th>
                <th className="py-3 px-4 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white">Phase 1: Admin Onboard</td>
                <td className="py-3 px-4">Core Management API</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                    BIND9 / PowerDNS
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">Zone apex initialized & replicated</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">SIG-SHA256</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white">Phase 2: Activation</td>
                <td className="py-3 px-4">Transactional Bus</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                    Postfix SMTP Outbound
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">Magic-link token issued (TTL 24h)</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">HMAC-VALID</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white">Phase 3: Service Provision</td>
                <td className="py-3 px-4">Storage & IMAP Node</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    Dovecot LDA / Certbot SNI
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">Virtual Maildir partitioned with Let's Encrypt TLS</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">ENCRYPTED</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-white">Phase 4: Auto-Scaling</td>
                <td className="py-3 px-4">Kernel ZFS Manager</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    ZFS Dataset Controller
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">Storage boundary expanded from 10G to 50G</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">ATOMIC-OK</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
