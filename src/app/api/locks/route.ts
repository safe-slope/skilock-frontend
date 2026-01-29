import { NextResponse } from "next/server";
import type { paths } from "@/lib/api/lock.types";
import { authHeader } from "@/lib/backend/auth";

type LocksOk = paths["/api/v1/locks"]["get"]["responses"]["200"]["content"]["*/*"];

export async function GET(req: Request) {
  const base = process.env.LOCK_SERVICE_URL;
  if (!base) return NextResponse.json({ error: "LOCK_SERVICE_URL missing" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "0";
  const size = searchParams.get("size") ?? "20";
  const sort = searchParams.get("sort");

  const qs = new URLSearchParams({ page, size });
  if (sort) qs.set("sort", sort);

  const headers = { accept: "application/json", ...(await authHeader()) };

  const r = await fetch(`${base}/api/v1/locks?${qs.toString()}`, {
    headers,
    cache: "no-store",
  });

  const text = await r.text();

  if (!r.ok) {
    return new NextResponse(text || "Failed to load locks", {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
    });
  }



  const data = (text ? JSON.parse(text) : null) as LocksOk;
  return NextResponse.json(data);
}
