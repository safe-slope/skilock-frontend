import { cookies } from "next/headers";

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies(); 
  return store.get("access_token")?.value ?? null;
}

export async function authHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
