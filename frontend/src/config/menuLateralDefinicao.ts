import type { MenuProps } from "antd";
import { CODIGO_FUNCAO_ADMINISTRADOR } from "../lib/funcaoUsuario";

export type NoMenuLateral =
  | {
      tipo: "item";
      chave: string;
      rota: string;
      rotulo: string;
      podeVer: (funcaoUsuario: number) => boolean;
    }
  | {
      tipo: "submenu";
      chave: string;
      rotulo: string;
      podeVer: (funcaoUsuario: number) => boolean;
      filhos: NoMenuLateral[];
    };

export const arvoreMenuLateral: NoMenuLateral[] = [
  {
    tipo: "submenu",
    chave: "cadastros",
    rotulo: "Cadastros",
    podeVer: (f) => f === CODIGO_FUNCAO_ADMINISTRADOR,
    filhos: [
      {
        tipo: "item",
        chave: "cadastro-usuarios",
        rota: "/cadastros/usuarios",
        rotulo: "Usuário",
        podeVer: (f) => f === CODIGO_FUNCAO_ADMINISTRADOR,
      },
    ],
  },
];

export function filtrarMenuPorFuncao(
  nos: NoMenuLateral[],
  funcaoUsuario: number
): NoMenuLateral[] {
  const saida: NoMenuLateral[] = [];
  for (const no of nos) {
    if (!no.podeVer(funcaoUsuario)) {
      continue;
    }
    if (no.tipo === "item") {
      saida.push(no);
    } else {
      const filhos = filtrarMenuPorFuncao(no.filhos, funcaoUsuario);
      if (filhos.length > 0) {
        saida.push({ ...no, filhos });
      }
    }
  }
  return saida;
}

function paraItensAntd(nos: NoMenuLateral[]): MenuProps["items"] {
  return nos.map((no) => {
    if (no.tipo === "item") {
      return { key: no.rota, label: no.rotulo };
    }
    return {
      key: `submenu:${no.chave}`,
      label: no.rotulo,
      children: paraItensAntd(no.filhos),
    };
  });
}

export function itensMenuAntdParaUsuario(
  funcaoUsuario: number
): MenuProps["items"] {
  return paraItensAntd(filtrarMenuPorFuncao(arvoreMenuLateral, funcaoUsuario));
}

export function usuarioPossuiItensNoMenuLateral(funcaoUsuario: number): boolean {
  return filtrarMenuPorFuncao(arvoreMenuLateral, funcaoUsuario).length > 0;
}
