import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from './lib/animations';
import { cn } from './lib/utils';

/**
 * Prévia de validação da Milestone 1 do design system.
 * Acesse com `?m1=theme-test` no URL. Mostra:
 *  - Fonte Inter aplicada
 *  - Tokens de cor respondendo ao tema
 *  - Animações Framer com preset fadeUp
 *  - Toggle light/dark via next-themes
 * Este componente é temporário — some quando a Milestone 3 refatorar App.tsx.
 */
export function ThemeTest() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.div
        {...fadeUp}
        className="mx-auto max-w-5xl px-6 py-12 space-y-10"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Design System · Milestone 1
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Fundação pronta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Inter, Tailwind, tokens HSL, next-themes, Framer Motion e
              lucide-react carregados. Use o toggle para alternar o tema e
              validar os tokens no claro e no escuro.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Tipografia</h2>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-1"
          >
            {(
              [
                ['text-4xl font-bold tracking-tight', 'Hero — 36px 700'],
                ['text-3xl font-semibold tracking-tight', 'Página cartório — 30px 600'],
                ['text-2xl font-semibold tracking-tight', 'Página engenharia — 24px 600'],
                ['text-xl font-semibold', 'Título de seção — 20px 600'],
                ['text-lg', 'Subtítulo — 18px 400'],
                ['text-base', 'Body padrão cartório — 16px 400'],
                ['text-sm', 'Body UIs densas engenharia — 14px 400'],
                ['text-xs text-muted-foreground', 'Label/hint — 12px 400 muted'],
              ] as const
            ).map(([cls, label]) => (
              <motion.p key={label} variants={staggerItem} className={cls}>
                {label}
              </motion.p>
            ))}
          </motion.div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Tokens de cor</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <Swatch token="background" />
            <Swatch token="foreground" />
            <Swatch token="card" />
            <Swatch token="card-foreground" />
            <Swatch token="primary" />
            <Swatch token="primary-foreground" />
            <Swatch token="secondary" />
            <Swatch token="accent" />
            <Swatch token="muted" />
            <Swatch token="muted-foreground" />
            <Swatch token="border" />
            <Swatch token="destructive" />
            <Swatch token="success" />
            <Swatch token="warning" />
            <Swatch token="maprix-navy" label="maprix.navy" />
            <Swatch token="maprix-cyan" label="maprix.cyan" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Cards & superfícies</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card text-card-foreground p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Card padrão
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">123,45 ha</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa tokens `card` e `card-foreground`. Borda via `border`.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Card secundário
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">Secondary</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa `secondary` como background.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Foco visível & anel</h2>
          <p className="text-sm text-muted-foreground">
            Tab através dos elementos abaixo — o anel deve aparecer com cor{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">--ring</code>.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                'rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium',
                'transition-colors hover:bg-primary/90',
              )}
            >
              Primário
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md border border-border bg-background px-4 py-2 text-sm font-medium',
                'transition-colors hover:bg-secondary',
              )}
            >
              Outline
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium text-foreground',
                'transition-colors hover:bg-secondary',
              )}
            >
              Ghost
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium',
                'transition-colors hover:bg-destructive/90',
              )}
            >
              Destrutivo
            </button>
          </div>
        </section>

        <footer className="pt-6 border-t border-border text-xs text-muted-foreground">
          Acesse a aplicação completa em <code className="rounded bg-muted px-1.5 py-0.5">/</code>.
          Esta prévia some na Milestone 3.
        </footer>
      </motion.div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-md',
        'border border-border bg-background text-foreground',
        'transition-colors hover:bg-secondary',
      )}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Swatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div
        className="h-14"
        style={{ background: `hsl(var(--${token}))` }}
        aria-hidden
      />
      <div className="px-3 py-2">
        <p className="text-xs font-medium truncate">{label ?? token}</p>
        <p className="text-[10px] text-muted-foreground truncate font-mono">
          --{token}
        </p>
      </div>
    </div>
  );
}
