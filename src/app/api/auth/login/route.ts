import { NextResponse } from "next/server";
import type { paths } from "@/lib/api/auth.types";

type LoginBody =
  paths["/api/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];

type LoginOk =
  paths["/api/v1/auth/login"]["post"]["responses"]["200"]["content"]["*/*"];

export async function POST(req: Request) {
  const base = process.env.AUTH_SERVICE_URL;
  if (!base) return NextResponse.json({ error: "AUTH_SERVICE_URL missing" }, { status: 500 });

  const body = (await req.json()) as LoginBody;

  const r = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/plain, */*" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!r.ok) {
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
    });
  }

  const token = (await r.text()) as LoginOk;

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30, // 30 min
  });

  return res;
}
