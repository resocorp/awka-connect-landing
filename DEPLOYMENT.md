# PHSWEB Internet — Deployment Guide

This guide covers running and deploying the three parts of the PHSWEB platform:

| # | Component | Dev URL | Production |
|---|-----------|---------|------------|
| 1 | **Frontend** (Landing Page + CRM) | http://localhost:8080 | Netlify / Vercel / VPS Nginx |
| 2 | **Backend API** | http://localhost:3001 | VPS (PM2 + Nginx reverse proxy) |
| 3 | **CRM Admin** | http://localhost:8080/admin/login | Same host as frontend, `/admin/*` routes |

---

## Prerequisites

- **Node.js 18+** and **npm** — [install via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **Supabase** project credentials — https://supabase.com/dashboard/project/dbbktjmnuipcszucwzkl/settings/api
- **Paystack** account and API keys — https://dashboard.paystack.com/#/settings/developer
- (Production) A Linux VPS with SSH access (DigitalOcean, Hetzner, etc.)

---

## Development Environment

### Step 1 — Clone and install

```bash
git clone <your-repo-url>
cd awka-connect-landing

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### Step 2 — Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
# Supabase — use the service_role key (NOT the anon key)
SUPABASE_URL=https://dbbktjmnuipcszucwzkl.supabase.co
SUPABASE_SERVICE_KEY=<paste service_role key from Supabase dashboard>

# Paystack test keys
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

# Radius Manager (your ISP provisioning server)
RADIUS_API_URL=http://your-radius-server/radiusmanager/api/sysapi.php
RADIUS_API_USER=api
RADIUS_API_PASS=api123
```

> **Note:** The Supabase `service_role` key is secret — never commit it or expose it in the frontend.

### Step 3 — Start both servers

Open **two terminals**:

**Terminal 1 — Backend API**
```bash
cd server
npm run dev
# Server starts on http://localhost:3001
# Verify: curl http://localhost:3001/health
```

**Terminal 2 — Frontend**
```bash
# From repo root
npm run dev
# Vite starts on http://localhost:8080
# All /api/* requests are proxied to http://localhost:3001
```

### Accessing the apps in development

| App | URL | Notes |
|-----|-----|-------|
| **Landing page** | http://localhost:8080 | Public marketing site |
| **CRM Login** | http://localhost:8080/admin/login | Login with a Supabase Auth user |
| **CRM Dashboard** | http://localhost:8080/admin | Redirects to login if not authenticated |
| **CRM Leads** | http://localhost:8080/admin/leads | Lead management |
| **CRM Customers** | http://localhost:8080/admin/customers | Customer management |
| **CRM Settings** | http://localhost:8080/admin/settings | Radius, Paystack, Plans config |
| **API health check** | http://localhost:3001/health | Returns `{"status":"ok"}` |

### Creating a CRM admin user (first time)

1. Go to https://supabase.com/dashboard/project/dbbktjmnuipcszucwzkl/auth/users
2. Click **Add user** → **Create new user**
3. Enter email and password
4. Use those credentials to log in at http://localhost:8080/admin/login

---

## Production Environment

### Architecture

```
Internet
   │
   ├─► Netlify / Vercel ──► Frontend build (static files)
   │                         Landing page + CRM (React SPA)
   │                         /api/* → proxied to VPS API
   │
   └─► VPS (Nginx)
         ├─► :443  ──► Nginx reverse proxy
         │              ├─► /api/* → Node.js API (port 3001, PM2)
         │              └─► /       → frontend static files (if self-hosted)
         └─► Supabase (external, managed)
```

---

### Option A — Frontend on Netlify/Vercel + Backend on VPS (recommended)

#### 1. Deploy the backend to your VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Clone the repo
git clone <your-repo-url>
cd awka-connect-landing/server

# Install dependencies
npm install

# Create production .env
cp .env.example .env
nano .env
```

Set in `server/.env` for production:

```env
SUPABASE_URL=https://dbbktjmnuipcszucwzkl.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>

PAYSTACK_SECRET_KEY=your_paystack_live_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_live_public_key

PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

RADIUS_API_URL=http://your-radius-server/radiusmanager/api/sysapi.php
RADIUS_API_USER=api
RADIUS_API_PASS=your_radius_password
```

```bash
# Build TypeScript
npm run build

# Install PM2 globally
npm install -g pm2

# Start the API with PM2
pm2 start dist/index.js --name phsweb-api

# Save PM2 config and enable auto-start on reboot
pm2 save
pm2 startup
```

Verify the API is running:
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}
```

#### 2. Configure Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/phsweb-api
```

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/phsweb-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Enable HTTPS with Let's Encrypt
sudo certbot --nginx -d api.your-domain.com
```

#### 3. Deploy the frontend to Netlify

Set an environment variable in Netlify so the frontend calls the correct API:

> The frontend uses Vite's proxy in dev. In production, `VITE_API_BASE_URL` must point to your live API.

In `src/lib/api.ts` the base URL should read from `import.meta.env.VITE_API_BASE_URL` (or default to `/api` if unset and you reverse-proxy at the same domain).

**Netlify environment variables** (Site → Settings → Environment Variables):
```
VITE_API_BASE_URL=https://api.your-domain.com
```

**Build settings** in Netlify:
```
Base directory:   (leave empty — repo root)
Build command:    npm run build
Publish directory: dist
```

After deploy:

| App | URL |
|-----|-----|
| **Landing page** | https://your-netlify-site.netlify.app |
| **CRM Login** | https://your-netlify-site.netlify.app/admin/login |
| **CRM Dashboard** | https://your-netlify-site.netlify.app/admin |
| **API** | https://api.your-domain.com |
| **API health** | https://api.your-domain.com/health |

> **SPA routing:** Add a `public/_redirects` file with `/* /index.html 200` so Netlify handles React Router routes correctly.

---

### Option B — Everything on a single VPS

#### 1. Build the frontend

```bash
# From repo root on the VPS
npm install
npm run build
# Output goes to /dist
```

#### 2. Serve frontend + API via Nginx

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend static files
    root /home/user/awka-connect-landing/dist;
    index index.html;

    # React Router — serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

With this setup the frontend, CRM, and API are all on the same domain — no `VITE_API_BASE_URL` override is needed because the Vite build will call `/api/*` which Nginx proxies to the local Node process.

---

## Updating in Production

```bash
# On VPS
cd awka-connect-landing
git pull

# Rebuild backend
cd server && npm install && npm run build
pm2 restart phsweb-api

# Rebuild frontend (Option B only)
cd .. && npm install && npm run build
```

---

## PM2 Useful Commands

```bash
pm2 list                    # Show running processes
pm2 logs phsweb-api         # Stream logs
pm2 restart phsweb-api      # Restart API
pm2 stop phsweb-api         # Stop API
pm2 monit                   # Real-time monitoring dashboard
```

---

## Paystack Webhook (Production)

In your Paystack dashboard, add the webhook URL:
```
https://api.your-domain.com/api/webhooks/paystack
```

The backend verifies the `x-paystack-signature` header on every call.

---

## Environment Variable Reference

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase `service_role` key — keep secret |
| `PAYSTACK_SECRET_KEY` | ✅ | Paystack secret key (`sk_test_*` or `sk_live_*`) |
| `PAYSTACK_PUBLIC_KEY` | ✅ | Paystack public key |
| `PORT` | optional | API port (default `3001`) |
| `NODE_ENV` | optional | `development` or `production` |
| `CORS_ORIGIN` | ✅ | Frontend origin (e.g. `http://localhost:8080`) |
| `RADIUS_API_URL` | optional | Radius Manager API endpoint |
| `RADIUS_API_USER` | optional | Radius Manager API username |
| `RADIUS_API_PASS` | optional | Radius Manager API password |

### Frontend (root `.env` / Netlify env vars)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | optional | Override API base URL in production (default: `/api`) |
