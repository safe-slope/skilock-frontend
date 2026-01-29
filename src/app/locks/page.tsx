"use client";

import { useEffect, useMemo, useState } from "react";

type Lock = {
  id: number;
  macAddress: string;
  state: "LOCKED" | "UNLOCKED" | "UNKNOWN";
  mode: "NORMAL" | "SERVICE" | "MAINTENANCE" | "DISABLED";
  lockerId: number;
  locationId?: number;
};

type PageLockDto = {
  content: Lock[];
  totalElements: number;
};

function Badge({ children, kind }: { children: React.ReactNode; kind: "ok" | "warn" | "bad" | "muted" }) {
  return <span className={`sl-badge sl-${kind}`}>{children}</span>;
}

function StateBadge({ state }: { state: Lock["state"] }) {
  if (state === "LOCKED") return <Badge kind="bad">Locked</Badge>;
  if (state === "UNLOCKED") return <Badge kind="ok">Unlocked</Badge>;
  return <Badge kind="muted">Unknown</Badge>;
}

function ModeBadge({ mode }: { mode: Lock["mode"] }) {
  if (mode === "NORMAL") return <Badge kind="muted">Normal</Badge>;
  if (mode === "SERVICE") return <Badge kind="warn">Service</Badge>;
  if (mode === "MAINTENANCE") return <Badge kind="warn">Maintenance</Badge>;
  return <Badge kind="bad">Disabled</Badge>;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function LocksPage() {
  const [data, setData] = useState<PageLockDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyMac, setBusyMac] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const size = 50;

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/locks?page=${p}&size=${size}`, { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      setData((await r.json()) as PageLockDto);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load locks");
    } finally {
      setLoading(false);
    }
  }

  async function pollLock(mac: string, want: "LOCKED" | "UNLOCKED") {
    for (const delay of [250, 400, 600, 900, 1400]) {
      await sleep(delay);
      const r = await fetch(`/api/locks/mac/${encodeURIComponent(mac)}`, { cache: "no-store" });
      if (!r.ok) continue;
      const lock = (await r.json()) as Lock | null;
      if (lock && lock.state === want) return true;
    }
    return false;
  }

  async function action(lock: Lock, kind: "lock" | "unlock") {
    if (busyMac) return;
    setBusyMac(lock.macAddress);

    try {
      const r = await fetch(`/api/locks/${encodeURIComponent(lock.macAddress)}/${kind}`, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());

      await load(page);

      const want = kind === "lock" ? "LOCKED" : "UNLOCKED";
      await pollLock(lock.macAddress, want);

      await load(page);
    } catch (e: any) {
      alert(e?.message ?? "Action failed");
    } finally {
      setBusyMac(null);
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

  const locks = data?.content ?? [];

  const summary = useMemo(() => {
    const lockerIds = new Set<number>();
    for (const l of locks) lockerIds.add(l.lockerId);
    return { lockers: lockerIds.size, locks: locks.length };
  }, [locks]);

  const grouped = useMemo(() => {
    const m = new Map<number, Lock[]>();
    for (const l of locks) {
      const arr = m.get(l.lockerId) ?? [];
      arr.push(l);
      m.set(l.lockerId, arr);
    }
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [locks]);

  if (loading) {
    return (
      <main className="app-page">
        <div className="container">
          <p className="muted">Loading…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-page">
        <div className="container">
          <h1>Locks</h1>
          <p>Error: {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="container">
        <div className="sl-top">
          <div>
            <h1>Locks</h1>
            <p className="muted" style={{ marginTop: -6 }}>
              Locks are identified by <b>ID address</b> and shown below, grouped by <b>locker</b>.
            </p>
          </div>

          <div className="sl-controls">
            <button onClick={() => load(page)} disabled={!!busyMac}>Refresh</button>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || !!busyMac}>Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={!!busyMac}>Next</button>
          </div>
        </div>

        <div className="sl-kpis">
          <div className="tile">
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Lockers</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{summary.lockers}</div>
          </div>

          <div className="tile">
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Locks</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{summary.locks}</div>
          </div>
        </div>

        {locks.length === 0 ? (
          <div className="card"><p>No locks found.</p></div>
        ) : (
          <div className="sl-list">
            {grouped.map(([lockerId, groupLocks], idx) => (
              <div key={lockerId}>
                {idx > 0 && <div className="sl-divider" />}

                {groupLocks.map((lock) => {
                  const isBusy = busyMac === lock.macAddress;
                  const canAct = lock.mode === "NORMAL" && !isBusy;

                  const unlockDisabled = !canAct || lock.state === "UNLOCKED";
                  const lockDisabled = !canAct || lock.state === "LOCKED";

                  const unlockPrimary = lock.state === "LOCKED" && !unlockDisabled;
                  const lockPrimary = lock.state === "UNLOCKED" && !lockDisabled;

                  return (
                    <div key={lock.id} className="card sl-row">
                      {/* left: lock identity */}
                      <div className="sl-id">Lock ID: {lock.id}</div>

                      {/* middle: info */}
                      <div className="sl-meta">
                        <span><span className="muted">Status</span> <StateBadge state={lock.state} /></span>
                        <span><span className="muted">Mode</span> <ModeBadge mode={lock.mode} /></span>
                        <span><span className="muted">Locker</span> {lock.lockerId}</span>
                        {lock.locationId != null && <span><span className="muted">Location</span> {lock.locationId}</span>}
                      </div>

                      {/* right: actions */}
                      <div className="sl-actions">
                        <button
                          className={unlockPrimary ? "sl-primary" : ""}
                          disabled={unlockDisabled}
                          onClick={() => action(lock, "unlock")}
                        >
                          {isBusy ? "Working…" : "Unlock"}
                        </button>

                        <button
                          className={lockPrimary ? "sl-primary" : ""}
                          disabled={lockDisabled}
                          onClick={() => action(lock, "lock")}
                        >
                          {isBusy ? "Working…" : "Lock"}
                        </button>
                      </div>

                      {lock.mode !== "NORMAL" && (
                        <p className="muted" style={{ margin: "10px 0 0", fontSize: 13 }}>
                          Actions disabled in <b>{lock.mode.toLowerCase()}</b> mode.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
