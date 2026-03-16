import axios from 'axios';
import { supabase } from '../lib/supabase';

const SIDECAR_URL = process.env.WHATSAPP_SIDECAR_URL || 'http://127.0.0.1:3002';

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const response = await axios.post(`${SIDECAR_URL}/send-message`, { phone, message }, {
    timeout: 10000,
  });
  if (response.data?.error) {
    throw new Error(response.data.error);
  }
}

export async function getWhatsAppSidecarStatus(): Promise<{ status: string; hasQR: boolean }> {
  const response = await axios.get(`${SIDECAR_URL}/status`, { timeout: 5000 });
  return response.data;
}

export async function getWhatsAppQR(): Promise<{ qr: string } | null> {
  try {
    const response = await axios.get(`${SIDECAR_URL}/qr`, { timeout: 5000 });
    return response.data;
  } catch {
    return null;
  }
}

export async function disconnectWhatsApp(): Promise<{ success: boolean; message: string }> {
  const response = await axios.post(`${SIDECAR_URL}/disconnect`, {}, { timeout: 10000 });
  return response.data;
}

export async function restartWhatsApp(): Promise<{ success: boolean; message: string }> {
  const response = await axios.post(`${SIDECAR_URL}/restart`, {}, { timeout: 10000 });
  return response.data;
}

export async function getWhatsAppSettings() {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'wa_customer_template',
      'wa_admin_template',
      'wa_payment_template',
      'wa_admin_numbers',
    ]);

  const config: Record<string, string> = {};
  settings?.forEach((s) => { config[s.key] = s.value; });

  return {
    customerTemplate: config.wa_customer_template ||
      'Hi {name}, thanks for signing up with PHSWEB Internet! We will contact you shortly to schedule a site survey. Plan: {plan}',
    adminTemplate: config.wa_admin_template ||
      'New lead: {name} ({phone}) - {plan} plan. Address: {address}',
    paymentTemplate: config.wa_payment_template ||
      'Hi {name}, your PHSWEB Internet payment link is ready. Amount: NGN {amount}. Pay here: {payment_url} . Reference: {reference}',
    adminNumbers: (config.wa_admin_numbers || '').split(',').map((n) => n.trim()).filter(Boolean),
  };
}

export function interpolateWA(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}
