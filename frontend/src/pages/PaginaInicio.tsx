import { App, Button, DatePicker, Input, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { RangePickerProps } from "antd/es/date-picker";
import ptBR from "antd/locale/pt_BR";
import ptBRDatePicker from "antd/es/date-picker/locale/pt_BR";
import { PrinterOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiListarAvaliacoes } from "../api/avaliacaoServico";
import { apiListarUsuarios } from "../api/usuariosServico";
import { useSessao } from "../contexts/SessaoContext";
import { imprimirAvaliacao } from "../lib/impressaoAvaliacao";
import type { Avaliacao } from "../types/avaliacao";
import type { Usuario } from "../types/usuario";

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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [nomePaciente, setNomePaciente] = useState("");
  const [avaliador, setAvaliador] = useState("");
  const [pontuacaoCategoria, setPontuacaoCategoria] = useState<
    "todos" | "baixo" | "atencao" | "alto"
  >("todos");
  const [periodo, setPeriodo] = useState<RangePickerProps["value"]>(null);
  const temporizadorBusca = useRef<number | undefined>(undefined);
  const buscaAtual = useRef(0);

  function obterIntervaloPontuacao(categoria: string) {
    switch (categoria) {
      case "baixo":
        return { pontuacaoMin: 0, pontuacaoMax: 2 };
      case "atencao":
        return { pontuacaoMin: 3, pontuacaoMax: 4 };
      case "alto":
        return { pontuacaoMin: 5, pontuacaoMax: 999 };
      default:
        return {};
    }
  }

  function prepararPeriodo(periodoValue: RangePickerProps["value"]) {
    if (!periodoValue || !periodoValue[0] || !periodoValue[1]) {
      return { dataInicio: undefined, dataFim: undefined };
    }

    return {
      dataInicio: periodoValue[0].startOf("day").toISOString(),
      dataFim: periodoValue[1].endOf("day").toISOString(),
    };
  }

  const carregarAvaliacoes = useCallback(
    async (
      filtroNome: string,
      filtros: {
        avaliador: string;
        pontuacaoCategoria: string;
        periodo: RangePickerProps["value"];
      },
      idBusca = buscaAtual.current
    ) => {
      if (!token) {
        return;
      }

      setCarregando(true);

      try {
        const { pontuacaoMin, pontuacaoMax } = obterIntervaloPontuacao(
          filtros.pontuacaoCategoria
        );
        const { dataInicio, dataFim } = prepararPeriodo(filtros.periodo);

        const dados = await apiListarAvaliacoes(token, filtroNome, {
          minhas: apenasMinhas,
          avaliadorNome: filtros.avaliador,
          pontuacaoMin,
          pontuacaoMax,
          dataInicio,
          dataFim,
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
    void carregarAvaliacoes("", {
      avaliador: "",
      pontuacaoCategoria: "todos",
      periodo: null,
    }, buscaAtual.current);

    return () => window.clearTimeout(temporizadorBusca.current);
  }, [carregarAvaliacoes]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const carregarUsuarios = async () => {
      try {
        const dadosUsuarios = await apiListarUsuarios(token);
        setUsuarios(dadosUsuarios);
      } catch (e) {
        message.error(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar os avaliadores."
        );
      }
    };

    void carregarUsuarios();
  }, [message, token]);

  function buscarEnquantoDigita(valor: string) {
    setNomePaciente(valor);
    window.clearTimeout(temporizadorBusca.current);
    buscaAtual.current += 1;
    const idBusca = buscaAtual.current;

    temporizadorBusca.current = window.setTimeout(() => {
      void carregarAvaliacoes(valor, {
        avaliador,
        pontuacaoCategoria,
        periodo,
      }, idBusca);
    }, 300);
  }

  function buscarAgora(valor: string) {
    window.clearTimeout(temporizadorBusca.current);
    buscaAtual.current += 1;
    void carregarAvaliacoes(valor, {
      avaliador,
      pontuacaoCategoria,
      periodo,
    }, buscaAtual.current);
  }

  function aplicarFiltros() {
    window.clearTimeout(temporizadorBusca.current);
    buscaAtual.current += 1;
    void carregarAvaliacoes(nomePaciente, {
      avaliador,
      pontuacaoCategoria,
      periodo,
    }, buscaAtual.current);
  }

  function limparFiltros() {
    setNomePaciente("");
    setAvaliador("");
    setPontuacaoCategoria("todos");
    setPeriodo(null);

    window.clearTimeout(temporizadorBusca.current);
    buscaAtual.current += 1;
    void carregarAvaliacoes("", {
      avaliador: "",
      pontuacaoCategoria: "todos",
      periodo: null,
    }, buscaAtual.current);
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
          <Typography.Title level={2} style={{ color: verde, margin: 0 }}>
            {apenasMinhas ? "Minhas Avaliações" : "Histórico Geral"}
          </Typography.Title>

          <Space wrap={false} style={{ width: "100%", gap: 12, marginBottom: 4, overflowX: "auto" }}>
            <Input
              allowClear
              size="large"
              placeholder="Nome do paciente"
              value={nomePaciente}
              onChange={(evento) => buscarEnquantoDigita(evento.target.value)}
              style={{ minWidth: 240, maxWidth: 360 }}
            />
            <Select
              showSearch
              allowClear
              size="large"
              placeholder="Avaliador"
              value={avaliador || undefined}
              onChange={(valor) => setAvaliador(valor ?? "")}
              options={usuarios.map((usuario) => ({
                label: usuario.nome,
                value: usuario.nome,
              }))}
              style={{ minWidth: 220, maxWidth: 320 }}
              filterOption={(input, option) =>
                option?.label
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
            <Select
              size="large"
              placeholder="Pontuação"
              value={pontuacaoCategoria === "todos" ? undefined : pontuacaoCategoria}
              onChange={(valor) => setPontuacaoCategoria(valor ?? "todos")}
              allowClear
              options={[
                { label: "Baixo risco (0-2)", value: "baixo" },
                { label: "Atenção (3-4)", value: "atencao" },
                { label: "Alto risco (5+)", value: "alto" },
              ]}
              style={{ minWidth: 220, maxWidth: 260 }}
            />
            <DatePicker.RangePicker
              locale={ptBRDatePicker}
              value={periodo}
              onChange={(valores) => setPeriodo(valores)}
              placeholder={["Início", "Fim"]}
              style={{ minWidth: 280, maxWidth: 420 }}
              size="large"
            />
            <Button type="primary" onClick={aplicarFiltros}>
              Filtrar
            </Button>
            <Button onClick={limparFiltros}>Limpar filtros</Button>
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
