import { Brackets } from "typeorm";
import { AppDataSource } from "../config/database";
import { Avaliacao } from "../entities/Avaliacao";

const repositorio = AppDataSource.getRepository(Avaliacao);

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
};

export async function criarAvaliacao(
  dados: DadosCriarAvaliacao
): Promise<Avaliacao> {
  const nova = repositorio.create(dados);

  return repositorio.save(nova);
}

export async function buscarTodasAvaliacoes(
  nomePaciente?: string,
  buscaExata = false,
  pacienteId?: number,
  avaliador?: { id: number; nome: string }
): Promise<Avaliacao[]> {
  const consulta = repositorio
    .createQueryBuilder("avaliacao")
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

  return consulta.getMany();
}

export async function removerAvaliacao(id: number): Promise<boolean> {
  const resultado = await repositorio.delete(id);

  return !!resultado.affected && resultado.affected > 0;
}
