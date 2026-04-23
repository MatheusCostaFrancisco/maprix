import { useEffect, useMemo, useState } from 'react';
import type { CoordinateSystem, GeoPoint, Polygon } from '@maprix/types';
import {
  DEFAULT_SAMPLE,
  SYSTEM_PRESETS,
  buildPolygon,
  parsePoints,
} from '@/polygonInput';

const STORAGE_KEY = 'maprix:input:v1';

interface StoredState {
  input: string;
  sourceIdx: number;
  targetIdx: number;
  tolerancia: number;
}

function loadState(): StoredState {
  if (typeof window === 'undefined') return defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      input: typeof parsed.input === 'string' ? parsed.input : DEFAULT_SAMPLE,
      sourceIdx: typeof parsed.sourceIdx === 'number' ? parsed.sourceIdx : 0,
      targetIdx: typeof parsed.targetIdx === 'number' ? parsed.targetIdx : 5,
      tolerancia: typeof parsed.tolerancia === 'number' ? parsed.tolerancia : 0.5,
    };
  } catch {
    return defaults();
  }
}

function defaults(): StoredState {
  return { input: DEFAULT_SAMPLE, sourceIdx: 0, targetIdx: 5, tolerancia: 0.5 };
}

export interface InputState {
  input: string;
  setInput: (v: string) => void;
  sourceIdx: number;
  setSourceIdx: (v: number) => void;
  targetIdx: number;
  setTargetIdx: (v: number) => void;
  tolerancia: number;
  setTolerancia: (v: number) => void;
  points: GeoPoint[];
  parseErrors: string[];
  sourceSystem: CoordinateSystem;
  targetSystem: CoordinateSystem;
  polygon: Polygon | null;
  reset: () => void;
}

/**
 * Estado compartilhado do input do polígono entre as telas de engenharia.
 * Persiste automaticamente em localStorage — o usuário vê seus pontos
 * preservados ao alternar entre /conversor e /memorial-e-shapefile.
 */
export function useInputState(): InputState {
  const [stored, setStored] = useState<StoredState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* storage cheio ou bloqueado — silencia */
    }
  }, [stored]);

  const parsed = useMemo(() => parsePoints(stored.input), [stored.input]);
  const sourceSystem = SYSTEM_PRESETS[stored.sourceIdx]?.value ?? SYSTEM_PRESETS[0]!.value;
  const targetSystem = SYSTEM_PRESETS[stored.targetIdx]?.value ?? SYSTEM_PRESETS[5]!.value;
  const polygon = parsed.points.length >= 2 ? buildPolygon(parsed.points, sourceSystem) : null;

  return {
    input: stored.input,
    setInput: (v) => setStored((s) => ({ ...s, input: v })),
    sourceIdx: stored.sourceIdx,
    setSourceIdx: (v) => setStored((s) => ({ ...s, sourceIdx: v })),
    targetIdx: stored.targetIdx,
    setTargetIdx: (v) => setStored((s) => ({ ...s, targetIdx: v })),
    tolerancia: stored.tolerancia,
    setTolerancia: (v) => setStored((s) => ({ ...s, tolerancia: v })),
    points: parsed.points,
    parseErrors: parsed.errors,
    sourceSystem,
    targetSystem,
    polygon,
    reset: () => setStored(defaults()),
  };
}
