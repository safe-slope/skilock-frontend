"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login";

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr" }}>
      {!hideNav && (
        <header style={{ padding: 16, borderBottom: "1px solid #ddd" }}>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/locks">Locks</Link>
            <Link href="/lock-events">Events</Link>
            <Link href="/monitoring">Monitoring</Link>

            <form action="/api/auth/logout" method="post">
              <button type="submit">Logout</button>
            </form>
          </nav>
        </header>
      )}

      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
