# ADR 0001 — Postgres + Drizzle para persistência/auth (em vez de MySQL)

- Status: Accepted
- Data: 2026-05-25

## Contexto

O `CLAUDE.md` previa Express/TS/**MySQL** (mesma stack do AcoVitta), mas o backend
ainda não tinha banco — era stateless (só endpoints do geo-core). Ao introduzir login
JWT por role, era preciso uma camada de persistência para usuários.

Já existia um Postgres provisionado no Railway (usado por um protótipo paralelo), com
driver `pg` e Drizzle ORM TS-native validados. O custo de subir um MySQL novo + ORM
não se justificava para o escopo atual.

## Decisão

Usar **Postgres (Railway) + Drizzle ORM** para a camada de auth do backend. Migrations
append-only geradas por `drizzle-kit`. Schema `users` com enum `user_role`.

## Consequências

- TS-native, sem ORM extra; tipos do schema inferidos pelo Drizzle.
- Reaproveita infra Railway já existente.
- Diverge do AcoVitta (MySQL) — times/projetos não compartilham mais a mesma stack de DB.
- `CLAUDE.md` atualizado para refletir Postgres.

## Quando reabrir

- Se o produto precisar consolidar a stack de DB com AcoVitta (MySQL) por operação/custo.
- Se surgir requisito que o Postgres no Railway não atenda (escala, extensões, multi-região).
