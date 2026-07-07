# Backend Maprix — build do workspace pnpm (backend + shared deps) e run.
# Contexto de build = raiz do monorepo (ver docker-compose.yml).
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app

# Manifestos primeiro (cache de camada de dependências).
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY shared/types/package.json ./shared/types/
COPY shared/geo-core/package.json ./shared/geo-core/
COPY maprix-web/package.json ./maprix-web/
RUN pnpm install --frozen-lockfile

# Código-fonte + build de backend e suas dependências (types, geo-core).
COPY . .
RUN pnpm --filter "backend..." build

WORKDIR /app/backend
EXPOSE 3000

# Aplica migrations, semeia (idempotente, não-fatal) e sobe a API.
CMD ["sh", "-c", "node dist/db/migrate.js && (node dist/db/seed.js || true) && node dist/index.js"]
