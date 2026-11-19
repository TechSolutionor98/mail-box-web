const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return "http://127.0.0.1:4000/api/v1";
};

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const baseUrl = getApiBase();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        success: false,
        error: json?.error || json?.message || `Request failed with status ${res.status}`,
      };
    }
    return json || { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error: backend server may be unreachable.",
    };
  }
}

export const api = {
  auth: {
    login: (email: string, password: string, totpToken?: string) =>
      apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, totpToken }),
      }),
    register: (email: string, password: string, packageId?: string) =>
      apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, packageId }),
      }),
    me: () => apiRequest("/auth/me"),
  },
  admin: {
    stats: () => apiRequest<{
      totalUsers: number;
      activeUsers: number;
      suspendedUsers: number;
      totalDomains: number;
      activeDomains: number;
      totalMailboxes: number;
      activeMailboxes: number;
      totalPackages: number;
      recentUsers: any[];
    }>("/admin/stats"),
    users: () => apiRequest<any[]>("/admin/users"),
    createUser: (data: { email: string; password: string; role?: string; packageId?: string }) =>
      apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateUserStatus: (id: string, status: "ACTIVE" | "SUSPENDED") =>
      apiRequest(`/admin/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    deleteUser: (id: string) =>
      apiRequest(`/admin/users/${id}`, {
        method: "DELETE",
      }),
    domains: () => apiRequest<any[]>("/admin/domains"),
    activityLogs: () => apiRequest<any[]>("/admin/activity-logs"),
    packages: () => apiRequest<any[]>("/admin/packages"),
  },
  webmail: {
    messages: (folder: string = "INBOX") =>
      apiRequest<{ messages: any[]; unreadCount: number; activeFolder: string }>(
        `/webmail/messages?folder=${folder}`
      ),
    message: (id: string) => apiRequest<any>(`/webmail/messages/${id}`),
    send: (data: { recipient: string; subject: string; bodyHtml: string; attachmentsJson?: string }) =>
      apiRequest("/webmail/send", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    saveDraft: (data: { recipient: string; subject: string; bodyHtml: string }) =>
      apiRequest("/webmail/draft", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    toggleStar: (id: string) =>
      apiRequest(`/webmail/messages/${id}/star`, {
        method: "PUT",
      }),
    moveFolder: (id: string, folder: string) =>
      apiRequest(`/webmail/messages/${id}/folder`, {
        method: "PUT",
        body: JSON.stringify({ folder }),
      }),
    deleteMessage: (id: string) =>
      apiRequest(`/webmail/messages/${id}`, {
        method: "DELETE",
      }),
  },
  user: {
    profile: () => apiRequest<any>("/user/profile"),
    domains: () => apiRequest<any[]>("/user/domains"),
    addDomain: (domainName: string) =>
      apiRequest("/user/domains", {
        method: "POST",
        body: JSON.stringify({ domainName }),
      }),
    deleteDomain: (id: string) =>
      apiRequest(`/user/domains/${id}`, {
        method: "DELETE",
      }),
    dnsRecords: (domainId: string) => apiRequest<any[]>(`/user/domains/${domainId}/dns`),
    addDnsRecord: (data: { domainId: string; type: string; name: string; value: string; ttl?: number; priority?: number }) =>
      apiRequest("/user/dns", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deleteDnsRecord: (id: string) =>
      apiRequest(`/user/dns/${id}`, {
        method: "DELETE",
      }),
    mailboxes: (domainId?: string) =>
      apiRequest<any[]>(`/user/mailboxes${domainId ? `?domainId=${domainId}` : ""}`),
    createMailbox: (data: { domainId: string; emailAddress: string; password: string; quotaMb?: number }) =>
      apiRequest("/user/mailboxes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deleteMailbox: (id: string) =>
      apiRequest(`/user/mailboxes/${id}`, {
        method: "DELETE",
      }),
    packages: () => apiRequest<any[]>("/user/packages"),
  },
};
