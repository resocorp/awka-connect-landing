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

export default router;
