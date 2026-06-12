import { App, Button, Input, Space, Table, Typography, DatePicker, InputNumber, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PrinterOutlined, SearchOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import { apiListarAvaliacoes } from "../api/avaliacaoServico";
import { useSessao } from "../contexts/SessaoContext";
import { CelulaNotificacao } from "../lib/notificacaoPews";
import { imprimirAvaliacao, imprimirListaAvaliacoes } from "../lib/impressaoAvaliacao";
import type { Avaliacao } from "../types/avaliacao";

const verde = "#1f6b3a";
const verdeClaro = "#88a98f";

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

type PropsPaginaInicio = {
  apenasMinhas?: boolean;
};

export function PaginaInicio({ apenasMinhas = false }: PropsPaginaInicio) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { token } = useSessao();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [nomePaciente, setNomePaciente] = useState("");
  const [filtroAvaliador, setFiltroAvaliador] = useState("");
  const [filtroPontuacao, setFiltroPontuacao] = useState<number | null>(null);
  const [filtroDatas, setFiltroDatas] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [agora, setAgora] = useState(() => new Date());
  const temporizadorBusca = useRef<number | undefined>(undefined);
  const buscaAtual = useRef(0);

  const avaliacoesFiltradas = useMemo(() => {
    return avaliacoes.filter((avaliacao) => {
      // 1. Filtro por paciente
      const matchesPaciente =
        !nomePaciente ||
        avaliacao.nomePaciente?.toLowerCase().includes(nomePaciente.toLowerCase());

      // 2. Filtro por avaliador
      const matchesAvaliador =
        !filtroAvaliador ||
        avaliacao.avaliadorNome?.toLowerCase().includes(filtroAvaliador.toLowerCase());

      // 3. Filtro por pontuação
      const matchesPontuacao =
        filtroPontuacao === null ||
        avaliacao.pontuacaoTotal === filtroPontuacao;

      // 4. Filtro por data (criadoEm)
      let matchesData = true;
      if (filtroDatas && filtroDatas[0] && filtroDatas[1]) {
        const dataCriacao = new Date(avaliacao.criadoEm);
        const dataInicio = filtroDatas[0].startOf("day").toDate();
        const dataFim = filtroDatas[1].endOf("day").toDate();
        matchesData = dataCriacao >= dataInicio && dataCriacao <= dataFim;
      }

      return matchesPaciente && matchesAvaliador && matchesPontuacao && matchesData;
    });
  }, [avaliacoes, nomePaciente, filtroAvaliador, filtroPontuacao, filtroDatas]);

  // Atualiza o relógio a cada 30 segundos para manter os countdowns precisos
  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(new Date());
    }, 30_000);

    return () => window.clearInterval(intervalo);
  }, []);

  const carregarAvaliacoes = useCallback(
    async (filtroNome: string, idBusca = buscaAtual.current) => {
      if (!token) {
        return;
      }

      setCarregando(true);

      try {
        const dados = await apiListarAvaliacoes(token, filtroNome, {
          minhas: apenasMinhas,
        });

        if (idBusca !== buscaAtual.current) {
          return;
        }

        setAvaliacoes(dados);
      } catch (e) {
        if (idBusca !== buscaAtual.current) {
          return;
        }

        message.error(
          e instanceof Error
            ? e.message
            : "Não foi possível listar as avaliações."
        );
      } finally {
        if (idBusca === buscaAtual.current) {
          setCarregando(false);
        }
      }
    },
    [apenasMinhas, message, token]
  );

  useEffect(() => {
    buscaAtual.current += 1;
    void carregarAvaliacoes("", buscaAtual.current);

    return () => window.clearTimeout(temporizadorBusca.current);
  }, [carregarAvaliacoes]);

  function buscarEnquantoDigita(valor: string) {
    setNomePaciente(valor);
    window.clearTimeout(temporizadorBusca.current);
    buscaAtual.current += 1;
    const idBusca = buscaAtual.current;

    temporizadorBusca.current = window.setTimeout(() => {
      void carregarAvaliacoes(valor, idBusca);
    }, 300);
  }

  function buscarAgora(valor: string) {
    window.clearTimeout(temporizadorBusca.current);
    buscaAtual.current += 1;
    void carregarAvaliacoes(valor, buscaAtual.current);
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
      sorter: (a, b) => a.pontuacaoTotal - b.pontuacaoTotal,
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
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "12px" }}>
            <Typography.Title level={2} style={{ color: verde, margin: 0 }}>
              {apenasMinhas ? "Minhas Avaliações" : "Histórico Geral"}
            </Typography.Title>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => imprimirListaAvaliacoes(avaliacoesFiltradas, nomePaciente)}
              disabled={avaliacoesFiltradas.length === 0}
              style={{ backgroundColor: verde, borderColor: verde }}
            >
              Imprimir Resultado
            </Button>
          </div>

          <Row gutter={[16, 16]} style={{ width: "100%" }}>
            <Col xs={24} sm={12} md={8}>
              <Input.Search
                allowClear
                size="large"
                placeholder="Nome do paciente"
                value={nomePaciente}
                enterButton={<SearchOutlined />}
                onChange={(evento) => buscarEnquantoDigita(evento.target.value)}
                onSearch={buscarAgora}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                allowClear
                size="large"
                placeholder="Avaliador"
                value={filtroAvaliador}
                onChange={(evento) => setFiltroAvaliador(evento.target.value)}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <InputNumber
                size="large"
                placeholder="Pontuação"
                value={filtroPontuacao}
                onChange={(valor) => setFiltroPontuacao(valor)}
                min={0}
                max={15}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={24} md={6}>
              <DatePicker.RangePicker
                size="large"
                placeholder={["Data inicial", "Data final"]}
                value={filtroDatas}
                onChange={(valores) => setFiltroDatas(valores as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
              />
            </Col>
          </Row>

          <Table<Avaliacao>
            rowKey="id"
            loading={carregando}
            columns={colunas}
            dataSource={avaliacoesFiltradas}
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
