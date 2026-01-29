"use client";

import { useEffect, useMemo, useState } from "react";

type LockEvent = {
  id?: number;
  eventTime?: string;
  eventType?: string;
  lockId?: number;
  skiTicketId?: number;
};

type PageLockEventDto = {
  content?: LockEvent[];
  totalElements?: number;
  totalPages?: number;
};

function Badge({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: "ok" | "warn" | "bad" | "muted";
}) {
  return <span className={`sl-badge sl-${kind}`}>{children}</span>;
}

function eventKind(t?: string): "ok" | "warn" | "bad" | "muted" {
  if (!t) return "muted";
  if (t === "LOCK" || t === "UNLOCK") return "ok";
  if (t.startsWith("SET_MODE_TO_")) return "warn";
  if (t === "ACTION_FAILED" || t === "COMMUNICATION_ERROR") return "bad";
  return "muted";
}

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

export default function LockEventsPage() {
  const [data, setData] = useState<PageLockEventDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const size = 50;

  const [lockIdInput, setLockIdInput] = useState("");
  const [lockIdFilter, setLockIdFilter] = useState<number | null>(null);
  const [order, setOrder] = useState<"newest" | "oldest">("newest");

  const [view, setView] = useState<"timeline" | "grouped">("timeline");

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/lock-events?page=${p}&size=${size}`, { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      setData((await r.json()) as PageLockEventDto);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const rawEvents = data?.content ?? [];

  const events = useMemo(() => {
    let arr = [...rawEvents];

    if (lockIdFilter != null) {
      arr = arr.filter((e) => e.lockId === lockIdFilter);
    }

    arr.sort((a, b) => {
      const ta = parseTimeMs(a.eventTime);
      const tb = parseTimeMs(b.eventTime);
      return order === "newest" ? tb - ta : ta - tb;
    });

    return arr;
  }, [rawEvents, lockIdFilter, order]);

  const grouped = useMemo(() => {
    const m = new Map<number, LockEvent[]>();
    for (const e of events) {
      const id = typeof e.lockId === "number" ? e.lockId : -1;
      const arr = m.get(id) ?? [];
      arr.push(e);
      m.set(id, arr);
    }

    return Array.from(m.entries()).sort((a, b) => {
      if (a[0] === -1) return 1;
      if (b[0] === -1) return -1;
      return a[0] - b[0];
    });
  }, [events]);

  const summary = useMemo(() => {
    return {
      eventsOnPage: rawEvents.length,
      eventsShown: events.length,
      total: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 0,
    };
  }, [events.length, rawEvents.length, data?.totalElements, data?.totalPages]);

  function applyLockIdFilter() {
    const v = lockIdInput.trim();
    if (!v) {
      setLockIdFilter(null);
      return;
    }
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) {
      alert("Lock ID must be a positive integer.");
      return;
    }
    setLockIdFilter(n);
  }

  function clearFilter() {
    setLockIdInput("");
    setLockIdFilter(null);
  }

  if (loading) {
    return (
      <main className="app-page">
        <div className="container">
          <p className="muted">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="container">
        <div className="sl-top">
          <div>
            <h1>Events</h1>
            <p className="muted" style={{ marginTop: -6 }}>
              Lock activity log. Default sort: <b>time</b>.
            </p>
          </div>

          <div className="sl-controls">
            <button onClick={() => load(page)}>Refresh</button>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={summary.totalPages ? page + 1 >= summary.totalPages : false}
            >
              Next
            </button>
          </div>
        </div>

        <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>
          Page <b>{page + 1}</b>
          {summary.totalPages ? (
            <>
              {" "}
              / <b>{summary.totalPages}</b>
            </>
          ) : null}
          {" • "}Loaded <b>{summary.eventsOnPage}</b>
        </p>

        <div className="tile" style={{ marginBottom: 14 }}>
          {/* row 1: filter + time */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ minWidth: 220 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Filter by Lock ID
              </div>
              <input
                className="input"
                value={lockIdInput}
                placeholder="e.g. 4001"
                onChange={(e) => setLockIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLockIdFilter();
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 18 }}>
              <button onClick={applyLockIdFilter}>Apply</button>
              <button onClick={clearFilter} disabled={lockIdFilter == null && lockIdInput.trim() === ""}>
                Clear
              </button>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", paddingTop: 18 }}>
              <span className="muted" style={{ fontSize: 13 }}>
                Time
              </span>
              <button className={order === "newest" ? "sl-primary" : ""} onClick={() => setOrder("newest")}>
                Newest
              </button>
              <button className={order === "oldest" ? "sl-primary" : ""} onClick={() => setOrder("oldest")}>
                Oldest
              </button>
            </div>
          </div>


          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 13 }}>
              View
            </span>
            <button className={view === "timeline" ? "sl-primary" : ""} onClick={() => setView("timeline")}>
              Timeline
            </button>
            <button className={view === "grouped" ? "sl-primary" : ""} onClick={() => setView("grouped")}>
              Group by lock
            </button>

            {lockIdFilter != null ? (
              <span className="muted" style={{ marginLeft: "auto", fontSize: 13 }}>
                Active: <b>Lock {lockIdFilter}</b>
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "8px 0 18px" }}>
          <div>
            <span className="muted">Shown events:</span> <b>{summary.eventsShown}</b>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <span className="muted">Total events:</span> <b>{summary.total}</b>
          </div>
        </div>


        {error && (
          <div className="card">
            <p style={{ margin: 0 }}>Error</p>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{error}</pre>
          </div>
        )}

        {events.length === 0 ? (
          <div className="card">
            <p>No events found.</p>
          </div>
        ) : view === "timeline" ? (
    
          <div className="sl-list">
            {events.map((e) => (
              <div key={e.id ?? `${e.eventTime}-${e.lockId}-${e.eventType}`} className="card sl-row">
                <div className="sl-mac">Lock {e.lockId ?? "—"}</div>

                <div className="sl-meta">
                  <span>
                    <span className="muted">Type</span>{" "}
                    <Badge kind={eventKind(e.eventType)}>{e.eventType ?? "—"}</Badge>
                  </span>

                  <span>
                    <span className="muted">Time</span> {formatTime(e.eventTime)}
                  </span>

                  <span>
                    <span className="muted">Ticket</span> {e.skiTicketId ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
       
          <div className="sl-list">
            {grouped.map(([lockId, group], idx) => (
              <div key={lockId}>
                {idx > 0 && <div className="sl-divider" />}

                <div className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>
                  Lock ID: <b style={{ color: "rgba(255,255,255,0.92)" }}>{lockId === -1 ? "—" : lockId}</b>
                </div>

                {group.map((e) => (
                  <div key={e.id ?? `${e.eventTime}-${e.lockId}-${e.eventType}`} className="card sl-row">
                    <div className="sl-mac">Lock {e.lockId ?? "—"}</div>

                    <div className="sl-meta">
                      <span>
                        <span className="muted">Type</span>{" "}
                        <Badge kind={eventKind(e.eventType)}>{e.eventType ?? "—"}</Badge>
                      </span>

                      <span>
                        <span className="muted">Time</span> {formatTime(e.eventTime)}
                      </span>

                      <span>
                        <span className="muted">Ticket</span> {e.skiTicketId ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
