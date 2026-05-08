import { Request, Response } from "express";

import {
  buscarTodosPacientes,
  buscarPacientePorId,
  criarPaciente,
  atualizarPaciente,
  removerPaciente,
} from "../repositories/pacienteRepository";

export async function listarPacientes(req: Request, res: Response) {
  try {
    const nome = req.query.nome as string | undefined;

    const pacientes = await buscarTodosPacientes(nome);

    res.json(pacientes);
  } catch {
    res.status(500).json({
      erro: "Não foi possível listar os pacientes.",
    });
  }
}

export async function cadastrarPaciente(req: Request, res: Response) {
  try {
    const {
      nome,
      dataNascimento,
      nomeResponsavelLegal,
      telefoneResponsavelLegal,
      endereco,
    } = req.body;

    if (!nome) {
      return res.status(400).json({
        erro: "Nome é obrigatório.",
      });
    }

    let data: Date | null = null;

    if (dataNascimento) {
      const convertida = new Date(dataNascimento);

      if (Number.isNaN(convertida.getTime())) {
        return res.status(400).json({
          erro: "Data inválida.",
        });
      }

      data = convertida;
    }

    const paciente = await criarPaciente({
      nome,
      dataNascimento: data,
      nomeResponsavelLegal,
      telefoneResponsavelLegal: telefoneResponsavelLegal ?? null,
      endereco: endereco ?? null,
    });

    res.status(201).json(paciente);
  } catch(erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Não foi possível cadastrar o paciente.",
    });
  }
}

export async function obterPacientePorId(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const paciente = await buscarPacientePorId(id);

    if (!paciente) {
      return res.status(404).json({
        erro: "Paciente não encontrado.",
      });
    }

    res.json(paciente);
  } catch(erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Não foi possível buscar o paciente.",
    });
  }
}

export async function alterarPaciente(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const paciente = await atualizarPaciente(id, req.body);

    if (!paciente) {
      return res.status(404).json({
        erro: "Paciente não encontrado.",
      });
    }

    res.json(paciente);
  } catch {
    res.status(500).json({
      erro: "Não foi possível atualizar o paciente.",
    });
  }
}

export async function excluirPaciente(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    const removido = await removerPaciente(id);

    if (!removido) {
      return res.status(404).json({
        erro: "Paciente não encontrado.",
      });
    }

    res.json({
      mensagem: "Paciente removido com sucesso.",
    });
  } catch {
    res.status(500).json({
      erro: "Não foi possível remover o paciente.",
    });
  }
}