export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>

      <nav>
        <ul>
          <li>
            <a href="/locks">Locks</a>
          </li>
          <li>
            <a href="/lock-events">Events</a>
          </li>
          <li>
            <a href="/monitoring">Monitoring</a>
          </li>
        </ul>
      </nav>
    </main>
  );
}
