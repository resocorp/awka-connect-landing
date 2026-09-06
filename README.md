# PHSWEB Internet — phsweb.ng

Marketing site for **PHSWEB Internet**, a fibre and fixed wireless broadband
provider in Awka, Anambra State, Nigeria.

A static React site plus one serverless function. Enquiries land in **Chatwoot**,
where the care team already works.

---

## Architecture

| Piece | Where | What it does |
|---|---|---|
| Landing page | `src/` → `dist/` | Static Vite/React build, served by Netlify |
| Lead endpoint | `netlify/functions/lead.mts` | `POST /api/lead` → creates a Chatwoot contact + conversation |
| Live chat | `src/lib/chatwoot.ts` | Chatwoot widget, loaded from `chat.sabiwifi.com` |
| WhatsApp | `src/lib/attribution.ts` | `wa.me` links with a prefilled, attributed first message |

There is no database and no admin panel. Chatwoot is the system of record for
enquiries.

### How a lead arrives

Three doors, all opening into Chatwoot:

1. **Contact form** → `/api/lead` → contact + conversation in the *Website Leads*
   inbox. This is the only path that captures plan, install address and GPS.
2. **Live chat widget** → *Website Chat* inbox, with attribution attached as
   contact custom attributes.
3. **WhatsApp link** → the business line on **0911 101 1000**, arriving through
   the existing Evolution → Chatwoot bridge.

The *Website Leads* inbox is an API channel with **no delivery channel** — nothing
this site does can send a message to a customer. That is deliberate: unsolicited
outbound from the business line is what previously earned a WhatsApp block. An
agent reads the lead and chooses to reach out.

### Attribution

`src/lib/attribution.ts` captures `utm_*`, referrer and landing path once per
session and holds them in `sessionStorage`. They ride along in three ways:

- the form posts them, and they become Chatwoot contact custom attributes
- the widget sets them via `$chatwoot.setCustomAttributes`
- `wa.me` links carry them in the prefilled message text — the only attribution
  that survives the hop into WhatsApp, since we control nothing on the far side

---

## Development

```bash
npm install
npm run dev        # http://localhost:8080
```

To exercise the lead function locally you need the Netlify CLI, since `npm run dev`
serves the static site only:

```bash
npx netlify dev    # serves the site and /api/lead together
```

### Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_CHATWOOT_WEBSITE_TOKEN` | build-time | Website Chat inbox token. Public by design. Unset disables the widget. |
| `CHATWOOT_BASE_URL` | function | `https://chat.sabiwifi.com` |
| `CHATWOOT_ACCOUNT_ID` | function | Chatwoot account id |
| `CHATWOOT_API_TOKEN` | function | Agent access token. **Secret.** |
| `CHATWOOT_LEADS_INBOX_ID` | function | id of the *Website Leads* API inbox |

Set the function variables in Netlify → Site configuration → Environment variables.
Never commit them.

---

## Plans

`src/data/plans.ts` is the single source of truth for the pricing cards and the
form's plan picker. It also records each plan's `radiusSrvid`, so whoever
provisions a customer by hand knows which Radius Manager service was requested.
Keep that in step with Radius Manager — nothing verifies it automatically.

---

## Deployment

Netlify, building from `main`. `npm run build` → `dist`. Config lives in
`netlify.toml`; the lead function declares its own route via `export const config`.

`phsweb.ng` DNS stays with go54 — only the apex A record and the `www` CNAME point
at Netlify. The zone also carries Zoho MX, DKIM, SPF and `portal1` (the Radius
Manager), none of which should be touched.

---

## History

This repo previously held an Express CRM (`server/`), a Baileys WhatsApp sidecar
(`whatsapp-sidecar/`) and a Supabase-backed admin panel (`src/pages/admin/`), all
running on a DigitalOcean droplet. The CRM captured 37 leads in five months, 35 of
which were never worked, in front of a Paystack integration that never left test
keys. The sidecar only ever sent messages — it never collected any — and its
session had been logged out for some time, so those notifications were failing
silently.

All of it was retired in favour of Chatwoot in September 2026. The data was
exported before the droplet was destroyed.
