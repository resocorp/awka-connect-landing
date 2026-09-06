/**
 * Visit attribution.
 *
 * Captured once on first load and held in sessionStorage, so it survives
 * in-page navigation and anchor jumps but does not follow the visitor across
 * sessions. Everything here is best-effort: a blocked or full sessionStorage
 * must never break the page, so every access is guarded.
 */

const STORAGE_KEY = "phsweb_attribution";

export const WHATSAPP_NUMBER = "2349111011000";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function read(): Attribution | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

function write(value: Attribution): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* private mode or quota — attribution is a nice-to-have, never a blocker */
  }
}

/** Host of the referring page, or undefined for direct traffic and self-referrals. */
function referrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? undefined : host;
  } catch {
    return undefined;
  }
}

/**
 * Capture attribution from the current URL. Safe to call on every mount —
 * the first call in a session wins, so a later anchor navigation that has
 * dropped the query string cannot overwrite the real source.
 */
export function captureAttribution(): Attribution {
  const existing = read();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const captured: Attribution = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) captured[key] = value.slice(0, 120);
  }

  const host = referrerHost();
  if (host) captured.referrer = host;
  captured.landing_path = window.location.pathname + window.location.search;

  write(captured);
  return captured;
}

export function getAttribution(): Attribution {
  return read() ?? captureAttribution();
}

/**
 * Human-readable origin, e.g. "pricing — google/cpc" or "hero — via facebook.com".
 * This is what an agent reads in Chatwoot, so it favours legibility over precision.
 */
function describeOrigin(section: string): string {
  const a = getAttribution();

  if (a.utm_source) {
    const channel = a.utm_medium ? `${a.utm_source}/${a.utm_medium}` : a.utm_source;
    return a.utm_campaign
      ? `${section} — ${channel}, ${a.utm_campaign}`
      : `${section} — ${channel}`;
  }
  if (a.referrer) return `${section} — via ${a.referrer}`;
  return section;
}

/**
 * A wa.me link whose prefilled first message carries the plan and the origin.
 *
 * Without this a WhatsApp lead reaches Chatwoot as a bare phone number with no
 * context; the prefill is the only attribution that survives the hop into
 * WhatsApp, because we control nothing on the other side.
 */
export function waLink(section: string, plan?: string): string {
  const intro = plan
    ? `Hi PHSWEB, I'm interested in the ${plan}.`
    : "Hi PHSWEB, I'd like to know more about your internet plans.";
  const text = `${intro} (from: ${describeOrigin(section)})`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
