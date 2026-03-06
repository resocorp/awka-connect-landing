import { Router } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');

    if (error) throw error;

    // Convert to key-value object
    const settings: any = {};
    data.forEach(s => {
      settings[s.key] = s.value;
    });

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const updates = req.body;

    // Upsert each setting
    for (const [key, value] of Object.entries(updates)) {
      await supabase
        .from('settings')
        .upsert({
          key,
          value: value as string
        }, {
          onConflict: 'key'
        });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
