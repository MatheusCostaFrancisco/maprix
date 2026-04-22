# Maprix — Contexto do Projeto

## O que é

Microsaas web B2B para engenheiros agrônomos/agrimensores que trabalham com georreferenciamento de imóveis. MVP focado em:

1. Conversão precisa UTM ↔ lat/long (SIRGAS2000)
2. Geração de memorial descritivo (cursivo + tabelado + export DWG)
3. Geração de pacote shapefile SIG-RI (.dbf/.prj/.shp/.shx) — Provimento CNJ 195/2025

## Regra de ouro arquitetural

Toda operação geométrica/geodésica passa pelo `shared/geo-core`. Nunca duplicar lógica de conversão em web ou backend.

## Workspaces

- `maprix-web` — UI (React/Vite)
- `backend` — API (Express/TS/MySQL)
- `shared/geo-core` — motor geodésico (proj4js, turf)
- `shared/types` — contratos TS compartilhados

## Dependências externas obrigatórias (para os próximos prompts)

- `proj4` — transformações geodésicas
- `@turf/turf` — operações em polígonos
- `shpjs` ou `shapefile-js` — leitura/escrita shapefile

## Comandos

- `pnpm install` — instala tudo
- `pnpm -r build` — compila todos os workspaces
- `pnpm --filter maprix-web dev` — sobe o frontend
- `pnpm --filter backend dev` — sobe o backend

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript + MySQL (mesma stack do AcoVitta)
- Monorepo: pnpm workspaces
- Lint: ESLint + Prettier (a adicionar)
