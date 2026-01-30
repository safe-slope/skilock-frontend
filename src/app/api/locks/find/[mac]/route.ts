import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend/client";

export async function GET(_req: Request, ctx: { params: { mac: string } }) {
  const { mac } = ctx.params;

  const r = await backendFetch(`/api/v1/locks/mac/${encodeURIComponent(mac)}`, {
    method: "GET",
  });

  const text = await r.text();

  if (!r.ok) {
    return new NextResponse(text || "Lock not found", {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
    });
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
