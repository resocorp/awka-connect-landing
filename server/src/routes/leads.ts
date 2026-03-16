import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { initializePayment } from '../services/paystack';
import { createRadiusUser, selectOwner } from '../services/radius';
import { sendWhatsApp, getWhatsAppSettings, interpolateWA } from '../services/whatsapp';

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

    // Log activity (non-fatal — never block the response)
    supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: lead.id,
      action: 'created',
      details: { source: 'website', plan: plan }
    }).then(({ error: logErr }) => {
      if (logErr) console.error('activity_log insert failed:', logErr.message);
    });

    // Send WhatsApp notifications (fire-and-forget, don't block response)
    (async () => {
      try {
        const waConfig = await getWhatsAppSettings();
        const vars = { name, email, phone, plan: plan || '', address: address || '' };

        // 1. Customer confirmation WhatsApp
        if (phone) {
          const customerMsg = interpolateWA(waConfig.customerTemplate, vars);
          try {
            await sendWhatsApp(phone, customerMsg);
            console.log(`WhatsApp sent to customer ${phone}`);
          } catch (e: any) {
            console.error(`Customer WhatsApp failed (${phone}):`, e.message);
          }
        }

        // 2. Admin alert WhatsApp
        for (const adminNumber of waConfig.adminNumbers) {
          const adminMsg = interpolateWA(waConfig.adminTemplate, vars);
          try {
            await sendWhatsApp(adminNumber, adminMsg);
            console.log(`Admin alert WhatsApp sent to ${adminNumber}`);
          } catch (e: any) {
            console.error(`Admin WhatsApp failed (${adminNumber}):`, e.message);
          }
        }
      } catch (e: any) {
        console.error('WhatsApp notification error:', e.message);
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

    // Send payment link via WhatsApp (fire-and-forget)
    if (lead.phone) {
      (async () => {
        try {
          const waConfig = await getWhatsAppSettings();
          const msg = interpolateWA(waConfig.paymentTemplate, {
            name: lead.name,
            phone: lead.phone,
            amount: Number(amount).toLocaleString(),
            payment_url: paymentUrl,
            reference,
            plan: lead.plan_requested || '',
          });
          await sendWhatsApp(lead.phone, msg);
          console.log(`Payment link WhatsApp sent to ${lead.phone}`);
        } catch (e: any) {
          console.error(`Payment link WhatsApp failed (${lead.phone}):`, e.message);
        }
      })();
    }

    res.json({
      payment_url: paymentUrl,
      reference,
      whatsapp_sent: !!lead.phone,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Convert lead to customer (manual admin action)
router.post('/:id/convert', async (req, res) => {
  try {
    console.log(`[Convert] Starting conversion for lead ${req.params.id}`);

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (leadError || !lead) {
      console.error(`[Convert] Lead not found: ${leadError?.message}`);
      return res.status(404).json({ error: 'Lead not found' });
    }

    console.log(`[Convert] Lead: ${lead.name}, phone: ${lead.phone}, plan_requested: ${lead.plan_requested}, status: ${lead.status}`);

    if (lead.status === 'active') {
      return res.status(400).json({ error: 'Lead is already an active customer' });
    }

    // Look up plan by name stored in plan_requested
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .ilike('name', lead.plan_requested)
      .single();

    console.log(`[Convert] Plan lookup for "${lead.plan_requested}": ${plan ? `found (id=${plan.id}, srvid=${plan.radius_srvid})` : `NOT FOUND (${planError?.message})`}`);

    // Use email as Radius username and password
    const username = (lead.email || '').trim().toLowerCase() || `user_${lead.id.substring(0, 8)}`;
    console.log(`[Convert] Generated radius username: ${username}`);

    // Create Radius Manager account (enabled but expired — admin activates after installation)
    const owner = selectOwner();
    let radiusError: string | null = null;
    try {
      await createRadiusUser({
        username,
        password: username,
        firstname: lead.name.split(' ')[0],
        lastname: lead.name.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        gpsLat: lead.gps_lat,
        gpsLong: lead.gps_long,
        srvid: plan?.radius_srvid,
        groupid: 11,
        acctype: plan?.radius_acctype ?? 0,
        enabled: 1,
        expiry: new Date().toISOString().split('T')[0],
        owner
      });
    } catch (e: any) {
      radiusError = e.message;
      console.error(`[Convert] Radius user creation FAILED: ${e.message}`);
    }

    // Update lead status to provisioning
    await supabase
      .from('leads')
      .update({ status: 'provisioning', radius_username: username })
      .eq('id', req.params.id);

    // Check if customer record already exists for this lead
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('lead_id', req.params.id)
      .maybeSingle();

    let customer = existingCustomer;
    if (!existingCustomer) {
      console.log(`[Convert] Creating new customer record (plan_id=${plan?.id ?? 'null'}, owner=${owner})`);
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          lead_id: req.params.id,
          radius_username: username,
          plan_id: plan?.id ?? null,
          status: 'expired',
          firstname: lead.name.split(' ')[0],
          lastname: lead.name.split(' ').slice(1).join(' ') || '',
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          gps_lat: lead.gps_lat,
          gps_long: lead.gps_long,
          expires_at: new Date().toISOString(),
          owner
        })
        .select()
        .single();

      if (custError) {
        console.error(`[Convert] Customer creation FAILED: ${custError.message}`);
        throw custError;
      }
      customer = newCustomer;
      console.log(`[Convert] Customer created: ${customer?.id}`);
    } else {
      console.log(`[Convert] Customer already exists: ${existingCustomer.id}`);
    }

    // Log activity (non-fatal)
    supabase.from('activity_log').insert({
      entity_type: 'lead',
      entity_id: req.params.id,
      action: 'converted_to_customer',
      details: {
        radius_username: username,
        plan: lead.plan_requested,
        plan_srvid: plan?.radius_srvid ?? null,
        customer_id: customer?.id,
        radius_error: radiusError
      }
    }).then(({ error: logErr }) => {
      if (logErr) console.error('activity_log insert failed:', logErr.message);
    });

    // Send welcome WhatsApp (fire-and-forget)
    if (lead.phone) {
      (async () => {
        try {
          const waConfig = await getWhatsAppSettings();
          const msg = interpolateWA(waConfig.customerTemplate, {
            name: lead.name,
            phone: lead.phone,
            email: lead.email || '',
            plan: lead.plan_requested || '',
            address: lead.address || ''
          });
          await sendWhatsApp(lead.phone, msg);
          console.log(`Welcome WhatsApp sent to ${lead.phone}`);
        } catch (e: any) {
          console.error('Welcome WhatsApp failed:', e.message);
        }
      })();
    }

    const result = {
      success: true,
      customer_id: customer?.id,
      radius_username: username,
      radius_srvid: plan?.radius_srvid ?? null,
      plan_name: plan?.name ?? lead.plan_requested,
      radius_error: radiusError
    };
    console.log(`[Convert] DONE:`, JSON.stringify(result));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
