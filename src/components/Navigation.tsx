"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<string>("USER");
  const [email, setEmail] = useState<string>("user@apexdesign.io");

  useEffect(() => {
    const savedRole = localStorage.getItem("auth_role");
    const savedEmail = localStorage.getItem("auth_email");
    if (savedRole) setRole(savedRole);
    if (savedEmail) setEmail(savedEmail);
  }, [pathname]);

  // If on login page, render full width without sidebar navigation
  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_email");
    localStorage.removeItem("auth_user");
    router.push("/login");
  };

  // Generate Navigation items according to active role
  const getNavGroups = () => {
    if (role === "SUPER_ADMIN") {
      return [
        {
          category: "Super Admin Controls",
          items: [
            { href: "/admin", label: "Admin Overview", icon: "admin_panel_settings" },
            { href: "/admin/users", label: "User Accounts", icon: "group" },
            { href: "/domains", label: "Global Domains List", icon: "language" },
            { href: "/packages", label: "Hosting Packages", icon: "inventory_2" },
            { href: "/webmail", label: "Webmail Console", icon: "mark_email_unread" },
          ],
        },
        {
          category: "System Overview",
          items: [
            { href: "/", label: "Architecture Diagram", icon: "account_tree" },
          ],
        },
      ];
    }

    if (role === "MAILBOX_USER") {
      return [
        {
          category: "Webmail Suite",
          items: [
            { href: "/webmail", label: "Webmail Client", icon: "mark_email_unread" },
          ],
        },
        {
          category: "Account Info",
          items: [
            { href: "/login", label: "Switch Account", icon: "swap_horiz" },
          ],
        },
      ];
    }

    // Default USER (Domain Owner)
    return [
      {
        category: "Domain & Mail Portal",
        items: [
          { href: "/dashboard", label: "User Dashboard", icon: "dashboard" },
          { href: "/domains", label: "My Domains & Mailboxes", icon: "language" },
          { href: "/domains/apexdesign.io", label: "DNS & Email Accounts", icon: "dns" },
          { href: "/webmail", label: "Webmail Client", icon: "mark_email_unread" },
          { href: "/packages", label: "Packages & Upgrade", icon: "upgrade" },
        ],
      },
      {
        category: "System Overview",
        items: [
          { href: "/", label: "Operations Workflow", icon: "account_tree" },
          { href: "/login", label: "Switch Account", icon: "swap_horiz" },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  const getRoleBadge = () => {
    if (role === "SUPER_ADMIN") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
          Super Admin
        </span>
      );
    }
    if (role === "MAILBOX_USER") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Mailbox User
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        Domain Owner
      </span>
    );
  };

  return (
    <>
      {/* Mobile top nav bar */}
      <header className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            HCP
          </div>
          <span className="font-bold text-white text-base tracking-tight">HostCloud Platform</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">dns</span>
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight leading-none text-base">HostControl</h1>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wide">CLOUD SUITE</span>
            </div>
          </Link>
          {getRoleBadge()}
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h2 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {group.category}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-lg ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer profile snippet with Active Role Display & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                  role === "SUPER_ADMIN"
                    ? "bg-red-600"
                    : role === "MAILBOX_USER"
                    ? "bg-emerald-600"
                    : "bg-indigo-600"
                }`}
              >
                {email ? email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {role === "SUPER_ADMIN"
                    ? "Super Admin"
                    : role === "MAILBOX_USER"
                    ? "Webmail User"
                    : "Domain Owner"}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
