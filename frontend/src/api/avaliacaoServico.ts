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

export async function apiAtualizarAvaliacao(
  token: string,
  avaliacaoId: number,
  corpo: Partial<CorpoCriarAvaliacao>
) {
  const resposta = await fetch(`${urlBaseApi()}/avaliacoes/${avaliacaoId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(corpo),
  });

  return tratarResposta(resposta) as Promise<Avaliacao>;
}

export async function apiAnexarArquivoAvaliacao(
  token: string,
  avaliacaoId: number,
  arquivo: File
) {
  const formData = new FormData();
  formData.append("anexo", arquivo);

  const resposta = await fetch(`${urlBaseApi()}/avaliacoes/${avaliacaoId}/anexo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return tratarResposta(resposta) as Promise<Avaliacao>;
}

export async function apiRegistrarSinaisVitaisAvaliacao(
  token: string,
  avaliacaoId: number,
  corpo: {
    condicaoGeral: "SEM_ALTERACOES" | "ALTERACOES_OBSERVADAS";
    frequenciaCardiaca?: number | null;
    frequenciaRespiratoria?: number | null;
    temperatura?: number | null;
    saturacaoOxigenio?: number | null;
    pressaoArterial?: string | null;
    dor?: number | null;
    observacao?: string | null;
  }
) {
  const resposta = await fetch(
    `${urlBaseApi()}/avaliacoes/${avaliacaoId}/sinais-vitais`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(corpo),
    }
  );

  return tratarResposta(resposta) as Promise<Avaliacao>;
}

export async function apiListarAvaliacoes(
  token: string,
  nomePaciente?: string,
  opcoes?: {
    exato?: boolean;
    pacienteId?: number;
    minhas?: boolean;
    avaliadorId?: number;
    avaliadorNome?: string;
    pontuacaoMin?: number;
    pontuacaoMax?: number;
    dataInicio?: string;
    dataFim?: string;
  }
) {
  const parametros = new URLSearchParams();

  if (nomePaciente && nomePaciente.trim() !== "") {
    parametros.set("nomePaciente", nomePaciente.trim());
  }

  if (opcoes?.exato) {
    parametros.set("exato", "true");
  }

  if (opcoes?.pacienteId) {
    parametros.set("pacienteId", String(opcoes.pacienteId));
  }

  if (opcoes?.minhas) {
    parametros.set("minhas", "true");
  }

  if (opcoes?.avaliadorId) {
    parametros.set("avaliadorId", String(opcoes.avaliadorId));
  }

  if (opcoes?.avaliadorNome && opcoes.avaliadorNome.trim() !== "") {
    parametros.set("avaliadorNome", opcoes.avaliadorNome.trim());
  }

  if (opcoes?.pontuacaoMin !== undefined) {
    parametros.set("pontuacaoMin", String(opcoes.pontuacaoMin));
  }

  if (opcoes?.pontuacaoMax !== undefined) {
    parametros.set("pontuacaoMax", String(opcoes.pontuacaoMax));
  }

  if (opcoes?.dataInicio) {
    parametros.set("dataInicio", opcoes.dataInicio);
  }

  if (opcoes?.dataFim) {
    parametros.set("dataFim", opcoes.dataFim);
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

export async function apiExcluirAvaliacao(token: string, id: number) {
  const resposta = await fetch(`${urlBaseApi()}/avaliacoes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta);
}

export async function apiExcluirAnexoAvaliacao(
  token: string,
  avaliacaoId: number,
  anexoId?: number
) {
  const caminho = anexoId
    ? `${urlBaseApi()}/avaliacoes/${avaliacaoId}/anexo/${anexoId}`
    : `${urlBaseApi()}/avaliacoes/${avaliacaoId}/anexo`;

  const resposta = await fetch(caminho, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta) as Promise<Avaliacao>;
}
