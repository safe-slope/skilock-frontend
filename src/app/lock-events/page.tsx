"use client";

import { useEffect, useState } from "react";

type PageLockEventDto = {
  content?: Array<{
    id?: number;
    eventTime?: string;
    eventType?: string;
    lockId?: number;
    skiTicketId?: number;
  }>;
  totalElements?: number;
  totalPages?: number;
};

export default function LockEventsPage() {
  const [data, setData] = useState<PageLockEventDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/lock-events?page=0&size=50", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <main>Loading...</main>;

  return (
    <main>
      <h1>Lock events</h1>

      {error && <pre>{error}</pre>}

      <div>TotalElements: {data?.totalElements ?? 0}</div>

      {(data?.content?.length ?? 0) === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul>
          {(data?.content ?? []).map((e) => (
            <li key={e.id ?? `${e.eventTime}-${e.lockId}`}>
              <div>Time: {e.eventTime}</div>
              <div>Type: {e.eventType}</div>
              <div>LockId: {e.lockId}</div>
              <div>SkiTicketId: {e.skiTicketId}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
