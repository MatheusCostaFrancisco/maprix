import { useEffect, useState } from 'react';
import type { Polygon } from '@maprix/types';
import { computeArea } from '@maprix/geo-core';
import { API_BASE_URL, fetchHealth } from './api';

// Dummy import check — confirma que tipos e geo-core resolvem no bundle do web.
const _typeCheck: Polygon | null = null;
void _typeCheck;
void computeArea;

type HealthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok' }
  | { status: 'error'; message: string };

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'idle' });

  async function ping() {
    setHealth({ status: 'loading' });
    try {
      const data = await fetchHealth();
      setHealth(data.ok ? { status: 'ok' } : { status: 'error', message: 'resposta sem ok:true' });
    } catch (err) {
      setHealth({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  useEffect(() => {
    if (API_BASE_URL) void ping();
  }, []);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <h1 style={{ margin: 0 }}>Maprix</h1>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
          minWidth: 320,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
          Backend: {API_BASE_URL || '(VITE_API_URL não configurada)'}
        </div>
        <HealthBadge health={health} />
        <button
          onClick={ping}
          style={{
            marginTop: 12,
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid #888',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Ping backend
        </button>
      </section>
    </main>
  );
}

function HealthBadge({ health }: { health: HealthState }) {
  switch (health.status) {
    case 'idle':
      return <span>aguardando…</span>;
    case 'loading':
      return <span>consultando /health…</span>;
    case 'ok':
      return <span style={{ color: 'green' }}>✓ backend OK</span>;
    case 'error':
      return <span style={{ color: 'crimson' }}>✗ erro: {health.message}</span>;
  }
}
