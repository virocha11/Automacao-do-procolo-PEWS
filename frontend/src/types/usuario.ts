export type Usuario = {
  id: number;
  nome: string;
  email: string;
  funcao: number;
  dataNascimento?: string | null;
  celular?: string | null;
};

export type RespostaLogin = {
  mensagem: string;
  token: string;
  usuario: Usuario;
};
