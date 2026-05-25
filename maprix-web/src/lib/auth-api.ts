import type { User } from '@maprix/types';
import { API_BASE_URL } from '@/api';

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não configurada');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(body?.error ?? `request_failed_${res.status}`);
  }
  return body as T;
}

export interface MeResponse {
  user: User | null;
}

export const authApi = {
  signup: (data: { email: string; password: string; name?: string }) =>
    authRequest<{ user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    authRequest<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => authRequest<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  me: () => authRequest<MeResponse>('/api/auth/me'),
};
