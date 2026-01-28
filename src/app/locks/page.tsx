"use client";

import { useEffect, useState } from "react";

type Lock = {
  id?: number;
  macAddress: string;
  state?: string;
  mode?: string;
};

type PageLockDto = {
  content?: Lock[];
  totalElements?: number;
  totalPages?: number;
};

export default function LocksPage() {
  const [data, setData] = useState<PageLockDto | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/locks?page=0&size=50", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function action(mac: string, kind: "lock" | "unlock") {
    setError("");
    try {
      const r = await fetch(`/api/locks/${encodeURIComponent(mac)}/${kind}`, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Action failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Locks</h1>

      {error ? <div>{error}</div> : null}

      <ul>
        {(data?.content ?? []).map((l) => (
          <li key={l.id ?? l.macAddress}>
            <div>MAC: {l.macAddress}</div>
            <div>State: {l.state}</div>
            <div>Mode: {l.mode}</div>

            <button onClick={() => action(l.macAddress, "unlock")}>Unlock</button>
            <button onClick={() => action(l.macAddress, "lock")}>Lock</button>
          </li>
        ))}
      </ul>

      <div>TotalElements: {data?.totalElements ?? 0}</div>
    </div>
  );
}
