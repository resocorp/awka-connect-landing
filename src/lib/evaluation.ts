/**
 * Client for the evaluation flow. Every call goes to /api/evaluation/* (a Netlify
 * function that proxies to the ops panel). The session issued after the one-time
 * code is kept in localStorage for a day so closing the tab and coming back on
 * the same phone resumes where the person was; the panel expires it after 24 h too.
 */
const SESSION_KEY = "phsweb_eval_session";
const DRAFT_KEY = "phsweb_eval_draft";
const PHONE_KEY = "phsweb_eval_phone";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function lsGet(k: string): string {
  try { return localStorage.getItem(k) || ""; } catch { return ""; }
}
function lsSet(k: string, v: string) {
  try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* private mode or quota */ }
}

export function getSession(): string {
  const raw = lsGet(SESSION_KEY);
  if (!raw) return "";
  try {
    const { s, exp } = JSON.parse(raw) as { s: string; exp: number };
    if (!s || !exp || Date.now() > exp) { lsSet(SESSION_KEY, ""); return ""; }
    return s;
  } catch { return ""; }
}
export function setSession(s: string) {
  lsSet(SESSION_KEY, s ? JSON.stringify({ s, exp: Date.now() + SESSION_TTL_MS }) : "");
}
export function getPhone(): string { return lsGet(PHONE_KEY); }
export function setPhone(p: string) { lsSet(PHONE_KEY, p); }
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

export async function api<T = Record<string, unknown>>(path: string, body?: unknown, timeoutMs = 20000): Promise<T> {
  // A request that never answers must fail, not hang the page: the 2026-09-18 stall was a reply lost on the way
  // back while the screen said "Saving…" forever. Callers re-sync with the server after a failure.
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`/api/evaluation/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", "X-Session": getSession() },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    throw new ApiError(0, { error: ctl.signal.aborted ? "The connection is slow — reconnecting…" : "Network problem — reconnecting…" });
  } finally {
    clearTimeout(timer);
  }
  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export type Next = "inventory" | "results" | "test" | "done" | "screened_out" | "closed";
