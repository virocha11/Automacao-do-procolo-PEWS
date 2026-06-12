import { Brackets } from "typeorm";
import { AppDataSource } from "../config/database";
import { Avaliacao } from "../entities/Avaliacao";
import { AvaliacaoAnexo } from "../entities/AvaliacaoAnexo";

const repositorio = AppDataSource.getRepository(Avaliacao);
const repositorioAnexo = AppDataSource.getRepository(AvaliacaoAnexo);

export type DadosCriarAvaliacao = {
  nomePaciente: string | null;
  pacienteId: number | null;
  avaliadorNome: string | null;
  avaliadorId: number | null;
  faixaEtaria: string | null;
  leito: string | null;
  diagnostico: string | null;
  dih: string | null;
  dataAvaliacao: Date | null;
  avaliacaoRespiratoria: string | null;
  pontuacaoRespiratoria: number;
  avaliacaoCardiovascular: string | null;
  pontuacaoCardiovascular: number;
  avaliacaoNeurologica: string | null;
  pontuacaoNeurologica: number;
  frequenciaRespiratoria: number | null;
  frequenciaCardiaca: number | null;
  vigilia: boolean;
  emesePosOperatorio: boolean;
  nebulizacaoResgate: boolean;
  pontuacaoTotal: number;
  intervencao: string | null;
  tempoControleSsvv: string | null;
  anexoCaminho?: string | null;
  anexoNomeOriginal?: string | null;
};

export type DadosCriarAvaliacaoAnexo = {
  avaliacaoId: number;
  caminho: string;
  nomeOriginal: string;
};

export type DadosAtualizarAvaliacao = Partial<DadosCriarAvaliacao>;

export async function criarAvaliacao(
  dados: DadosCriarAvaliacao
): Promise<Avaliacao> {
  const nova = repositorio.create(dados);

  return repositorio.save(nova);
}

export async function buscarAvaliacaoPorId(
  id: number
): Promise<Avaliacao | null> {
  return repositorio.findOne({
    where: { id },
    relations: ["anexos", "sinaisVitais"],
  });
}

export async function criarAvaliacaoAnexo(
  dados: DadosCriarAvaliacaoAnexo
) {
  const novoAnexo = repositorioAnexo.create(dados);
  return repositorioAnexo.save(novoAnexo);
}

export async function buscarAvaliacaoAnexoPorId(
  id: number
): Promise<AvaliacaoAnexo | null> {
  return repositorioAnexo.findOne({ where: { id } });
}

export async function buscarAvaliacaoAnexoPorCaminho(
  caminho: string
): Promise<AvaliacaoAnexo | null> {
  return repositorioAnexo.findOne({ where: { caminho } });
}

export async function buscarAvaliacaoPorCaminho(
  caminho: string
): Promise<Avaliacao | null> {
  return repositorio.findOne({ where: { anexoCaminho: caminho } });
}

export async function removerAvaliacaoAnexo(id: number): Promise<boolean> {
  const resultado = await repositorioAnexo.delete(id);
  return !!resultado.affected && resultado.affected > 0;
}

export async function atualizarAvaliacao(
  id: number,
  dados: DadosAtualizarAvaliacao
): Promise<Avaliacao | null> {
  await repositorio.update(id, dados);
  return repositorio.findOne({
    where: { id },
    relations: ["anexos", "sinaisVitais"],
  });
}

export async function buscarTodasAvaliacoes(
  nomePaciente?: string,
  buscaExata = false,
  pacienteId?: number,
  avaliador?: { id: number; nome: string },
  avaliadorId?: number,
  avaliadorNome?: string,
  pontuacaoMin?: number,
  pontuacaoMax?: number,
  dataInicio?: Date,
  dataFim?: Date
): Promise<Avaliacao[]> {
  const consulta = repositorio
    .createQueryBuilder("avaliacao")
    .leftJoinAndSelect("avaliacao.anexos", "anexo")
    .leftJoinAndSelect("avaliacao.sinaisVitais", "sinalVital")
    .orderBy("avaliacao.criadoEm", "DESC");

  if (pacienteId) {
    consulta.andWhere("avaliacao.pacienteId = :pacienteId", { pacienteId });
  }

  if (nomePaciente) {
    consulta.andWhere(
      buscaExata
        ? "avaliacao.nomePaciente = :nomePaciente"
        : "avaliacao.nomePaciente LIKE :nomePaciente",
      { nomePaciente: buscaExata ? nomePaciente : `${nomePaciente}%` }
    );
  }

  if (avaliador) {
    consulta.andWhere(
      new Brackets((subconsulta) => {
        subconsulta
          .where("avaliacao.avaliadorId = :avaliadorId", {
            avaliadorId: avaliador.id,
          })
          .orWhere(
            "avaliacao.avaliadorId IS NULL AND avaliacao.avaliadorNome = :avaliadorNome",
            { avaliadorNome: avaliador.nome }
          );
      })
    );
  }

  if (avaliadorId) {
    consulta.andWhere("avaliacao.avaliadorId = :avaliadorId", {
      avaliadorId,
    });
  }

  if (avaliadorNome) {
    consulta.andWhere("avaliacao.avaliadorNome LIKE :avaliadorNome", {
      avaliadorNome: `${avaliadorNome}%`,
    });
  }

  if (pontuacaoMin !== undefined) {
    consulta.andWhere("avaliacao.pontuacaoTotal >= :pontuacaoMin", {
      pontuacaoMin,
    });
  }

  if (pontuacaoMax !== undefined) {
    consulta.andWhere("avaliacao.pontuacaoTotal <= :pontuacaoMax", {
      pontuacaoMax,
    });
  }

  if (dataInicio) {
    consulta.andWhere("avaliacao.criadoEm >= :dataInicio", {
      dataInicio,
    });
  }

  if (dataFim) {
    consulta.andWhere("avaliacao.criadoEm <= :dataFim", {
      dataFim,
    });
  }

  return consulta.getMany();
}

export async function removerAvaliacao(id: number): Promise<boolean> {
  const resultado = await repositorio.delete(id);

  return !!resultado.affected && resultado.affected > 0;
}
