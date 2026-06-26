import {
  App,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Popover,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import datePickerPtBR from "antd/es/date-picker/locale/pt_BR";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  apiListarAvaliacoes,
  apiRegistrarSinaisVitaisAvaliacao,
} from "../api/avaliacaoServico";
import { apiListarUsuarios } from "../api/usuariosServico";
import { useSessao } from "../contexts/SessaoContext";
import {
  imprimirAvaliacao,
  imprimirRelatorioAvaliacoes,
} from "../lib/impressaoAvaliacao";
import type { Avaliacao } from "../types/avaliacao";
import type { Usuario } from "../types/usuario";

const verde = "#1f6b3a";
const verdeClaro = "#88a98f";
const { RangePicker } = DatePicker;

type PeriodoFiltro = [Dayjs | null, Dayjs | null] | null;
type CategoriaPontuacao = "baixo" | "atencao" | "alto";
type CondicaoGeralSsvv = "SEM_ALTERACOES" | "ALTERACOES_OBSERVADAS";

type FiltrosHistorico = {
  nomePaciente: string;
  avaliadorId: number | null;
  pontuacao: CategoriaPontuacao | null;
  periodo: PeriodoFiltro;
};

const filtrosIniciais: FiltrosHistorico = {
  nomePaciente: "",
  avaliadorId: null,
  pontuacao: null,
  periodo: null,
};

function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function obterIntervaloPontuacao(categoria: CategoriaPontuacao | null) {
  switch (categoria) {
    case "baixo":
      return { pontuacaoMin: 0, pontuacaoMax: 2 };
    case "atencao":
      return { pontuacaoMin: 3, pontuacaoMax: 4 };
    case "alto":
      return { pontuacaoMin: 5, pontuacaoMax: undefined };
    default:
      return { pontuacaoMin: undefined, pontuacaoMax: undefined };
  }
}

function prepararPeriodo(periodo: PeriodoFiltro) {
  if (!periodo?.[0] || !periodo[1]) {
    return { dataInicio: undefined, dataFim: undefined };
  }

  return {
    dataInicio: periodo[0].startOf("day").toISOString(),
    dataFim: periodo[1].endOf("day").toISOString(),
  };
}

function intervaloReavaliacaoMinutos(pontuacao: number) {
  if (pontuacao >= 7) {
    return 0;
  }

  if (pontuacao >= 5) {
    return 20;
  }

  if (pontuacao === 4) {
    return 30;
  }

  if (pontuacao === 3) {
    return 60;
  }

  return null;
}

function intervaloSinaisVitaisMinutos(pontuacao: number) {
  if (pontuacao >= 7) {
    return 0;
  }

  if (pontuacao >= 5) {
    return 20;
  }

  if (pontuacao === 4) {
    return 30;
  }

  if (pontuacao === 3) {
    return 60;
  }

  return 360;
}

function formatarDuracaoMinutos(minutos: number) {
  const total = Math.max(0, Math.ceil(minutos));
  const horas = Math.floor(total / 60);
  const restoMinutos = total % 60;

  if (horas > 0 && restoMinutos > 0) {
    return `${horas}h ${restoMinutos}min`;
  }

  if (horas > 0) {
    return `${horas}h`;
  }

  return `${total}min`;
}

function obterStatusReavaliacao(avaliacao: Avaliacao, agora: Date) {
  const intervalo = intervaloReavaliacaoMinutos(avaliacao.pontuacaoTotal);
  const dataAvaliacao = new Date(avaliacao.criadoEm);

  if (!intervalo && intervalo !== 0) {
    return {
      cor: "success" as const,
      icone: <CheckCircleOutlined />,
      texto: "Em dia",
      tagTexto: "PEWS em dia",
      nivel: "ok" as const,
      titulo: "Reavaliação PEWS",
      detalhe: "Sem lembrete automático para a pontuação atual.",
      prazo: "-",
    };
  }

  if (Number.isNaN(dataAvaliacao.getTime())) {
    return {
      cor: "default" as const,
      icone: <ClockCircleOutlined />,
      texto: "Sem data",
      tagTexto: "PEWS sem data",
      nivel: "ok" as const,
      titulo: "Reavaliação PEWS",
      detalhe: "Não foi possível calcular o prazo desta avaliação.",
      prazo: "-",
    };
  }

  const prazo = new Date(dataAvaliacao.getTime() + intervalo * 60_000);
  const minutosRestantes = (prazo.getTime() - agora.getTime()) / 60_000;

  if (intervalo === 0 && minutosRestantes >= -1) {
    return {
      cor: "error" as const,
      icone: <ExclamationCircleOutlined />,
      texto: "Imediata",
      tagTexto: "PEWS imediato",
      nivel: "error" as const,
      titulo: "Reavaliação PEWS",
      detalhe: "A pontuação indica reavaliação imediata.",
      prazo: formatarDataHora(prazo.toISOString()),
    };
  }

  if (minutosRestantes <= 0) {
    return {
      cor: "error" as const,
      icone: <ExclamationCircleOutlined />,
      texto: "Atrasado",
      tagTexto: `PEWS atrasado ${formatarDuracaoMinutos(
        Math.abs(minutosRestantes)
      )}`,
      nivel: "error" as const,
      titulo: "Reavaliação PEWS",
      detalhe: `Reavaliação atrasada há ${formatarDuracaoMinutos(
        Math.abs(minutosRestantes)
      )}.`,
      prazo: formatarDataHora(prazo.toISOString()),
    };
  }

  return {
    cor: "warning" as const,
    icone: <ClockCircleOutlined />,
    texto: "Atenção",
    tagTexto: `PEWS em ${formatarDuracaoMinutos(minutosRestantes)}`,
    nivel: "warning" as const,
    titulo: "Reavaliação PEWS",
    detalhe: `Reavaliar em ${formatarDuracaoMinutos(minutosRestantes)}.`,
    prazo: formatarDataHora(prazo.toISOString()),
  };
}

function obterUltimoSinalVital(avaliacao: Avaliacao) {
  return [...(avaliacao.sinaisVitais ?? [])].sort((a, b) => {
    return (
      new Date(b.registradoEm).getTime() -
      new Date(a.registradoEm).getTime()
    );
  })[0];
}

function formatarFrequenciaSsvv(minutos: number) {
  if (minutos === 0) {
    return "Imediato/Contínuo";
  }
  if (minutos < 60) {
    return `A cada ${minutos} minutos`;
  }
  const horas = minutos / 60;
  return `A cada ${horas} ${horas === 1 ? "hora" : "horas"}`;
}

function obterStatusSinaisVitais(avaliacao: Avaliacao, agora: Date) {
  const intervalo = intervaloSinaisVitaisMinutos(avaliacao.pontuacaoTotal);
  const frequencia = formatarFrequenciaSsvv(intervalo);
  const ultimoSinalVital = obterUltimoSinalVital(avaliacao);
  const dataBase = ultimoSinalVital?.registradoEm ?? avaliacao.criadoEm;
  const dataReferencia = new Date(dataBase);

  const realizado = !!ultimoSinalVital;

  if (Number.isNaN(dataReferencia.getTime())) {
    return {
      cor: "default" as const,
      icone: <ClockCircleOutlined />,
      tagTexto: "SSVV sem data",
      nivel: "ok" as const,
      detalhe: "Não foi possível calcular o prazo dos sinais vitais.",
      prazo: "-",
      ultimoRegistro: "Nenhuma aferição registrada.",
      condicaoGeral: "-",
      observacao: null,
      frequencia: "Não disponível",
      procedimentoStatus: "Desconhecido",
      realizado: false,
    };
  }

  const prazo = new Date(dataReferencia.getTime() + intervalo * 60_000);
  const minutosRestantes = (prazo.getTime() - agora.getTime()) / 60_000;
  const ultimoRegistro = ultimoSinalVital
    ? `Último SSVV: ${formatarDataHora(ultimoSinalVital.registradoEm)} por ${
        ultimoSinalVital.usuarioNome ?? "usuário não identificado"
      }.`
    : "Nenhuma aferição registrada.";

  if (intervalo === 0 && minutosRestantes >= -1) {
    return {
      cor: "error" as const,
      icone: <ExclamationCircleOutlined />,
      tagTexto: "SSVV imediato",
      nivel: "error" as const,
      detalhe: "Sinais vitais devem ser aferidos imediatamente.",
      prazo: formatarDataHora(prazo.toISOString()),
      ultimoRegistro,
      condicaoGeral: formatarCondicaoGeralSsvv(ultimoSinalVital?.condicaoGeral),
      observacao: ultimoSinalVital?.observacao ?? null,
      frequencia,
      procedimentoStatus: realizado ? "Realizado (Pendente imediato)" : "Não realizado (Pendente imediato)",
      realizado,
    };
  }

  if (minutosRestantes <= 0) {
    return {
      cor: "error" as const,
      icone: <ExclamationCircleOutlined />,
      tagTexto: `SSVV atrasado ${formatarDuracaoMinutos(
        Math.abs(minutosRestantes)
      )}`,
      nivel: "error" as const,
      detalhe: `Sinais vitais atrasados ${formatarDuracaoMinutos(
        Math.abs(minutosRestantes)
      )}.`,
      prazo: formatarDataHora(prazo.toISOString()),
      ultimoRegistro,
      condicaoGeral: formatarCondicaoGeralSsvv(ultimoSinalVital?.condicaoGeral),
      observacao: ultimoSinalVital?.observacao ?? null,
      frequencia,
      procedimentoStatus: realizado ? "Realizado (Atrasado)" : "Não realizado (Atrasado)",
      realizado,
    };
  }

  return {
    cor: "warning" as const,
    icone: <ClockCircleOutlined />,
    tagTexto: `SSVV em ${formatarDuracaoMinutos(minutosRestantes)}`,
    nivel: "warning" as const,
    detalhe: `Sinais vitais em ${formatarDuracaoMinutos(minutosRestantes)}.`,
    prazo: formatarDataHora(prazo.toISOString()),
    ultimoRegistro,
    condicaoGeral: formatarCondicaoGeralSsvv(ultimoSinalVital?.condicaoGeral),
    observacao: ultimoSinalVital?.observacao ?? null,
    frequencia,
    procedimentoStatus: "Realizado (Em dia)",
    realizado,
  };
}

function formatarCondicaoGeralSsvv(
  condicao?: "SEM_ALTERACOES" | "ALTERACOES_OBSERVADAS" | null
) {
  if (condicao === "SEM_ALTERACOES") {
    return "Sem alterações";
  }

  if (condicao === "ALTERACOES_OBSERVADAS") {
    return "Alterações observadas";
  }

  return "-";
}

type PropsPaginaInicio = {
  apenasMinhas?: boolean;
};

export function PaginaInicio({ apenasMinhas = false }: PropsPaginaInicio) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { token } = useSessao();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosHistorico>(filtrosIniciais);
  const [agora, setAgora] = useState(() => new Date());
  const [registrandoSsvvId, setRegistrandoSsvvId] = useState<number | null>(
    null
  );
  const [modalSsvvAvaliacaoId, setModalSsvvAvaliacaoId] = useState<
    number | null
  >(null);
  const [condicaoGeralSsvv, setCondicaoGeralSsvv] =
    useState<CondicaoGeralSsvv>("SEM_ALTERACOES");
  const [fcSsvv, setFcSsvv] = useState<number | "">("");
  const [frSsvv, setFrSsvv] = useState<number | "">("");
  const [tempSsvv, setTempSsvv] = useState<number | "">("");
  const [spo2Ssvv, setSpo2Ssvv] = useState<number | "">("");
  const [paSsvv, setPaSsvv] = useState("");
  const [dorSsvv, setDorSsvv] = useState<number | "">("");
  const [observacaoSsvv, setObservacaoSsvv] = useState("");

  const opcoesAvaliador = useMemo(() => {
    return [...usuarios]
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .map((usuario) => ({ label: usuario.nome, value: usuario.id }));
  }, [usuarios]);

  const opcoesPontuacao = [
    { label: "0-2 baixo risco", value: "baixo" },
    { label: "3-4 atenção", value: "atencao" },
    { label: "5+ alto risco", value: "alto" },
  ];

  const carregarAvaliacoes = useCallback(
    async (filtrosBusca: FiltrosHistorico = filtrosIniciais) => {
      if (!token) {
        return;
      }

      setCarregando(true);

      try {
        const { pontuacaoMin, pontuacaoMax } = obterIntervaloPontuacao(
          filtrosBusca.pontuacao
        );
        const { dataInicio, dataFim } = prepararPeriodo(filtrosBusca.periodo);

        const dados = await apiListarAvaliacoes(
          token,
          filtrosBusca.nomePaciente,
          {
            minhas: apenasMinhas,
            avaliadorId: filtrosBusca.avaliadorId ?? undefined,
            pontuacaoMin,
            pontuacaoMax,
            dataInicio,
            dataFim,
          }
        );

        setAvaliacoes(dados);
      } catch (e) {
        message.error(
          e instanceof Error
            ? e.message
            : "Não foi possível listar as avaliações."
        );
      } finally {
        setCarregando(false);
      }
    },
    [apenasMinhas, message, token]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const temporizadorCarregamento = window.setTimeout(() => {
      void Promise.all([
        carregarAvaliacoes(),
        apiListarUsuarios(token)
          .then(setUsuarios)
          .catch((e) => {
            message.error(
              e instanceof Error
                ? e.message
                : "Não foi possível carregar os avaliadores."
            );
          }),
      ]);
    }, 0);

    return () => window.clearTimeout(temporizadorCarregamento);
  }, [carregarAvaliacoes, message, token]);

  useEffect(() => {
    const temporizador = window.setInterval(() => {
      setAgora(new Date());
    }, 60_000);

    return () => window.clearInterval(temporizador);
  }, []);

  function aplicarFiltros() {
    void carregarAvaliacoes(filtros);
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais);
    void carregarAvaliacoes(filtrosIniciais);
  }

  function imprimirRelatorio() {
    if (avaliacoes.length === 0) {
      message.warning("Não há avaliações para imprimir.");
      return;
    }

    imprimirRelatorioAvaliacoes(avaliacoes);
  }

  function abrirModalSsvv(avaliacaoId: number) {
    setModalSsvvAvaliacaoId(avaliacaoId);
    setCondicaoGeralSsvv("SEM_ALTERACOES");
    setFcSsvv("");
    setFrSsvv("");
    setTempSsvv("");
    setSpo2Ssvv("");
    setPaSsvv("");
    setDorSsvv("");
    setObservacaoSsvv("");
  }

  async function registrarSinaisVitais() {
    if (!token) {
      return;
    }

    if (!modalSsvvAvaliacaoId) {
      return;
    }

    try {
      setRegistrandoSsvvId(modalSsvvAvaliacaoId);
      const avaliacaoAtualizada = await apiRegistrarSinaisVitaisAvaliacao(
        token,
        modalSsvvAvaliacaoId,
        {
          condicaoGeral: condicaoGeralSsvv,
          frequenciaCardiaca: fcSsvv === "" ? null : fcSsvv,
          frequenciaRespiratoria: frSsvv === "" ? null : frSsvv,
          temperatura: tempSsvv === "" ? null : tempSsvv,
          saturacaoOxigenio: spo2Ssvv === "" ? null : spo2Ssvv,
          pressaoArterial: paSsvv.trim() || null,
          dor: dorSsvv === "" ? null : dorSsvv,
          observacao: observacaoSsvv.trim() || null,
        }
      );
      setAvaliacoes((avaliacoesAtuais) =>
        avaliacoesAtuais.map((avaliacao) =>
          avaliacao.id === avaliacaoAtualizada.id
            ? avaliacaoAtualizada
            : avaliacao
        )
      );
      setAgora(new Date());
      setModalSsvvAvaliacaoId(null);
      message.success("Sinais vitais registrados.");
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : "Não foi possível registrar os sinais vitais."
      );
    } finally {
      setRegistrandoSsvvId(null);
    }
  }

  const colunas: ColumnsType<Avaliacao> = [
    {
      title: "Paciente",
      dataIndex: "nomePaciente",
      key: "nomePaciente",
      align: "center",
      render: (valor: string | null | undefined) => valor ?? "-",
    },
    {
      title: "Avaliador",
      dataIndex: "avaliadorNome",
      key: "avaliadorNome",
      align: "center",
      render: (valor: string | null | undefined) => valor ?? "-",
    },
    {
      title: "Pontuação",
      dataIndex: "pontuacaoTotal",
      key: "pontuacaoTotal",
      align: "center",
    },
    {
      title: "Data",
      dataIndex: "criadoEm",
      key: "criadoEm",
      align: "center",
      render: (valor: string | null | undefined) => formatarDataHora(valor),
    },
    {
      title: "Status",
      key: "status",
      align: "center",
      width: 140,
      render: (_, registro) => {
        const statusPews = obterStatusReavaliacao(registro, agora);
        const statusSsvv = obterStatusSinaisVitais(registro, agora);
        const ultimoSinalVital = obterUltimoSinalVital(registro);

        return (
          <Space
            direction="vertical"
            size={4}
            onClick={(evento) => evento.stopPropagation()}
          >
            <Popover
              title="Reavaliação PEWS"
              content={
                <Space direction="vertical" size={4}>
                  <Typography.Text>{statusPews.detalhe}</Typography.Text>
                  <Typography.Text type="secondary">
                    Prazo: {statusPews.prazo}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    Pontuação PEWS: {registro.pontuacaoTotal}
                  </Typography.Text>
                </Space>
              }
              trigger={["hover", "click"]}
            >
              <Tag
                color={statusPews.cor}
                icon={statusPews.icone}
                style={{ cursor: "pointer", marginInlineEnd: 0 }}
              >
                {statusPews.tagTexto}
              </Tag>
            </Popover>
            <Popover
              title="Sinais vitais"
              content={
                <Space direction="vertical" size={10} style={{ maxWidth: 320 }}>
                  <div>
                    <Typography.Text strong>Frequência recomendada: </Typography.Text>
                    <Tag color="blue">{statusSsvv.frequencia}</Tag>
                  </div>
                  <div>
                    <Typography.Text strong>Procedimento: </Typography.Text>
                    <Tag color={statusSsvv.realizado ? "success" : "warning"}>
                      {statusSsvv.procedimentoStatus}
                    </Tag>
                  </div>
                  <hr style={{ border: 0, borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />
                  <Typography.Text type="secondary">{statusSsvv.detalhe}</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: "block" }}>
                    Prazo limite: {statusSsvv.prazo}
                  </Typography.Text>
                  
                  {ultimoSinalVital && (
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text strong style={{ display: "block", marginBottom: 4 }}>
                        Últimos Sinais Vitais Aferidos:
                      </Typography.Text>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px 8px" }}>
                        <div><Typography.Text type="secondary">FC: </Typography.Text><Typography.Text strong>{ultimoSinalVital.frequenciaCardiaca !== null && ultimoSinalVital.frequenciaCardiaca !== undefined ? `${ultimoSinalVital.frequenciaCardiaca} bpm` : "-"}</Typography.Text></div>
                        <div><Typography.Text type="secondary">FR: </Typography.Text><Typography.Text strong>{ultimoSinalVital.frequenciaRespiratoria !== null && ultimoSinalVital.frequenciaRespiratoria !== undefined ? `${ultimoSinalVital.frequenciaRespiratoria} irpm` : "-"}</Typography.Text></div>
                        <div><Typography.Text type="secondary">Temp: </Typography.Text><Typography.Text strong>{ultimoSinalVital.temperatura !== null && ultimoSinalVital.temperatura !== undefined ? `${Number(ultimoSinalVital.temperatura).toFixed(1)} °C` : "-"}</Typography.Text></div>
                        <div><Typography.Text type="secondary">SpO2: </Typography.Text><Typography.Text strong>{ultimoSinalVital.saturacaoOxigenio !== null && ultimoSinalVital.saturacaoOxigenio !== undefined ? `${ultimoSinalVital.saturacaoOxigenio}%` : "-"}</Typography.Text></div>
                        <div><Typography.Text type="secondary">PA: </Typography.Text><Typography.Text strong>{ultimoSinalVital.pressaoArterial || "-"}</Typography.Text></div>
                        <div><Typography.Text type="secondary">Dor: </Typography.Text><Typography.Text strong>{ultimoSinalVital.dor !== null && ultimoSinalVital.dor !== undefined ? `${ultimoSinalVital.dor}/10` : "-"}</Typography.Text></div>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <Typography.Text type="secondary">Condição: </Typography.Text>
                        <Typography.Text strong>{statusSsvv.condicaoGeral}</Typography.Text>
                      </div>
                    </div>
                  )}

                  <Typography.Text type="secondary" style={{ display: "block", fontSize: "11px", marginTop: 4 }}>
                    {statusSsvv.ultimoRegistro}
                  </Typography.Text>
                  {statusSsvv.observacao ? (
                    <Typography.Text type="secondary" style={{ display: "block" }}>
                      Obs: {statusSsvv.observacao}
                    </Typography.Text>
                  ) : null}
                  <Button
                    type="primary"
                    size="small"
                    loading={registrandoSsvvId === registro.id}
                    onClick={() => abrirModalSsvv(registro.id)}
                    style={{ background: verde, alignSelf: "flex-start", marginTop: 4 }}
                  >
                    Registrar SSVV
                  </Button>
                </Space>
              }
              trigger={["hover", "click"]}
            >
              <Tag
                color={statusSsvv.cor}
                icon={statusSsvv.icone}
                style={{ cursor: "pointer", marginInlineEnd: 0 }}
              >
                {statusSsvv.tagTexto}
              </Tag>
            </Popover>
          </Space>
        );
      },
    },
    {
      title: "",
      key: "acoes",
      align: "center",
      render: (_, registro) => (
        <Button
          type="default"
          size="small"
          icon={<PrinterOutlined />}
          onClick={(evento) => {
            evento.stopPropagation();
            imprimirAvaliacao(
              {
                pacienteNome: registro.nomePaciente ?? "-",
                faixaEtaria: registro.faixaEtaria ?? "-",
                leito: registro.leito ?? "-",
                diagnostico: registro.diagnostico ?? "-",
                dih: registro.dih ?? "-",
                avaliadorNome: registro.avaliadorNome ?? "-",
                criadoEm: registro.criadoEm ?? new Date().toISOString(),
                avaliacaoRespiratoria:
                  registro.avaliacaoRespiratoria ?? "-",
                pontuacaoRespiratoria: registro.pontuacaoRespiratoria ?? 0,
                avaliacaoCardiovascular:
                  registro.avaliacaoCardiovascular ?? "-",
                pontuacaoCardiovascular: registro.pontuacaoCardiovascular ?? 0,
                avaliacaoNeurologica:
                  registro.avaliacaoNeurologica ?? "-",
                pontuacaoNeurologica: registro.pontuacaoNeurologica ?? 0,
                frequenciaRespiratoria: registro.frequenciaRespiratoria,
                frequenciaCardiaca: registro.frequenciaCardiaca,
                vigilia: registro.vigilia,
                emesePosOperatorio: registro.emesePosOperatorio,
                nebulizacaoResgate: registro.nebulizacaoResgate,
                pontuacaoTotal: registro.pontuacaoTotal,
                intervencao: registro.intervencao ?? "-",
                tempoControleSsvv: registro.tempoControleSsvv ?? "-",
              },
              "Avaliação PEWS"
            );
          }}
        >
          Imprimir
        </Button>
      ),
    },
  ];

  return (
    <>
    <div style={{ margin: "-24px" }}>
      <nav
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          background: verdeClaro,
        }}
      >
        <Button
          type="text"
          onClick={() => navigate("/inicio")}
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Histórico Geral
        </Button>
        <Button
          type="text"
          onClick={() => navigate("/avaliacoes/nova")}
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Nova Avaliação
        </Button>
        <Button
          type="text"
          onClick={() => navigate("/manual-pews")}
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Como Utilizar o PEWS
        </Button>
      </nav>

      <main
        style={{
          minHeight: "calc(100vh - 104px)",
          padding: 24,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Typography.Title level={2} style={{ color: verde, margin: 0 }}>
            {apenasMinhas ? "Minhas Avaliações" : "Histórico Geral"}
          </Typography.Title>

          <Space size="middle" wrap style={{ width: "100%" }}>
            <Input
              allowClear
              size="large"
              placeholder="Nome do paciente"
              value={filtros.nomePaciente}
              onChange={(evento) =>
                setFiltros((filtrosAtuais) => ({
                  ...filtrosAtuais,
                  nomePaciente: evento.target.value,
                }))
              }
              onPressEnter={aplicarFiltros}
              style={{ width: 300 }}
            />
            <Select
              allowClear
              showSearch
              size="large"
              placeholder="Avaliador"
              value={filtros.avaliadorId}
              options={opcoesAvaliador}
              optionFilterProp="label"
              onChange={(avaliadorId) =>
                setFiltros((filtrosAtuais) => ({
                  ...filtrosAtuais,
                  avaliadorId: avaliadorId ?? null,
                }))
              }
              style={{ width: 275 }}
            />
            <Select
              allowClear
              size="large"
              placeholder="Pontuação"
              value={filtros.pontuacao}
              options={opcoesPontuacao}
              onChange={(pontuacao) =>
                setFiltros((filtrosAtuais) => ({
                  ...filtrosAtuais,
                  pontuacao: pontuacao ?? null,
                }))
              }
              style={{ width: 275 }}
            />
            <RangePicker
              locale={datePickerPtBR}
              size="large"
              value={filtros.periodo}
              placeholder={["Início", "Fim"]}
              format="DD/MM/YYYY"
              onChange={(periodo) =>
                setFiltros((filtrosAtuais) => ({
                  ...filtrosAtuais,
                  periodo,
                }))
              }
              style={{ width: 300 }}
            />
            <Button
              type="primary"
              size="large"
              onClick={aplicarFiltros}
              style={{ background: verde }}
            >
              Filtrar
            </Button>
            <Button size="large" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button
              size="large"
              icon={<PrinterOutlined />}
              onClick={imprimirRelatorio}
            >
              Imprimir relatório
            </Button>
          </Space>

          <Table<Avaliacao>
            rowKey="id"
            loading={carregando}
            columns={colunas}
            dataSource={avaliacoes}
            pagination={{ pageSize: 12 }}
            bordered={false}
            rowClassName="linha-clicavel"
            onRow={(registro) => ({
              onClick: () => {
                if (registro.pacienteId) {
                  navigate(`/historico/paciente/${registro.pacienteId}`);
                  return;
                }

                const nome = registro.nomePaciente?.trim();

                if (nome) {
                  navigate(`/historico/paciente/${encodeURIComponent(nome)}`);
                }
              },
            })}
            style={{ width: "100%" }}
          />
        </Space>
      </main>
    </div>
    <Modal
      title="Registrar sinais vitais"
      open={modalSsvvAvaliacaoId !== null}
      okText="Registrar"
      cancelText="Cancelar"
      confirmLoading={
        modalSsvvAvaliacaoId !== null &&
        registrandoSsvvId === modalSsvvAvaliacaoId
      }
      onCancel={() => setModalSsvvAvaliacaoId(null)}
      onOk={() => void registrarSinaisVitais()}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text>
          Preencha as informações de sinais vitais observadas na aferição do paciente.
        </Typography.Text>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          <div>
            <Typography.Text style={{ display: "block", marginBottom: 4 }}>Frequência Cardíaca (bpm)</Typography.Text>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={300}
              value={fcSsvv === "" ? undefined : fcSsvv}
              onChange={(value) => setFcSsvv(value ?? "")}
              placeholder="Ex: 80"
            />
          </div>
          <div>
            <Typography.Text style={{ display: "block", marginBottom: 4 }}>Frequência Respiratória (irpm)</Typography.Text>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={150}
              value={frSsvv === "" ? undefined : frSsvv}
              onChange={(value) => setFrSsvv(value ?? "")}
              placeholder="Ex: 24"
            />
          </div>
          <div>
            <Typography.Text style={{ display: "block", marginBottom: 4 }}>Temperatura corporal (°C)</Typography.Text>
            <InputNumber
              style={{ width: "100%" }}
              min={30}
              max={45}
              step={0.1}
              value={tempSsvv === "" ? undefined : tempSsvv}
              onChange={(value) => setTempSsvv(value ?? "")}
              placeholder="Ex: 36.5"
            />
          </div>
          <div>
            <Typography.Text style={{ display: "block", marginBottom: 4 }}>Saturação de Oxigênio (SpO2 %)</Typography.Text>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={100}
              value={spo2Ssvv === "" ? undefined : spo2Ssvv}
              onChange={(value) => setSpo2Ssvv(value ?? "")}
              placeholder="Ex: 98"
            />
          </div>
          <div>
            <Typography.Text style={{ display: "block", marginBottom: 4 }}>Pressão Arterial (mmHg)</Typography.Text>
            <Input
              style={{ width: "100%" }}
              value={paSsvv}
              onChange={(evento) => setPaSsvv(evento.target.value)}
              placeholder="Ex: 120/80"
            />
          </div>
          <div>
            <Typography.Text style={{ display: "block", marginBottom: 4 }}>Escala de Dor (0 a 10)</Typography.Text>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={10}
              value={dorSsvv === "" ? undefined : dorSsvv}
              onChange={(value) => setDorSsvv(value ?? "")}
              placeholder="Ex: 3"
            />
          </div>
        </div>

        <div>
          <Typography.Text style={{ display: "block", marginBottom: 6, fontWeight: "500" }}>
            Condição geral observada na aferição:
          </Typography.Text>
          <Radio.Group
            value={condicaoGeralSsvv}
            onChange={(evento) => setCondicaoGeralSsvv(evento.target.value)}
          >
            <Space direction="horizontal" size={16}>
              <Radio value="SEM_ALTERACOES">Sem alterações</Radio>
              <Radio value="ALTERACOES_OBSERVADAS">
                Alterações observadas
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        <div>
          <Typography.Text style={{ display: "block", marginBottom: 4 }}>Observações</Typography.Text>
          <Input.TextArea
            value={observacaoSsvv}
            onChange={(evento) => setObservacaoSsvv(evento.target.value)}
            placeholder="Observação opcional"
            maxLength={500}
            rows={3}
            showCount
          />
        </div>
      </Space>
    </Modal>
    </>
  );
}
