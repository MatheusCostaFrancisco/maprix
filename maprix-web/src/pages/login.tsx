import { Suspense, lazy, useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, FileText, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo, LogoMark } from '@/components/shared/logo';
import { useAuth } from '@/contexts/auth-context';
import { ROLE_HOME } from '@/lib/roles';

// Lazy: mantém three.js fora do bundle principal — só carrega no login desktop.
const ThreeBackground = lazy(() => import('@/components/auth/three-background'));

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

const ERR_MAP: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_already_used: 'Este e-mail já está cadastrado.',
  invalid_input: 'Verifique os dados (senha mínima de 8 caracteres).',
};

const FEATURES = [
  { icon: ArrowLeftRight, text: 'Conversão precisa UTM ↔ lat/long (SIRGAS2000)' },
  { icon: FileText, text: 'Memorial descritivo cursivo, tabelado e DWG' },
  { icon: Layers, text: 'Pacote shapefile SIG-RI (CNJ 195/2025)' },
];

export default function LoginPage() {
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  if (loading) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </div>
    );
  }
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = isSignup
        ? await signup({ email, password, name: name || undefined })
        : await login({ email, password });
      navigate(ROLE_HOME[u.role], { replace: true });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'erro';
      setError(ERR_MAP[code] ?? `Erro: ${code}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-2 bg-background">
      {/* Painel de marca */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-maprix-navy p-12 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] opacity-[0.07]"
        >
          <LogoMark className="h-full w-full" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_20%_10%,rgba(63,184,224,0.12),transparent)]"
        />
        {isDesktop && !reduce && (
          <Suspense fallback={null}>
            <div aria-hidden className="absolute inset-0 opacity-70">
              <ThreeBackground />
            </div>
          </Suspense>
        )}

        <Logo
          wordmarkClassName="text-white text-xl"
          markClassName="h-8 w-8"
          className="relative gap-2.5"
        />

        <div className="relative space-y-6">
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Georreferenciamento preciso, do campo ao cartório.
          </h1>
          <ul className="space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.text} className="flex items-start gap-3 text-sm text-white/80">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-maprix-cyan" strokeWidth={1.75} />
                  </span>
                  {f.text}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Maprix · Provimento CNJ 195/2025
        </p>
      </aside>

      {/* Painel do formulário */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <Logo wordmarkClassName="text-xl" markClassName="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isSignup ? 'Criar conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignup
                ? 'Crie sua conta de engenheiro para começar.'
                : 'Entre para acessar sua área de trabalho.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? 'Mínimo 8 caracteres' : '••••••••'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {isSignup && (
              <p className="text-xs text-muted-foreground">
                O cadastro cria uma conta de engenheiro. Contas de cartório são criadas pela
                equipe Maprix.
              </p>
            )}

            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? 'Aguarde…' : isSignup ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup');
                setError(null);
              }}
            >
              {isSignup ? 'Entrar' : 'Criar conta de engenheiro'}
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
