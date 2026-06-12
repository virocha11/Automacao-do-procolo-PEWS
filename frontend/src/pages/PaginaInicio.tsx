import {
  App,
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Typography,
} from "antd";
import datePickerPtBR from "antd/es/date-picker/locale/pt_BR";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import { PrinterOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiListarAvaliacoes } from "../api/avaliacaoServico";
import { apiListarUsuarios } from "../api/usuariosServico";
import { useSessao } from "../contexts/SessaoContext";
import { CelulaNotificacao } from "../lib/notificacaoPews";
import { imprimirAvaliacao } from "../lib/impressaoAvaliacao";
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
  const [nomePaciente, setNomePaciente] = useState("");
  const [agora, setAgora] = useState(() => new Date());
  const temporizadorBusca = useRef<number | undefined>(undefined);
  const buscaAtual = useRef(0);
  const [filtros, setFiltros] = useState<FiltrosHistorico>(filtrosIniciais);

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

  // Atualiza o relógio a cada 30 segundos para manter os countdowns precisos
  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalo);
  }, []);

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
      title: "Notificação",
      key: "notificacao",
      align: "center",
      width: 260,
      render: (_: unknown, registro: Avaliacao) => (
        <CelulaNotificacao avaliacao={registro} agora={agora} />
      ),
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
  );
}
