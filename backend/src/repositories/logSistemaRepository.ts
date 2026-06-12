import {
  AcaoLogSistema,
  EntidadeLogSistema,
  LogSistema,
} from "../entities/LogSistema";
import { AppDataSource } from "../config/database";

const repositorio = AppDataSource.getRepository(LogSistema);

export type DadosCriarLogSistema = {
  usuarioId?: number | null;
  usuarioNome?: string | null;
  acao: AcaoLogSistema;
  entidade: EntidadeLogSistema;
  entidadeId?: number | null;
  descricao: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
};

function serializarDados(dados: unknown) {
  if (dados === undefined || dados === null) {
    return null;
  }

  return JSON.stringify(dados);
}

export async function registrarLogSistema(dados: DadosCriarLogSistema) {
  const log = repositorio.create({
    usuarioId: dados.usuarioId ?? null,
    usuarioNome: dados.usuarioNome ?? null,
    acao: dados.acao,
    entidade: dados.entidade,
    entidadeId: dados.entidadeId ?? null,
    descricao: dados.descricao,
    dadosAntes: serializarDados(dados.dadosAntes),
    dadosDepois: serializarDados(dados.dadosDepois),
  });

  return repositorio.save(log);
}

export async function listarLogsSistema(): Promise<LogSistema[]> {
  return repositorio.find({
    order: { criadoEm: "DESC" },
    take: 300,
  });
}
