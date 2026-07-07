import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/app-shell';
import { RequireAuth } from '@/components/auth/require-auth';
import LoginPage from '@/pages/login';
import { NotFound } from '@/pages/not-found';

// Rotas pesadas (mapbox no conversor, telas do cartório) carregadas sob demanda.
const ConversorPage = lazy(() => import('@/pages/engenharia/conversor'));
const MemorialEShapefilePage = lazy(() => import('@/pages/engenharia/memorial-e-shapefile'));
const MatriculasPage = lazy(() => import('@/pages/cartorio/matriculas'));
const ProtocolosPage = lazy(() => import('@/pages/cartorio/protocolos'));

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Navigate to="/engenharia/conversor" replace />} />

        <Route
          path="/engenharia"
          element={
            <RequireAuth area="engenharia">
              <AppShell area="engenharia" />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/engenharia/conversor" replace />} />
          <Route path="conversor" element={<ConversorPage />} />
          <Route path="memorial-e-shapefile" element={<MemorialEShapefilePage />} />
        </Route>

        <Route
          path="/cartorio"
          element={
            <RequireAuth area="cartorio">
              <AppShell area="cartorio" />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/cartorio/matriculas" replace />} />
          <Route path="matriculas" element={<MatriculasPage />} />
          <Route path="protocolos" element={<ProtocolosPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
