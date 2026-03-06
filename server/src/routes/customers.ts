import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { addCredits, sendPod, getUserData } from '../services/radius';

const router = Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = supabase
      .from('customers')
      .select('*, plans(*)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`firstname.ilike.%${search}%,lastname.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, plans(*), leads(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Get Radius data
    try {
      const radiusData = await getUserData(data.radius_username);
      data.radius_data = radiusData;
    } catch (radiusError) {
      console.error('Failed to fetch Radius data:', radiusError);
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Activate customer (extend expiry)
router.post('/:id/activate', async (req, res) => {
  try {
    const { months = 1 } = req.body;

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Add credits in Radius Manager
    await addCredits(customer.radius_username, months, 'month');

    // Update customer status
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await supabase
      .from('customers')
      .update({
        status: 'active',
        activated_at: customer.activated_at || new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .eq('id', req.params.id);

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'active' })
      .eq('id', customer.lead_id);

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'customer',
      entity_id: req.params.id,
      action: 'activated',
      details: { months, expires_at: expiresAt.toISOString() }
    });

    res.json({ success: true, expires_at: expiresAt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Suspend customer
router.post('/:id/suspend', async (req, res) => {
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Send PoD (Packet of Disconnect) in Radius Manager
    await sendPod(customer.radius_username);

    // Update customer status
    await supabase
      .from('customers')
      .update({ status: 'suspended' })
      .eq('id', req.params.id);

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'customer',
      entity_id: req.params.id,
      action: 'suspended',
      details: {}
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'customer',
      entity_id: req.params.id,
      action: 'updated',
      details: updates
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
