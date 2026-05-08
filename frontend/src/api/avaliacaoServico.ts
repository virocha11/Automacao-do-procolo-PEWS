import { urlBaseApi } from "./requisicoes";
import type { Avaliacao, CorpoCriarAvaliacao } from "../types/avaliacao";

async function tratarResposta(resposta: Response) {
  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(corpo?.erro ?? "Erro na requisição.");
  }

  return corpo;
}

export async function apiCriarAvaliacao(
  token: string,
  corpo: CorpoCriarAvaliacao
) {
  const resposta = await fetch(`${urlBaseApi()}/avaliacoes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(corpo),
  });

  return tratarResposta(resposta) as Promise<Avaliacao>;
}

export async function apiListarAvaliacoes(
  token: string,
  nomePaciente?: string
) {
  const parametros = new URLSearchParams();

  if (nomePaciente && nomePaciente.trim() !== "") {
    parametros.set("nomePaciente", nomePaciente.trim());
  }

  const consulta = parametros.toString();
  const resposta = await fetch(
    `${urlBaseApi()}/avaliacoes${consulta ? `?${consulta}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return tratarResposta(resposta) as Promise<Avaliacao[]>;
}
