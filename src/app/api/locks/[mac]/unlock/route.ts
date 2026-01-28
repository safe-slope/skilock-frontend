import { NextResponse } from "next/server";
import { authHeader } from "@/lib/backend/auth";

export async function POST(_: Request, ctx: { params: Promise<{ mac: string }> }) {
  const base = process.env.LOCK_SERVICE_URL;
  if (!base) return NextResponse.json({ error: "LOCK_SERVICE_URL missing" }, { status: 500 });

  const { mac } = await ctx.params;

  const r = await fetch(`${base}/api/v1/locks/${encodeURIComponent(mac)}/lock`, {
    method: "POST",
    headers: { ...authHeader() },
    cache: "no-store",
  });

  if (!r.ok) {
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
    });
  }

  return NextResponse.json({ ok: true });
}
