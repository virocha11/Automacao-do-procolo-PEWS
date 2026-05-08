import { Like } from "typeorm";
import { AppDataSource } from "../config/database";
import { Avaliacao } from "../entities/Avaliacao";

const repositorio = AppDataSource.getRepository(Avaliacao);

export type DadosCriarAvaliacao = {
  nomePaciente: string | null;
  avaliadorNome: string | null;
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
  nomePaciente?: string
): Promise<Avaliacao[]> {
  return repositorio.find({
    where: nomePaciente
      ? {
          nomePaciente: Like(`%${nomePaciente}%`),
        }
      : undefined,
    order: {
      criadoEm: "DESC",
    },
  });
}
