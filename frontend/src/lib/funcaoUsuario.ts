export const CODIGO_FUNCAO_ADMINISTRADOR = 1;
export const CODIGO_FUNCAO_ENFERMEIRO = 2;
export const CODIGO_FUNCAO_MEDICO = 3;

/** Texto amigável para o código numérico vindo do backend */
export function nomeDaFuncao(codigo: number): string {
  switch (codigo) {
    case 1:
      return "Administrador";
    case 2:
      return "Enfermeiro";
    case 3:
      return "Médico";
    default:
      return "Usuário";
  }
}
