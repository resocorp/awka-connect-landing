import { supabase } from './supabase';

const API_BASE = '/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = any>(method: string, path: string, body?: any): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// Leads
export const getLeads = (params?: { status?: string; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return request('GET', `/leads${qs ? `?${qs}` : ''}`);
};
export const getLead = (id: string) => request('GET', `/leads/${id}`);
export const updateLead = (id: string, data: any) => request('PATCH', `/leads/${id}`, data);
export const generatePaymentLink = (id: string, amount: number) =>
  request('POST', `/leads/${id}/payment-link`, { amount });

// Customers
export const getCustomers = (params?: { status?: string; search?: string }) => {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return request('GET', `/customers${qs ? `?${qs}` : ''}`);
};
export const getCustomer = (id: string) => request('GET', `/customers/${id}`);
export const updateCustomer = (id: string, data: any) => request('PATCH', `/customers/${id}`, data);
export const activateCustomer = (id: string, months = 1) =>
  request('POST', `/customers/${id}/activate`, { months });
export const suspendCustomer = (id: string) => request('POST', `/customers/${id}/suspend`);

// Plans
export const getPlans = () => request('GET', '/plans');
export const getPublicPlans = (): Promise<any[]> =>
  fetch('/api/plans').then(r => r.json());
export const createPlan = (data: any) => request('POST', '/plans', data);
export const updatePlan = (id: string, data: any) => request('PUT', `/plans/${id}`, data);
export const deletePlan = (id: string) => request('DELETE', `/plans/${id}`);

// Lead convert to customer (admin)
export const convertLead = (id: string) => request('POST', `/leads/${id}/convert`);

// Settings
export const getSettings = () => request('GET', '/settings');
export const updateSettings = (data: Record<string, string>) => request('PUT', '/settings', data);

// Customer stats summary
export const getCustomerStats = () => request('GET', '/customers/stats/summary');

// Customer status sync
export const syncCustomerStatuses = () => request('POST', '/customers/sync-status');

// Dashboard
export const getDashboardStats = () => request('GET', '/dashboard/stats');

// WhatsApp sidecar
export const getWhatsAppStatus = () => request('GET', '/whatsapp/status');
export const getWhatsAppQR = () => request('GET', '/whatsapp/qr');

// Health
export const healthCheck = () => request('GET', '/../health');
