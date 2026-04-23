import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

/**
 * Toggle de tema persistente via next-themes (usa localStorage por baixo).
 * Mostra o ícone do tema _oposto_ ao atual (indica pra onde vai ao clicar).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === 'system' ? resolvedTheme : theme;
  const isDark = current === 'dark';
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
