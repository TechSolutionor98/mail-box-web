import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Hosting Control Panel Platform",
  description: "Next-generation cloud web hosting control panel, server management, and DNS zone editor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col lg:flex-row">
        <Navigation />
        <main className="flex-1 min-w-0 min-h-screen bg-slate-950 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
