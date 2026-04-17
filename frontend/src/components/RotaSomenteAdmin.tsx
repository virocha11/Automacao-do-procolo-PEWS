import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSessao } from "../contexts/SessaoContext";
import { CODIGO_FUNCAO_ADMINISTRADOR } from "../lib/funcaoUsuario";

export function RotaSomenteAdmin({ children }: { children: ReactNode }) {
  const { token, usuario } = useSessao();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (usuario?.funcao !== CODIGO_FUNCAO_ADMINISTRADOR) {
    return <Navigate to="/inicio" replace />;
  }
  return <>{children}</>;
}
