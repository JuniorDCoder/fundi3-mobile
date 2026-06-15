/**
 * Client for the Fundi3 web API's wallet endpoints.
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

export type SolanaNetwork = "devnet" | "testnet" | "mainnet-beta";

export interface WalletInfo {
  address: string;
  network: SolanaNetwork;
  balanceSol: number | null;
  explorerUrl: string;
}

export async function getWallet(): Promise<WalletInfo> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/wallet`, { headers });
  if (!res.ok) throw new Error("Failed to load wallet");
  return res.json();
}

export async function exportWalletKey(password: string): Promise<string> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/wallet/export`, {
    method: "POST",
    headers,
    body: JSON.stringify({ password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Failed to export key");
  return json.secretKey;
}

export async function requestAirdrop(): Promise<void> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/wallet/airdrop`, { method: "POST", headers });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Airdrop failed");
  }
}

export interface WalletTransaction {
  signature: string;
  blockTime: number | null;
  status: "success" | "failed";
  direction: "in" | "out" | "other";
  changeSol: number | null;
  counterparty: string | null;
  explorerUrl: string;
  kind: "certificate" | "transfer";
}

export async function getTransactions(): Promise<WalletTransaction[]> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/wallet/transactions`, { headers });
  if (!res.ok) throw new Error("Failed to load transactions");
  const json: { transactions: WalletTransaction[] } = await res.json();
  return json.transactions;
}

export interface SendResult {
  signature: string;
  explorerUrl: string;
}

export async function sendTransfer(
  recipient: string,
  amountSol: number,
  password: string,
  lang: "en" | "fr",
): Promise<SendResult> {
  const base = await apiUrl();
  const headers = await authHeaders();
  const res = await fetch(`${base}/api/wallet/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({ recipient, amountSol, password, lang }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Send failed");
  return json;
}
