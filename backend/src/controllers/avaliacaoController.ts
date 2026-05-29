import { Request, Response } from "express";

import {
  buscarTodasAvaliacoes,
  criarAvaliacao,
  removerAvaliacao,
} from "../repositories/avaliacaoRepository";

function textoOuNulo(valor: unknown): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

  return texto === "" ? null : texto;
}

function numeroOuNulo(valor: unknown): number | null {
  if (valor == null || valor === "") {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

function numeroPositivoOuNulo(valor: unknown): number | null {
  const numero = numeroOuNulo(valor);

  return numero && numero > 0 ? numero : null;
}

function pontuacao(valor: unknown): number {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
}

function booleano(valor: unknown): boolean {
  return valor === true;
}

export async function listarAvaliacoes(req: Request, res: Response) {
  try {
    const nomePaciente = textoOuNulo(req.query.nomePaciente);
    const buscaExata = req.query.exato === "true";
    const pacienteId = numeroPositivoOuNulo(req.query.pacienteId);
    const apenasMinhas = req.query.minhas === "true";
    const avaliador = apenasMinhas
      ? req.usuarioAutenticado
        ? {
            id: req.usuarioAutenticado.id,
            nome: req.usuarioAutenticado.nome,
          }
        : undefined
      : undefined;
    const avaliacoes = await buscarTodasAvaliacoes(
      nomePaciente ?? undefined,
      buscaExata,
      pacienteId ?? undefined,
      avaliador
    );

    res.json(avaliacoes);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Não foi possível listar as avaliações.",
    });
  }
}

export async function cadastrarAvaliacao(req: Request, res: Response) {
  try {
    const avaliacao = await criarAvaliacao({
      nomePaciente: textoOuNulo(req.body.nomePaciente),
      pacienteId: numeroPositivoOuNulo(req.body.pacienteId),
      avaliadorNome: req.usuarioAutenticado?.nome ?? null,
      avaliadorId: req.usuarioAutenticado?.id ?? null,
      faixaEtaria: textoOuNulo(req.body.faixaEtaria),
      leito: textoOuNulo(req.body.leito),
      diagnostico: textoOuNulo(req.body.diagnostico),
      dih: textoOuNulo(req.body.dih),
      dataAvaliacao: new Date(),
      avaliacaoRespiratoria: textoOuNulo(req.body.avaliacaoRespiratoria),
      pontuacaoRespiratoria: pontuacao(req.body.pontuacaoRespiratoria),
      avaliacaoCardiovascular: textoOuNulo(req.body.avaliacaoCardiovascular),
      pontuacaoCardiovascular: pontuacao(req.body.pontuacaoCardiovascular),
      avaliacaoNeurologica: textoOuNulo(req.body.avaliacaoNeurologica),
      pontuacaoNeurologica: pontuacao(req.body.pontuacaoNeurologica),
      frequenciaRespiratoria: numeroOuNulo(req.body.frequenciaRespiratoria),
      frequenciaCardiaca: numeroOuNulo(req.body.frequenciaCardiaca),
      vigilia: booleano(req.body.vigilia),
      emesePosOperatorio: booleano(req.body.emesePosOperatorio),
      nebulizacaoResgate: booleano(req.body.nebulizacaoResgate),
      pontuacaoTotal: pontuacao(req.body.pontuacaoTotal),
      intervencao: textoOuNulo(req.body.intervencao),
      tempoControleSsvv: textoOuNulo(req.body.tempoControleSsvv),
    });

    res.status(201).json(avaliacao);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Não foi possível cadastrar a avaliação.",
    });
  }
}

export async function excluirAvaliacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const removida = await removerAvaliacao(id);

    if (!removida) {
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    res.json({ mensagem: "Avaliação removida com sucesso." });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Não foi possível remover a avaliação.",
    });
  }
}
