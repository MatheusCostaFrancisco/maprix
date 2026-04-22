const raw = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = raw
  ? raw.startsWith('http://') || raw.startsWith('https://')
    ? raw.replace(/\/$/, '')
    : `https://${raw.replace(/\/$/, '')}`
  : '';

export async function fetchHealth(): Promise<{ ok: boolean }> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não configurada');
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
