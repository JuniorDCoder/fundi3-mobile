/**
 * Client for the Fundi3 web API's push-token and in-app notification endpoints.
 * All requests are authenticated with the Supabase session token.
 */
import { supabase } from "../supabase/client";

async function apiUrl() {
  return (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AppNotification {
  id: string;
  type: "wallet_send" | "wallet_receive" | "certificate_minted";
  titleEn: string;
  titleFr: string;
  bodyEn: string;
  bodyFr: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export async function savePushToken(token: string): Promise<void> {
  const base = await apiUrl();
  const headers = await authHeaders();
  await fetch(`${base}/api/user/push-token`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token }),
  });
}

export async function getNotifications(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/notifications`, { headers });
  if (!res.ok) return { notifications: [], unreadCount: 0 };
  return res.json();
}

export async function markNotificationsRead(ids: string[] | "all"): Promise<void> {
  const base = await apiUrl();
  const headers = await authHeaders();
  await fetch(`${base}/api/notifications`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(ids === "all" ? { all: true } : { ids }),
  });
}
