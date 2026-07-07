import type {
  CartorioOverview,
  Matricula,
  MatriculaStatus,
  Protocolo,
  ProtocoloStatus,
  ProtocoloTipo,
} from '@maprix/types';
import { API_BASE_URL } from '@/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error('VITE_API_URL não configurada');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(body?.error ?? `request_failed_${res.status}`);
  return body as T;
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
}

export interface MatriculaInput {
  numero: string;
  cartorio?: string;
  proprietario: string;
  municipio?: string;
  uf?: string;
  areaM2?: number;
}

export interface ProtocoloInput {
  numero: string;
  requerente: string;
  tipo: ProtocoloTipo;
  matriculaId?: string;
  observacao?: string;
}

export const cartorioApi = {
  overview: () => request<CartorioOverview>('/api/cartorio/overview'),

  listMatriculas: (params: { q?: string; status?: MatriculaStatus } = {}) =>
    request<{ matriculas: Matricula[] }>(`/api/cartorio/matriculas${qs(params)}`),
  createMatricula: (data: MatriculaInput) =>
    request<{ matricula: Matricula }>('/api/cartorio/matriculas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMatricula: (id: string, data: Partial<MatriculaInput> & { status?: MatriculaStatus }) =>
    request<{ matricula: Matricula }>(`/api/cartorio/matriculas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listProtocolos: (params: { q?: string; status?: ProtocoloStatus } = {}) =>
    request<{ protocolos: Protocolo[] }>(`/api/cartorio/protocolos${qs(params)}`),
  createProtocolo: (data: ProtocoloInput) =>
    request<{ protocolo: Protocolo }>('/api/cartorio/protocolos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProtocolo: (
    id: string,
    data: { status?: ProtocoloStatus; observacao?: string; matriculaId?: string | null },
  ) =>
    request<{ protocolo: Protocolo }>(`/api/cartorio/protocolos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
