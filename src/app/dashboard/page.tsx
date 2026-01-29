"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function parseTimeMs(s?: string) {
  if (!s) return 0;
  const d = new Date(s);
  const ms = d.getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function formatTime(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

function eventKind(t?: string): "ok" | "warn" | "bad" | "muted" {
  if (!t) return "muted";
  if (t === "LOCK" || t === "UNLOCK") return "ok";
  if (t.startsWith("SET_MODE_TO_")) return "warn";
  if (t === "ACTION_FAILED" || t === "COMMUNICATION_ERROR") return "bad";
  return "muted";
}

function Badge({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: "ok" | "warn" | "bad" | "muted";
}) {
  return <span className={`sl-badge sl-${kind}`}>{children}</span>;
}

function countBy<T extends string | number>(arr: T[]) {
  const m = new Map<T, number>();
  for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

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
          fetch("/api/locks?page=0&size=200", { cache: "no-store" }),
          fetch("/api/lock-events?page=0&size=200", { cache: "no-store" }),
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

  const derived = useMemo(() => {
    const totalLocks = locks.length;

    const stateCounts = countBy(locks.map((l) => l.state));
    const modeCounts = countBy(locks.map((l) => l.mode));

    const locked = stateCounts.get("LOCKED") ?? 0;
    const unlocked = stateCounts.get("UNLOCKED") ?? 0;
    const unknown = stateCounts.get("UNKNOWN") ?? 0;

    const nonNormal = locks.filter((l) => l.mode !== "NORMAL").length;
    const attention = locks.filter((l) => l.state === "UNKNOWN" || l.mode === "DISABLED").length;

    const eventsSorted = [...events].sort((a, b) => parseTimeMs(b.eventTime) - parseTimeMs(a.eventTime));
    const recentEvents = eventsSorted.slice(0, 12);

    const attentionLocks = locks
      .filter((l) => l.state === "UNKNOWN" || l.mode === "DISABLED")
      .slice(0, 6);

    const nonNormalLocksList = locks
      .filter((l) => l.mode !== "NORMAL")
      .slice(0, 6);


    const activity = new Map<number, number>();
    for (const ev of events) activity.set(ev.lockId, (activity.get(ev.lockId) ?? 0) + 1);
    const topActiveLocks = Array.from(activity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([lockId, cnt]) => {
        const lock = locks.find((l) => l.id === lockId);
        return { lockId, cnt, mac: lock?.macAddress, state: lock?.state, mode: lock?.mode };
      });


    const failures = events.filter((e) => e.eventType === "ACTION_FAILED" || e.eventType === "COMMUNICATION_ERROR").length;

    return {
      totalLocks,
      locked,
      unlocked,
      unknown,
      nonNormal,
      attention,
      modeCounts,
      recentEvents,
      attentionLocks,
      nonNormalLocksList,
      topActiveLocks,
      failures,
      totalEventsLoaded: events.length,
    };
  }, [locks, events]);

  return (
    <main className="app-page">
      <div className="container">
        <div className="sl-top">
          <div>
            <h1>Dashboard</h1>
            <p className="muted" style={{ marginTop: -6 }}>
              Overview of lock health and recent activity.
            </p>
          </div>

          <div className="sl-controls">
            <button onClick={() => location.reload()} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        {err && (
          <div className="card">
            <p style={{ margin: 0 }}>Error</p>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{err}</pre>
          </div>
        )}

        {loading && !err && <p className="muted">Loading…</p>}

        {!loading && !err && (
          <div className="grid-2">
       
             <section
              className="tile"
              style={{
                borderColor: "rgba(70, 55, 111, 0.35)",
                background: "rgba(120,255,170,0.05)",
              }}
            >
              <div className="tile-header">

                <h2>Health</h2>
                <Link href="/locks">View locks</Link>
              </div>
               <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                  Lock data
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div>
                    <span className="muted">Number of locks:</span> <b>{derived.totalLocks}</b>
                  </div>
                  <div>
                    <span className="muted">LOCKED:</span> <b>{derived.locked}</b>
                  </div>
                  <div>
                    <span className="muted">UNLOCKED:</span> <b>{derived.unlocked}</b>
                  </div>
                  <div>
                    <span className="muted">UNKNOWN:</span> <b>{derived.unknown}</b>
                  </div>
                </div>

                <div className="sl-divider" />

                {/* Modes */}
                <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                  Modes
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div>
                    <span className="muted">NORMAL:</span> <b>{derived.modeCounts.get("NORMAL") ?? 0}</b>
                  </div>
                  <div>
                    <span className="muted">SERVICE:</span> <b>{derived.modeCounts.get("SERVICE") ?? 0}</b>
                  </div>
                  <div>
                    <span className="muted">MAINTENANCE:</span> <b>{derived.modeCounts.get("MAINTENANCE") ?? 0}</b>
                  </div>
                  <div>
                    <span className="muted">DISABLED:</span> <b>{derived.modeCounts.get("DISABLED") ?? 0}</b>
                  </div>
                </div>
              <div className="sl-divider" />

              

              {derived.attentionLocks.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  Needs attention:
                </p>
              ) : null}

              <div className="sl-list">
                {(derived.attentionLocks.length > 0 ? derived.attentionLocks : derived.nonNormalLocksList).map((l) => (
                  <div key={l.id} className="card sl-row">
                    <div className="sl-id">Lock ID: {l.id}</div>
                    <div className="sl-meta">
                      <span>
                        <span className="muted">State</span> <b>{l.state}</b>
                      </span>
                      <span>
                        <span className="muted">Mode</span> <b>{l.mode}</b>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {(derived.attentionLocks.length === 0 && derived.nonNormalLocksList.length === 0) ? (
                <p className="muted" style={{ marginTop: 10 }}>
                  All locks are in NORMAL mode.
                </p>
              ) : null}
            </section>


            {/* Activity */}
            <section
              className="tile"
              style={{
                borderColor: "rgba(53, 35, 103, 0.35)",
                background: "rgba(198, 109, 37, 0.05)",
              }}
            >
              <div className="tile-header">
                <h2>Activity</h2>
                <Link href="/lock-events">View events</Link>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <span className="muted">Events loaded:</span> <b>{derived.totalEventsLoaded}</b>
                </div>
                <div>
                  <span className="muted">Failures:</span> <b>{derived.failures}</b>
                </div>
              </div>

              <div className="sl-divider" />

              <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                Most active locks
              </div>

              {derived.topActiveLocks.length === 0 ? (
                <p className="muted">No activity yet.</p>
              ) : (
                <div className="sl-list">
                  {derived.topActiveLocks.map((x) => (
                    <div key={x.lockId} className="card sl-row">
                      <div className="sl-id">Lock ID: {x.lockId}</div>
                      <div className="sl-meta">
                        <span>
                          <span className="muted">Events</span> <b>{x.cnt}</b>
                        </span>
                        <span>
                          <span className="muted">State</span> {x.state ?? "—"}
                        </span>
                        <span>
                          <span className="muted">Mode</span> {x.mode ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="tile" style={{ gridColumn: "1 / -1" }}>
              <div className="tile-header">
                <h2>Recent events</h2>
                <Link href="/lock-events">View events</Link>
              </div>

              {derived.recentEvents.length === 0 ? (
                <p className="muted">No events.</p>
              ) : (
                <div className="sl-list">
                  {derived.recentEvents.map((ev) => (
                    <div key={ev.id} className="card sl-row">
                      <div className="sl-id">Lock ID: {ev.lockId}</div>
                      <div className="sl-meta">
                        <span>
                          <span className="muted">Event type</span>{" "}
                          <Badge kind={eventKind(ev.eventType)}>{ev.eventType}</Badge>
                        </span>
                        <span>
                          <span className="muted">Time</span> {formatTime(ev.eventTime)}
                        </span>
                        <span>
                          <span className="muted">Ticket</span> {ev.skiTicketId ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
