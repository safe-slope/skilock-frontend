import { cookies } from "next/headers";

export function getAccessToken(): string | null {
  return cookies().get("access_token")?.value ?? null;
}

export function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
