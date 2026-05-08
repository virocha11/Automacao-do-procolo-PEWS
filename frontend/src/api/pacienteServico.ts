import type { Paciente } from "../types/paciente";
import { urlBaseApi } from "./requisicoes";

async function tratarResposta(resposta: Response) {
  if (!resposta.ok) {
    let mensagem = "Erro na requisição.";

    try {
      const dados = await resposta.json();

      if (dados?.erro) {
        mensagem = dados.erro;
      }
    } catch {
      //
    }

    throw new Error(mensagem);
  }

  return resposta.json();
}

export async function apiListarPacientes(token: string, nome?: string) {
  const parametros = new URLSearchParams();

  if (nome && nome.trim() !== "") {
    parametros.set("nome", nome.trim());
  }

  const consulta = parametros.toString();
  const resposta = await fetch(
    `${urlBaseApi()}/pacientes${consulta ? `?${consulta}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return tratarResposta(resposta) as Promise<Paciente[]>;
}

export async function apiListarTodosPacientes(token: string) {
  const resposta = await fetch(`${urlBaseApi()}/pacientes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta) as Promise<Paciente[]>;
}

export type CorpoCriarPaciente = {
  nome: string;
  dataNascimento: string;
  nomeResponsavelLegal: string;
  telefoneResponsavelLegal: string;
  endereco: string;
};

export async function apiCriarPaciente(
  token: string,
  corpo: CorpoCriarPaciente
) {
  const resposta = await fetch(`${urlBaseApi()}/pacientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(corpo),
  });

  return tratarResposta(resposta) as Promise<Paciente>;
}

export async function apiAtualizarPaciente(
  token: string,
  id: number,
  corpo: CorpoCriarPaciente
) {
  const resposta = await fetch(`${urlBaseApi()}/pacientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(corpo),
  });

  return tratarResposta(resposta) as Promise<Paciente>;
}

export async function apiExcluirPaciente(
  token: string,
  id: number
) {
  const resposta = await fetch(`${urlBaseApi()}/pacientes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta);
}
