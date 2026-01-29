"use client";

import { useEffect, useState } from "react";

type Lock = {
  id: number;
  macAddress: string;
  state: "LOCKED" | "UNLOCKED" | "UNKNOWN";
  mode: "NORMAL" | "SERVICE" | "MAINTENANCE" | "DISABLED";
};

type PageLockDto = {
  content: Lock[];
  totalElements: number;
};

export default function LocksPage() {
  const [data, setData] = useState<PageLockDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const r = await fetch("/api/locks?page=0&size=50");
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e: any) {
      setError(e.message ?? "Failed to load locks");
    } finally {
      setLoading(false);
    }
  }

  async function action(mac: string, kind: "lock" | "unlock") {
    setBusy(mac);
    try {
      const r = await fetch(`/api/locks/${mac}/${kind}`, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e: any) {
      alert(e.message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <main>Loading…</main>;
  if (error) return <main>Error: {error}</main>;

  return (
    <main>
      <h1>Locks</h1>
      <p>Total: {data?.totalElements ?? 0}</p>

      <table>
        <thead>
          <tr>
            <th>MAC</th>
            <th>State</th>
            <th>Mode</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.content.map((lock) => {
            const isBusy = busy === lock.macAddress;

            return (
              <tr key={lock.id}>
                <td>{lock.macAddress}</td>
                <td>{lock.state}</td>
                <td>{lock.mode}</td>
                <td>
                  <div className="actions">
                    <button
                      disabled={lock.state === "UNLOCKED" || isBusy}
                      onClick={() => action(lock.macAddress, "unlock")}
                    >
                      Unlock
                    </button>

                    <button
                      disabled={lock.state === "LOCKED" || isBusy}
                      onClick={() => action(lock.macAddress, "lock")}
                    >
                      Lock
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {data?.content.length === 0 && (
            <tr>
              <td colSpan={4}>No locks found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
