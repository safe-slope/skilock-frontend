"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!r.ok) {
        let msg = "Login failed";
        const ct = r.headers.get("content-type") ?? "";

        if (ct.includes("application/json")) {
          const j = await r.json().catch(() => null);
          msg = j?.error ?? msg;
        } else {
          const text = await r.text().catch(() => "");
          msg = text || msg;
        }

        throw new Error(msg);
      }

      router.push(next);
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

   return (
    <main style={{ minHeight: "100vh", padding: "40px 0" }}>
      <div className="container">
        <div className="grid-auth">
      
          <section>
            <h1>SkiLock</h1>
            <p className="muted" style={{ marginTop: 6, maxWidth: 520 }}>
              Operator dashboard for smart ski locks.
            </p>

            <ul style={{ marginTop: 18, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Real-time overview of lock state and mode</li>
              <li>Remote lock/unlock </li>
              <li>Events visibility</li>
            </ul>

          </section>

        
          <section className="card" style={{ maxWidth: 440, width: "100%" }}>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Sign in</h2>
            <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
              Use your operator account credentials.
            </p>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 13 }}>
                  Username
                </span>
                <input
                  className="input"
                  placeholder="e.g. admin-resort"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted" style={{ fontSize: 13 }}>
                  Password
                </span>
                <input
                  className="input"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>

              <button className="btn-primary" disabled={loading} type="submit">
                {loading ? "Signing in…" : "Sign in"}
              </button>

              {err && (
                <div
                  className="card"
                  style={{
                    padding: 12,
                    borderColor: "rgba(255, 99, 99, 0.35)",
                    background: "rgba(255, 99, 99, 0.08)",
                  }}
                >
                  <b>Login failed</b>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {err}
                  </div>
                </div>
              )}
            </form>

  
          </section>
        </div>
      </div>
    </main>
  );
}