import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() || "";
  const { pathname } = request.nextUrl;

  // Skip static assets, Next.js internal files, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ----------------------------------------------------------------------
  // 1. MAIL / WEBMAIL SUBDOMAIN (mail.techsolutionor.com or webmail.*)
  // ----------------------------------------------------------------------
  if (host.startsWith("mail.") || host.startsWith("webmail.")) {
    // If root or /login or anything else, route to /webmail
    if (pathname === "/" || pathname === "/login" || !pathname.startsWith("/webmail")) {
      const url = request.nextUrl.clone();
      url.pathname = "/webmail";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ----------------------------------------------------------------------
  // 2. SUPER ADMIN SUBDOMAIN (superadminpane.techsolutionor.com / superadminpanel.* / superadmin.*)
  // ----------------------------------------------------------------------
  if (
    host.startsWith("superadminpane.") ||
    host.startsWith("superadminpanel.") ||
    host.startsWith("superadmin.")
  ) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ----------------------------------------------------------------------
  // 3. USER CONTROL PANEL (tpanel.techsolutionor.com)
  // ----------------------------------------------------------------------
  if (host.startsWith("tpanel.")) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
