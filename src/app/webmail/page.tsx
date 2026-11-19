"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  preview: string;
  body: string;
  folder: "INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH";
  isRead: boolean;
  isStarred: boolean;
  time: string;
  avatarColor: string;
  attachments?: { name: string; size: string; type: string }[];
}

export default function WebmailPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMailbox, setActiveMailbox] = useState("alex@apexdesign.io");
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Login form states for dedicated webmail portal (mail.techsolutionor.com)
  const [loginEmail, setLoginEmail] = useState("alex@apexdesign.io");
  const [loginPassword, setLoginPassword] = useState("Alex@123456");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showServerSpecs, setShowServerSpecs] = useState(false);

  // Webmail Inbox states
  const [activeFolder, setActiveFolder] = useState<"INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH">("INBOX");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Compose State
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const loadMessages = async (folder: "INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH" = activeFolder) => {
    setLoadingMessages(true);
    try {
      const res = await api.webmail.messages(folder);
      if (res.success && res.data) {
        const rawList = res.data.messages || [];
        const colors = ["bg-indigo-600", "bg-purple-600", "bg-emerald-600", "bg-blue-600", "bg-teal-600"];
        const mapped: Message[] = rawList.map((m: any, idx: number) => {
          const plainText = (m.bodyHtml || "").replace(/<[^>]+>/g, " ").trim();
          return {
            id: m.id,
            sender: m.sender,
            recipient: m.recipient,
            subject: m.subject || "(No Subject)",
            preview: plainText.slice(0, 95) + (plainText.length > 95 ? "..." : ""),
            body: m.bodyHtml || "",
            folder: m.folder,
            isRead: m.isRead,
            isStarred: m.isStarred,
            time: m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Recent",
            avatarColor: colors[idx % colors.length],
            attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : undefined,
          };
        });
        setMessages(mapped);
        if (mapped.length > 0) {
          setSelectedMessageId(mapped[0].id);
        } else {
          setSelectedMessageId("");
        }
      }
    } catch (err) {
      console.error("Failed to load messages from backend:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("auth_role");
    const savedEmail = localStorage.getItem("auth_email");
    const token = localStorage.getItem("auth_token");

    if (token && savedEmail) {
      setIsAuthenticated(true);
      setActiveMailbox(savedEmail);
      setLoginEmail(savedEmail);
      loadMessages("INBOX");
    }
  }, []);

  const handleWebmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await api.auth.login(loginEmail, loginPassword);
      if (res.success && res.data) {
        localStorage.setItem("auth_token", res.data.accessToken);
        localStorage.setItem("auth_role", res.data.user.role || "MAILBOX_USER");
        localStorage.setItem("auth_email", res.data.user.email);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));

        setActiveMailbox(res.data.user.email);
        setIsAuthenticated(true);
        loadMessages("INBOX");
        return;
      }

      setLoginError(res.error || "Authentication failed. Invalid email or password.");
    } catch (err: any) {
      setLoginError(err.message || "Failed to authenticate with mail.techsolutionor.com");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_email");
    localStorage.removeItem("auth_user");
    setIsAuthenticated(false);
    setMessages([]);
    setSelectedMessageId("");
  };

  const handleSelectFolder = (folder: "INBOX" | "SENT" | "DRAFTS" | "SPAM" | "TRASH") => {
    setActiveFolder(folder);
    loadMessages(folder);
  };

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || messages[0];

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.webmail.toggleStar(id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = (id: string) => {
    setSelectedMessageId(id);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
    );
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeBody) return;
    setIsSending(true);

    try {
      const res = await api.webmail.send({
        recipient: composeTo.trim(),
        subject: composeSubject.trim() || "(No Subject)",
        bodyHtml: `<p>${composeBody.replace(/\n/g, "<br/>")}</p>`,
      });

      if (res.success) {
        setIsComposeOpen(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        alert("Email sent successfully!");
        setActiveFolder("SENT");
        loadMessages("SENT");
      } else {
        alert(res.error || "Failed to send email.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedMessage) return;
    try {
      await api.webmail.deleteMessage(selectedMessage.id);
      loadMessages(activeFolder);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // =========================================================================
  // VIEW 1: DEDICATED WEBMAIL LOGIN PORTAL (mail.techsolutionor.com)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Node Indicator Banner */}
        <div className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Webmail Gateway:</span>
          <strong className="text-white font-mono">mail.techsolutionor.com</strong>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-semibold text-[11px]">TLS 1.3 256-bit</span>
        </div>

        {/* Card */}
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative z-10 backdrop-blur-xl">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
              <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Webmail Client
            </h1>
            <p className="text-xs text-slate-400">
              Sign in to your domain email inbox on <span className="text-indigo-400 font-mono font-semibold">mail.techsolutionor.com</span>
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-indigo-400">touch_app</span>
              <span>1-Click Test Mailbox Login:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("alex@apexdesign.io");
                  setLoginPassword("Alex@123456");
                  setLoginError("");
                }}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${
                  loginEmail === "alex@apexdesign.io"
                    ? "bg-indigo-600/20 border-indigo-500 text-white font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="text-[11px] font-semibold truncate">alex@apexdesign.io</div>
                <div className="text-[9px] text-slate-500">Alex@123456</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginEmail("support@apexdesign.io");
                  setLoginPassword("Support@123456");
                  setLoginError("");
                }}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${
                  loginEmail === "support@apexdesign.io"
                    ? "bg-indigo-600/20 border-indigo-500 text-white font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="text-[11px] font-semibold truncate">support@apexdesign.io</div>
                <div className="text-[9px] text-slate-500">Support@123456</div>
              </button>
            </div>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleWebmailLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                  alternate_email
                </span>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@yourdomain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Mailbox Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
                  lock_outline
                </span>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter mailbox password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loginLoading ? (
                <span>Connecting to mail.techsolutionor.com...</span>
              ) : (
                <>
                  <span>Sign In to Webmail</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Server Config & Return to Panel */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3 text-center text-xs">
            <button
              type="button"
              onClick={() => setShowServerSpecs(!showServerSpecs)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>{showServerSpecs ? "Hide Client Setup Specs" : "View IMAP / SMTP Setup Specs"}</span>
            </button>

            {showServerSpecs && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-1.5 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">IMAP Server:</span>
                  <span className="text-white font-bold">mail.techsolutionor.com (Port 993 SSL)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SMTP Server:</span>
                  <span className="text-white font-bold">mail.techsolutionor.com (Port 465 SSL)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Webmail URL:</span>
                  <span className="text-indigo-400 font-bold">https://mail.techsolutionor.com</span>
                </div>
              </div>
            )}

            <div className="pt-1">
              <Link
                href="/login"
                className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center justify-center gap-1 transition"
              >
                <span>Are you a Domain Owner or Admin?</span>
                <span className="text-indigo-400 font-bold underline">Go to Main Hosting Panel &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED WEBMAIL SUITE (Inbox / Compose / Folders)
  // =========================================================================
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Webmail Bar with Node Branding */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
            <span className="material-symbols-outlined text-indigo-400 text-lg">mail</span>
            <span className="text-xs font-bold text-white font-mono">{activeMailbox}</span>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Host: <strong className="font-mono">mail.techsolutionor.com</strong>
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-6 hidden sm:block">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search messages, sender, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span className="hidden sm:inline">New Email</span>
          </button>

          <Link
            href="/dashboard"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
            title="Main Control Panel"
          >
            <span className="material-symbols-outlined text-sm text-indigo-400">dashboard</span>
            <span>Main Panel</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
            title="Sign out of Webmail"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Folders */}
        <div className="w-56 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="space-y-1">
              {[
                { folder: "INBOX", label: "Inbox", icon: "inbox", count: messages.filter((m) => m.folder === "INBOX" && !m.isRead).length },
                { folder: "SENT", label: "Sent Items", icon: "send", count: 0 },
                { folder: "DRAFTS", label: "Drafts", icon: "draft", count: 0 },
                { folder: "SPAM", label: "Junk / Spam", icon: "report", count: 0 },
                { folder: "TRASH", label: "Trash", icon: "delete", count: 0 },
              ].map((item) => (
                <button
                  key={item.folder}
                  onClick={() => handleSelectFolder(item.folder as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeFolder === item.folder
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-900">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Storage Quota Widget */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Mailbox Quota</span>
                <span className="text-white font-bold font-mono">14% Used</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-[14%] rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-500">286 MB of 2,048 MB allocated</p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center font-mono">
            Node: mail.techsolutionor.com
          </div>
        </div>

        {/* Middle Column: Message List */}
        <div className="w-80 sm:w-96 bg-slate-900/40 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-white capitalize">{activeFolder.toLowerCase()}</span>
            <span>{filteredMessages.length} message(s)</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loadingMessages ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-indigo-400">progress_activity</span>
                <span>Connecting to mail.techsolutionor.com...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No messages found in {activeFolder.toLowerCase()}.
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => markAsRead(msg.id)}
                  className={`p-4 cursor-pointer transition-all border-l-2 ${
                    selectedMessage?.id === msg.id
                      ? "bg-indigo-600/10 border-indigo-500"
                      : "border-transparent hover:bg-slate-800/40"
                  } ${!msg.isRead ? "font-bold text-white" : "text-slate-300"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs truncate max-w-[200px]">{msg.sender}</span>
                    <span className="text-[10px] text-slate-500">{msg.time}</span>
                  </div>
                  <h4 className="text-xs text-slate-200 truncate mb-1">{msg.subject}</h4>
                  <p className="text-[11px] text-slate-400 truncate line-clamp-2">{msg.preview}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Message View */}
        <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Message Header */}
              <div className="p-6 border-b border-slate-800 space-y-4 shrink-0 bg-slate-900/30">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-bold text-white">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => toggleStar(selectedMessage.id, e)}
                      className={`p-2 rounded-lg hover:bg-slate-800 transition ${
                        selectedMessage.isStarred ? "text-amber-400" : "text-slate-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">star</span>
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${selectedMessage.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                      {selectedMessage.sender.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white">{selectedMessage.sender}</div>
                      <div className="text-[11px] text-slate-400">To: {selectedMessage.recipient}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px]">{selectedMessage.time}</span>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-200 leading-relaxed space-y-4">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
                  className="prose prose-invert max-w-none text-xs sm:text-sm space-y-2"
                />

                {selectedMessage.attachments && (
                  <div className="pt-6 border-t border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase">
                      Attachments ({selectedMessage.attachments.length})
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {selectedMessage.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                        >
                          <span className="material-symbols-outlined text-indigo-400 text-lg">
                            attachment
                          </span>
                          <span>{att.name}</span>
                          <span className="text-[10px] text-slate-500">({att.size})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a message to view content.
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE EMAIL MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">edit_square</span>
                Compose New Message
              </h3>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">From</label>
                <input
                  type="text"
                  disabled
                  value={activeMailbox}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">To</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@domain.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Subject line"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Message Body</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Write your email message..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isSending ? "hourglass_top" : "send"}
                  </span>
                  <span>{isSending ? "Sending..." : "Send Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
