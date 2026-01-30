import { authHeader } from "./auth";

export async function backendFetch(path: string, options: RequestInit = {}) {
  const base = process.env.LOCK_SERVICE_URL;
  if (!base) throw new Error("LOCK_SERVICE_URL missing");

  const headers = {
    ...(await authHeader()),
    ...(options.headers || {}),
  };


  return fetch(`${base}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}
