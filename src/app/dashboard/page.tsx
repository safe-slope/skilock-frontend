"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lock = {
  id: number;
  macAddress: string;
  state: "LOCKED" | "UNLOCKED" | "UNKNOWN";
  mode: "NORMAL" | "SERVICE" | "MAINTENANCE" | "DISABLED";
};

type PageLockDto = { content: Lock[]; totalElements: number };

type LockEvent = {
  id: number;
  eventTime: string;
  eventType: string;
  lockId: number;
  skiTicketId: number;
};

type PageLockEventDto = { content: LockEvent[]; totalElements: number };

export default function DashboardPage() {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [events, setEvents] = useState<LockEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [lr, er] = await Promise.all([
          fetch("/api/locks?page=0&size=5", { cache: "no-store" }),
          fetch("/api/lock-events?page=0&size=5", { cache: "no-store" }),
        ]);
        if (!lr.ok) throw new Error(await lr.text());
        if (!er.ok) throw new Error(await er.text());

        const ljson = (await lr.json()) as PageLockDto;
        const ejson = (await er.json()) as PageLockEventDto;

        setLocks(ljson.content ?? []);
        setEvents(ejson.content ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      {err && <p style={{ color: "tomato" }}>{err}</p>}
      {loading && !err && <p>Loading…</p>}

      {!loading && !err && (
        <div className="dash-grid">
          <section className="tile">
            <div className="tile-header">
              <h2>Locks</h2>
              <Link href="/locks">View all</Link>
            </div>
            {locks.length === 0 ? (
              <p>No locks.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {locks.map((l) => (
                  <li key={l.id}>
                    {l.macAddress} — {l.state} ({l.mode})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="tile">
            <div className="tile-header">
              <h2>Events</h2>
              <Link href="/lock-events">View all</Link>
            </div>
            {events.length === 0 ? (
              <p>No events.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {events.map((ev) => (
                  <li key={ev.id}>
                    {new Date(ev.eventTime).toLocaleString()} — {ev.eventType} (Lock {ev.lockId})
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
