/**
 * Client for the Fundi3 web API's user-preferences endpoints.
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

export interface NotificationPreferences {
  emailCourseCompleted: boolean;
  emailNewCourse: boolean;
  emailCertificatePdf: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/user/notifications`, { headers });
  if (!res.ok) return null;
  const json = await res.json();
  return json.preferences ?? null;
}

export async function saveNotificationPreferences(
  partial: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/user/notifications`, {
    method: "PUT",
    headers,
    body: JSON.stringify(partial),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save preferences");
  }
  const json = await res.json();
  return json.preferences;
}
