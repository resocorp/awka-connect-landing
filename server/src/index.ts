import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import leadsRouter from './routes/leads';
import customersRouter from './routes/customers';
import settingsRouter from './routes/settings';
import plansRouter from './routes/plans';
import radiusRouter from './routes/radius';
import webhooksRouter from './routes/webhooks';
import dashboardRouter from './routes/dashboard';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes (no auth required)
app.use('/api/leads', leadsRouter);
app.use('/api/webhooks', webhooksRouter);

// Protected routes (require Supabase Auth JWT)
app.use('/api/customers', requireAuth, customersRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/plans', requireAuth, plansRouter);
app.use('/api/radius', requireAuth, radiusRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

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

app.listen(PORT, () => {
  console.log(`🚀 PHSWEB CRM Server running on port ${PORT}`);
});
