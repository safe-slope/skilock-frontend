export const dynamic = "force-dynamic";

async function getLocks() {
  const r = await fetch("http://localhost:3000/api/locks?page=0&size=50", {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default async function LocksPage() {
  const page = await getLocks();
  const locks = page?.content ?? [];

  return (
    <main style={{ padding: 24 }}>
      <h1>Locks</h1>

      <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
        {locks.map((l: any) => (
          <li key={l.id} style={{ border: "1px solid #333", padding: 12, borderRadius: 8 }}>
            <div><b>MAC:</b> {l.macAddress}</div>
            <div><b>State:</b> {l.state}</div>
            <div><b>Mode:</b> {l.mode}</div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <form action={`/api/locks/${encodeURIComponent(l.macAddress)}/unlock`} method="post">
                <button type="submit">Unlock</button>
              </form>
              <form action={`/api/locks/${encodeURIComponent(l.macAddress)}/lock`} method="post">
                <button type="submit">Lock</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
