# PHSWEB CRM Server

Backend API for PHSWEB CRM system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Get Supabase service key:
   - Go to https://supabase.com/dashboard/project/dbbktjmnuipcszucwzkl/settings/api
   - Copy the `service_role` key (not the anon key)
   - Paste it in `.env` as `SUPABASE_SERVICE_KEY`

4. Run in development:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/leads` - Create lead (from landing page)
- `GET /api/leads` - List leads
- `PATCH /api/leads/:id` - Update lead
- `POST /api/leads/:id/payment-link` - Generate payment link
- `GET /api/customers` - List customers
- `POST /api/customers/:id/activate` - Activate customer
- `POST /api/customers/:id/suspend` - Suspend customer
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/plans` - List plans
- `POST /api/plans` - Create plan
- `POST /api/webhooks/paystack` - Paystack webhook
- `GET /api/dashboard/stats` - Dashboard statistics
