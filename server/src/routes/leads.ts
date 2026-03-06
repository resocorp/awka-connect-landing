import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { initializePayment } from '../services/paystack';
import { sendSMSByPhone, getSMSSettings, interpolateSMS } from '../services/radius';

const router = Router();

// Get all leads with filters
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lead
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new lead (from landing page)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, plan, address, gpsLat, gpsLong } = req.body;

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        plan_requested: plan,
        address,
        gps_lat: gpsLat ? parseFloat(gpsLat) : null,
        gps_long: gpsLong ? parseFloat(gpsLong) : null,
        status: 'new',
        source: 'website'
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: lead.id,
      action: 'created',
      details: { source: 'website', plan: plan }
    });

    // Send SMS notifications (fire-and-forget, don't block response)
    (async () => {
      try {
        const smsConfig = await getSMSSettings();
        const vars = { name, email, phone, plan: plan || '', address: address || '' };

        // 1. Customer confirmation SMS
        if (phone) {
          const customerMsg = interpolateSMS(smsConfig.customerTemplate, vars);
          try {
            await sendSMSByPhone(phone, customerMsg);
            console.log(`SMS sent to customer ${phone}`);
          } catch (e: any) {
            console.error(`Customer SMS failed (${phone}):`, e.message);
          }
        }

        // 2. Admin alert SMS
        for (const adminPhone of smsConfig.adminPhones) {
          const adminMsg = interpolateSMS(smsConfig.adminTemplate, vars);
          try {
            await sendSMSByPhone(adminPhone, adminMsg);
            console.log(`Admin alert SMS sent to ${adminPhone}`);
          } catch (e: any) {
            console.error(`Admin SMS failed (${adminPhone}):`, e.message);
          }
        }
      } catch (e: any) {
        console.error('SMS notification error:', e.message);
      }
    })();

    res.status(201).json(lead);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update lead
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes, survey_date } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (survey_date !== undefined) updateData.survey_date = survey_date;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: req.params.id,
      action: 'updated',
      details: updateData
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate payment link
router.post('/:id/payment-link', async (req, res) => {
  try {
    const { amount } = req.body; // amount in Naira

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (leadError) throw leadError;

    const reference = `PHSWEB-${Date.now()}-${lead.id.substring(0, 8)}`;
    
    const payment = await initializePayment({
      email: lead.email,
      amount: amount * 100, // Convert to kobo
      reference,
      callback_url: `${process.env.CORS_ORIGIN}/payment/callback`,
      metadata: {
        lead_id: lead.id,
        customer_name: lead.name,
        plan: lead.plan_requested
      }
    });

    // Update lead with payment reference
    await supabase
      .from('leads')
      .update({
        payment_ref: reference,
        payment_amount: amount,
        status: 'payment_pending'
      })
      .eq('id', req.params.id);

    const paymentUrl = payment.data.authorization_url;

    // Log activity
    await supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: req.params.id,
      action: 'payment_link_generated',
      details: { amount, reference, payment_url: paymentUrl }
    });

    // Send payment link via SMS (fire-and-forget)
    if (lead.phone) {
      (async () => {
        try {
          const smsConfig = await getSMSSettings();
          const msg = interpolateSMS(smsConfig.paymentTemplate, {
            name: lead.name,
            phone: lead.phone,
            amount: Number(amount).toLocaleString(),
            payment_url: paymentUrl,
            reference,
            plan: lead.plan_requested || '',
          });
          await sendSMSByPhone(lead.phone, msg);
          console.log(`Payment link SMS sent to ${lead.phone}`);
        } catch (e: any) {
          console.error(`Payment link SMS failed (${lead.phone}):`, e.message);
        }
      })();
    }

    res.json({
      payment_url: paymentUrl,
      reference,
      sms_sent: !!lead.phone,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
