/**
 * Evaluation proxy → the ops panel.
 *
 * phsweb.ng/evaluation talks only to this function. It forwards every call to
 * https://panel.sabiwifi.com/api/evaluation/<same path> with the shared secret
 * (EVALUATION_KEY) and the visitor's session header, so the secret never reaches
 * the browser and the panel never has to trust a public origin. The panel owns
 * the candidate records, the one-time codes, the test bank and the grading.
 *
 * Nothing here is stored: on a panel failure the visitor is told to try again and
 * the payload is logged, like lead.mts does.
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env var ${name}`);
  return v;
}

/** Nigerian numbers to E.164 (same rule as lead.mts). */
function normalisePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

const ALLOWED = new Set(["start", "otp/verify", "otp/resend", "status", "inventory", "test/next", "test/answer"]);

export default async (req: Request, context: { ip?: string }): Promise<Response> => {
  const url = new URL(req.url);
  const sub = url.pathname.replace(/^\/api\/evaluation\/?/, "");
  if (!ALLOWED.has(sub)) return json({ error: "Not found" }, 404);
  if (req.method !== "POST" && req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown> | undefined;
  if (req.method === "POST") {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (typeof body.phone === "string") body.phone = normalisePhone(body.phone) ?? body.phone;
  }

  const base = (process.env.PANEL_BASE_URL ?? "https://panel.sabiwifi.com").replace(/\/$/, "");
  const ip = context.ip ?? req.headers.get("x-nf-client-connection-ip") ?? "";
  try {
    const res = await fetch(`${base}/api/evaluation/${sub}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "X-Eval-Key": env("EVALUATION_KEY"),
        "X-Session": req.headers.get("x-session") ?? "",
        "X-Client-IP": ip,
        // Cloudflare fronts the panel; present as a browser like lead.mts does for Chatwoot.
        "User-Agent": "Mozilla/5.0 (compatible; PHSWEB-website/1.0)",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25_000),
    });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[evaluation] panel unreachable:", err);
    if (sub === "start") console.error("[evaluation] unsaved start payload:", JSON.stringify(body));
    return json({ error: "We could not reach our server right now. Please try again in a minute, or message us on WhatsApp." }, 502);
  }
};

export const config = { path: "/api/evaluation/*" };
