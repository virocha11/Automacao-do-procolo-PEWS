import {
  App,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiListarAvaliacoes } from "../api/avaliacaoServico";
import {
  apiBuscarPacientePorId,
  apiListarPacientes,
} from "../api/pacienteServico";
import { useSessao } from "../contexts/SessaoContext";
import type { Avaliacao } from "../types/avaliacao";
import type { Paciente } from "../types/paciente";

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

function texto(valor: string | number | boolean | null | undefined): string {
  if (typeof valor === "boolean") {
    return valor ? "Sim" : "Não";
  }

  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return String(valor);
}

function classificarPontuacao(pontuacao: number) {
  if (pontuacao >= 5) {
    return { texto: "Alto risco", cor: "red" };
  }

  if (pontuacao >= 3) {
    return { texto: "Atenção", cor: "gold" };
  }

  return { texto: "Baixo risco", cor: "green" };
}

function ordenarPorMaisRecente(avaliacoes: Avaliacao[]) {
  return [...avaliacoes].sort((a, b) => {
    const dataA = new Date(a.criadoEm).getTime();
    const dataB = new Date(b.criadoEm).getTime();

    return dataB - dataA;
  });
}

function nomesIguais(a: string, b: string) {
  return (
    a.trim().localeCompare(b.trim(), "pt-BR", {
      sensitivity: "base",
    }) === 0
  );
}

export function PaginaHistoricoPaciente() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { token } = useSessao();
  const { pacienteId = "" } = useParams();
  const idPaciente = Number(pacienteId);
  const rotaPorId = Number.isFinite(idPaciente) && idPaciente > 0;
  const nomeLegado = rotaPorId ? "" : decodeURIComponent(pacienteId);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregarAvaliacoes = useCallback(async () => {
    if (!token || (!rotaPorId && !nomeLegado.trim())) {
      return;
    }

    setCarregando(true);

    try {
      if (rotaPorId) {
        const dadosPaciente = await apiBuscarPacientePorId(token, idPaciente);
        setPaciente(dadosPaciente);

        const dados = await apiListarAvaliacoes(token, dadosPaciente.nome, {
          exato: true,
          pacienteId: idPaciente,
        });
        setAvaliacoes(ordenarPorMaisRecente(dados));
        return;
      }

      const dados = await apiListarAvaliacoes(token, nomeLegado, {
        exato: true,
      });
      setAvaliacoes(ordenarPorMaisRecente(dados));

      const pacientes = await apiListarPacientes(token, nomeLegado);
      const pacienteEncontrado = pacientes.find((item) =>
        nomesIguais(item.nome, nomeLegado)
      );

      if (pacienteEncontrado) {
        setPaciente(pacienteEncontrado);
      }
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : "Não foi possível listar as avaliações do paciente."
      );
    } finally {
      setCarregando(false);
    }
  }, [idPaciente, message, nomeLegado, rotaPorId, token]);

  useEffect(() => {
    void carregarAvaliacoes();
  }, [carregarAvaliacoes]);

  const avaliacaoMaisRecente = avaliacoes[0];
  const maiorPontuacao = useMemo(
    () =>
      avaliacoes.reduce(
        (maior, avaliacao) => Math.max(maior, avaliacao.pontuacaoTotal),
        0
      ),
    [avaliacoes]
  );
  const classificacaoAtual = classificarPontuacao(
    avaliacaoMaisRecente?.pontuacaoTotal ?? 0
  );
  const nomePaciente =
    paciente?.nome ?? avaliacaoMaisRecente?.nomePaciente ?? nomeLegado;

  function navegarParaNovaAvaliacao() {
    const idParaPreencher = rotaPorId ? idPaciente : paciente?.id;

    if (idParaPreencher) {
      navigate(`/avaliacoes/nova?pacienteId=${idParaPreencher}`);
      return;
    }

    navigate("/avaliacoes/nova", {
      state: {
        nomePaciente,
        faixaEtaria: avaliacaoMaisRecente?.faixaEtaria,
      },
    });
  }

  const itensCollapse = avaliacoes.map((avaliacao) => {
    const classificacao = classificarPontuacao(avaliacao.pontuacaoTotal);

    return {
      key: String(avaliacao.id),
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Space size="middle" wrap>
            <CalendarOutlined style={{ color: verde }} />
            <Typography.Text strong>
              {formatarDataHora(avaliacao.criadoEm)}
            </Typography.Text>
            <Typography.Text type="secondary">
              {texto(avaliacao.avaliadorNome)}
            </Typography.Text>
          </Space>
          <Space>
            <Tag color={classificacao.cor}>{classificacao.texto}</Tag>
            <Tag color="default">PEWS {avaliacao.pontuacaoTotal}</Tag>
          </Space>
        </div>
      ),
      children: (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2, lg: 3 }}
            items={[
              { key: "leito", label: "Leito", children: texto(avaliacao.leito) },
              {
                key: "faixaEtaria",
                label: "Faixa etária",
                children: texto(avaliacao.faixaEtaria),
              },
              { key: "dih", label: "DIH", children: texto(avaliacao.dih) },
              {
                key: "diagnostico",
                label: "Diagnóstico",
                children: texto(avaliacao.diagnostico),
                span: 3,
              },
            ]}
          />

          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2, lg: 3 }}
            title="Sinais e critérios"
            items={[
              {
                key: "respiratoria",
                label: "Respiratória",
                children: `${texto(avaliacao.avaliacaoRespiratoria)} (${
                  avaliacao.pontuacaoRespiratoria
                } pts)`,
              },
              {
                key: "cardiovascular",
                label: "Cardiovascular",
                children: `${texto(avaliacao.avaliacaoCardiovascular)} (${
                  avaliacao.pontuacaoCardiovascular
                } pts)`,
              },
              {
                key: "neurologica",
                label: "Neurológica",
                children: `${texto(avaliacao.avaliacaoNeurologica)} (${
                  avaliacao.pontuacaoNeurologica
                } pts)`,
              },
              {
                key: "fr",
                label: "Freq. respiratória",
                children: texto(avaliacao.frequenciaRespiratoria),
              },
              {
                key: "fc",
                label: "Freq. cardíaca",
                children: texto(avaliacao.frequenciaCardiaca),
              },
              {
                key: "vigilia",
                label: "Vigília",
                children: texto(avaliacao.vigilia),
              },
              {
                key: "emese",
                label: "Êmese pós-operatório",
                children: texto(avaliacao.emesePosOperatorio),
              },
              {
                key: "nebulizacao",
                label: "Nebulização de resgate",
                children: texto(avaliacao.nebulizacaoResgate),
              },
              {
                key: "tempoControle",
                label: "Controle SSVV",
                children: texto(avaliacao.tempoControleSsvv),
              },
            ]}
          />

          <Descriptions
            bordered
            size="small"
            column={1}
            items={[
              {
                key: "intervencao",
                label: "Intervenção",
                children: texto(avaliacao.intervencao),
              },
            ]}
          />
        </Space>
      ),
    };
  });

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
          onClick={navegarParaNovaAvaliacao}
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Nova Avaliação
        </Button>
        <Button
          type="text"
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Como Utilizar o PEWS
        </Button>
      </nav>

      <main style={{ minHeight: "calc(100vh - 104px)", padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space
            align="start"
            style={{
              justifyContent: "space-between",
              width: "100%",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Space direction="vertical" size={4}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/inicio")}
              >
                Voltar
              </Button>
              <Typography.Title level={2} style={{ color: verde, margin: 0 }}>
                Histórico de {nomePaciente || "paciente"}
              </Typography.Title>
              <Typography.Text type="secondary">
                Avaliações ordenadas da mais recente para a mais antiga.
              </Typography.Text>
            </Space>

            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={navegarParaNovaAvaliacao}
              style={{ background: verde }}
            >
              Nova avaliação
            </Button>
          </Space>

          {carregando ? (
            <div style={{ display: "grid", minHeight: 260, placeItems: "center" }}>
              <Spin size="large" />
            </div>
          ) : avaliacoes.length === 0 ? (
            <Empty description="Nenhuma avaliação encontrada para este paciente." />
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <Card size="small">
                  <Typography.Text type="secondary">Último PEWS</Typography.Text>
                  <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
                    {avaliacaoMaisRecente.pontuacaoTotal}
                  </Typography.Title>
                  <Tag color={classificacaoAtual.cor}>
                    {classificacaoAtual.texto}
                  </Tag>
                </Card>
                <Card size="small">
                  <Typography.Text type="secondary">Avaliações</Typography.Text>
                  <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
                    {avaliacoes.length}
                  </Typography.Title>
                </Card>
                <Card size="small">
                  <Typography.Text type="secondary">Maior PEWS</Typography.Text>
                  <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
                    {maiorPontuacao}
                  </Typography.Title>
                </Card>
                <Card size="small">
                  <Typography.Text type="secondary">
                    Última avaliação
                  </Typography.Text>
                  <Typography.Title level={5} style={{ margin: "8px 0 0" }}>
                    {formatarDataHora(avaliacaoMaisRecente.criadoEm)}
                  </Typography.Title>
                </Card>
              </div>

              <Collapse
                accordion
                size="large"
                items={itensCollapse}
              />
            </>
          )}
        </Space>
      </main>
    </div>
  );
}
