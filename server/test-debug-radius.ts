/**
 * Debug Test: Lead-to-Customer Conversion & Radius Manager API
 * 
 * Tests:
 * 1. Radius Manager API connectivity (get_userdata for existing user)
 * 2. Radius Manager API create user
 * 3. Lead-to-customer convert endpoint
 * 4. DB settings vs env vars for Radius config
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const DIVIDER = '─'.repeat(60);

// ── Helpers ──────────────────────────────────────────────────
async function request(method: string, path: string, body?: any, headers?: Record<string, string>) {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  const url = `${BASE_URL}${path}`;
  console.log(`  → ${method} ${url}`);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }
    console.log(`  ← ${res.status} ${typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : String(data).substring(0, 500)}`);
    return { status: res.status, data };
  } catch (e: any) {
    console.log(`  ← FETCH ERROR: ${e.message}`);
    return { status: 0, data: { error: e.message } };
  }
}

async function getAuthToken(): Promise<string> {
  console.log('\n🔐 Authenticating as admin...');
  const loginRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_KEY!,
    },
    body: JSON.stringify({ email: 'admin@phsweb.ng', password: 'phsweb2024' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.access_token) {
    console.error('❌ Admin login failed:', JSON.stringify(loginData).substring(0, 300));
    process.exit(1);
  }
  console.log('  ✅ Got access token');
  return loginData.access_token;
}

// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🔍 DEBUG: Lead → Customer & Radius Manager API');
  console.log(DIVIDER);

  // ── 1. Check env vars ──────────────────────────────────────
  console.log('\n📋 1. Environment Variables');
  console.log(`  SUPABASE_URL       = ${process.env.SUPABASE_URL}`);
  console.log(`  SUPABASE_SERVICE_KEY= ${process.env.SUPABASE_SERVICE_KEY?.substring(0, 30)}...`);
  console.log(`  RADIUS_API_URL     = ${process.env.RADIUS_API_URL}`);
  console.log(`  RADIUS_API_USER    = ${process.env.RADIUS_API_USER}`);
  console.log(`  RADIUS_API_PASS    = ${process.env.RADIUS_API_PASS}`);

  // ── 2. Check DB settings for radius config ─────────────────
  console.log('\n📋 2. DB Settings (radius config from settings table)');
  const { data: dbSettings, error: dbErr } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['radius_api_url', 'radius_api_user', 'radius_api_pass']);
  
  if (dbErr) {
    console.log(`  ❌ Error reading settings: ${dbErr.message}`);
  } else if (!dbSettings || dbSettings.length === 0) {
    console.log('  ⚠️  No radius settings in DB — will use env vars as fallback');
  } else {
    dbSettings.forEach(s => {
      const display = s.key === 'radius_api_pass' ? s.value?.substring(0, 5) + '...' : s.value;
      console.log(`  ${s.key} = ${display}`);
    });
  }

  // Determine effective config
  const configMap: Record<string, string> = {};
  dbSettings?.forEach(s => { configMap[s.key] = s.value; });
  const effectiveUrl = configMap.radius_api_url || process.env.RADIUS_API_URL!;
  const effectiveUser = configMap.radius_api_user || process.env.RADIUS_API_USER!;
  const effectivePass = configMap.radius_api_pass || process.env.RADIUS_API_PASS!;
  console.log(`\n  Effective Radius URL:  ${effectiveUrl}`);
  console.log(`  Effective Radius User: ${effectiveUser}`);
  console.log(`  Effective Radius Pass: ${effectivePass?.substring(0, 5)}...`);

  // ── 3. Direct Radius API test: get_userdata ────────────────
  console.log('\n📋 3. Direct Radius API Test: get_userdata');
  
  // Try with the existing customer from screenshot: cnnuamelle@gmail.com / phone +2348066137843
  const testUsername = '2348066137843';
  console.log(`  Testing with username: ${testUsername}`);

  const queryParams = new URLSearchParams({
    apiuser: effectiveUser,
    apipass: effectivePass,
    q: 'get_userdata',
    username: testUsername
  });

  const fullUrl = `${effectiveUrl}?${queryParams.toString()}`;
  console.log(`  Full URL: ${fullUrl.replace(effectivePass, '***')}`);
  console.log(`  URL-encoded pass: ${encodeURIComponent(effectivePass)}`);

  try {
    console.log('  Sending request...');
    const response = await axios.get(fullUrl, { timeout: 15000 });
    console.log(`  ✅ Response status: ${response.status}`);
    console.log(`  Response headers content-type: ${response.headers['content-type']}`);
    console.log(`  Response data type: ${typeof response.data}`);
    console.log(`  Response data: ${JSON.stringify(response.data).substring(0, 1000)}`);
    
    // Check if response indicates success
    if (response.data && typeof response.data === 'object') {
      const keys = Object.keys(response.data);
      console.log(`  Response keys: ${keys.join(', ')}`);
      if (response.data[0] !== undefined) {
        console.log(`  response.data[0] = ${response.data[0]} (${typeof response.data[0]})`);
      }
      if (response.data.enableuser !== undefined) {
        console.log(`  enableuser = ${response.data.enableuser}`);
      }
      if (response.data.expiry !== undefined) {
        console.log(`  expiry = ${response.data.expiry}`);
      }
      if (response.data.username !== undefined) {
        console.log(`  username = ${response.data.username}`);
      }
    }
  } catch (e: any) {
    console.log(`  ❌ Request failed: ${e.message}`);
    if (e.response) {
      console.log(`  Response status: ${e.response.status}`);
      console.log(`  Response data: ${JSON.stringify(e.response.data).substring(0, 500)}`);
    }
    if (e.code) console.log(`  Error code: ${e.code}`);
  }

  // ── 4. Direct Radius API test: list all users (to find valid usernames) ──
  console.log('\n📋 4. Direct Radius API: Try alternate username formats');
  
  // The customer in the screenshot: Chinedu Onwuemelle, +2348066137843
  // The convert endpoint generates username from phone: (lead.phone || '').replace(/[^0-9]/g, '')
  // So +2348066137843 → 2348066137843
  const altUsernames = ['2348066137843', '+2348066137843', 'conwuemelle@gmail.com'];
  
  for (const uname of altUsernames) {
    console.log(`\n  Trying username: "${uname}"`);
    const params = new URLSearchParams({
      apiuser: effectiveUser,
      apipass: effectivePass,
      q: 'get_userdata',
      username: uname
    });
    try {
      const res = await axios.get(`${effectiveUrl}?${params.toString()}`, { timeout: 10000 });
      console.log(`    Status: ${res.status}, Data: ${JSON.stringify(res.data).substring(0, 300)}`);
    } catch (e: any) {
      console.log(`    Error: ${e.message}`);
      if (e.response) console.log(`    Response: ${JSON.stringify(e.response.data).substring(0, 300)}`);
    }
  }

  // ── 5. Test via the server API (through Express routes) ────
  const token = await getAuthToken();
  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log('\n📋 5. Test Radius proxy via Express: GET /api/radius/user/:username');
  await request('GET', `/api/radius/user/${testUsername}`, undefined, authHeaders);

  // ── 6. Check existing customers in DB ──────────────────────
  console.log('\n📋 6. Existing customers in Supabase');
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('id, radius_username, status, firstname, lastname, phone, plan_id, expires_at, lead_id')
    .limit(5);
  
  if (custErr) {
    console.log(`  ❌ Error: ${custErr.message}`);
  } else {
    console.log(`  Found ${customers?.length || 0} customers`);
    customers?.forEach(c => {
      console.log(`  - ${c.firstname} ${c.lastname} | radius: ${c.radius_username} | status: ${c.status} | expires: ${c.expires_at} | lead_id: ${c.lead_id}`);
    });
  }

  // ── 7. Check existing leads ────────────────────────────────
  console.log('\n📋 7. Existing leads in Supabase');
  const { data: leads, error: leadErr } = await supabase
    .from('leads')
    .select('id, name, phone, email, plan_requested, status, radius_username')
    .limit(5);
  
  if (leadErr) {
    console.log(`  ❌ Error: ${leadErr.message}`);
  } else {
    console.log(`  Found ${leads?.length || 0} leads`);
    leads?.forEach(l => {
      console.log(`  - ${l.name} | ${l.phone} | plan: ${l.plan_requested} | status: ${l.status} | radius: ${l.radius_username}`);
    });
  }

  // ── 8. Check plans table ───────────────────────────────────
  console.log('\n📋 8. Plans table');
  const { data: plans, error: planErr } = await supabase
    .from('plans')
    .select('id, name, radius_srvid, radius_acctype, is_active, price');
  
  if (planErr) {
    console.log(`  ❌ Error: ${planErr.message}`);
  } else {
    console.log(`  Found ${plans?.length || 0} plans`);
    plans?.forEach(p => {
      console.log(`  - "${p.name}" | srvid: ${p.radius_srvid} | acctype: ${p.radius_acctype} | price: ${p.price} | active: ${p.is_active}`);
    });
  }

  // ── 9. Full lead-to-customer conversion test ───────────────
  console.log('\n📋 9. Full Lead → Customer Conversion Test');
  
  // Create a test lead
  console.log('\n  9a. Creating test lead...');
  const { data: testLead, error: leadCreateErr } = await supabase
    .from('leads')
    .insert({
      name: 'Debug Test User',
      email: 'debugtest@example.com',
      phone: '+2349000000001',
      plan_requested: plans?.[0]?.name || 'UNLIMITED HOME PLAN',
      address: 'Test Address, Awka',
      status: 'new',
      source: 'debug_test'
    })
    .select()
    .single();

  if (leadCreateErr) {
    console.log(`  ❌ Failed to create test lead: ${leadCreateErr.message}`);
  } else {
    console.log(`  ✅ Created lead: ${testLead.id}`);
    console.log(`  Lead data: ${JSON.stringify(testLead).substring(0, 300)}`);

    // Call the convert endpoint
    console.log('\n  9b. Calling POST /api/leads/:id/convert...');
    const convertResult = await request('POST', `/api/leads/${testLead.id}/convert`, undefined, authHeaders);
    
    console.log(`\n  Convert result:`);
    console.log(`    status: ${convertResult.status}`);
    console.log(`    data: ${JSON.stringify(convertResult.data)}`);

    if (convertResult.status === 200) {
      console.log(`    success: ${convertResult.data.success}`);
      console.log(`    customer_id: ${convertResult.data.customer_id}`);
      console.log(`    radius_username: ${convertResult.data.radius_username}`);
      console.log(`    radius_srvid: ${convertResult.data.radius_srvid}`);
      console.log(`    radius_error: ${convertResult.data.radius_error}`);
      console.log(`    plan_name: ${convertResult.data.plan_name}`);

      // Check the customer was created in DB
      if (convertResult.data.customer_id) {
        console.log('\n  9c. Checking created customer in DB...');
        const { data: newCust, error: newCustErr } = await supabase
          .from('customers')
          .select('*, plans(*)')
          .eq('id', convertResult.data.customer_id)
          .single();
        
        if (newCustErr) {
          console.log(`  ❌ Customer lookup error: ${newCustErr.message}`);
        } else {
          console.log(`  ✅ Customer in DB: ${JSON.stringify(newCust).substring(0, 500)}`);
        }
      }

      // Try getUserData on the newly created radius user
      if (convertResult.data.radius_username && !convertResult.data.radius_error) {
        console.log(`\n  9d. Fetching radius data for new user: ${convertResult.data.radius_username}`);
        await request('GET', `/api/radius/user/${convertResult.data.radius_username}`, undefined, authHeaders);
      }
    }

    // ── 10. Test GET /api/customers/:id (the endpoint that fetches radius data) ──
    if (convertResult.data?.customer_id) {
      console.log('\n📋 10. Test GET /api/customers/:id (includes radius data fetch)');
      await request('GET', `/api/customers/${convertResult.data.customer_id}`, undefined, authHeaders);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up debug test data...');
    if (convertResult.data?.customer_id) {
      await supabase.from('customers').delete().eq('id', convertResult.data.customer_id);
    }
    await supabase.from('activity_log').delete().eq('entity_id', testLead.id);
    await supabase.from('leads').delete().eq('id', testLead.id);
    console.log('  ✅ Cleaned up');
  }

  // ── 11. Test with existing customer from screenshot ────────
  console.log('\n📋 11. Test GET /api/customers for existing customer (from screenshot)');
  const existingCustResult = await request('GET', '/api/customers', undefined, authHeaders);
  if (existingCustResult.status === 200 && existingCustResult.data?.length > 0) {
    const first = existingCustResult.data[0];
    console.log(`\n  First customer: ${first.firstname} ${first.lastname}`);
    console.log(`  radius_username: ${first.radius_username}`);
    console.log(`  plan: ${first.plans?.name || 'NO PLAN JOINED'}`);
    console.log(`  status: ${first.status}`);
    
    console.log(`\n  Fetching full customer detail (includes radius data)...`);
    await request('GET', `/api/customers/${first.id}`, undefined, authHeaders);
  }

  console.log('\n' + DIVIDER);
  console.log('🏁 Debug test complete');
  console.log(DIVIDER);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
