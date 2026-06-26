export type CorpoCriarAvaliacao = {
  nomePaciente?: string;
  pacienteId?: number;
  avaliadorNome?: string;
  avaliadorId?: number;
  faixaEtaria?: string;
  leito?: string;
  diagnostico?: string;
  dih?: string;
  avaliacaoRespiratoria?: string;
  pontuacaoRespiratoria: number;
  avaliacaoCardiovascular?: string;
  pontuacaoCardiovascular: number;
  avaliacaoNeurologica?: string;
  pontuacaoNeurologica: number;
  frequenciaRespiratoria?: number;
  frequenciaCardiaca?: number;
  vigilia: boolean;
  emesePosOperatorio: boolean;
  nebulizacaoResgate: boolean;
  pontuacaoTotal: number;
  intervencao?: string;
  tempoControleSsvv?: string;
};

export type Avaliacao = CorpoCriarAvaliacao & {
  id: number;
  dataAvaliacao?: string | null;
  criadoEm: string;
  anexoCaminho?: string | null;
  anexoNomeOriginal?: string | null;
  anexos?: {
    id: number;
    caminho: string;
    nomeOriginal: string;
    criadoEm: string;
  }[];
  sinaisVitais?: {
    id: number;
    avaliacaoId: number;
    pacienteId?: number | null;
    usuarioId?: number | null;
    usuarioNome?: string | null;
    condicaoGeral: "SEM_ALTERACOES" | "ALTERACOES_OBSERVADAS";
    frequenciaCardiaca?: number | null;
    frequenciaRespiratoria?: number | null;
    temperatura?: number | null;
    saturacaoOxigenio?: number | null;
    pressaoArterial?: string | null;
    dor?: number | null;
    observacao?: string | null;
    registradoEm: string;
  }[];
};
