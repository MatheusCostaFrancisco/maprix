import { useEffect, useMemo, useState } from 'react';
import type { ConferenciaResult, Polygon, Segment } from '@maprix/types';
import {
  API_BASE_URL,
  type ConferenciaResponse,
  type ConvertResponse,
  type MemorialResponse,
  conferirPolygon,
  convertPolygon,
  downloadMemorialDxf,
  downloadShapefile,
  fetchHealth,
  gerarMemorial,
} from './api';
import {
  DEFAULT_SAMPLE,
  SYSTEM_PRESETS,
  buildPolygon,
  parsePoints,
  systemKey,
} from './polygonInput';

type HealthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok' }
  | { status: 'error'; message: string };

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string };

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'idle' });
  const [input, setInput] = useState<string>(DEFAULT_SAMPLE);
  const [sourceIdx, setSourceIdx] = useState<number>(0);
  const [targetIdx, setTargetIdx] = useState<number>(5);
  const [tolerancia, setTolerancia] = useState<number>(0.5);

  const [convert, setConvert] = useState<AsyncState<ConvertResponse>>({ status: 'idle' });
  const [conferencia, setConferencia] = useState<AsyncState<ConferenciaResponse>>({ status: 'idle' });
  const [memorial, setMemorial] = useState<AsyncState<MemorialResponse>>({ status: 'idle' });
  const [shapefile, setShapefile] = useState<AsyncState<{ filename: string }>>({ status: 'idle' });

  const parsed = useMemo(() => parsePoints(input), [input]);
  const sourceSystem = SYSTEM_PRESETS[sourceIdx]!.value;
  const targetSystem = SYSTEM_PRESETS[targetIdx]!.value;

  async function pingHealth() {
    setHealth({ status: 'loading' });
    try {
      const data = await fetchHealth();
      setHealth(data.ok ? { status: 'ok' } : { status: 'error', message: 'resposta sem ok:true' });
    } catch (err) {
      setHealth({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  useEffect(() => {
    if (API_BASE_URL) void pingHealth();
  }, []);

  function currentPolygon(): Polygon | null {
    if (parsed.points.length < 2) return null;
    return buildPolygon(parsed.points, sourceSystem);
  }

  async function doConvert() {
    const poly = currentPolygon();
    if (!poly) return;
    setConvert({ status: 'loading' });
    try {
      const data = await convertPolygon(poly, targetSystem);
      setConvert({ status: 'ok', data });
    } catch (err) {
      setConvert({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  async function doConferencia() {
    const poly = currentPolygon();
    if (!poly) return;
    setConferencia({ status: 'loading' });
    try {
      const data = await conferirPolygon(poly, targetSystem, tolerancia);
      setConferencia({ status: 'ok', data });
    } catch (err) {
      setConferencia({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  async function doMemorial() {
    const poly = currentPolygon();
    if (!poly) return;
    setMemorial({ status: 'loading' });
    try {
      const data = await gerarMemorial(poly);
      setMemorial({ status: 'ok', data });
    } catch (err) {
      setMemorial({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  async function doDownloadDxf() {
    const poly = currentPolygon();
    if (!poly) return;
    try {
      const blob = await downloadMemorialDxf(poly);
      triggerDownload(blob, 'memorial-maprix.dxf');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function doDownloadShapefile() {
    const poly = currentPolygon();
    if (!poly) return;
    setShapefile({ status: 'loading' });
    try {
      const blob = await downloadShapefile(poly);
      const filename = `maprix-sigri-${Date.now()}.zip`;
      triggerDownload(blob, filename);
      setShapefile({ status: 'ok', data: { filename } });
    } catch (err) {
      setShapefile({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>Maprix</h1>
        <HealthBadge health={health} onPing={pingHealth} />
      </header>

      <section style={styles.card}>
        <h2 style={styles.h2}>1. Entrada de pontos</h2>
        <label style={styles.label}>
          Pontos (id, x, y — um por linha)
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            style={styles.textarea}
            spellCheck={false}
          />
        </label>
        <div style={styles.row}>
          <label style={styles.label}>
            Sistema de origem
            <select
              value={sourceIdx}
              onChange={(e) => setSourceIdx(Number(e.target.value))}
              style={styles.select}
            >
              {SYSTEM_PRESETS.map((p, i) => (
                <option key={systemKey(p.value)} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.label}>
            Sistema destino
            <select
              value={targetIdx}
              onChange={(e) => setTargetIdx(Number(e.target.value))}
              style={styles.select}
            >
              {SYSTEM_PRESETS.map((p, i) => (
                <option key={systemKey(p.value)} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.label}>
            Tolerância (m)
            <input
              type="number"
              step={0.01}
              min={0}
              value={tolerancia}
              onChange={(e) => setTolerancia(Number(e.target.value))}
              style={styles.select}
            />
          </label>
        </div>
        <div style={{ fontSize: 13, color: '#555' }}>
          {parsed.points.length} ponto(s) lido(s){parsed.errors.length > 0 ? ` — ${parsed.errors.length} erro(s)` : ''}
        </div>
        {parsed.errors.length > 0 && (
          <ul style={{ color: 'crimson', margin: '4px 0 0', paddingLeft: 20 }}>
            {parsed.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.h2}>2. Conversão & memorial</h2>
        <div style={styles.actions}>
          <button onClick={doConvert} style={styles.btn} disabled={!currentPolygon()}>Converter</button>
          <button onClick={doConferencia} style={styles.btn} disabled={!currentPolygon()}>Conferência bilateral</button>
          <button onClick={doMemorial} style={styles.btn} disabled={!currentPolygon()}>Gerar memorial</button>
          <button onClick={doDownloadDxf} style={styles.btn} disabled={!currentPolygon()}>Baixar DXF</button>
          <button onClick={doDownloadShapefile} style={styles.btn} disabled={!currentPolygon()}>
            Baixar shapefile SIG-RI
          </button>
        </div>
        {shapefile.status === 'loading' && <div>Gerando shapefile…</div>}
        {shapefile.status === 'error' && <div style={{ color: 'crimson' }}>{shapefile.message}</div>}
        {shapefile.status === 'ok' && (
          <div style={{ color: 'green' }}>✓ ZIP baixado: {shapefile.data.filename}</div>
        )}
      </section>

      {convert.status === 'loading' && <section style={styles.card}>Convertendo…</section>}
      {convert.status === 'error' && <section style={styles.card}><span style={{ color: 'crimson' }}>{convert.message}</span></section>}
      {convert.status === 'ok' && <ConvertView data={convert.data} />}

      {conferencia.status === 'loading' && <section style={styles.card}>Conferindo…</section>}
      {conferencia.status === 'error' && <section style={styles.card}><span style={{ color: 'crimson' }}>{conferencia.message}</span></section>}
      {conferencia.status === 'ok' && <ConferenciaView data={conferencia.data.conferencia} />}

      {memorial.status === 'loading' && <section style={styles.card}>Gerando memorial…</section>}
      {memorial.status === 'error' && <section style={styles.card}><span style={{ color: 'crimson' }}>{memorial.message}</span></section>}
      {memorial.status === 'ok' && <MemorialView data={memorial.data} />}

      <footer style={{ textAlign: 'center', color: '#888', fontSize: 12, padding: 16 }}>
        Maprix MVP — backend em {API_BASE_URL || '(VITE_API_URL não configurada)'}
      </footer>
    </main>
  );
}

function HealthBadge({ health, onPing }: { health: HealthState; onPing: () => void }) {
  let label: string;
  let color = '#555';
  switch (health.status) {
    case 'idle': label = 'aguardando'; break;
    case 'loading': label = '…'; break;
    case 'ok': label = '✓ backend OK'; color = 'green'; break;
    case 'error': label = `✗ ${health.message}`; color = 'crimson'; break;
  }
  return (
    <button onClick={onPing} style={{ ...styles.badge, color }}>{label}</button>
  );
}

function ConvertView({ data }: { data: ConvertResponse }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>Polígono convertido</h2>
      <div style={styles.metrics}>
        <div><strong>Área:</strong> {data.area_m2.toFixed(2)} m²</div>
        <div><strong>Perímetro:</strong> {data.perimetro_m.toFixed(2)} m</div>
        <div><strong>Pontos:</strong> {data.polygon.points.length}</div>
      </div>
      <h3 style={styles.h3}>Coordenadas</h3>
      <table style={styles.table}>
        <thead>
          <tr><th>ID</th><th>X / Longitude</th><th>Y / Latitude</th><th>Z</th></tr>
        </thead>
        <tbody>
          {data.polygon.points.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.x.toFixed(6)}</td>
              <td>{p.y.toFixed(6)}</td>
              <td>{p.z?.toFixed(3) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 style={styles.h3}>Segmentos (azimute + distância)</h3>
      <SegmentsTable segments={data.segments} />
    </section>
  );
}

function SegmentsTable({ segments }: { segments: Segment[] }) {
  return (
    <table style={styles.table}>
      <thead>
        <tr><th>De → Para</th><th>Azimute (DMS)</th><th>Azimute (°)</th><th>Distância (m)</th></tr>
      </thead>
      <tbody>
        {segments.map((s, i) => (
          <tr key={`${s.from.id}-${s.to.id}-${i}`}>
            <td>{s.from.id} → {s.to.id}</td>
            <td>{s.azimute_dms}</td>
            <td>{s.azimute_decimal.toFixed(4)}</td>
            <td>{s.distancia_m.toFixed(3)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConferenciaView({ data }: { data: ConferenciaResult }) {
  const overallColor = data.aprovado ? 'green' : 'crimson';
  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>Conferência bilateral</h2>
      <div style={{ ...styles.badgeBig, background: data.aprovado ? '#e8f7ee' : '#fdecec', color: overallColor }}>
        {data.aprovado ? '✓ APROVADO' : '✗ REPROVADO'} — divergência máx: {data.divergenciaMaxima_m.toFixed(4)} m
        (tolerância {data.toleranciaConfig_m} m)
      </div>
      <table style={styles.table}>
        <thead><tr><th>Ponto</th><th>Δ (m)</th><th>Status</th></tr></thead>
        <tbody>
          {data.divergenciasPorPonto.map((d) => {
            const ok = d.delta_m <= data.toleranciaConfig_m;
            return (
              <tr key={d.pontoId} style={{ background: ok ? '#f0fbf2' : '#fdecec' }}>
                <td>{d.pontoId}</td>
                <td>{d.delta_m.toFixed(6)}</td>
                <td style={{ color: ok ? 'green' : 'crimson' }}>{ok ? '✓ OK' : '✗ FORA'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function MemorialView({ data }: { data: MemorialResponse }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.h2}>Memorial descritivo</h2>
      <div style={styles.metrics}>
        <div><strong>Vértices:</strong> {data.resumo.num_vertices}</div>
        <div><strong>Área:</strong> {data.resumo.area_m2.toFixed(2)} m²</div>
        <div><strong>Perímetro:</strong> {data.resumo.perimetro_m.toFixed(2)} m</div>
      </div>
      <h3 style={styles.h3}>Forma cursiva</h3>
      <pre style={styles.pre}>{data.cursivo}</pre>
      <h3 style={styles.h3}>Forma tabelada</h3>
      <table style={styles.table}>
        <thead>
          <tr><th>De</th><th>Para</th><th>Azimute (DMS)</th><th>Distância (m)</th></tr>
        </thead>
        <tbody>
          {data.tabelado.map((r, i) => (
            <tr key={`${r.de}-${r.para}-${i}`}>
              <td>{r.de}</td>
              <td>{r.para}</td>
              <td>{r.azimute_dms}</td>
              <td>{r.distancia_m.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const styles = {
  page: {
    fontFamily: 'system-ui, sans-serif',
    maxWidth: 960,
    margin: '0 auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { border: '1px solid #ddd', borderRadius: 8, padding: 16, background: 'white' },
  h2: { margin: '0 0 12px', fontSize: 18 },
  h3: { margin: '16px 0 8px', fontSize: 14, color: '#555' },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginTop: 8 },
  label: { display: 'flex', flexDirection: 'column' as const, gap: 4, fontSize: 13, flex: '1 1 200px' },
  textarea: { fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 8, border: '1px solid #ccc', borderRadius: 6, resize: 'vertical' as const },
  select: { padding: 6, border: '1px solid #ccc', borderRadius: 6, fontSize: 14 },
  actions: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
  btn: { padding: '8px 14px', border: '1px solid #333', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 14 },
  badge: { padding: '4px 10px', border: '1px solid #ccc', borderRadius: 12, fontSize: 12, background: 'white', cursor: 'pointer' },
  badgeBig: { padding: '10px 14px', borderRadius: 6, fontWeight: 'bold' as const, marginBottom: 12 },
  metrics: { display: 'flex', gap: 24, flexWrap: 'wrap' as const, fontSize: 14, marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  pre: { whiteSpace: 'pre-wrap' as const, background: '#f7f7f9', padding: 12, borderRadius: 6, fontSize: 13, lineHeight: 1.5 },
};
