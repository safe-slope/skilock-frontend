import { authHeader } from "@/lib/backend/auth";

export async function backendFetch(path: string, init?: RequestInit) {
  const base = process.env.LOCK_SERVICE_URL;
  if (!base) throw new Error("LOCK_SERVICE_URL missing");

  const headers = {
    ...(init?.headers ?? {}),
    ...(await authHeader()),
  } as Record<string, string>;

  return fetch(`${base}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
