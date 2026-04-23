# Dívida técnica — Maprix

Itens adiados conscientemente. Cada um tem **quando reavaliar** e **justificativa original** pra evitar que voltem como decisão do zero.

---

## 1. Migração Vite → Next.js (App Router)

**Decidido em:** 2026-04-22 (aplicação do design system `maprix-ui`, Milestone 0/auditoria).

**Estado atual:** `maprix-web` roda em Vite 5 (SPA). Deploy no Railway via `serve dist` (estático). Roteamento de áreas implementado via `react-router-dom` + wrapper `<ThemeProvider>` em vez de `app/<area>/layout.tsx`.

**Por que foi adiado:**
- O cliente-alvo é **usuário logado** (engenheiro/cartório), não tráfego público. SSR/SEO não agrega valor hoje.
- Deploy no Railway já está estável e amortizado (`serve -s dist -l $PORT`). Migrar pra `next start` exige refazer build/config e ~6–10h de trabalho sem ganho funcional imediato.
- ~90% do valor da skill `maprix-ui` (tokens, shadcn/ui, Framer Motion, lucide, sonner, next-themes) é framework-agnóstico e funciona no Vite.
- A skill exige nominalmente Next.js, mas a divergência prática é pequena: apenas `app/<area>/layout.tsx` vira `<Route>` + `<ThemeProvider>`.

**Quando reavaliar:**
- Quando houver uma **landing pública** (ex: `maprix.com.br` com páginas comerciais indexáveis por busca)
- Quando precisar de **Server Components** para esconder lógica/dados sensíveis (ex: integração direta com SIGEF/CAR)
- Quando o peso do bundle cliente-only passar de ~500KB gzipped e fizer diferença perceptível no time-to-interactive
- Quando adicionarmos rotas de **recuperação de senha / e-mail** que se beneficiam de SSR (links com tokens no corpo)

**Critério de "pronto pra migrar":** pelo menos 2 dos 4 gatilhos acima. Antes disso, não vale.

**Caminho da migração:** não há atalho — é refatoração de `index.html` + Vite config → `app/layout.tsx` + `next.config.mjs`, rotas manuais → App Router, tests de regressão visual (se implementados até lá).

---

## 2. Testes visuais automatizados (Playwright / Chromatic)

**Decidido em:** 2026-04-22 (aplicação do design system, Milestone 0/auditoria).

**Estado atual:** validação visual por **screenshots manuais** tirados pelo desenvolvedor (Matheus) a cada milestone. Sem baseline automatizada, sem CI visual.

**Por que foi adiado:**
- Com **2 telas** (`/engenharia/conversor` e `/engenharia/memorial-e-shapefile`) e 1 stub cartório, o custo de configurar Playwright + baseline + CI excede o benefício. O dev consegue varrer visualmente em ~5 minutos.
- O risco de regressão visual é baixo enquanto o design system é novo — quase todo commit nessa fase muda visuais de propósito.

**Quando reavaliar:**
- Quando atingir **5 ou mais telas** no total (engenharia + cartório + shared)
- Quando começar a receber contribuições externas (ex: Thiago sócio mexendo no frontend) — aí valida que PR não quebra temas/estados
- Quando houver **feature crítica com muitas variantes visuais** (ex: relatório imprimível que precisa ficar pixel-perfect)

**Alternativas em ordem de preferência (quando tempo de implementar):**
1. **Playwright** com `toHaveScreenshot()` integrado ao `pnpm test:visual` local (mais barato)
2. **Chromatic** se o time crescer — historia + review em PR é ótimo, mas tem custo mensal
3. Percy (menos usado hoje)

---

## 3. Campos SIG-RI adicionais no `.dbf` (MATRICULA, PROPRIETAR, MUNICIPIO, UF)

**Decidido em:** 2026-04-22 (auditoria CNJ 195/2025 — GAPs 06 e 07).

**Estado atual:** `.dbf` tem só `ID` (C,10), `AREA_M2` (N,16,3), `PERIM_M` (N,16,3). A metadata do Polygon (`matricula`, `proprietario`, `municipio`, `uf`) só alimenta o `ID` via matrícula.

**Por que foi adiado:** o Manual ONR v1.2 indica que esses metadados são preenchidos via **formulário da UI do ONR** no ato do upload, não via DBF. Ausência provavelmente não bloqueia aceitação.

**Quando reavaliar:**
- Após o **primeiro upload real** em `mapa.onr.org.br/sigri/` — se o ONR reportar ausência de campos esperados
- Se o Manual Técnico Operacional completo do ONR for publicado e definir schema obrigatório
- Se algum cartório piloto pedir esses campos pra inspeção manual do DBF no QGIS

**Especificação já desenhada** (em `Docs/CNJ-195-2025-GAPS.md` GAPs 06/07):
- `MATRICULA` C(20)
- `PROPRIETAR` C(50)
- `MUNICIPIO` C(40)
- `UF` C(2)
- Encoding já resolvido (ISO-8859-1 via GAP-03, suporta acentos).

---

## 4. PDF do memorial descritivo

**Decidido em:** 2026-04-22 (Prompt 3 do Ultraplan).

**Estado atual:** memorial em cursivo + tabelado (JSON) + export DXF. Sem PDF.

**Por que foi adiado:** DXF cobre engenharia (AutoCAD/QGIS/BricsCAD). PDF seria pro processo do cartório (anexar ao protocolo), que ainda não foi validado com demanda real.

**Quando reavaliar:** após primeira demo no cartório. Se o cartório pedir "papel" (PDF), priorizar. Opções: `pdfkit` no backend, ou `window.print()` no web com CSS print dedicado.

---

## 5. Validação geométrica do polígono (self-intersection, vértices duplicados, área mínima)

**Decidido em:** 2026-04-22 (auditoria CNJ 195/2025 — GAP-09).

**Estado atual:** `gerarShapefileZip` aceita qualquer array de pontos com length ≥ 3. Polígonos malformados podem gerar área errada ou ser rejeitados pelo ONR sem mensagem clara.

**Quando reavaliar:** quando um usuário real reportar erro de ingestão ou cálculo inconsistente. Spec em `Docs/CNJ-195-2025-GAPS.md` GAP-09.

**Biblioteca candidata:** `@turf/boolean-valid` + implementação caseira de detecção de auto-intersecção O(n²).

---

## 6. Tema light forçado no `/cartorio`

**Decidido em:** 2026-04-23 (Milestone 5 do refator de design system).

**Estado atual:** `AppShell` força `theme: 'light'` ao montar quando `area === 'cartorio'` via hook `useForcedLightTheme` em `maprix-web/src/components/shell/app-shell.tsx`. O `ThemeToggle` é ocultado no Topbar nessa área. A preferência prévia do usuário é restaurada ao desmontar.

**Por que foi adiado:** premissa de design da skill `maprix-ui` (§7 — "Cartório (light default)" / Mercury vibes institucional). Decisão tomada **sem usuário cartorial real** validando — é uma aposta baseada em referência visual.

**Quando reavaliar:**
- Quando o produto for **piloto com escrivão/oficial real**, perguntar diretamente:
  - O light forçado incomoda em uso noturno?
  - Faz sentido reabrir o toggle de tema na área?
- Se houver pedido por dark, a remoção é trivial: tirar `useForcedLightTheme(area === 'cartorio')` do `AppShell` e remover a condicional `area !== 'cartorio'` do `Topbar`. Os tokens dark já estão prontos em `globals.css`.

---

## 7. Autenticação real (login + sessão)

**Decidido em:** 2026-04-22 (UI-AUDIT — Decisão pendente #4) e formalizado na M6 do refator.

**Estado atual:** **nenhuma autenticação implementada.** Todas as rotas (`/engenharia/*`, `/cartorio/*`) são acessíveis sem login. O componente `UnauthorizedState` existe em `maprix-web/src/components/engenharia/result-states.tsx` mas só é renderizado em modo de stub via query param `?state=unauthorized` para validar o design do estado.

**Por que foi adiado:** o ciclo do design system precisava de um produto com TELAS para aplicar tokens, componentes e estados. Auth foi escopada para fora dos 6 milestones para não estourar prazo.

**Quando reavaliar:** **antes de qualquer demo externa** (engenheiro ou cartório piloto). Não é seguro expor o backend aberto, mesmo que ainda não persista dados sensíveis.

**Caminho sugerido (a confirmar quando começar):**
- Backend: JWT em cookie httpOnly + middleware `requireAuth` no Express
- Frontend: rota `/login`, `useAuth()` hook + redirect em rotas protegidas via `<Route element={<RequireAuth />}>`
- Storage: tabela `users` no MySQL existente (mesma stack do AcoVitta)
- 2FA: avaliar quando houver usuário pagante (não bloqueante pra MVP)
- O certificado digital ICP-Brasil **não** entra aqui — o profissional autentica direto no portal do ONR para o upload final do SIG-RI.
