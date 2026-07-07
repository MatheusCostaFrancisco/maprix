export type CoordinateSystem =
  | { type: 'UTM'; zone: number; hemisphere: 'N' | 'S'; datum: 'SIRGAS2000' | 'WGS84' }
  | { type: 'LatLong'; datum: 'SIRGAS2000' | 'WGS84' | 'SAD69' };

export interface GeoPoint {
  id: string;
  x: number;
  y: number;
  z?: number;
}

export interface Polygon {
  points: GeoPoint[];
  system: CoordinateSystem;
  metadata?: {
    matricula?: string;
    proprietario?: string;
    municipio?: string;
    uf?: string;
    area_m2?: number;
    perimetro_m?: number;
  };
}

export interface Segment {
  from: GeoPoint;
  to: GeoPoint;
  azimute_decimal: number;
  azimute_dms: string;
  distancia_m: number;
}

export interface ConferenciaResult {
  sistemaOrigem: CoordinateSystem;
  sistemaDestino: CoordinateSystem;
  divergenciaMaxima_m: number;
  toleranciaConfig_m: number;
  aprovado: boolean;
  divergenciasPorPonto: Array<{ pontoId: string; delta_m: number }>;
}

/** Perfil de acesso — define qual frente o usuário enxerga após o login. */
export type Role = 'engenheiro' | 'cartorio';

/** Usuário público (sem hash de senha) — contrato compartilhado web↔backend. */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

// --- Cartório ---------------------------------------------------------------

export type MatriculaStatus = 'ativa' | 'em_analise' | 'cancelada';

/** Matrícula imobiliária gerida pelo cartório. `areaM2` em camelCase (nunca snake). */
export interface Matricula {
  id: string;
  numero: string;
  cartorio: string | null;
  proprietario: string;
  municipio: string | null;
  uf: string | null;
  areaM2: number | null;
  status: MatriculaStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProtocoloTipo =
  | 'georreferenciamento'
  | 'retificacao'
  | 'desmembramento'
  | 'unificacao';

export type ProtocoloStatus =
  | 'recebido'
  | 'em_analise'
  | 'exigencia'
  | 'aprovado'
  | 'rejeitado';

/** Protocolo de entrada de um pedido no cartório, opcionalmente ligado a uma matrícula. */
export interface Protocolo {
  id: string;
  numero: string;
  requerente: string;
  tipo: ProtocoloTipo;
  status: ProtocoloStatus;
  matriculaId: string | null;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Contadores para o painel do cartório. */
export interface CartorioOverview {
  matriculas: number;
  protocolosAbertos: number;
  protocolosExigencia: number;
  protocolosAprovados: number;
}
