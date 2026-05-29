import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LayoutAreaLogada } from "./components/LayoutAreaLogada";
import { RotaSomenteAdmin } from "./components/RotaSomenteAdmin";
import { useSessao } from "./contexts/SessaoContext";
import { PaginaInicio } from "./pages/PaginaInicio";
import { PaginaLogin } from "./pages/PaginaLogin";
import { PaginaUsuarios } from "./pages/PaginaUsuarios";
import { PaginaNovaAvaliacao } from "./pages/PaginaNovaAvaliacao";
import { PaginaPacientes } from "./pages/PaginaPacientes";
import { PaginaHistoricoPaciente } from "./pages/PaginaHistoricoPaciente";
import { PaginaManualPews } from "./pages/PaginaManualPews";

function RotaInicial() {
  const { token } = useSessao();
  if (token) {
    return <Navigate to="/inicio" replace />;
  }
  return <Navigate to="/login" replace />;
}

function RotaProtegida({ children }: { children: ReactNode }) {
  const { token } = useSessao();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RotaInicial />} />
      <Route path="/login" element={<PaginaLogin />} />
      <Route
        element={
          <RotaProtegida>
            <LayoutAreaLogada />
          </RotaProtegida>
        }
      >
        <Route path="/inicio" element={<PaginaInicio />} />
        <Route
          path="/minhas-avaliacoes"
          element={<PaginaInicio apenasMinhas />}
        />
        <Route path="/avaliacoes/nova" element={<PaginaNovaAvaliacao />} />
        <Route
          path="/historico/paciente/:pacienteId"
          element={<PaginaHistoricoPaciente />}
        />
        <Route
          path="/cadastros/usuarios"
          element={
            <RotaSomenteAdmin>
              <PaginaUsuarios />
            </RotaSomenteAdmin>
          }
        />
        <Route
          path="/cadastros/pacientes"
          element={<PaginaPacientes />}
        />
        <Route path="/manual-pews" element={<PaginaManualPews />} />

      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
