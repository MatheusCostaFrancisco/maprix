# CHANGELOG

Histórico de mudanças relevantes do `maprix-web`. Foco em release notes — para detalhes técnicos, consultar commits e `Docs/UI-AUDIT-2026-04-22.md`.

---

## [0.2.0] — Refator de design system (M1–M6) · 2026-04-22 → 2026-04-23

Refator integral do frontend para a identidade `maprix-ui` (Mapbox / Mercury), executado em 6 milestones com validação manual entre cada um.

### Adicionado

- **Design system completo:** Tailwind 3.4 + tokens HSL navy/cyan, Inter via `@fontsource`, `next-themes` com toggle por tema, sonner para toasts, Framer Motion para animações.
- **Componentes shadcn (New York):** alert, avatar, badge, button, card, input, label, select, sheet, skeleton, table, tabs, textarea, tooltip.
- **Componentes Maprix shared:** `EmptyState`, `PageHeader` (variantes `engenharia`/`cartorio`), `StatCard`, `ThemeToggle`.
- **Rotas com `react-router-dom`:**
  - `/engenharia/conversor` — conversor + conferência bilateral, 5 estados (idle/loading/ok/error/sem-permissão).
  - `/engenharia/memorial-e-shapefile` — memorial descritivo + downloads DXF e SIG-RI ZIP.
  - `/cartorio/matriculas` — listagem stub com botão "Nova matrícula" (toast info).
  - `/cartorio/protocolos` — listagem stub.
- **App shell** (`AppShell`) compartilhado: sidebar colapsável (w-64 ↔ w-16) com persistência em `localStorage`, topbar sticky com breadcrumb, mobile drawer via `Sheet`, container `max-w-5xl` centrado.
- **Cartório força tema light** ao montar via hook `useForcedLightTheme` e oculta `ThemeToggle` no Topbar dessa área. Preferência do usuário é restaurada ao sair.
- **Logos** `logo.svg` e `logo-mark.svg` em `public/`.
- **Helper de download de blob** em `lib/download.ts`.
- **Hook `useInputState`** compartilhado entre as duas telas de engenharia.
- **`TooltipProvider`** global em `main.tsx` cobrindo toda a árvore.

### Removido

- `src/legacy/App.legacy.tsx` (400 linhas) — versão pré-design-system.
- `src/ThemeTest.tsx` e `src/ComponentsTest.tsx` (663 linhas) — preview routes `?m1=theme-test` e `?m2=components-test` usadas durante M1/M2.
- `src/components/engenharia/engenharia-layout.tsx` — substituído pelo `AppShell` genérico na M4.
- 6 componentes shadcn não utilizados: `alert-dialog`, `checkbox`, `dialog`, `dropdown-menu`, `separator`, `switch`.
- 5 dependências Radix UI não utilizadas (`@radix-ui/react-{alert-dialog,checkbox,dropdown-menu,separator,switch}`) e o workspace ref `@maprix/geo-core` (não importado no frontend).

### Mudou

- `Sheet`: `data-[state=open]:duration-500` → `300` e `closed:duration-300` → `200` para respeitar §8 da skill (animações ≤ 300ms).
- `tsconfig.json` deixou de excluir `src/legacy` (pasta não existe mais).

### Bundle (gzip)

| Build | JS | CSS |
|---|---|---|
| Antes do refator (`a9ce1d3`) | n/a (sem Tailwind/shadcn) | n/a |
| M5 (com legacy/test components) | 169.23 kB | 7.89 kB |
| M6 final | **155.12 kB** | **7.31 kB** |

Build sem warnings de chunk size (estava acima de 500 kB minified, agora 484.92 kB).

### Breaking changes

Nenhum — o backend e os contratos `@maprix/types` permanecem inalterados.

### Próximos passos sugeridos

1. **Auth real** (login + sessão) — hoje todas as rotas são acessíveis sem autenticação. `UnauthorizedState` existe mas só é renderizado via query param `?state=unauthorized`. Ver `Docs/TECH-DEBT.md` §7.
2. **Conteúdo real do cartório** — Matrículas e Protocolos são stubs com `EmptyState`. Aguardando definição da API e UX com escrivão piloto.
3. **Validação visual automatizada** (Playwright/Chromatic) — ver `Docs/TECH-DEBT.md` §2.
4. **Reavaliar tema forçado no cartório** quando houver usuário cartorial real testando — ver `Docs/TECH-DEBT.md` §6.

---

## [0.1.0] — MVP funcional · 2026-04-22 e anterior

Histórico anterior ao refator de design system. Engloba bootstrap do monorepo, Prompts 2/3/4 do Ultraplan (conversor, memorial, shapefile SIG-RI) e correções dos bloqueantes da auditoria CNJ 195/2025 (GAP-01..04).

Detalhes em `Docs/CNJ-195-2025-CHECKLIST.md` e nos commits anteriores a `71b778b`.
