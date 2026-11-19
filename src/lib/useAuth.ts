"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useRequireAuth(allowedRoles?: string[]) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("auth_role");
    const userStr = localStorage.getItem("auth_user");

    // 1. Not logged in -> redirect to login page
    if (!token || !savedRole) {
      if (typeof window !== "undefined") {
        const host = window.location.hostname.toLowerCase();
        if (host.startsWith("superadmin")) {
          router.replace("/admin/login");
          return;
        }
      }
      router.replace("/login");
      return;
    }

    // 2. Role check if specific roles are required
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(savedRole)) {
      if (savedRole === "MAILBOX_USER") {
        router.replace("/webmail");
      } else if (savedRole === "USER") {
        router.replace("/dashboard");
      } else if (savedRole === "SUPER_ADMIN" || savedRole === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/login");
      }
      return;
    }

    // 3. Authorized
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {}
    }
    setRole(savedRole);
    setAuthorized(true);
  }, [router]);

  return { authorized, user, role };
}
