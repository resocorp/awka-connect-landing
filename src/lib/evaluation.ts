/**
 * Client for the evaluation flow. Every call goes to /api/evaluation/* (a Netlify
 * function that proxies to the ops panel). The session issued after the one-time
 * code is kept in sessionStorage so a refresh resumes where the person was.
 */
const SESSION_KEY = "phsweb_eval_session";
const DRAFT_KEY = "phsweb_eval_draft";
const PHONE_KEY = "phsweb_eval_phone";

export function getSession(): string {
  try { return sessionStorage.getItem(SESSION_KEY) || ""; } catch { return ""; }
}
export function setSession(s: string) {
  try { s ? sessionStorage.setItem(SESSION_KEY, s) : sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
export function getPhone(): string {
  try { return sessionStorage.getItem(PHONE_KEY) || ""; } catch { return ""; }
}
export function setPhone(p: string) {
  try { sessionStorage.setItem(PHONE_KEY, p); } catch { /* ignore */ }
}
export function loadDraft<T>(): T | null {
  try { const r = sessionStorage.getItem(DRAFT_KEY); return r ? (JSON.parse(r) as T) : null; } catch { return null; }
}
export function saveDraft(d: unknown) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, data: Record<string, unknown>) {
    super((data && (data.error as string)) || `request failed (${status})`);
    this.status = status;
    this.data = data || {};
  }
}

export async function api<T = Record<string, unknown>>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/evaluation/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "X-Session": getSession() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export type Next = "inventory" | "test" | "done" | "screened_out" | "closed";
