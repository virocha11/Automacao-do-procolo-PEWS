import {
  App,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileAddOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  apiAnexarArquivoAvaliacao,
  apiExcluirAvaliacao,
  apiExcluirAnexoAvaliacao,
  apiListarAvaliacoes,
} from "../api/avaliacaoServico";
import { apiBuscarPacientePorId, apiListarPacientes } from "../api/pacienteServico";
import { urlBaseApi } from "../api/requisicoes";
import { useSessao } from "../contexts/SessaoContext";
import { imprimirAvaliacao } from "../lib/impressaoAvaliacao";
import { CODIGO_FUNCAO_ADMINISTRADOR } from "../lib/funcaoUsuario";
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

function formatarDataCurta(valor: string | null | undefined): string {
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

function ordenarPorMaisAntiga(avaliacoes: Avaliacao[]) {
  return [...avaliacoes].sort((a, b) => {
    const dataA = new Date(a.criadoEm).getTime();
    const dataB = new Date(b.criadoEm).getTime();

    return dataA - dataB;
  });
}

function nomesIguais(a: string, b: string) {
  return (
    a.trim().localeCompare(b.trim(), "pt-BR", {
      sensitivity: "base",
    }) === 0
  );
}

function GraficoEvolucaoPews({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  const dados = ordenarPorMaisAntiga(avaliacoes);
  const largura = 360;
  const altura = 150;
  const margem = { topo: 18, direita: 14, baixo: 30, esquerda: 30 };
  const larguraGrafico = largura - margem.esquerda - margem.direita;
  const alturaGrafico = altura - margem.topo - margem.baixo;
  const maiorValor = Math.max(7, ...dados.map((item) => item.pontuacaoTotal));
  const passos = Array.from({ length: maiorValor + 1 }, (_, indice) => indice);

  function x(indice: number) {
    if (dados.length <= 1) {
      return margem.esquerda + larguraGrafico / 2;
    }

    return margem.esquerda + (indice / (dados.length - 1)) * larguraGrafico;
  }

  function y(valor: number) {
    return (
      margem.topo +
      alturaGrafico -
      (Math.min(valor, maiorValor) / maiorValor) * alturaGrafico
    );
  }

  const pontos = dados.map((avaliacao, indice) => ({
    avaliacao,
    x: x(indice),
    y: y(avaliacao.pontuacaoTotal),
  }));

  const caminhoLinha = pontos
    .map((ponto, indice) => `${indice === 0 ? "M" : "L"} ${ponto.x} ${ponto.y}`)
    .join(" ");

  const rotulosData = dados.filter((_, indice) => {
    if (dados.length <= 6) {
      return true;
    }

    return indice === 0 || indice === dados.length - 1;
  });

  return (
    <Card
      title="Evolução do PEWS"
      size="small"
      style={{ minWidth: 300 }}
      styles={{
        header: { minHeight: 36, padding: "0 12px" },
        body: { padding: 10 },
      }}
    >
      <div>
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          role="img"
          aria-label="Gráfico de evolução da pontuação PEWS do paciente"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <rect
            x={margem.esquerda}
            y={y(maiorValor)}
            width={larguraGrafico}
            height={y(5) - y(maiorValor)}
            fill="#fff1f0"
          />
          <rect
            x={margem.esquerda}
            y={y(5)}
            width={larguraGrafico}
            height={y(3) - y(5)}
            fill="#fffbe6"
          />
          <rect
            x={margem.esquerda}
            y={y(3)}
            width={larguraGrafico}
            height={y(0) - y(3)}
            fill="#f6ffed"
          />

          {passos.map((valor) => (
            <g key={valor}>
              <line
                x1={margem.esquerda}
                x2={largura - margem.direita}
                y1={y(valor)}
                y2={y(valor)}
                stroke="#d9e3dd"
                strokeWidth={valor === 0 ? 1.4 : 0.8}
              />
              <text
                x={margem.esquerda - 12}
                y={y(valor) + 4}
                textAnchor="end"
                fill="#5b6b61"
                fontSize="10"
              >
                {valor}
              </text>
            </g>
          ))}

          <line
            x1={margem.esquerda}
            x2={margem.esquerda}
            y1={margem.topo}
            y2={margem.topo + alturaGrafico}
            stroke="#8da396"
          />
          <line
            x1={margem.esquerda}
            x2={largura - margem.direita}
            y1={margem.topo + alturaGrafico}
            y2={margem.topo + alturaGrafico}
            stroke="#8da396"
          />

          {pontos.length > 1 ? (
            <path
              d={caminhoLinha}
              fill="none"
              stroke={verde}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {pontos.map((ponto) => {
            const classificacao = classificarPontuacao(
              ponto.avaliacao.pontuacaoTotal
            );

            return (
              <g key={ponto.avaliacao.id}>
                <circle
                  cx={ponto.x}
                  cy={ponto.y}
                  r="4.5"
                  fill="#fff"
                  stroke={verde}
                  strokeWidth="2.4"
                >
                  <title>
                    {`${formatarDataHora(ponto.avaliacao.criadoEm)} | PEWS ${
                      ponto.avaliacao.pontuacaoTotal
                    } | ${texto(ponto.avaliacao.avaliadorNome)} | ${
                      classificacao.texto
                    }`}
                  </title>
                </circle>
                <text
                  x={ponto.x}
                  y={ponto.y - 12}
                  textAnchor="middle"
                  fill="#1f3d2b"
                  fontSize="10"
                  fontWeight="600"
                >
                  {ponto.avaliacao.pontuacaoTotal}
                </text>
              </g>
            );
          })}

          {rotulosData.map((avaliacao, indice) => {
            const indiceOriginal = dados.findIndex((item) => item.id === avaliacao.id);

            return (
              <text
                key={`${avaliacao.id}-${indice}`}
                x={x(indiceOriginal)}
                y={altura - 20}
                textAnchor="middle"
                fill="#5b6b61"
                fontSize="10"
              >
                {formatarDataCurta(avaliacao.criadoEm)}
              </text>
            );
          })}

          <text
            x={margem.esquerda}
            y={altura - 6}
            fill="#6f7c73"
            fontSize="10"
          >
            Mais antiga
          </text>
          <text
            x={largura - margem.direita}
            y={altura - 6}
            textAnchor="end"
            fill="#6f7c73"
            fontSize="10"
          >
            Mais recente
          </text>
        </svg>
      </div>

      <Space size={[4, 4]} wrap style={{ marginTop: 6 }}>
        <Tag color="green">0-2 baixo risco</Tag>
        <Tag color="gold">3-4 atenção</Tag>
        <Tag color="red">5+ alto risco</Tag>
      </Space>
    </Card>
  );
}

export function PaginaHistoricoPaciente() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { token, usuario } = useSessao();
  const { pacienteId = "" } = useParams();
  const idPaciente = Number(pacienteId);
  const rotaPorId = Number.isFinite(idPaciente) && idPaciente > 0;
  const nomeLegado = rotaPorId ? "" : decodeURIComponent(pacienteId);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [avaliacaoParaAnexo, setAvaliacaoParaAnexo] = useState<number | null>(null);
  const [anexoCarregandoId, setAnexoCarregandoId] = useState<number | null>(null);
  const arquivoInputRef = useRef<HTMLInputElement>(null);
  const usuarioAdministrador = usuario?.funcao === CODIGO_FUNCAO_ADMINISTRADOR;

  const carregarAvaliacoes = useCallback(async () => {
    if (!token || (!rotaPorId && !nomeLegado.trim())) {
      return;
    }

    setCarregando(true);

    try {
      if (rotaPorId) {
        const dadosPaciente = await apiBuscarPacientePorId(token, idPaciente);
        setPaciente(dadosPaciente);

        const dados = await apiListarAvaliacoes(token, undefined, {
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

  async function removerAvaliacao(id: number) {
    if (!token) {
      return;
    }

    try {
      await apiExcluirAvaliacao(token, id);
      message.success("Avaliação removida.");
      await carregarAvaliacoes();
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : "Não foi possível remover a avaliação."
      );
    }
  }

  async function anexarArquivoAvaliacao(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    const avaliacaoId = avaliacaoParaAnexo;

    if (!arquivo || !avaliacaoId || !token) {
      return;
    }

    setAnexoCarregandoId(avaliacaoId);

    try {
      await apiAnexarArquivoAvaliacao(token, avaliacaoId, arquivo);
      message.success("Arquivo anexado com sucesso.");
      await carregarAvaliacoes();
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : "Não foi possível anexar o arquivo."
      );
    } finally {
      setAnexoCarregandoId(null);
      setAvaliacaoParaAnexo(null);
      if (arquivoInputRef.current) {
        arquivoInputRef.current.value = "";
      }
    }
  }

  async function abrirAnexo(caminho: string) {
    const url = `${urlBaseApi()}/anexos/${encodeURIComponent(caminho)}`;

    try {
      const resposta = await fetch(url, { method: "HEAD" });
      if (!resposta.ok) {
        throw new Error("Arquivo não encontrado ou foi removido.");
      }
      window.open(url, "_blank");
    } catch (erro) {
      message.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível abrir o arquivo."
      );
    }
  }

  async function removerAnexoAvaliacao(
    avaliacaoId: number,
    anexoId?: number
  ) {
    if (!token) {
      return;
    }

    try {
      await apiExcluirAnexoAvaliacao(token, avaliacaoId, anexoId);
      message.success("Anexo excluído com sucesso.");
      await carregarAvaliacoes();
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : "Não foi possível excluir o anexo."
      );
    }
  }

  const imprimirHistoricoAvaliacao = useCallback(
    (avaliacao: Avaliacao) => {
      imprimirAvaliacao(
        {
          pacienteNome: texto(avaliacao.nomePaciente),
          faixaEtaria: texto(avaliacao.faixaEtaria),
          leito: texto(avaliacao.leito),
          diagnostico: texto(avaliacao.diagnostico),
          dih: avaliacao.dih,
          avaliadorNome: usuario?.nome,
          criadoEm: avaliacao.criadoEm ?? new Date().toISOString(),
          avaliacaoRespiratoria: texto(avaliacao.avaliacaoRespiratoria),
          pontuacaoRespiratoria: avaliacao.pontuacaoRespiratoria,
          avaliacaoCardiovascular: texto(avaliacao.avaliacaoCardiovascular),
          pontuacaoCardiovascular: avaliacao.pontuacaoCardiovascular,
          avaliacaoNeurologica: texto(avaliacao.avaliacaoNeurologica),
          pontuacaoNeurologica: avaliacao.pontuacaoNeurologica,
          frequenciaRespiratoria: avaliacao.frequenciaRespiratoria,
          frequenciaCardiaca: avaliacao.frequenciaCardiaca,
          vigilia: avaliacao.vigilia,
          emesePosOperatorio: avaliacao.emesePosOperatorio,
          nebulizacaoResgate: avaliacao.nebulizacaoResgate,
          pontuacaoTotal: avaliacao.pontuacaoTotal,
          intervencao: texto(avaliacao.intervencao),
          tempoControleSsvv: texto(avaliacao.tempoControleSsvv),
        },
        "Avaliação PEWS"
      );
    },
    [usuario?.nome]
  );

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
            <Button
              type="default"
              size="small"
              icon={<PrinterOutlined />}
              onClick={(evento) => {
                evento.stopPropagation();
                imprimirHistoricoAvaliacao(avaliacao);
              }}
            >
              Imprimir
            </Button>
            <Button
              type="default"
              size="small"
              icon={<FileAddOutlined />}
              loading={anexoCarregandoId === avaliacao.id}
              onClick={(evento) => {
                evento.stopPropagation();

                const totalAnexos =
                  (avaliacao.anexos?.length ?? 0) +
                  (avaliacao.anexoCaminho ? 1 : 0);

                if (totalAnexos >= 3) {
                  message.warning(
                    "São permitidos 3 arquivos por avaliação. Limite atingido"
                  );
                  return;
                }

                setAvaliacaoParaAnexo(avaliacao.id);
                arquivoInputRef.current?.click();
              }}
            >
              Anexar
            </Button>
            {(avaliacao.anexos?.length ?? 0) > 0 || avaliacao.anexoCaminho ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {avaliacao.anexos?.map((anexo) => (
                  <Space key={anexo.id} size="small">
                    <Typography.Link
                      href={`${urlBaseApi()}/anexos/${encodeURIComponent(
                        anexo.caminho
                      )}`}
                      onClick={(evento) => {
                        evento.preventDefault();
                        evento.stopPropagation();
                        void abrirAnexo(anexo.caminho);
                      }}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {anexo.nomeOriginal}
                      <DownloadOutlined style={{ marginLeft: 6 }} />
                    </Typography.Link>
                    <Popconfirm
                      title="Tem certeza que deseja excluir este anexo?"
                      okText="Excluir"
                      cancelText="Cancelar"
                      onConfirm={(evento) => {
                        evento?.stopPropagation();
                        void removerAnexoAvaliacao(avaliacao.id, anexo.id);
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        title="Excluir anexo"
                        onClick={(evento) => evento.stopPropagation()}
                      />
                    </Popconfirm>
                  </Space>
                ))}
                {avaliacao.anexoCaminho ? (
                  <Space size="small">
                    <Typography.Link
                      href={`${urlBaseApi()}/anexos/${encodeURIComponent(
                        avaliacao.anexoCaminho
                      )}`}
                      onClick={(evento) => {
                        evento.preventDefault();
                        evento.stopPropagation();
                        void abrirAnexo(avaliacao.anexoCaminho ?? "");
                      }}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {avaliacao.anexoNomeOriginal ?? "Anexo"}
                      <DownloadOutlined style={{ marginLeft: 6 }} />
                    </Typography.Link>
                    <Popconfirm
                      title="Tem certeza que deseja excluir este anexo?"
                      okText="Excluir"
                      cancelText="Cancelar"
                      onConfirm={(evento) => {
                        evento?.stopPropagation();
                        void removerAnexoAvaliacao(avaliacao.id);
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        title="Excluir anexo"
                        onClick={(evento) => evento.stopPropagation()}
                      />
                    </Popconfirm>
                  </Space>
                ) : null}
              </div>
            ) : null}
            {usuarioAdministrador ? (
              <span onClick={(evento) => evento.stopPropagation()}>
                <Popconfirm
                  title="Excluir avaliação?"
                  okText="Excluir"
                  cancelText="Cancelar"
                  onConfirm={(evento) => {
                    evento?.stopPropagation();
                    void removerAvaliacao(avaliacao.id);
                  }}
                >
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(evento) => evento.stopPropagation()}
                  >
                    Excluir
                  </Button>
                </Popconfirm>
              </span>
            ) : null}
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
      <input
        ref={arquivoInputRef}
        type="file"
        accept="*/*"
        style={{ display: "none" }}
        onChange={anexarArquivoAvaliacao}
      />
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
          onClick={() => navigate("/manual-pews")}
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
		                  gridTemplateColumns:
		                    "repeat(4, minmax(140px, 1fr)) minmax(300px, 360px)",
		                  gap: 12,
		                  alignItems: "stretch",
		                  overflowX: "auto",
		                }}
		              >
		                <Card size="small" style={{ minWidth: 140 }}>
		                  <Typography.Text type="secondary">Último PEWS</Typography.Text>
		                  <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
		                    {avaliacaoMaisRecente.pontuacaoTotal}
		                  </Typography.Title>
		                  <Tag color={classificacaoAtual.cor}>
		                    {classificacaoAtual.texto}
		                  </Tag>
		                </Card>
		                <Card size="small" style={{ minWidth: 140 }}>
		                  <Typography.Text type="secondary">Avaliações</Typography.Text>
		                  <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
		                    {avaliacoes.length}
		                  </Typography.Title>
		                </Card>
		                <Card size="small" style={{ minWidth: 140 }}>
		                  <Typography.Text type="secondary">Maior PEWS</Typography.Text>
		                  <Typography.Title level={3} style={{ margin: "4px 0 0" }}>
		                    {maiorPontuacao}
		                  </Typography.Title>
		                </Card>
		                <Card size="small" style={{ minWidth: 140 }}>
		                  <Typography.Text type="secondary">
		                    Última avaliação
		                  </Typography.Text>
		                  <Typography.Title level={5} style={{ margin: "8px 0 0" }}>
		                    {formatarDataHora(avaliacaoMaisRecente.criadoEm)}
		                  </Typography.Title>
		                </Card>

		                <GraficoEvolucaoPews avaliacoes={avaliacoes} />
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
