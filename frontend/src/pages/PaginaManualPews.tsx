import {
  AlertOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const verde = "#1f6b3a";
const verdeClaro = "#88a98f";
const verdeEscuro = "#0f3f24";
const verdeSuave = "#eef7f0";
const cinzaBorda = "#d7e2da";

type Criterio = {
  pontos: string;
  texto: string;
};

type SecaoManual = {
  titulo: string;
  subtitulo: string;
  icone: ReactNode;
  criterios: Criterio[];
  nota?: string;
};

type Intervencao = {
  faixa: string;
  titulo: string;
  acoes: string[];
  destaque: string;
};

const secoes: SecaoManual[] = [
  {
    titulo: "Estado Neurológico",
    subtitulo: "Observe atividade, resposta e nível de consciência.",
    icone: <BulbOutlined />,
    criterios: [
      { pontos: "0 ponto", texto: "Ativo." },
      { pontos: "1 ponto", texto: "Sonolento ou hipoativo." },
      { pontos: "2 pontos", texto: "Irritado." },
      {
        pontos: "3 pontos",
        texto: "Letárgico, obnubilado ou com resposta reduzida à dor.",
      },
    ],
  },
  {
    titulo: "Estado Cardiovascular",
    subtitulo: "Avalie cor, perfusão, TEC e frequência cardíaca.",
    icone: <HeartOutlined />,
    criterios: [
      { pontos: "0 ponto", texto: "Corado ou TEC de 1 a 2 segundos." },
      {
        pontos: "1 ponto",
        texto: "Pálido, TEC de 3 segundos ou FC acima do limite superior para a idade.",
      },
      {
        pontos: "2 pontos",
        texto: "Moteado, TEC de 4 segundos ou FC >= 20 bpm acima do limite superior para a idade.",
      },
      {
        pontos: "3 pontos",
        texto: "Acinzentado/cianótico, TEC >= 5 segundos, FC >= 30 bpm acima do limite superior para a idade ou bradicardia.",
      },
    ],
  },
  {
    titulo: "Estado Respiratório",
    subtitulo: "Considere FR, retrações, gemência e necessidade de O2.",
    icone: <DashboardOutlined />,
    criterios: [
      {
        pontos: "0 ponto",
        texto: "Frequência respiratória normal para a idade, sem retrações.",
      },
      {
        pontos: "1 ponto",
        texto: "FR acima do limite superior, uso de musculatura acessória ou FiO2 >= 30%.",
      },
      {
        pontos: "2 pontos",
        texto: "FR >= 20 rpm acima do limite superior, retrações subcostais/intercostais/de fúrcula ou FiO2 >= 40%.",
      },
      {
        pontos: "3 pontos",
        texto: "FR >= 5 rpm abaixo do limite inferior, retrações importantes, gemência ou FiO2 >= 50%.",
      },
    ],
  },
  {
    titulo: "Nebulizadores",
    subtitulo: "Pontue quando houver nebulização de resgate recente.",
    icone: <MedicineBoxOutlined />,
    criterios: [
      {
        pontos: "0 ponto",
        texto: "Não realizou nebulização de resgate nos últimos 15 minutos.",
      },
      {
        pontos: "2 pontos",
        texto: "Recebeu nebulização de resgate nos últimos 15 minutos.",
      },
    ],
    nota: "Nebulização de resgate inclui inalação com soro fisiológico 0,9% associada a broncodilatadores.",
  },
  {
    titulo: "Vômitos",
    subtitulo: "Aplicável ao pós-operatório.",
    icone: <ExperimentOutlined />,
    criterios: [
      {
        pontos: "0 ponto",
        texto: "Não apresenta vômito no pós-operatório.",
      },
      {
        pontos: "2 pontos",
        texto: "Apresenta 3 ou mais episódios de vômito no pós-operatório.",
      },
    ],
    nota: "Considere este item para vômitos persistentes em crianças submetidas a cirurgias.",
  },
];

const intervencoes: Intervencao[] = [
  {
    faixa: "0 ponto",
    titulo: "Rotina de avaliação",
    destaque: "Sinais vitais de 6/6 horas",
    acoes: ["Manter rotina de avaliação.", "PEWS a cada 24 horas."],
  },
  {
    faixa: "1 a 2 pontos",
    titulo: "Reavaliar em 60 minutos",
    destaque: "Sinais vitais de 4/4 horas",
    acoes: [
      "Avaliação imediata do enfermeiro.",
      "Repetir o PEWS em 60 minutos.",
      "Comunicar médico pediatra se a pontuação permanecer.",
    ],
  },
  {
    faixa: "3 pontos",
    titulo: "Reavaliar em 30 minutos",
    destaque: "Sinais vitais de 2/2 horas",
    acoes: [
      "Avaliação imediata do enfermeiro.",
      "Repetir o PEWS em 30 minutos.",
      "Comunicar médico pediatra e definir necessidade de chamado de intercorrência.",
    ],
  },
  {
    faixa: "4 a 6 pontos",
    titulo: "Acompanhamento imediato",
    destaque: "Sinais vitais de 1/1 hora",
    acoes: [
      "Avaliação/acompanhamento imediato do enfermeiro(a).",
      "Repetir o PEWS em 20 minutos.",
      "Abrir chamado de intercorrencia.",
    ],
  },
  {
    faixa: ">= 7 pontos",
    titulo: "Resposta imediata",
    destaque: "Monitorização contínua",
    acoes: [
      "Repetir o PEWS imediatamente por um segundo avaliador.",
      "Solicitar avaliação médica imediata.",
      "Considerar fluxo de PCR / Time de Resposta Rapida.",
    ],
  },
];

const parametros = [
  {
    titulo: "Frequência cardíaca",
    itens: [
      "Recém-nascido: vigília 100-205 bpm; sono 90-160 bpm.",
      "1 mês a < 1 ano: vigília 100-180 bpm; sono 90-160 bpm.",
      "1 a 3 anos: vigília 98-140 bpm; sono 80-120 bpm.",
      "4 a 5 anos: vigília 80-120 bpm; sono 65-100 bpm.",
      "6 a 12 anos: vigília 75-118 bpm; sono 58-90 bpm.",
      "13 a 18 anos: vigília 60-100 bpm; sono 50-90 bpm.",
    ],
  },
  {
    titulo: "Frequência respiratória",
    itens: [
      "< 2 meses: 30-60 rpm.",
      "2 meses a < 1 ano: 30-53 rpm.",
      "1 a 3 anos: 22-37 rpm.",
      "4 a 5 anos: 20-28 rpm.",
      "6 a 12 anos: 18-25 rpm.",
      "> 12 anos: 12-20 rpm.",
    ],
  },
];

const botaoNavegacao: CSSProperties = {
  color: "#fff",
  height: 40,
  fontSize: 22,
};

function CartaoCriterios({ secao }: { secao: SecaoManual }) {
  return (
    <section
      style={{
        border: `1px solid ${cinzaBorda}`,
        borderRadius: 8,
        background: "#fff",
        padding: 18,
        boxShadow: "0 8px 22px rgba(31, 107, 58, 0.08)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "42px 1fr",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: verdeSuave,
            color: verde,
            fontSize: 22,
          }}
        >
          {secao.icone}
        </div>
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: verdeEscuro }}>
            {secao.titulo}
          </Typography.Title>
          <Typography.Text type="secondary">{secao.subtitulo}</Typography.Text>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {secao.criterios.map((criterio) => (
          <div
            key={`${secao.titulo}-${criterio.pontos}`}
            style={{
              display: "grid",
              gridTemplateColumns: "96px 1fr",
              gap: 12,
              alignItems: "start",
              padding: "12px 0",
              borderTop: `1px solid ${cinzaBorda}`,
            }}
          >
            <Tag
              color={criterio.pontos.startsWith("0") ? "green" : "gold"}
              style={{ width: "fit-content", margin: 0 }}
            >
              {criterio.pontos}
            </Tag>
            <Typography.Text>{criterio.texto}</Typography.Text>
          </div>
        ))}
      </div>

      {secao.nota ? (
        <Typography.Paragraph
          style={{
            margin: "16px 0 0",
            padding: 12,
            borderRadius: 8,
            background: "#f6f8f6",
            color: "#4b5b50",
          }}
        >
          {secao.nota}
        </Typography.Paragraph>
      ) : null}
    </section>
  );
}

export function PaginaManualPews() {
  const navigate = useNavigate();

  return (
    <div style={{ margin: "-24px" }}>
      <nav
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          background: verdeClaro,
        }}
      >
        <Button type="text" onClick={() => navigate("/inicio")} style={botaoNavegacao}>
          Histórico Geral
        </Button>
        <Button
          type="text"
          onClick={() => navigate("/avaliacoes/nova")}
          style={botaoNavegacao}
        >
          Nova Avaliação
        </Button>
        <Button type="text" style={botaoNavegacao}>
          Como Utilizar o PEWS
        </Button>
      </nav>

      <main
        style={{
          minHeight: "calc(100vh - 104px)",
          background: "linear-gradient(180deg, #f6fbf7 0%, #ffffff 38%)",
          padding: 24,
        }}
      >
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 0.7fr)",
            gap: 20,
            alignItems: "stretch",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              borderRadius: 8,
              background: verde,
              color: "#fff",
              padding: 28,
              minHeight: 190,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography.Title level={2} style={{ color: "#fff", marginTop: 0 }}>
              Como Utilizar o PEWS
            </Typography.Title>
            <Typography.Paragraph style={{ color: "#eef7f0", fontSize: 17, margin: 0 }}>
              Some os pontos dos domínios clínicos observados e utilize a faixa final
              para orientar tempo de reavaliação, sinais vitais e acionamentos.
            </Typography.Paragraph>
          </div>

          <aside
            style={{
              border: `1px solid ${cinzaBorda}`,
              borderRadius: 8,
              background: "#fff",
              padding: 20,
              display: "grid",
              alignContent: "center",
              gap: 12,
            }}
          >
            <AlertOutlined style={{ color: verde, fontSize: 28 }} />
            <Typography.Title level={4} style={{ margin: 0, color: verdeEscuro }}>
              Registro obrigatório
            </Typography.Title>
            <Typography.Text>
              Orientações médicas e intervenções devem ser registradas em prontuário,
              evolução de enfermagem e relatório técnico.
            </Typography.Text>
          </aside>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {secoes.map((secao) => (
            <CartaoCriterios key={secao.titulo} secao={secao} />
          ))}
        </section>

        <section
          style={{
            borderRadius: 8,
            background: verdeEscuro,
            color: "#fff",
            padding: 22,
            marginBottom: 24,
          }}
        >
          <Typography.Title level={3} style={{ color: "#fff", marginTop: 0 }}>
            Intervenções por pontuação
          </Typography.Title>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {intervencoes.map((item) => (
              <article
                key={item.faixa}
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.08)",
                  padding: 16,
                }}
              >
                <Tag color={item.faixa === ">= 7 pontos" ? "red" : "green"}>
                  {item.faixa}
                </Tag>
                <Typography.Title level={5} style={{ color: "#fff", margin: "10px 0 4px" }}>
                  {item.titulo}
                </Typography.Title>
                <Typography.Text style={{ color: "#d9f0de" }}>
                  <ClockCircleOutlined /> {item.destaque}
                </Typography.Text>
                <ul style={{ paddingLeft: 18, margin: "12px 0 0" }}>
                  {item.acoes.map((acao) => (
                    <li key={acao} style={{ marginBottom: 8 }}>
                      {acao}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {parametros.map((grupo) => (
            <article
              key={grupo.titulo}
              style={{
                border: `1px solid ${cinzaBorda}`,
                borderRadius: 8,
                background: "#fff",
                padding: 18,
              }}
            >
              <Typography.Title level={4} style={{ color: verdeEscuro, marginTop: 0 }}>
                <CheckCircleOutlined style={{ color: verde }} /> {grupo.titulo}
              </Typography.Title>
              <div style={{ display: "grid", gap: 8 }}>
                {grupo.itens.map((item) => (
                  <Typography.Text key={item}>{item}</Typography.Text>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
