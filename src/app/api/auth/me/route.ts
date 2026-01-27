import { NextResponse } from "next/server";
import { importSPKI, jwtVerify } from "jose";
import { getAccessToken } from "@/lib/backend/auth";

type Me = { userId: string; tenantId?: number | null; role?: string | null; exp?: number };

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

let cachedKey: CryptoKey | null = null;

async function getKey() {
  if (cachedKey) return cachedKey;

  const pem = mustGetEnv("JWT_PUBLIC_KEY").replace(/\\n/g, "\n");

  cachedKey = await importSPKI(pem, "RS256");
  return cachedKey;
}

export async function GET() {
  const token = getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, await getKey(), {
      // issuer: "safeslope-auth",
      // audience: "skilock-frontend",
    });

    const me: Me = {
      userId: String(payload.sub),
      tenantId: (payload as any).tenantId ?? null,
      role: (payload as any).role ?? null,
      exp: payload.exp,
    };

    return NextResponse.json(me);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
