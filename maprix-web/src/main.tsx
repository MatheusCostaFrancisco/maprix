import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './components/theme-provider';
import { App } from './App';
import { ThemeTest } from './ThemeTest';
import './globals.css';

const params = new URLSearchParams(window.location.search);
const showThemeTest = params.get('m1') === 'theme-test';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {showThemeTest ? <ThemeTest /> : <App />}
    </ThemeProvider>
  </React.StrictMode>,
);
