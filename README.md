# Maprix

Microsaas web B2B para engenheiros agrônomos/agrimensores que trabalham com georreferenciamento de imóveis.

## MVP — Escopo

1. Conversão precisa UTM ↔ lat/long (SIRGAS2000)
2. Geração de memorial descritivo (cursivo + tabelado + export DWG)
3. Geração de pacote shapefile SIG-RI (.dbf/.prj/.shp/.shx) — Provimento CNJ 195/2025

## Estrutura

```
maprix/
├── maprix-web/       # Frontend React + Vite + TypeScript
├── backend/          # API Express + TypeScript + MySQL
├── shared/
│   ├── geo-core/     # Motor geodésico (proj4js, turf)
│   └── types/        # Contratos TS compartilhados
└── Docs/
    └── ARCHITECTURE.md
```

## Como rodar

Pré-requisitos: Node >= 20 e pnpm 10+.

```bash
pnpm install
pnpm -r build
```

### Frontend (web)

```bash
pnpm --filter maprix-web dev
```

Abre em `http://localhost:5173`.

### Backend (API)

```bash
pnpm --filter backend dev
```

Health check: `GET http://localhost:3000/health` → `{ "ok": true }`.

## Scripts raiz

- `pnpm build` — compila todos os workspaces
- `pnpm dev:web` — atalho para frontend
- `pnpm dev:backend` — atalho para backend

## Regra de ouro

Toda operação geométrica/geodésica passa pelo `shared/geo-core`. Nunca duplicar lógica de conversão em web ou backend.
