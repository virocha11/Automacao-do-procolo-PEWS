import { Tag, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  AlertOutlined,
} from "@ant-design/icons";

import type { Avaliacao } from "../types/avaliacao";

/* ------------------------------------------------------------------ */
/*  Lógica de notificações baseada na pontuação e intervalos do PEWS  */
/* ------------------------------------------------------------------ */

/** Retorna o intervalo em minutos para reavaliar o PEWS com base na pontuação. */
export function obterIntervaloPewsMinutos(pontuacao: number): number | null {
  if (pontuacao === 0) return 1440; // 24h — rotina
  if (pontuacao <= 2) return 60;
  if (pontuacao === 3) return 30;
  if (pontuacao <= 6) return 20;
  // 7+: imediata (0 min)
  return 0;
}

/** Formata um valor em minutos em um texto legível (ex: "4h30min" ou "45 minutos"). */
export function formatarTempo(minutos: number, resumido = false): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0) {
    return `${h}h${m > 0 ? `${m}min` : ""}`;
  }
  return resumido ? `${minutos} min` : `${minutos} minutos`;
}

/** Retorna o intervalo em minutos para verificação de sinais vitais. */
export function obterIntervaloSsvvMinutos(
  pontuacao: number,
  tempoControleSsvv?: string
): number | null {
  // Tenta extrair do campo salvo; caso contrário, infere da pontuação.
  const texto = (tempoControleSsvv ?? "").toLowerCase();

  if (texto.includes("contínua") || texto.includes("continua")) return 0;
  if (texto.includes("1/1")) return 60;
  if (texto.includes("2/2")) return 120;
  if (texto.includes("4/4")) return 240;
  if (texto.includes("6/6")) return 360;

  // Fallback pela pontuação
  if (pontuacao >= 7) return 0; // contínuo
  if (pontuacao >= 4) return 60; // 1/1h
  if (pontuacao === 3) return 120; // 2/2h
  if (pontuacao >= 1) return 240; // 4/4h
  return 360; // 6/6h — rotina (pontuação 0)
}

/* ------------------------------------------------------------------ */
/*  Tipos                                                             */
/* ------------------------------------------------------------------ */

export type TipoNotificacao =
  | "atrasado"
  | "urgente"
  | "proximo"
  | "emDia"
  | "continuo";

export type StatusNotificacao = {
  tipo: TipoNotificacao;
  tipoPews: TipoNotificacao;
  tipoSsvv: TipoNotificacao;
  textoPews: string;
  textoSsvv: string;
  tooltipPews: string;
  tooltipSsvv: string;
};

/* ------------------------------------------------------------------ */
/*  Cálculo do status de notificação                                  */
/* ------------------------------------------------------------------ */

export function calcularNotificacao(
  avaliacao: Avaliacao,
  agora: Date
): StatusNotificacao {
  const criadoEm = new Date(avaliacao.criadoEm);
  const pontuacao = avaliacao.pontuacaoTotal;

  if (Number.isNaN(criadoEm.getTime())) {
    return {
      tipo: "emDia" as const,
      tipoPews: "emDia" as const,
      tipoSsvv: "emDia" as const,
      textoPews: "-",
      textoSsvv: "-",
      tooltipPews: "",
      tooltipSsvv: "",
    };
  }

  const decorrido = Math.floor(
    (agora.getTime() - criadoEm.getTime()) / 60000
  );

  // --- PEWS ---
  const intervaloPews = obterIntervaloPewsMinutos(pontuacao);
  let textoPews: string;
  let tooltipPews: string;
  let tipoPews: TipoNotificacao;

  if (intervaloPews === 0) {
    textoPews = "Reavaliar PEWS AGORA";
    tooltipPews = "Pontuação ≥ 7 — reavaliação imediata por segundo avaliador";
    tipoPews = "urgente";
  } else if (intervaloPews !== null) {
    const restantePews = intervaloPews - decorrido;

    if (restantePews <= 0) {
      const atraso = Math.abs(restantePews);
      textoPews = `PEWS atrasado ${formatarTempo(atraso, true)}`;
      tooltipPews = `O PEWS deveria ter sido reavaliado há ${formatarTempo(atraso, false)}`;
      tipoPews = "atrasado";
    } else {
      textoPews = `Avaliar PEWS em ${formatarTempo(restantePews, true)}`;
      tooltipPews = `Reavaliação do PEWS em ${formatarTempo(restantePews, false)}`;
      if (restantePews <= 10) {
        tipoPews = "urgente";
      } else if (restantePews <= 30) {
        tipoPews = "proximo";
      } else {
        tipoPews = "emDia";
      }
    }
  } else {
    textoPews = "-";
    tooltipPews = "";
    tipoPews = "emDia";
  }

  // --- Sinais Vitais ---
  const intervaloSsvv = obterIntervaloSsvvMinutos(
    pontuacao,
    avaliacao.tempoControleSsvv
  );
  let textoSsvv: string;
  let tooltipSsvv: string;
  let tipoSsvv: TipoNotificacao;

  if (intervaloSsvv === 0) {
    textoSsvv = "Monitorização contínua";
    tooltipSsvv = "Pontuação ≥ 7 — monitorização contínua dos sinais vitais";
    tipoSsvv = "continuo";
  } else if (intervaloSsvv !== null) {
    // Quantas verificações deveriam ter ocorrido desde a avaliação
    const ciclos = Math.floor(decorrido / intervaloSsvv);
    const proximoEm = (ciclos + 1) * intervaloSsvv - decorrido;

    if (proximoEm <= 0) {
      textoSsvv = "Verificar Sinais Vitais";
      tooltipSsvv = `Verificação de sinais vitais atrasada (a cada ${formatarTempo(intervaloSsvv, false)})`;
      tipoSsvv = "atrasado";
    } else {
      textoSsvv = `Sinais Vitais em ${formatarTempo(proximoEm, true)}`;
      tooltipSsvv = `Próxima verificação de sinais vitais em ${formatarTempo(proximoEm, false)}`;
      if (proximoEm <= 15) {
        tipoSsvv = "urgente";
      } else if (proximoEm <= 30) {
        tipoSsvv = "proximo";
      } else {
        tipoSsvv = "emDia";
      }
    }
  } else {
    textoSsvv = "-";
    tooltipSsvv = "";
    tipoSsvv = "emDia";
  }

  // O tipo geral é o mais severo entre PEWS e SSVV
  const prioridade: TipoNotificacao[] = [
    "atrasado",
    "urgente",
    "continuo",
    "proximo",
    "emDia",
  ];

  const tipo =
    prioridade.indexOf(tipoPews) <= prioridade.indexOf(tipoSsvv)
      ? tipoPews
      : tipoSsvv;

  return {
    tipo,
    tipoPews,
    tipoSsvv,
    textoPews,
    textoSsvv,
    tooltipPews,
    tooltipSsvv,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers visuais (cores, ícones, componente de célula)              */
/* ------------------------------------------------------------------ */

export function tagColorDoTipo(tipo: TipoNotificacao) {
  switch (tipo) {
    case "atrasado":
      return "red";
    case "urgente":
      return "orange";
    case "continuo":
      return "blue";
    case "proximo":
      return "gold";
    case "emDia":
      return "green";
  }
}

export function iconeDoTipo(tipo: TipoNotificacao) {
  switch (tipo) {
    case "atrasado":
      return <ExclamationCircleOutlined />;
    case "urgente":
      return <WarningOutlined />;
    case "continuo":
      return <AlertOutlined />;
    case "proximo":
      return <ClockCircleOutlined />;
    case "emDia":
      return <CheckCircleOutlined />;
  }
}

/* ------------------------------------------------------------------ */
/*  Componente reutilizável para a célula de notificação               */
/* ------------------------------------------------------------------ */

type PropsCelulaNotificacao = {
  avaliacao: Avaliacao;
  agora: Date;
};

/**
 * Renderiza as duas tags de notificação (PEWS + Sinais Vitais)
 * para uma avaliação. Pode ser usado em qualquer tabela ou lista.
 */
export function CelulaNotificacao({ avaliacao, agora }: PropsCelulaNotificacao) {
  const status = calcularNotificacao(avaliacao, agora);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        alignItems: "center",
      }}
    >
      <Tooltip title={status.tooltipPews}>
        <Tag
          icon={iconeDoTipo(status.tipoPews)}
          color={tagColorDoTipo(status.tipoPews)}
          style={{
            fontSize: 12,
            padding: "2px 8px",
            margin: 0,
            fontWeight: 600,
            cursor: "default",
          }}
        >
          {status.textoPews}
        </Tag>
      </Tooltip>

      <Tooltip title={status.tooltipSsvv}>
        <Tag
          icon={iconeDoTipo(status.tipoSsvv)}
          color={tagColorDoTipo(status.tipoSsvv)}
          style={{
            fontSize: 11,
            padding: "1px 6px",
            margin: 0,
            cursor: "default",
          }}
        >
          {status.textoSsvv}
        </Tag>
      </Tooltip>
    </div>
  );
}
