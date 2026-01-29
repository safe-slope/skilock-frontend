import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend/client";

export async function POST(_req: Request, ctx: { params: { mac: string } }) {
  const { mac } = ctx.params;

  const r = await backendFetch(`/api/v1/locks/${encodeURIComponent(mac)}/unlock`, {
    method: "POST",
  });

  const text = await r.text();
  return new NextResponse(text || null, { status: r.status });
}
