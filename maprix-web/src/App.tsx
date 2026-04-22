import type { Polygon } from '@maprix/types';
import { computeArea } from '@maprix/geo-core';

// Dummy import check — confirma que tipos e geo-core resolvem no bundle do web.
const _typeCheck: Polygon | null = null;
void _typeCheck;
void computeArea;

export function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1>Maprix</h1>
    </main>
  );
}
