---
title: Login JWT por role — separa as frentes engenheiro e cartório
date: 2026-05-25
status: Accepted
---

# Login JWT por role

Adicionar autenticação ao monorepo (hoje stateless) de forma que a role gravada na
conta (`engenheiro` | `cartorio`) defina qual frente o usuário acessa após o login.

## Contexto

- Backend (`backend/src/index.ts`): Express/TS stateless, só endpoints do geo-core.
- Frontend (`maprix-web`): React Router com `/engenharia/*` e `/cartorio/*`, sem login
  nem guard — qualquer um navega para as duas áreas.
- Persistência: Postgres + Drizzle (Railway). Ver [ADR 0001](../adr/0001-postgres-drizzle-para-auth.md).

## Goals

- Conta carrega `role`; login decide a frente.
- Signup público cria **engenheiro**; cartório é **seed/convite**.
- JWT em **cookie httpOnly**; `/api/auth/me` devolve a role (fonte: banco).
- Guard de rota: sem sessão → `/login`; role de outra área → redireciona pra própria.

## Non-goals

- Funcionalidades de matrículas/protocolos do cartório (seguem stub).
- Proteger endpoints do geo-core com auth (próxima etapa; foco é gatear a frente).
- Reset de senha, verificação de e-mail, OAuth, multi-tenant, billing.

## Arquitetura

### Backend (`backend/`)
- `src/db/client.ts`, `src/db/schema.ts` (enum `user_role`, tabela `users`), `drizzle.config.ts`, `migrations/`.
- `src/lib/auth.ts` — bcrypt + jwt + cookie opts.
- `src/routes/auth.ts` — `POST /api/auth/signup` (role forçada = engenheiro), `/login`, `/logout`, `GET /api/auth/me`.
- `src/db/seed.ts` — semeia conta de cartório a partir de env `SEED_CARTORIO_*`.
- `src/index.ts` — CORS com credentials + origin = FRONTEND_URL, cookie-parser, monta auth router.

### Frontend (`maprix-web/`)
- `src/contexts/auth-context.tsx` — AuthProvider + useAuth.
- `src/lib/auth-api.ts` — fetch com `credentials:'include'`.
- `src/lib/roles.ts` — `ROLE_AREA` (engenheiro↔engenharia) e `ROLE_HOME`.
- `src/pages/login.tsx` — login + cadastro (cria engenheiro).
- `src/components/auth/require-auth.tsx` — guard por área.
- `src/App.tsx` — rota `/login` + áreas protegidas; `src/main.tsx` — AuthProvider; `topbar.tsx` — usuário real + logout.

### shared/types
`Role = 'engenheiro' | 'cartorio'` + `interface User`.

## Edge cases

- `Role` ('engenheiro') ≠ `Area` ('engenharia') → mapeado por `ROLE_AREA` no guard.
- Signup sempre engenheiro (servidor ignora role do cliente).
- Reload restaura sessão via `/api/auth/me`.
- Sem `JWT_SECRET`/`DATABASE_URL` → backend falha no boot (fail fast).

## Critérios de pronto

- `pnpm -r build` verde (backend + web).
- migrate aplica; seed cria cartório; signup cria engenheiro.
- login engenheiro → `/engenharia`; login cartório → `/cartorio`; acesso cruzado redireciona.
- logout volta pra `/login`.
