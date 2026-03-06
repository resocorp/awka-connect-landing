import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Get all plans
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create plan
router.post('/', async (req, res) => {
  try {
    const { name, price, radius_srvid, radius_acctype } = req.body;

    const { data, error } = await supabase
      .from('plans')
      .insert({
        name,
        price,
        radius_srvid,
        radius_acctype: radius_acctype || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update plan
router.put('/:id', async (req, res) => {
  try {
    const { name, price, radius_srvid, radius_acctype, is_active } = req.body;

    const { data, error } = await supabase
      .from('plans')
      .update({
        name,
        price,
        radius_srvid,
        radius_acctype,
        is_active
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete plan
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('plans')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
