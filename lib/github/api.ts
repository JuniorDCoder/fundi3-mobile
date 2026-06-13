/**
 * Client for the Fundi3 web API's GitHub connect/push endpoints.
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

export interface GithubStatus {
  connected: boolean;
  username: string | null;
}

export async function getGithubStatus(): Promise<GithubStatus> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/github/status`, { headers });
  if (!res.ok) return { connected: false, username: null };
  return res.json();
}

export async function disconnectGithub(): Promise<void> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/github/disconnect`, { method: "POST", headers });
  if (!res.ok) throw new Error("github_disconnect_error");
}

export interface PushResult {
  repoUrl: string;
  fileUrls: Record<string, string>;
}

export async function pushToGithub(
  files: Record<string, string>,
  repoName: string,
  commitMessage: string,
): Promise<PushResult> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/github/push`, {
    method: "POST",
    headers,
    body: JSON.stringify({ files, repoName, commitMessage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "github_push_error");
  }
  return res.json();
}
