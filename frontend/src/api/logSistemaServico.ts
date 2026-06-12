import type { LogSistema } from "../types/logSistema";
import { urlBaseApi } from "./requisicoes";

async function tratarResposta(resposta: Response) {
  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(corpo?.erro ?? "Erro na requisição.");
  }

  return corpo;
}

export async function apiListarLogsSistema(token: string) {
  const resposta = await fetch(`${urlBaseApi()}/logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta) as Promise<LogSistema[]>;
}
