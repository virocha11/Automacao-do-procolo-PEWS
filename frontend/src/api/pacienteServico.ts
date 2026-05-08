import type { Paciente } from "../types/paciente";

const URL_BASE = "http://localhost:3000";

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

export async function apiListarPacientes(token: string) {
  const resposta = await fetch(`${URL_BASE}/pacientes`, {
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
  const resposta = await fetch(`${URL_BASE}/pacientes`, {
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
  const resposta = await fetch(`${URL_BASE}/pacientes/${id}`, {
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
  const resposta = await fetch(`${URL_BASE}/pacientes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return tratarResposta(resposta);
}