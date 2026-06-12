import { AppDataSource } from "../config/database";
import {
  CondicaoGeralSinaisVitais,
  ControleSinaisVitais,
} from "../entities/ControleSinaisVitais";

const repositorio = AppDataSource.getRepository(ControleSinaisVitais);

export type DadosCriarControleSinaisVitais = {
  avaliacaoId: number;
  pacienteId?: number | null;
  usuarioId?: number | null;
  usuarioNome?: string | null;
  condicaoGeral: CondicaoGeralSinaisVitais;
  observacao?: string | null;
};

export async function criarControleSinaisVitais(
  dados: DadosCriarControleSinaisVitais
) {
  const controle = repositorio.create({
    avaliacaoId: dados.avaliacaoId,
    pacienteId: dados.pacienteId ?? null,
    usuarioId: dados.usuarioId ?? null,
    usuarioNome: dados.usuarioNome ?? null,
    condicaoGeral: dados.condicaoGeral,
    observacao: dados.observacao ?? null,
  });

  return repositorio.save(controle);
}
