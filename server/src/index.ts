import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';
import leadsRouter from './routes/leads';
import customersRouter from './routes/customers';
import settingsRouter from './routes/settings';
import plansRouter from './routes/plans';
import radiusRouter from './routes/radius';
import webhooksRouter from './routes/webhooks';
import dashboardRouter from './routes/dashboard';
import { requireAuth } from './middleware/auth';
import { getWhatsAppSidecarStatus, getWhatsAppQR, disconnectWhatsApp, restartWhatsApp, sendWhatsApp } from './services/whatsapp';
import { syncAllCustomerStatuses } from './services/sync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.set('trust proxy', 1); // trust nginx reverse proxy

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));

// Rate limiting - general: 100 req/min per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

// Strict rate limit for public form submissions: 5 per minute
const formLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions, please try again in a minute' }
});

app.use('/api/', generalLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Public routes (no auth required)
app.use('/api/webhooks', webhooksRouter);
// Leads: POST / and GET are public; admin sub-actions require auth
app.use('/api/leads', (req, _res, next) => {
  const isPublic =
    (req.method === 'POST' && req.path === '/') ||
    req.method === 'GET';
  if (isPublic) {
    // Apply strict rate limit to public POST (form submissions)
    if (req.method === 'POST') return formLimiter(req, _res, next);
    return next();
  }
  requireAuth(req, _res, next);
}, leadsRouter);

// Protected routes (require Supabase Auth JWT)
app.use('/api/customers', requireAuth, customersRouter);
app.use('/api/settings', requireAuth, settingsRouter);
// Plans: GET is public (landing page plan picker), mutations require auth
app.use('/api/plans', (req, _res, next) => {
  if (req.method === 'GET') return next();
  requireAuth(req, _res, next);
}, plansRouter);
app.use('/api/radius', requireAuth, radiusRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

// WhatsApp sidecar proxy (auth-protected)
app.get('/api/whatsapp/status', requireAuth, async (req, res) => {
  try {
    const status = await getWhatsAppSidecarStatus();
    res.json(status);
  } catch {
    res.json({ status: 'disconnected', hasQR: false });
  }
});

app.get('/api/whatsapp/qr', requireAuth, async (req, res) => {
  try {
    const data = await getWhatsAppQR();
    if (!data) return res.status(404).json({ error: 'No QR code available' });
    res.json(data);
  } catch {
    res.status(503).json({ error: 'WhatsApp sidecar not reachable' });
  }
});

app.post('/api/whatsapp/disconnect', requireAuth, async (req, res) => {
  try {
    const result = await disconnectWhatsApp();
    res.json(result);
  } catch {
    res.status(503).json({ error: 'WhatsApp sidecar not reachable' });
  }
});

app.post('/api/whatsapp/restart', requireAuth, async (req, res) => {
  try {
    const result = await restartWhatsApp();
    res.json(result);
  } catch {
    res.status(503).json({ error: 'WhatsApp sidecar not reachable' });
  }
});

app.post('/api/whatsapp/send', requireAuth, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'phone and message are required' });
    await sendWhatsApp(phone, message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`🚀 PHSWEB CRM Server running on port ${PORT}`);

  // Daily cron job: sync all customer statuses from Radius Manager at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log(`[Cron] Starting daily customer status sync at ${new Date().toISOString()}`);
    try {
      const result = await syncAllCustomerStatuses();
      console.log(`[Cron] Sync complete: ${result.synced} synced, ${result.failed} failed, ${result.total} total`);
    } catch (err: any) {
      console.error(`[Cron] Sync failed:`, err.message);
    }
  });
  console.log('⏰ Daily status sync cron scheduled (2:00 AM)');
});
