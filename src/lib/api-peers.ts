import { getFirebaseIdToken } from '@/lib/firebase';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getFirebaseIdToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.message || 'Request failed');
  }

  return body?.data ?? body;
}

export async function listItemsApi() {
  return request<any[]>('/api/items');
}

export async function createItemApi(payload: Record<string, unknown>) {
  return request<any>('/api/items', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateItemApi(id: string, payload: Record<string, unknown>) {
  return request<any>(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteItemApi(id: string) {
  return request<any>(`/api/items/${id}`, { method: 'DELETE' });
}

export async function listBookingsApi(role: 'borrowed' | 'lent'| '') {
  return request<any[]>(`/api/bookings?role=${role}`);
}

export async function createBookingApi(payload: Record<string, unknown>) {
  return request<any>('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateBookingApi(id: string, payload: Record<string, unknown>) {
  return request<any>(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function listRequestsApi() {
  return request<any[]>('/api/requests');
}

export async function createRequestApi(payload: Record<string, unknown>) {
  return request<any>('/api/requests', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateRequestApi(id: string, payload: Record<string, unknown>) {
  return request<any>(`/api/requests/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteRequestApi(id: string) {
  return request<any>(`/api/requests/${id}`, { method: 'DELETE' });
}

export async function createRequestOfferApi(payload: Record<string, unknown>) {
  return request<any>('/api/request-offers', { method: 'POST', body: JSON.stringify(payload) });
}

export async function listRequestOffersApi(requestIds: string[]) {
  const ids = requestIds.join(',');
  return request<any[]>(`/api/request-offers?requestIds=${encodeURIComponent(ids)}`);
}

export async function listMessagesApi(filters: Record<string, unknown>) {
  const params = new URLSearchParams(filters as Record<string, string>);
  return request<any[]>(`/api/messages?${params.toString()}`);
}

export async function createMessageApi(payload: Record<string, unknown>) {
  return request<any>('/api/messages', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMyPeerProfileApi() {
  return request<any>('/api/peer-profile/me');
}

export async function getProfileApi(id: string) {
  return request<any>(`/api/profiles/${id}`);
}

export async function updateMyPeerProfileApi(payload: Record<string, unknown>) {
  return request<any>('/api/peer-profile/me', { method: 'PATCH', body: JSON.stringify(payload) });
}
