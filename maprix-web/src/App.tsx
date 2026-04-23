import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/app-shell';
import ConversorPage from '@/pages/engenharia/conversor';
import MemorialEShapefilePage from '@/pages/engenharia/memorial-e-shapefile';
import { NotFound } from '@/pages/not-found';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/engenharia/conversor" replace />} />
        <Route path="/engenharia" element={<AppShell area="engenharia" />}>
          <Route index element={<Navigate to="/engenharia/conversor" replace />} />
          <Route path="conversor" element={<ConversorPage />} />
          <Route path="memorial-e-shapefile" element={<MemorialEShapefilePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
