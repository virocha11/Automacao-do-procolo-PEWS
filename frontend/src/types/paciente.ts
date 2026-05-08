export type Paciente = {
    id: number;
    nome: string;
    dataNascimento: string | null;
    nomeResponsavelLegal: string;
    telefoneResponsavelLegal: string | null;
    endereco: string | null;
  };