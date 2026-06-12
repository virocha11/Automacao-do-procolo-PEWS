import fs from "fs";
import path from "path";
import { Request, Response } from "express";

import {
  atualizarAvaliacao as atualizarAvaliacaoRepositorio,
  buscarAvaliacaoAnexoPorId,
  buscarAvaliacaoPorId,
  buscarTodasAvaliacoes,
  criarAvaliacao,
  criarAvaliacaoAnexo,
  removerAvaliacao,
  removerAvaliacaoAnexo,
} from "../repositories/avaliacaoRepository";
import {
  AcaoLogSistema,
  EntidadeLogSistema,
} from "../entities/LogSistema";
import {
  DadosCriarLogSistema,
  registrarLogSistema,
} from "../repositories/logSistemaRepository";
import { criarControleSinaisVitais } from "../repositories/controleSinaisVitaisRepository";
import { CondicaoGeralSinaisVitais } from "../entities/ControleSinaisVitais";

const uploadsDir = path.join(__dirname, "..", "uploads", "avaliacoes");
const legacyUploadsDir = path.join(
  __dirname,
  "..",
  "routes",
  "uploads",
  "avaliacoes"
);

function resolverCaminhoAnexo(caminho: string) {
  const caminhoAtual = path.join(uploadsDir, caminho);

  if (fs.existsSync(caminhoAtual)) {
    return caminhoAtual;
  }

  const caminhoLegado = path.join(legacyUploadsDir, caminho);

  if (fs.existsSync(caminhoLegado)) {
    return caminhoLegado;
  }

  return caminhoAtual;
}

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

function dataOuNulo(valor: unknown): Date | null {
  if (typeof valor !== "string") {
    return null;
  }

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function pontuacao(valor: unknown): number {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
}

function booleano(valor: unknown): boolean {
  return valor === true;
}

function condicaoGeralSsvvOuNula(
  valor: unknown
): CondicaoGeralSinaisVitais | null {
  if (
    valor === CondicaoGeralSinaisVitais.SEM_ALTERACOES ||
    valor === CondicaoGeralSinaisVitais.ALTERACOES_OBSERVADAS
  ) {
    return valor;
  }

  return null;
}

async function registrarAuditoria(dados: DadosCriarLogSistema) {
  try {
    await registrarLogSistema(dados);
  } catch (erro) {
    console.error("Não foi possível registrar log de auditoria:", erro);
  }
}

async function removerArquivoAntigo(caminho?: string | null) {
  if (!caminho) {
    return;
  }

  const arquivoAntigo = resolverCaminhoAnexo(caminho);

  if (fs.existsSync(arquivoAntigo)) {
    try {
      await fs.promises.unlink(arquivoAntigo);
    } catch {
      // não bloqueia a resposta se a remoção falhar
    }
  }
}

function construirDadosAvaliacao(
  body: any,
  usuarioId?: number,
  usuarioNome?: string | null,
  incluirDataAvaliacao = true
) {
  return {
    nomePaciente: textoOuNulo(body.nomePaciente),
    pacienteId: numeroPositivoOuNulo(body.pacienteId),
    avaliadorNome: usuarioNome ?? null,
    avaliadorId: usuarioId ?? null,
    faixaEtaria: textoOuNulo(body.faixaEtaria),
    leito: textoOuNulo(body.leito),
    diagnostico: textoOuNulo(body.diagnostico),
    dih: textoOuNulo(body.dih),
    ...(incluirDataAvaliacao ? { dataAvaliacao: new Date() } : {}),
    avaliacaoRespiratoria: textoOuNulo(body.avaliacaoRespiratoria),
    pontuacaoRespiratoria: pontuacao(body.pontuacaoRespiratoria),
    avaliacaoCardiovascular: textoOuNulo(body.avaliacaoCardiovascular),
    pontuacaoCardiovascular: pontuacao(body.pontuacaoCardiovascular),
    avaliacaoNeurologica: textoOuNulo(body.avaliacaoNeurologica),
    pontuacaoNeurologica: pontuacao(body.pontuacaoNeurologica),
    frequenciaRespiratoria: numeroOuNulo(body.frequenciaRespiratoria),
    frequenciaCardiaca: numeroOuNulo(body.frequenciaCardiaca),
    vigilia: booleano(body.vigilia),
    emesePosOperatorio: booleano(body.emesePosOperatorio),
    nebulizacaoResgate: booleano(body.nebulizacaoResgate),
    pontuacaoTotal: pontuacao(body.pontuacaoTotal),
    intervencao: textoOuNulo(body.intervencao),
    tempoControleSsvv: textoOuNulo(body.tempoControleSsvv),
  };
}

export async function listarAvaliacoes(req: Request, res: Response) {
  try {
    const nomePaciente = textoOuNulo(req.query.nomePaciente);
    const buscaExata = req.query.exato === "true";
    const pacienteId = numeroPositivoOuNulo(req.query.pacienteId);
    const avaliadorId = numeroPositivoOuNulo(req.query.avaliadorId);
    const avaliadorNome = textoOuNulo(req.query.avaliadorNome);
    const pontuacaoMin = numeroOuNulo(req.query.pontuacaoMin);
    const pontuacaoMax = numeroOuNulo(req.query.pontuacaoMax);
    const dataInicio = dataOuNulo(req.query.dataInicio);
    const dataFim = dataOuNulo(req.query.dataFim);
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
      avaliador,
      avaliadorId ?? undefined,
      avaliadorNome ?? undefined,
      pontuacaoMin ?? undefined,
      pontuacaoMax ?? undefined,
      dataInicio ?? undefined,
      dataFim ?? undefined
    );

    res.json(avaliacoes);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível listar as avaliações." });
  }
}

export async function cadastrarAvaliacao(req: Request, res: Response) {
  try {
    const dados = construirDadosAvaliacao(
      req.body,
      req.usuarioAutenticado?.id,
      req.usuarioAutenticado?.nome
    );

    const avaliacao = await criarAvaliacao(dados);

    await registrarAuditoria({
      usuarioId: req.usuarioAutenticado?.id,
      usuarioNome: req.usuarioAutenticado?.nome,
      acao: AcaoLogSistema.AVALIACAO_CRIADA,
      entidade: EntidadeLogSistema.AVALIACAO,
      entidadeId: avaliacao.id,
      descricao: `Avaliação criada para ${avaliacao.nomePaciente ?? "paciente sem nome"}.`,
      dadosDepois: avaliacao,
    });

    res.status(201).json(avaliacao);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível cadastrar a avaliação." });
  }
}

export async function atualizarAvaliacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const avaliacao = await buscarAvaliacaoPorId(id);

    if (!avaliacao) {
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    const dados = construirDadosAvaliacao(
      req.body,
      req.usuarioAutenticado?.id,
      req.usuarioAutenticado?.nome,
      false
    );

    const avaliacaoAtualizada = await atualizarAvaliacaoRepositorio(id, dados);

    if (!avaliacaoAtualizada) {
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    await registrarAuditoria({
      usuarioId: req.usuarioAutenticado?.id,
      usuarioNome: req.usuarioAutenticado?.nome,
      acao: AcaoLogSistema.AVALIACAO_EDITADA,
      entidade: EntidadeLogSistema.AVALIACAO,
      entidadeId: avaliacaoAtualizada.id,
      descricao: `Avaliação #${avaliacaoAtualizada.id} editada.`,
      dadosAntes: avaliacao,
      dadosDepois: avaliacaoAtualizada,
    });

    res.json(avaliacaoAtualizada);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível atualizar a avaliação." });
  }
}

export async function anexarArquivoAvaliacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const arquivo = req.file;

    if (!arquivo) {
      return res.status(400).json({ erro: "Nenhum arquivo foi enviado." });
    }

    const avaliacao = await buscarAvaliacaoPorId(id);

    if (!avaliacao) {
      await fs.promises.unlink(arquivo.path).catch(() => undefined);
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    if (avaliacao.anexos?.length >= 3) {
      await fs.promises.unlink(arquivo.path).catch(() => undefined);
      return res.status(400).json({
        erro: "São permitidos 3 arquivos por avaliação. Limite atingido",
      });
    }

    const anexoCriado = await criarAvaliacaoAnexo({
      avaliacaoId: id,
      caminho: arquivo.filename,
      nomeOriginal: arquivo.originalname,
    });

    const avaliacaoAtualizada = await buscarAvaliacaoPorId(id);

    if (!avaliacaoAtualizada) {
      return res.status(500).json({ erro: "Não foi possível anexar o arquivo." });
    }

    await registrarAuditoria({
      usuarioId: req.usuarioAutenticado?.id,
      usuarioNome: req.usuarioAutenticado?.nome,
      acao: AcaoLogSistema.ANEXO_ADICIONADO,
      entidade: EntidadeLogSistema.ANEXO,
      entidadeId: anexoCriado.id,
      descricao: `Anexo "${anexoCriado.nomeOriginal}" adicionado à avaliação #${id}.`,
      dadosDepois: anexoCriado,
    });

    res.json(avaliacaoAtualizada);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível anexar o arquivo." });
  }
}

export async function excluirAnexoAvaliacao(req: Request, res: Response) {
  try {
    const avaliacaoId = Number(req.params.id);
    const anexoIdParam = req.params.anexoId;

    if (!Number.isFinite(avaliacaoId) || avaliacaoId <= 0) {
      return res.status(400).json({ erro: "ID de avaliação inválido." });
    }

    const avaliacao = await buscarAvaliacaoPorId(avaliacaoId);

    if (!avaliacao) {
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    if (!anexoIdParam) {
      if (!avaliacao.anexoCaminho) {
        return res.status(404).json({ erro: "Anexo não encontrado." });
      }

      const caminhoArquivo = resolverCaminhoAnexo(avaliacao.anexoCaminho);
      if (fs.existsSync(caminhoArquivo)) {
        await fs.promises.unlink(caminhoArquivo).catch(() => undefined);
      }

      const avaliacaoAtualizada = await atualizarAvaliacaoRepositorio(avaliacaoId, {
        anexoCaminho: null,
        anexoNomeOriginal: null,
      });

      if (!avaliacaoAtualizada) {
        return res.status(500).json({ erro: "Não foi possível excluir o anexo." });
      }

      await registrarAuditoria({
        usuarioId: req.usuarioAutenticado?.id,
        usuarioNome: req.usuarioAutenticado?.nome,
        acao: AcaoLogSistema.ANEXO_EXCLUIDO,
        entidade: EntidadeLogSistema.ANEXO,
        entidadeId: avaliacaoId,
        descricao: `Anexo legado "${avaliacao.anexoNomeOriginal ?? avaliacao.anexoCaminho}" excluído da avaliação #${avaliacaoId}.`,
        dadosAntes: {
          caminho: avaliacao.anexoCaminho,
          nomeOriginal: avaliacao.anexoNomeOriginal,
        },
      });

      return res.json(avaliacaoAtualizada);
    }

    const anexoId = Number(anexoIdParam);

    if (!Number.isFinite(anexoId) || anexoId <= 0) {
      return res.status(400).json({ erro: "ID de anexo inválido." });
    }

    const anexo = await buscarAvaliacaoAnexoPorId(anexoId);

    if (!anexo || anexo.avaliacaoId !== avaliacaoId) {
      return res.status(404).json({ erro: "Anexo não encontrado." });
    }

    const caminhoArquivo = resolverCaminhoAnexo(anexo.caminho);
    if (fs.existsSync(caminhoArquivo)) {
      await fs.promises.unlink(caminhoArquivo).catch(() => undefined);
    }

    const removido = await removerAvaliacaoAnexo(anexoId);

    if (!removido) {
      return res.status(500).json({ erro: "Não foi possível excluir o anexo." });
    }

    const avaliacaoAtualizada = await buscarAvaliacaoPorId(avaliacaoId);

    if (!avaliacaoAtualizada) {
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    await registrarAuditoria({
      usuarioId: req.usuarioAutenticado?.id,
      usuarioNome: req.usuarioAutenticado?.nome,
      acao: AcaoLogSistema.ANEXO_EXCLUIDO,
      entidade: EntidadeLogSistema.ANEXO,
      entidadeId: anexo.id,
      descricao: `Anexo "${anexo.nomeOriginal}" excluído da avaliação #${avaliacaoId}.`,
      dadosAntes: anexo,
    });

    res.json(avaliacaoAtualizada);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível excluir o anexo." });
  }
}

export async function registrarSinaisVitaisAvaliacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const avaliacao = await buscarAvaliacaoPorId(id);

    if (!avaliacao) {
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    const condicaoGeral = condicaoGeralSsvvOuNula(req.body?.condicaoGeral);

    if (!condicaoGeral) {
      return res.status(400).json({ erro: "Condição geral inválida." });
    }

    const controle = await criarControleSinaisVitais({
      avaliacaoId: id,
      pacienteId: avaliacao.pacienteId,
      usuarioId: req.usuarioAutenticado?.id,
      usuarioNome: req.usuarioAutenticado?.nome,
      condicaoGeral,
      observacao: textoOuNulo(req.body?.observacao),
    });

    await registrarAuditoria({
      usuarioId: req.usuarioAutenticado?.id,
      usuarioNome: req.usuarioAutenticado?.nome,
      acao: AcaoLogSistema.SINAIS_VITAIS_REGISTRADOS,
      entidade: EntidadeLogSistema.SINAIS_VITAIS,
      entidadeId: controle.id,
      descricao: `Sinais vitais registrados para a avaliação #${id}.`,
      dadosDepois: controle,
    });

    const avaliacaoAtualizada = await buscarAvaliacaoPorId(id);

    if (!avaliacaoAtualizada) {
      return res.status(500).json({
        erro: "Não foi possível registrar os sinais vitais.",
      });
    }

    res.json(avaliacaoAtualizada);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      erro: "Não foi possível registrar os sinais vitais.",
    });
  }
}

export async function excluirAvaliacao(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const avaliacao = await buscarAvaliacaoPorId(id);
    const removida = await removerAvaliacao(id);

    if (!removida) {
      return res.status(404).json({ erro: "Avaliação não encontrada." });
    }

    await registrarAuditoria({
      usuarioId: req.usuarioAutenticado?.id,
      usuarioNome: req.usuarioAutenticado?.nome,
      acao: AcaoLogSistema.AVALIACAO_EXCLUIDA,
      entidade: EntidadeLogSistema.AVALIACAO,
      entidadeId: id,
      descricao: `Avaliação #${id} excluída.`,
      dadosAntes: avaliacao,
    });

    res.json({ mensagem: "Avaliação removida com sucesso." });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível remover a avaliação." });
  }
}
