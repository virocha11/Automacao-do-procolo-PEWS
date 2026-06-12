export type LogSistema = {
  id: number;
  usuarioId?: number | null;
  usuarioNome?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: number | null;
  descricao: string;
  dadosAntes?: string | null;
  dadosDepois?: string | null;
  criadoEm: string;
};
