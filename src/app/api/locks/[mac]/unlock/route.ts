import { NextResponse, type NextRequest } from "next/server";
import { backendFetch } from "@/lib/backend/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ mac: string }> }
) {
  const { mac } = await params;

  const r = await backendFetch(`/api/v1/locks/${encodeURIComponent(mac)}/unlock`, {
    method: "POST",
  });

  const text = await r.text();
  return new NextResponse(text || null, { status: r.status });
}
