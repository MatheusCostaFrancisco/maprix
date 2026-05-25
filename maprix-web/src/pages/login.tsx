import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { ROLE_HOME } from '@/lib/roles';

const ERR_MAP: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_already_used: 'Este e-mail já está cadastrado.',
  invalid_input: 'Verifique os dados (senha mínima de 8 caracteres).',
};

export default function LoginPage() {
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const isSignup = mode === 'signup';

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            map<span className="text-primary">rix</span>
          </CardTitle>
          <CardDescription>
            {isSignup ? 'Crie sua conta de engenheiro.' : 'Entre para acessar sua área.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Aguarde…' : isSignup ? 'Criar conta' : 'Entrar'}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode(isSignup ? 'login' : 'signup');
                setError(null);
              }}
            >
              {isSignup ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta de engenheiro'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
