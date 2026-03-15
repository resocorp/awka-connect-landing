# PHSWEB Internet — Awka Connect Landing Page & CRM

Marketing landing page and admin CRM for **PHSWEB Internet**, a fibre and fixed wireless broadband provider in Awka, Anambra State, Nigeria.

---

## Project Overview

This monorepo contains three interconnected applications:

| App | Location | Description |
|-----|----------|-------------|
| **Landing Page** | `/` (repo root) | Public-facing marketing site with sign-up form |
| **CRM / Admin Dashboard** | `/admin/*` routes (embedded in landing page) | Internal dashboard for managing leads, customers, settings |
| **Backend API** | `/server` | Node.js/Express REST API, Supabase integration, Radius Manager proxy, Paystack payments |

---

## Tech Stack

### Frontend (Landing Page + CRM)
- **React 18** + **TypeScript**
- **Vite** (build tool, dev server on port `8080`)
- **React Router v6** — routing including `/admin/*` CRM routes
- **TanStack Query v5** — server state management
- **shadcn/ui** + **Radix UI** — component library
- **Tailwind CSS** — styling
- **Supabase JS** — auth (admin login) and direct DB access where needed

### Backend API (`/server`)
- **Node.js** + **Express** + **TypeScript**
- **tsx** — dev runner with hot reload
- **Supabase** (service-role key) — database operations
- **Paystack** — payment initialisation and webhook processing
- **DMA Radius Manager** proxy — ISP account provisioning

### Database
- **Supabase** (PostgreSQL) — hosted, project ID `dbbktjmnuipcszucwzkl` (EU West 1)
  - `leads` — signup submissions from landing page
  - `customers` — provisioned/active customers
  - `plans` — service plans with Radius Manager mapping
  - `settings` — system config (Radius, Paystack, etc.)
  - `activity_log` — audit trail

---

## Repository Structure

```
awka-connect-landing/
├── src/                        # Frontend source
│   ├── components/             # Landing page sections (Hero, Plans, FAQ, etc.)
│   │   └── admin/              # CRM layout component
│   ├── pages/
│   │   ├── Index.tsx           # Landing page entry
│   │   └── admin/              # CRM pages: Dashboard, Leads, Customers, Settings, Login
│   ├── lib/
│   │   ├── api.ts              # API client (calls to /server)
│   │   └── supabase.ts         # Supabase client (anon key, for auth)
│   └── App.tsx                 # Router: / (landing) + /admin/* (CRM)
├── server/                     # Backend API
│   ├── src/
│   │   ├── index.ts            # Express app entry point (port 3001)
│   │   ├── routes/             # leads, customers, settings, plans, radius, webhooks, dashboard
│   │   ├── services/           # Supabase service, Radius Manager service
│   │   ├── middleware/         # Auth (Supabase JWT verification)
│   │   └── lib/                # Shared utilities
│   ├── .env.example            # Environment variable template
│   └── package.json
├── public/                     # Static assets (logo, images)
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite config — proxies /api → localhost:3001
├── package.json
└── DEPLOYMENT.md               # Deployment guide (dev + production)
```

---

## Quick Start (Development)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full instructions.

### Prerequisites
- Node.js 18+ and npm
- Access to the Supabase project (get keys from the dashboard)

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env — fill in SUPABASE_SERVICE_KEY, PAYSTACK keys, RADIUS details
```

### 3. Start both servers

```bash
# Terminal 1 — Backend API (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 8080, proxies /api → 3001)
npm run dev
```

- **Landing page**: http://localhost:8080
- **CRM admin**: http://localhost:8080/admin/login
- **API health check**: http://localhost:3001/health

---

## Customer Journey

1. Customer fills the sign-up form on the landing page
2. `POST /api/leads` creates a lead in Supabase
3. Admin reviews leads in the CRM → schedules site survey
4. Admin generates a Paystack payment link from the CRM
5. Customer pays → Paystack webhook auto-provisions a Radius account
6. After physical installation, admin activates the customer in the CRM
7. Radius account expiry is extended → customer goes live

---

## Security Notes

- Never commit `.env` files — they are in `.gitignore`
- `SUPABASE_SERVICE_KEY` must only be used server-side
- Paystack secret key must never be exposed to the frontend
- Paystack webhook signatures are verified on every request
