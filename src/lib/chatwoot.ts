/**
 * Chatwoot live-chat widget.
 *
 * The widget is loaded from chat.sabiwifi.com, which is a Cloudflare Tunnel into
 * CT 160 on the bench. That is a real dependency: if the bench is unreachable the
 * bubble simply never appears. It must fail quietly — a marketing page cannot
 * break because a chat script did not load, which is why every hook here is
 * guarded and nothing throws.
 *
 * No websocketURL override is needed. The widget iframe is served from BASE_URL
 * and derives its own cable URL from that origin.
 */

import { getAttribution } from "./attribution";

const BASE_URL = "https://chat.sabiwifi.com";

/**
 * Public per-inbox token — safe in client code, that is what it is for.
 * Unset until the Website Chat inbox exists, in which case we load nothing.
 */
const WEBSITE_TOKEN = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN as
  | string
  | undefined;

declare global {
  interface Window {
    chatwootSettings?: Record<string, unknown>;
    chatwootSDK?: { run: (opts: { websiteToken: string; baseUrl: string }) => void };
    $chatwoot?: {
      setCustomAttributes: (attrs: Record<string, string>) => void;
      toggle: (state?: "open" | "close") => void;
      setConversationCustomAttributes?: (attrs: Record<string, string>) => void;
    };
  }
}

let started = false;

export function loadChatwoot(): void {
  if (started || !WEBSITE_TOKEN || typeof document === "undefined") return;
  started = true;

  window.chatwootSettings = {
    position: "right",
    type: "standard",
    launcherTitle: "Chat with PHSWEB",
  };

  // Attach attribution as soon as the widget is ready, so an agent sees where
  // the visitor came from on the very first message rather than having to ask.
  document.addEventListener("chatwoot:ready", () => {
    try {
      const a = getAttribution();
      const attrs: Record<string, string> = {};
      for (const [k, v] of Object.entries(a)) {
        if (v) attrs[k] = String(v);
      }
      if (Object.keys(attrs).length) {
        window.$chatwoot?.setCustomAttributes(attrs);
      }
    } catch {
      /* attribution is never worth breaking the widget over */
    }
  });

  const script = document.createElement("script");
  script.src = `${BASE_URL}/packs/js/sdk.js`;
  script.defer = true;
  script.async = true;
  script.onload = () => {
    try {
      window.chatwootSDK?.run({ websiteToken: WEBSITE_TOKEN, baseUrl: BASE_URL });
    } catch {
      /* tunnel down, or SDK shape changed — leave the page alone */
    }
  };
  script.onerror = () => {
    console.warn("[chatwoot] widget failed to load from", BASE_URL);
  };
  document.head.appendChild(script);
}

/** True when the widget is loaded and can be opened programmatically. */
export function chatwootReady(): boolean {
  return typeof window !== "undefined" && !!window.$chatwoot;
}

export function openChatwoot(): void {
  try {
    window.$chatwoot?.toggle("open");
  } catch {
    /* no-op */
  }
}
