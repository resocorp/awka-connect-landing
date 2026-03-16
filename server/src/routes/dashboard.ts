import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // New leads today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: newLeadsToday } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Pending payments
    const { count: pendingPayments } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'payment_pending');

    // Active customers
    const { count: activeCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Churned customers
    const { count: churnedCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'churned');

    // Recent activity
    const { data: recentActivity } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      newLeadsToday: newLeadsToday || 0,
      pendingPayments: pendingPayments || 0,
      activeCustomers: activeCustomers || 0,
      churnedCustomers: churnedCustomers || 0,
      recentActivity: recentActivity || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: leads per day (last 30 days)
router.get('/analytics/leads-per-day', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const byDay: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      byDay[d.toISOString().split('T')[0]] = 0;
    }
    for (const row of data || []) {
      const day = new Date(row.created_at).toISOString().split('T')[0];
      if (byDay[day] !== undefined) byDay[day]++;
    }

    const result = Object.entries(byDay).map(([date, count]) => ({ date, count }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: activations/renewals by day of week
router.get('/analytics/renewals-by-day', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('created_at')
      .eq('action', 'activated');

    if (error) throw error;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const row of data || []) {
      const dow = new Date(row.created_at).getDay();
      counts[dow]++;
    }

    const result = dayNames.map((name, i) => ({ day: name, count: counts[i] }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: customer status distribution
router.get('/analytics/status-distribution', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('status');

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.status] = (counts[row.status] || 0) + 1;
    }

    const result = Object.entries(counts).map(([status, count]) => ({ status, count }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: conversions per day (last 30 days)
router.get('/analytics/conversions-per-day', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('activity_log')
      .select('created_at')
      .eq('action', 'converted_to_customer')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const byDay: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      byDay[d.toISOString().split('T')[0]] = 0;
    }
    for (const row of data || []) {
      const day = new Date(row.created_at).toISOString().split('T')[0];
      if (byDay[day] !== undefined) byDay[day]++;
    }

    const result = Object.entries(byDay).map(([date, count]) => ({ date, count }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
