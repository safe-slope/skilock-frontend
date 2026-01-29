import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <nav className="header-nav">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/locks">Locks</Link>
        <Link href="/lock-events">Events</Link>

        <div className="nav-spacer" />
        <form action="/api/auth/logout" method="post">
          <button type="submit">Logout</button>
        </form>
      </nav>
    </header>
  );
}
