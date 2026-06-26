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
  frequenciaCardiaca?: number | null;
  frequenciaRespiratoria?: number | null;
  temperatura?: number | null;
  saturacaoOxigenio?: number | null;
  pressaoArterial?: string | null;
  dor?: number | null;
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
    frequenciaCardiaca: dados.frequenciaCardiaca ?? null,
    frequenciaRespiratoria: dados.frequenciaRespiratoria ?? null,
    temperatura: dados.temperatura ?? null,
    saturacaoOxigenio: dados.saturacaoOxigenio ?? null,
    pressaoArterial: dados.pressaoArterial ?? null,
    dor: dados.dor ?? null,
    observacao: dados.observacao ?? null,
  });

  return repositorio.save(controle);
}
