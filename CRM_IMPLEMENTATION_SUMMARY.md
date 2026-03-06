# PHSWEB CRM Implementation Summary

## ✅ What Has Been Completed

### 1. Supabase Project Created
- **Project ID**: `dbbktjmnuipcszucwzkl`
- **Region**: EU West 1 (Ireland)
- **URL**: `https://dbbktjmnuipcszucwzkl.supabase.co`

### 2. Database Schema Deployed
All tables created with proper indexes and triggers:
- ✅ `leads` - Customer signup data from landing page
- ✅ `customers` - Active/provisioned customers
- ✅ `plans` - Service plans with Radius Manager mapping
- ✅ `settings` - System configuration (Radius, Paystack, etc.)
- ✅ `activity_log` - Audit trail for all actions

### 3. Backend API Server (Node.js/Express)
Complete REST API with TypeScript located in `/server`:

**Core Services:**
- ✅ Supabase integration
- ✅ DMA Radius Manager proxy (create user, add credits, suspend, SMS)
- ✅ Paystack payment integration (initialize, verify, webhook)

**API Endpoints:**
- ✅ `/api/leads` - CRUD operations, payment link generation
- ✅ `/api/customers` - List, activate, suspend customers
- ✅ `/api/settings` - Get/update system settings
- ✅ `/api/plans` - Manage service plans
- ✅ `/api/radius` - Proxy to Radius Manager
- ✅ `/api/webhooks/paystack` - Auto-provision on payment
- ✅ `/api/dashboard/stats` - Dashboard metrics

### 4. Landing Page Updates
- ✅ Enterprise plan option added to signup form
- ✅ Address field (required)
- ✅ GPS location capture (optional)
- ✅ Promo installation fee display (50% OFF)
- ✅ Form ready to POST to `/api/leads`

## 📋 Next Steps (To Complete the CRM)

### Phase 1: Install Backend Dependencies
```bash
cd server
npm install
```

### Phase 2: Configure Environment Variables
1. Get Supabase service key:
   - Visit: https://supabase.com/dashboard/project/dbbktjmnuipcszucwzkl/settings/api
   - Copy the `service_role` key
   
2. Create `server/.env`:
```env
SUPABASE_URL=https://dbbktjmnuipcszucwzkl.supabase.co
SUPABASE_SERVICE_KEY=<paste_service_key_here>

PAYSTACK_SECRET_KEY=<your_paystack_secret>
PAYSTACK_PUBLIC_KEY=<your_paystack_public>

PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

RADIUS_API_URL=http://your-radius-server/radiusmanager/api/sysapi.php
RADIUS_API_USER=api
RADIUS_API_PASS=api123
```

### Phase 3: Test Backend Server
```bash
cd server
npm run dev
```

Visit `http://localhost:3001/health` - should return `{"status":"ok"}`

### Phase 4: Build CRM Frontend (React Dashboard)
The CRM frontend needs to be built. It should include:

**Pages Needed:**
1. **Login** - Supabase Auth
2. **Dashboard** - Stats cards, recent activity
3. **Leads** - Table with filters, detail panel, actions
4. **Customers** - Table, activate/suspend actions
5. **Settings** - Configure Radius, Paystack, Plans

**Recommended Stack:**
- React + Vite + TypeScript (same as landing page)
- TailwindCSS + shadcn/ui (for consistency)
- React Router for navigation
- Supabase Auth for login
- Axios for API calls to backend

**File Structure:**
```
crm/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Leads.tsx
│   │   ├── Customers.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── LeadCard.tsx
│   │   ├── CustomerCard.tsx
│   │   └── StatsCard.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   └── App.tsx
```

### Phase 5: Connect Landing Page to API
Update `Contact.tsx` to POST form data to backend:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:3001/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        plan: form.plan,
        address: form.address,
        gpsLat: form.gpsLat,
        gpsLong: form.gpsLong
      })
    });
    
    if (response.ok) {
      toast({
        title: "Request received!",
        description: "We'll reach out to you shortly. Thank you!",
      });
      setForm({ name: "", email: "", phone: "", plan: "home", address: "", gpsLat: "", gpsLong: "" });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive"
    });
  }
};
```

### Phase 6: Configure Settings in CRM
Once CRM is built, configure:
1. **Radius Manager** - API URL, credentials, default groupid
2. **Paystack** - API keys
3. **Plans** - Map Home/Power/Enterprise to Radius srvid values

### Phase 7: Deploy to DigitalOcean VPS

**Backend Deployment:**
```bash
# On VPS
git clone <your-repo>
cd awka-connect-landing/server
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name phsweb-api
pm2 save
pm2 startup
```

**Frontend Deployment:**
- Landing page: Deploy to Netlify/Vercel (already set up)
- CRM dashboard: Deploy to same VPS with Nginx reverse proxy

## 🔄 Complete Customer Journey Flow

1. **Customer visits landing page** → fills signup form
2. **Form submits** → `POST /api/leads` → Lead created in Supabase
3. **Admin receives SMS** (via Radius Manager SMS API)
4. **Customer receives SMS**: "Thanks for signing up!"
5. **Admin reviews lead in CRM** → schedules site survey
6. **Admin sends payment link** → `POST /api/leads/:id/payment-link`
7. **Customer pays via Paystack**
8. **Paystack webhook** → `POST /api/webhooks/paystack`
9. **Auto-provision**:
   - Lead status → `payment_confirmed`
   - Radius account created (enabled but expired)
   - Customer record created
10. **After installation**, admin clicks "Activate" in CRM
11. **Activation** → Radius expiry extended → Customer status `active`
12. **Ongoing**: Admin can suspend, track churn, view stats

## 📊 Database Access

**Supabase Dashboard:**
https://supabase.com/dashboard/project/dbbktjmnuipcszucwzkl

**Direct SQL Access:**
```sql
-- View all leads
SELECT * FROM leads ORDER BY created_at DESC;

-- View active customers
SELECT * FROM customers WHERE status = 'active';

-- View recent activity
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20;
```

## 🔐 Security Notes

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Supabase service key** - Keep secret, only use server-side
3. **Paystack secret key** - Never expose to frontend
4. **Radius API credentials** - Stored in DB settings or env vars
5. **Webhook signature** - Always verify Paystack signatures

## 📝 Testing Checklist

- [ ] Backend server starts without errors
- [ ] Health check endpoint responds
- [ ] Landing page form submits to API
- [ ] Lead appears in Supabase `leads` table
- [ ] Payment link generation works
- [ ] Paystack webhook processes correctly
- [ ] Radius account creation works
- [ ] Customer activation extends expiry
- [ ] Settings can be updated
- [ ] Plans can be managed

## 🚀 Production Readiness

**Before going live:**
1. Set `NODE_ENV=production`
2. Update `CORS_ORIGIN` to production domain
3. Enable HTTPS (use Let's Encrypt)
4. Set up database backups (Supabase auto-backups)
5. Configure Paystack live keys (not test keys)
6. Test Radius Manager connectivity from VPS
7. Set up monitoring (PM2, error tracking)
8. Configure firewall rules on VPS

## 💡 Future Enhancements

- WhatsApp integration via Baileys (Phase 2)
- Agent AVR voice response system (Phase 3)
- Customer self-service portal
- Payment reminders automation
- Referral tracking system
- Analytics dashboard
- Mobile app for field technicians
