import { supabase } from '../lib/supabase';
import { getUserData } from './radius';

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000; // 2 months for churned definition

export async function syncAllCustomerStatuses(): Promise<{ synced: number; failed: number; total: number }> {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, radius_username, expires_at, lead_id')
    .not('radius_username', 'is', null);

  if (error) throw error;

  const now = new Date();
  let synced = 0;
  let failed = 0;

  for (const customer of customers) {
    try {
      console.log(`[Sync] Checking ${customer.radius_username}...`);
      const radiusData = await getUserData(customer.radius_username);

      if (!radiusData || radiusData[0] !== 0) {
        console.warn(`[Sync] No data for ${customer.radius_username}`);
        failed++;
        continue;
      }

      // Radius response: {0: status, 1: {enableuser, srvid, ...}, expiry: "...", ...}
      const userFields = radiusData[1] || {};
      const enableuser = Number(userFields.enableuser);
      const expiryStr = radiusData.expiry;
      console.log(`[Sync] ${customer.radius_username}: enableuser=${enableuser}, expiry=${expiryStr}`);

      let status: string;
      let expiresAt: string | null = null;

      if (enableuser === 0) {
        status = 'suspended';
      } else if (expiryStr) {
        const expiryDate = new Date(expiryStr);
        expiresAt = expiryDate.toISOString();
        if (expiryDate > now) {
          status = 'active';
        } else if (now.getTime() - expiryDate.getTime() <= SIXTY_DAYS_MS) {
          status = 'expired';
        } else {
          status = 'churned';
        }
      } else {
        status = 'active';
      }

      const updatePayload: any = { status };
      if (expiresAt) updatePayload.expires_at = expiresAt;

      await supabase
        .from('customers')
        .update(updatePayload)
        .eq('id', customer.id);

      // Keep linked lead status in sync
      if (customer.lead_id) {
        await supabase
          .from('leads')
          .update({ status })
          .eq('id', customer.lead_id);
      }

      synced++;
    } catch (e: any) {
      console.error(`[Sync] Failed for ${customer.radius_username}:`, e.message);
      failed++;
    }
  }

  return { synced, failed, total: customers.length };
}
