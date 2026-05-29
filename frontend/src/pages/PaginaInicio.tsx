import { App, Button, Input, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiListarAvaliacoes } from "../api/avaliacaoServico";
import { useSessao } from "../contexts/SessaoContext";
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
  const temporizadorBusca = useRef<number | undefined>(undefined);
  const buscaAtual = useRef(0);

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

          <Input.Search
            allowClear
            size="large"
            placeholder="Nome do paciente"
            value={nomePaciente}
            enterButton={<SearchOutlined />}
            onChange={(evento) => buscarEnquantoDigita(evento.target.value)}
            onSearch={buscarAgora}
            style={{ maxWidth: 570 }}
          />

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
