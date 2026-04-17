import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Usuario } from "../types/usuario";

const CHAVE_TOKEN = "pews_token";
const CHAVE_USUARIO = "pews_usuario";

type SessaoContexto = {
  usuario: Usuario | null;
  token: string | null;
  definirSessao: (token: string, usuario: Usuario) => void;
  encerrarSessao: () => void;
};

const SessaoContexto = createContext<SessaoContexto | null>(null);

function lerArmazenado(): { token: string | null; usuario: Usuario | null } {
  try {
    const token = localStorage.getItem(CHAVE_TOKEN);
    const bruto = localStorage.getItem(CHAVE_USUARIO);
    if (!token || !bruto) {
      return { token: null, usuario: null };
    }
    const usuario = JSON.parse(bruto) as Usuario;
    return { token, usuario };
  } catch {
    return { token: null, usuario: null };
  }
}

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const inicial = lerArmazenado();
  const [token, setToken] = useState<string | null>(inicial.token);
  const [usuario, setUsuario] = useState<Usuario | null>(inicial.usuario);

  const definirSessao = useCallback((novoToken: string, novoUsuario: Usuario) => {
    localStorage.setItem(CHAVE_TOKEN, novoToken);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(novoUsuario));
    setToken(novoToken);
    setUsuario(novoUsuario);
  }, []);

  const encerrarSessao = useCallback(() => {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    setToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      token,
      definirSessao,
      encerrarSessao,
    }),
    [usuario, token, definirSessao, encerrarSessao]
  );

  return (
    <SessaoContexto.Provider value={valor}>{children}</SessaoContexto.Provider>
  );
}

export function useSessao(): SessaoContexto {
  const ctx = useContext(SessaoContexto);
  if (!ctx) {
    throw new Error("useSessao deve ser usado dentro de ProvedorSessao.");
  }
  return ctx;
}
