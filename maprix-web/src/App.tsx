import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/app-shell';
import { RequireAuth } from '@/components/auth/require-auth';
import LoginPage from '@/pages/login';
import ConversorPage from '@/pages/engenharia/conversor';
import MemorialEShapefilePage from '@/pages/engenharia/memorial-e-shapefile';
import MatriculasPage from '@/pages/cartorio/matriculas';
import ProtocolosPage from '@/pages/cartorio/protocolos';
import { NotFound } from '@/pages/not-found';

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
