import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { verifyWebhookSignature, verifyPayment } from '../services/paystack';
import { createRadiusUser, selectOwner } from '../services/radius';

const router = Router();

// Paystack webhook handler
router.post('/paystack', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // Verify payment
      const verification = await verifyPayment(reference);

      if (verification.data.status === 'success') {
        const leadId = event.data.metadata.lead_id;

        // Get lead details
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (!lead) {
          return res.status(404).json({ error: 'Lead not found' });
        }

        // Update lead status
        await supabase
          .from('leads')
          .update({
            status: 'payment_confirmed',
            paid_at: new Date().toISOString()
          })
          .eq('id', leadId);

        // Get plan details (case-insensitive match on name)
        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .ilike('name', lead.plan_requested || '')
          .maybeSingle();

        if (!plan) {
          console.warn(`No plan found matching name "${lead.plan_requested}" for lead ${leadId}. Radius user will be created without srvid.`);
        }

        // Generate username (using phone number)
        const username = lead.phone.replace(/[^0-9]/g, '');

        // Create Radius account (enabled but expired)
        const owner = selectOwner();
        const radiusResult = await createRadiusUser({
          username,
          password: 'default123',
          firstname: lead.name.split(' ')[0],
          lastname: lead.name.split(' ').slice(1).join(' '),
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          gpsLat: lead.gps_lat,
          gpsLong: lead.gps_long,
          srvid: plan?.radius_srvid,
          groupid: 11,
          acctype: plan?.radius_acctype || 0,
          enabled: 1,
          expiry: new Date().toISOString().split('T')[0], // Today (expired)
          owner
        });

        // Update lead with radius username
        await supabase
          .from('leads')
          .update({
            radius_username: username,
            status: 'provisioning'
          })
          .eq('id', leadId);

        // Create customer record
        const { data: customer } = await supabase
          .from('customers')
          .insert({
            lead_id: leadId,
            radius_username: username,
            plan_id: plan?.id,
            status: 'expired',
            firstname: lead.name.split(' ')[0],
            lastname: lead.name.split(' ').slice(1).join(' '),
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

        // Log activity
        await supabase.from('activity_log').insert({
          entity_type: 'lead',
          entity_id: leadId,
          action: 'payment_confirmed_radius_created',
          details: {
            reference,
            amount: event.data.amount / 100,
            radius_username: username,
            customer_id: customer.id
          }
        });
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
