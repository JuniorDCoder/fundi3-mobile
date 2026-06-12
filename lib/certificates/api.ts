/**
 * Client for the Fundi3 web API's certificate endpoints.
 * All requests are authenticated with the Supabase session token.
 *
 * EXPO_PUBLIC_API_URL must point to the web app:
 *   Dev:  http://192.168.x.x:3000  (your LAN IP — not localhost)
 *   Prod: https://fundi3.xyz
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

export interface UserProfile {
  displayName: string;
  studentPubkey: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/user/profile`, { headers });
  if (!res.ok) return null;
  const json = await res.json();
  return json.profile ?? null;
}

export async function saveUserProfile(displayName: string): Promise<UserProfile> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/user/profile`, {
    method: "POST",
    headers,
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save profile");
  }
  return res.json();
}

export interface ClaimResult {
  certId: string;
  certificatePda: string | null;
  txSig: string | null;
  solanaExplorerUrl: string | null;
  alreadyClaimed?: boolean;
}

export async function claimCertificate(courseId: string, displayName?: string): Promise<ClaimResult> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/certificates/claim`, {
    method: "POST",
    headers,
    body: JSON.stringify({ courseId, displayName }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Certificate claim failed");
  return json;
}

export interface CertificateDetail {
  id: string;
  displayName: string;
  courseNameEn: string;
  courseNameFr: string;
  courseSlug: string;
  certificatePda: string | null;
  solanaExplorerUrl: string | null;
  issuedAt: string;
}

export async function getCertificate(certId: string): Promise<CertificateDetail | null> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/certificates/${certId}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

export interface CertificateListItem {
  id: string;
  displayName: string;
  courseNameEn: string;
  courseNameFr: string;
  courseSlug: string;
  certificatePda: string | null;
  solanaExplorerUrl: string | null;
  issuedAt: string;
  certUrl: string;
}

export async function getCertificates(): Promise<CertificateListItem[]> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/certificates`, { headers });
  if (!res.ok) return [];
  const json = await res.json();
  return json.certificates ?? [];
}
