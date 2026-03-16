import axios from 'axios';
import { supabase } from '../lib/supabase';

interface RadiusConfig {
  apiUrl: string;
  apiUser: string;
  apiPass: string;
}

async function getRadiusConfig(): Promise<RadiusConfig> {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['radius_api_url', 'radius_api_user', 'radius_api_pass']);

  const config: any = {};
  settings?.forEach(s => {
    config[s.key] = s.value;
  });

  return {
    apiUrl: config.radius_api_url || process.env.RADIUS_API_URL!,
    apiUser: config.radius_api_user || process.env.RADIUS_API_USER!,
    apiPass: config.radius_api_pass || process.env.RADIUS_API_PASS!
  };
}

export function selectOwner(): string {
  return Math.random() < 0.4 ? 'ojika.emmanuel' : 'admin';
}

export async function createRadiusUser(params: {
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  gpsLat?: number;
  gpsLong?: number;
  srvid?: number;
  groupid?: number;
  acctype?: number;
  enabled?: number;
  expiry?: string;
  owner?: string;
}) {
  const config = await getRadiusConfig();
  
  console.log('[Radius] createRadiusUser:', { username: params.username, srvid: params.srvid, groupid: params.groupid, owner: params.owner, expiry: params.expiry });

  const queryParams = new URLSearchParams({
    apiuser: config.apiUser,
    apipass: config.apiPass,
    q: 'new_user',
    username: params.username,
    password: params.password || 'default123',
    enabled: (params.enabled ?? 1).toString(),
    acctype: (params.acctype ?? 0).toString(),
    groupid: (params.groupid ?? 11).toString(),
    ...(params.srvid && { srvid: params.srvid.toString() }),
    ...(params.firstname && { firstname: params.firstname }),
    ...(params.lastname && { lastname: params.lastname }),
    ...(params.email && { email: params.email }),
    ...(params.phone && { phone: params.phone }),
    ...(params.phone && { mobile: params.phone }),
    ...(params.address && { address: params.address }),
    ...(params.city && { city: params.city }),
    ...(params.gpsLat && { gpslat: params.gpsLat.toString() }),
    ...(params.gpsLong && { gpslong: params.gpsLong.toString() }),
    ...(params.expiry && { expiry: params.expiry }),
    ...(params.owner && { owner: params.owner })
  });

  const response = await axios.get(`${config.apiUrl}?${queryParams.toString()}`);
  console.log('[Radius] createRadiusUser response:', JSON.stringify(response.data).substring(0, 300));

  // Radius returns [1, "error message"] on failure, or {0:0, ...} on success
  if (Array.isArray(response.data) && response.data[0] !== 0) {
    const errMsg = response.data[1] || 'Unknown Radius error';
    console.error('[Radius] createRadiusUser FAILED:', errMsg);
    throw new Error(`Radius: ${errMsg}`);
  }

  return response.data;
}

export async function getUserData(username: string) {
  const config = await getRadiusConfig();
  
  console.log('[Radius] getUserData:', { username });

  const queryParams = new URLSearchParams({
    apiuser: config.apiUser,
    apipass: config.apiPass,
    q: 'get_userdata',
    username
  });

  const response = await axios.get(`${config.apiUrl}?${queryParams.toString()}`);
  console.log('[Radius] getUserData response:', JSON.stringify(response.data).substring(0, 300));

  // Radius returns [1, "User not found!"] on failure
  if (Array.isArray(response.data) && response.data[0] !== 0) {
    const errMsg = response.data[1] || 'User not found';
    console.warn('[Radius] getUserData NOT FOUND:', errMsg);
    return null;
  }

  return response.data;
}

export async function addCredits(username: string, expiry: number, unit: 'day' | 'month' = 'month') {
  const config = await getRadiusConfig();
  
  console.log('[Radius] addCredits:', { username, expiry, unit });

  const queryParams = new URLSearchParams({
    apiuser: config.apiUser,
    apipass: config.apiPass,
    q: 'add_credits',
    username,
    expiry: expiry.toString(),
    unit
  });

  const response = await axios.get(`${config.apiUrl}?${queryParams.toString()}`);
  console.log('[Radius] addCredits response:', JSON.stringify(response.data).substring(0, 300));
  return response.data;
}

export async function sendPod(username: string) {
  const config = await getRadiusConfig();
  
  console.log('[Radius] sendPod:', { username });

  const queryParams = new URLSearchParams({
    apiuser: config.apiUser,
    apipass: config.apiPass,
    q: 'send_pod',
    username
  });

  const response = await axios.get(`${config.apiUrl}?${queryParams.toString()}`);
  console.log('[Radius] sendPod response:', JSON.stringify(response.data).substring(0, 300));
  return response.data;
}

export async function sendSMS(username: string, message?: string) {
  const config = await getRadiusConfig();
  
  const queryParams = new URLSearchParams({
    apiuser: config.apiUser,
    apipass: config.apiPass,
    q: 'send_sms',
    username,
    ...(message && { message })
  });

  const response = await axios.get(`${config.apiUrl}?${queryParams.toString()}`);
  return response.data;
}

export async function sendSMSByPhone(phone: string, message: string) {
  const config = await getRadiusConfig();

  const queryParams = new URLSearchParams({
    apiuser: config.apiUser,
    apipass: config.apiPass,
    q: 'send_sms',
    to: phone,
    message,
  });

  const response = await axios.get(`${config.apiUrl}?${queryParams.toString()}`);
  return response.data;
}

export async function getSMSSettings() {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['sms_customer_template', 'sms_admin_template', 'admin_alert_phones', 'sms_payment_template']);

  const config: Record<string, string> = {};
  settings?.forEach(s => { config[s.key] = s.value; });

  return {
    customerTemplate: config.sms_customer_template || 'Hi {name}, thanks for signing up with PHSWEB Internet! We will contact you shortly to schedule a site survey. Plan: {plan}',
    adminTemplate: config.sms_admin_template || 'New lead: {name} ({phone}) - {plan} plan. Address: {address}',
    paymentTemplate: config.sms_payment_template || 'Hi {name}, your PHSWEB Internet payment link is ready. Amount: NGN {amount}. Pay here: {payment_url} . Reference: {reference}',
    adminPhones: (config.admin_alert_phones || '').split(',').map(p => p.trim()).filter(Boolean),
  };
}

export function interpolateSMS(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}
