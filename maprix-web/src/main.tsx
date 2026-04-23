import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from './components/theme-provider';
import { App } from './App';
import { ThemeTest } from './ThemeTest';
import { ComponentsTest } from './ComponentsTest';
import './globals.css';

const params = new URLSearchParams(window.location.search);
const preview = params.get('m1') === 'theme-test'
  ? 'theme'
  : params.get('m2') === 'components-test'
    ? 'components'
    : null;

function Root() {
  if (preview === 'theme') return <ThemeTest />;
  if (preview === 'components') return <ComponentsTest />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        <Root />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
