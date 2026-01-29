import { NextResponse } from "next/server";
import type { paths } from "@/lib/api/auth.types";

type LoginBody =
  paths["/api/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];

type LoginOk =
  paths["/api/v1/auth/login"]["post"]["responses"]["200"]["content"]["*/*"];

export async function POST(req: Request) {
  const base = process.env.AUTH_SERVICE_URL;
  if (!base) {
    return NextResponse.json({ error: "AUTH_SERVICE_URL missing" }, { status: 500 });
  }

  const body = await req.json(); // brez trim, brez sprememb

  const r = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/plain, */*",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    return NextResponse.json(
      { error: text || "Login failed" },
      { status: r.status }
    );
  }

  const token = await r.text();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  return res;
}
