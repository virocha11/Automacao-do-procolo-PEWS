import type { Usuario } from "../types/usuario";
import { urlBaseApi } from "./requisicoes";

async function lerErro(res: Response): Promise<never> {
  let mensagem = "Falha na requisição.";
  try {
    const corpo = (await res.json()) as { erro?: string };
    if (corpo.erro) {
      mensagem = corpo.erro;
    }
  } catch {
  }
  throw new Error(mensagem);
}

function cabecalhos(token: string, json = false): HeadersInit {
  const h: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) {
    h["Content-Type"] = "application/json";
  }
  return h;
}

export type CorpoCriarUsuario = {
  nome: string;
  email: string;
  senha: string;
  funcao: number;
  dataNascimento: string | null;
  celular: string | null;
};

export type CorpoAtualizarUsuario = {
  nome?: string;
  email?: string;
  senha?: string;
  funcao?: number;
  dataNascimento?: string | null;
  celular?: string | null;
};

export async function apiListarUsuarios(token: string): Promise<Usuario[]> {
  const res = await fetch(`${urlBaseApi()}/usuarios`, {
    headers: cabecalhos(token),
  });
  if (!res.ok) {
    await lerErro(res);
  }
  return res.json() as Promise<Usuario[]>;
}

export async function apiCriarUsuario(
  token: string,
  corpo: CorpoCriarUsuario
): Promise<Usuario> {
  const res = await fetch(`${urlBaseApi()}/usuarios`, {
    method: "POST",
    headers: cabecalhos(token, true),
    body: JSON.stringify(corpo),
  });
  if (!res.ok) {
    await lerErro(res);
  }
  return res.json() as Promise<Usuario>;
}

export async function apiAtualizarUsuario(
  token: string,
  id: number,
  corpo: CorpoAtualizarUsuario
): Promise<Usuario> {
  const res = await fetch(`${urlBaseApi()}/usuarios/${id}`, {
    method: "PUT",
    headers: cabecalhos(token, true),
    body: JSON.stringify(corpo),
  });
  if (!res.ok) {
    await lerErro(res);
  }
  return res.json() as Promise<Usuario>;
}

export async function apiExcluirUsuario(token: string, id: number): Promise<void> {
  const res = await fetch(`${urlBaseApi()}/usuarios/${id}`, {
    method: "DELETE",
    headers: cabecalhos(token),
  });
  if (!res.ok) {
    await lerErro(res);
  }
}
