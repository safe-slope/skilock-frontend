"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <nav className="header-nav">
        <Link
          href="/dashboard"
          className={isActive(pathname, "/dashboard") ? "nav-link active" : "nav-link"}
        >
          Dashboard
        </Link>

        <Link
          href="/locks"
          className={isActive(pathname, "/locks") ? "nav-link active" : "nav-link"}
        >
          Locks
        </Link>

        <Link
          href="/lock-events"
          className={isActive(pathname, "/lock-events") ? "nav-link active" : "nav-link"}
        >
          Events
        </Link>

        <div className="nav-spacer" />

        <form action="/api/auth/logout" method="post">
          <button type="submit">Logout</button>
        </form>
      </nav>
    </header>
  );
}
