/**
 * Client for the evaluation flow.
 *
 * Before the one-time code, calls go to /api/evaluation/* — a Netlify function that adds the shared secret and
 * proxies to the ops panel. After the code, the session token is the credential, so the page talks to the panel
 * DIRECTLY (one hop fewer, no proxy cold starts); if a direct call ever fails at the network level the page falls
 * back to the proxy for the rest of the visit. The session lives in localStorage for a day.
 *
 * apiRetry() is the rule for anything that must not strand the person: transient failures (no reply, 5xx) are
 * retried with backoff for up to two minutes while the caller shows neutral progress — never "your connection".
 */
const SESSION_KEY = "phsweb_eval_session";
const DRAFT_KEY = "phsweb_eval_draft";
const PHONE_KEY = "phsweb_eval_phone";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const PANEL_BASE = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PANEL_BASE || "https://panel.sabiwifi.com").replace(/\/$/, "");
const SESSION_PATHS = new Set(["status", "inventory", "results", "want_learn", "reevaluate", "test/next", "test/answer"]);
let directOk = true;

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
/** Small per-viewer store for the local-first inventory. */
export function localGet<T>(k: string): T | null {
  try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : null; } catch { return null; }
}
export function localSet(k: string, v: unknown) { lsSet(k, v == null ? "" : JSON.stringify(v)); }

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
  constructor(status: number, data: Record<string, unknown>) {
    super((data && (data.error as string)) || `request failed (${status})`);
    this.status = status;
    this.data = data || {};
  }
  /** True when retrying is reasonable: no reply, a timeout, or a server-side/edge failure. */
  get transient(): boolean { return this.status === 0 || this.status === 502 || this.status === 503 || this.status === 504; }
}

export async function api<T = Record<string, unknown>>(path: string, body?: unknown, timeoutMs = 20000): Promise<T> {
  const sess = getSession();
  const direct = directOk && SESSION_PATHS.has(path) && !!sess;
  const url = direct ? `${PANEL_BASE}/api/evaluation/${path}` : `/api/evaluation/${path}`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", "X-Session": sess },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
      mode: "cors",
    });
  } catch {
    clearTimeout(timer);
    if (direct) { directOk = false; return api<T>(path, body, timeoutMs); }   // fall back to the proxy for this visit
    throw new ApiError(0, { error: "no reply" });
  }
  clearTimeout(timer);
  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retry transient failures with backoff (1, 2, 4, 8, 8… s) for up to `maxMs`, reporting elapsed time to
 * `onWait` so the UI can move from "Saving…" to "Still saving — your answer is safe" to a calm banner.
 * Non-transient errors (validation, 401, 409, 429) are thrown at once.
 */
export async function apiRetry<T = Record<string, unknown>>(path: string, body?: unknown, opts: { onWait?: (elapsedMs: number) => void; maxMs?: number } = {}): Promise<T> {
  const t0 = Date.now(); let delay = 1000; const maxMs = opts.maxMs ?? 120000;
  for (;;) {
    try { return await api<T>(path, body); }
    catch (e) {
      const ex = e instanceof ApiError ? e : new ApiError(0, { error: "no reply" });
      if (!ex.transient || Date.now() - t0 > maxMs) throw ex;
      opts.onWait?.(Date.now() - t0);
      await sleep(delay); delay = Math.min(delay * 2, 8000);
    }
  }
}

/** Neutral wording for a wait, by how long it has been going. Never mentions the person's connection. */
export function waitText(elapsedMs: number, verb = "Saving"): string {
  if (elapsedMs < 5000) return `${verb}…`;
  if (elapsedMs < 60000) return `Still ${verb.toLowerCase()} — your answer is safe, keep the page open`;
  return "We are having trouble reaching our server. Your answers are kept on this phone; the page keeps trying.";
}

export type Next = "inventory" | "results" | "test" | "done" | "screened_out" | "closed";
