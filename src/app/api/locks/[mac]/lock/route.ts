import { NextResponse } from "next/server";
import { authHeader } from "@/lib/backend/auth";

export async function POST(
  _: Request,
  { params }: { params: { mac: string } }
) {
  const base = process.env.LOCK_SERVICE_URL;
  if (!base) {
    return NextResponse.json(
      { error: "LOCK_SERVICE_URL missing" },
      { status: 500 }
    );
  }

  const { mac } = params;

  const r = await fetch(
    `${base}/api/v1/locks/${encodeURIComponent(mac)}/lock`,
    {
      method: "POST",
      headers: {
        ...(await authHeader()),
      },
      cache: "no-store",
    }
  );

  const text = await r.text();

  if (!r.ok) {
    return new NextResponse(text, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") ?? "text/plain",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
