/**
 * Website lead → Chatwoot.
 *
 * The only server-side code on this site. It creates (or updates) a Chatwoot
 * contact and opens a conversation in the "Website Leads" inbox — an API channel
 * with no delivery channel, so nothing is ever sent to the customer from here.
 * That is deliberate: cold outbound from the business line is what earned the
 * 463 block. An agent reads the lead and chooses to reach out.
 *
 * Every Chatwoot call is awaited. A function is frozen the moment it returns, so
 * the fire-and-forget pattern the retired Express server used would silently
 * drop writes here.
 */

interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
}

interface LeadBody {
  name?: string;
  email?: string;
  phone?: string;
  plan?: string;
  address?: string;
  gpsLat?: string | null;
  gpsLong?: string | null;
  _gotcha?: string;
  attribution?: Attribution;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Nigerian numbers to E.164, which is what Chatwoot expects.
 * 08031234567 / 8031234567 / +2348031234567 / 234 803 123 4567 all land on
 * +2348031234567. Anything already carrying a different country code is left
 * alone rather than mangled.
 */
function normalisePhone(raw?: string): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return raw.startsWith("+") ? raw : `+${digits}`;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env var ${name}`);
  return v;
}

async function chatwoot<T>(path: string, init?: RequestInit): Promise<T> {
  const base = env("CHATWOOT_BASE_URL").replace(/\/$/, "");
  const res = await fetch(`${base}/api/v1/accounts/${env("CHATWOOT_ACCOUNT_ID")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      api_access_token: env("CHATWOOT_API_TOKEN"),
      // Cloudflare sits in front of chat.sabiwifi.com. Bot Fight Mode has
      // 1010-blocked non-browser agents on this host before, so present as one.
      "User-Agent": "Mozilla/5.0 (compatible; PHSWEB-website/1.0)",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`chatwoot ${init?.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Honeypot. Answer exactly as we would a real submission — never tell a bot
  // it was caught, or the next version of it simply stops filling the field.
  if (body._gotcha) return json({ ok: true });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = normalisePhone(body.phone);

  if (!name || (!email && !phone)) {
    return json({ error: "Name and either an email or phone number are required" }, 400);
  }

  const attribution = body.attribution ?? {};
  const customAttributes: Record<string, string> = {};
  const put = (k: string, v?: string | null) => {
    if (v) customAttributes[k] = String(v).slice(0, 500);
  };
  put("plan_requested", body.plan);
  put("install_address", body.address);
  put("gps_lat", body.gpsLat);
  put("gps_long", body.gpsLong);
  put("utm_source", attribution.utm_source);
  put("utm_medium", attribution.utm_medium);
  put("utm_campaign", attribution.utm_campaign);
  put("referrer", attribution.referrer);
  put("landing_path", attribution.landing_path);

  try {
    const inboxId = Number(env("CHATWOOT_LEADS_INBOX_ID"));

    // Find an existing contact before creating one, so a repeat submission
    // enriches the record instead of splitting the history across duplicates.
    const query = email || phone || "";
    const found = await chatwoot<{ payload?: Array<{ id: number }> }>(
      `/contacts/search?q=${encodeURIComponent(query)}`
    );
    let contactId = found.payload?.[0]?.id;

    if (contactId) {
      await chatwoot(`/contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          ...(email && { email }),
          ...(phone && { phone_number: phone }),
          custom_attributes: customAttributes,
        }),
      });
    } else {
      const created = await chatwoot<{ payload?: { contact?: { id: number }; id?: number } }>(
        "/contacts",
        {
          method: "POST",
          body: JSON.stringify({
            inbox_id: inboxId,
            name,
            ...(email && { email }),
            ...(phone && { phone_number: phone }),
            custom_attributes: customAttributes,
          }),
        }
      );
      contactId = created.payload?.contact?.id ?? created.payload?.id;
    }

    if (!contactId) throw new Error("chatwoot did not return a contact id");

    const lines = [
      "🌐 *New website lead*",
      "",
      `Name: ${name}`,
      email ? `Email: ${email}` : null,
      phone ? `Phone: ${phone}` : null,
      body.plan ? `Plan wanted: ${body.plan}` : null,
      body.address ? `Address: ${body.address}` : null,
      body.gpsLat && body.gpsLong
        ? `GPS: ${body.gpsLat}, ${body.gpsLong}  → https://maps.google.com/?q=${body.gpsLat},${body.gpsLong}`
        : "GPS: not shared",
      "",
      `Source: ${
        attribution.utm_source
          ? `${attribution.utm_source}${attribution.utm_medium ? `/${attribution.utm_medium}` : ""}${
              attribution.utm_campaign ? ` (${attribution.utm_campaign})` : ""
            }`
          : attribution.referrer
            ? `referred by ${attribution.referrer}`
            : "direct"
      }`,
      attribution.landing_path ? `Landed on: ${attribution.landing_path}` : null,
    ].filter(Boolean);

    const conversation = await chatwoot<{ id: number }>("/conversations", {
      method: "POST",
      body: JSON.stringify({
        inbox_id: inboxId,
        contact_id: contactId,
        source_id: email || phone,
        status: "open",
      }),
    });

    await chatwoot(`/conversations/${conversation.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: lines.join("\n"), message_type: "incoming" }),
    });

    return json({ ok: true });
  } catch (err) {
    // Chatwoot is the only store — if it is unreachable the lead exists nowhere
    // else, so put the whole payload in the function log where it can be
    // recovered by hand. The visitor is told to use WhatsApp instead.
    console.error("[lead] failed to reach Chatwoot:", err);
    console.error("[lead] unsaved payload:", JSON.stringify({ name, email, phone, ...customAttributes }));
    return json({ error: "Could not submit right now. Please message us on WhatsApp." }, 502);
  }
};

export const config = { path: "/api/lead" };
