import {
  App,
  AutoComplete,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import type { CSSProperties } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiCriarAvaliacao } from "../api/avaliacaoServico";
import { apiListarPacientes } from "../api/pacienteServico";
import { useSessao } from "../contexts/SessaoContext";
import type { CorpoCriarAvaliacao } from "../types/avaliacao";

const { Title } = Typography;

type ValoresFormulario = {
  nomePaciente?: string;
  faixaEtaria?: string;
  leito?: string;
  diagnostico?: string;
  dih?: string;
  avaliacaoRespiratoria?: string;
  pontuacaoRespiratoria?: number;
  avaliacaoCardiovascular?: string;
  pontuacaoCardiovascular?: number;
  avaliacaoNeurologica?: string;
  pontuacaoNeurologica?: number;
  frequenciaRespiratoria?: number;
  frequenciaCardiaca?: number;
  vigilia?: boolean;
  emesePosOperatorio?: boolean;
  nebulizacaoResgate?: boolean;
  intervencao?: string;
  tempoControleSsvv?: string;
};

type OpcaoPontuada = {
  value: string;
  label: string;
  pontuacao: number;
};

const verde = "#1f6b3a";
const verdeClaro = "#88a98f";

const opcoesFaixaEtaria = [
  { value: "0 a 11 meses", label: "0 a 11 meses" },
  { value: "1 a 4 anos", label: "1 a 4 anos" },
  { value: "5 a 12 anos", label: "5 a 12 anos" },
  { value: "13 ou mais anos", label: "13 ou mais anos" },
];

const opcoesAvaliacaoRespiratoria: OpcaoPontuada[] = [
  {
    value: "FR normal para a idade, sem retração",
    label: "FR normal para a idade, sem retração",
    pontuacao: 0,
  },
  {
    value:
      "FR acima do limite superior para a idade, uso de musculatura acessória ou FiO2 >= 30% ou litros/min de O2",
    label:
      "FR acima do limite superior para a idade, uso de musculatura acessória ou FiO2 >= 30% ou litros/min de O2",
    pontuacao: 1,
  },
  {
    value:
      "FR >= 20 rpm acima do limite superior para a idade, retrações subcostais, intercostais e de fúrcula ou FiO2 >= 40% ou 6 litros/min de O2",
    label:
      "FR >= 20 rpm acima do limite superior para a idade, retrações subcostais, intercostais e de fúrcula ou FiO2 >= 40% ou 6 litros/min de O2",
    pontuacao: 2,
  },
  {
    value:
      "FR >= 5 rpm abaixo do limite inferior para a idade, retrações subcostais, intercostais, de fúrcula, do esterno e gemência ou FiO2 >= 50% ou 8 litros/min de O2",
    label:
      "FR >= 5 rpm abaixo do limite inferior para a idade, retrações subcostais, intercostais, de fúrcula, do esterno e gemência ou FiO2 >= 50% ou 8 litros/min de O2",
    pontuacao: 3,
  },
];

const opcoesAvaliacaoCardiovascular: OpcaoPontuada[] = [
  {
    value: "Corado ou TEC 1 - 2seg",
    label: "Corado ou TEC 1 - 2seg",
    pontuacao: 0,
  },
  {
    value:
      "Pálido ou TEC 3 seg ou FC acima do limite superior para a idade",
    label:
      "Pálido ou TEC 3 seg ou FC acima do limite superior para a idade",
    pontuacao: 1,
  },
  {
    value:
      "Moteado ou TEC 4seg ou FC >= 20bpm acima do limite superior para a idade",
    label:
      "Moteado ou TEC 4seg ou FC >= 20bpm acima do limite superior para a idade",
    pontuacao: 2,
  },
  {
    value:
      "Acinzentado/cianótico ou TEC >= 5seg ou FC >= 30 bpm acima do limite superior para a idade ou bradicardia para a idade",
    label:
      "Acinzentado/cianótico ou TEC >= 5seg ou FC >= 30 bpm acima do limite superior para a idade ou bradicardia para a idade",
    pontuacao: 3,
  },
];

const opcoesAvaliacaoNeurologica: OpcaoPontuada[] = [
  { value: "Ativo", label: "Ativo", pontuacao: 0 },
  { value: "Sonolento/Hipoativo", label: "Sonolento/Hipoativo", pontuacao: 1 },
  { value: "Irritado", label: "Irritado", pontuacao: 2 },
  {
    value: "Letárgico/Obnubilado ou resposta reduzida à dor",
    label: "Letárgico/Obnubilado ou resposta reduzida à dor",
    pontuacao: 3,
  },
];

const painel: CSSProperties = {
  border: "1px solid #8f8f8f",
  borderRadius: 12,
  background: "#f7f7f7",
  padding: 24,
  width: "min(100%, 824px)",
  margin: "0 auto",
};

const botaoPrincipal: CSSProperties = {
  minWidth: 164,
  height: 48,
  borderRadius: 4,
  background: verde,
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.24)",
  fontSize: 20,
};

function texto(valor: string | undefined) {
  const limpo = valor?.trim();

  return limpo === "" ? undefined : limpo;
}

function ordenarNomesPacientes(nomes: string[]) {
  return [...new Set(nomes)]
    .filter((nome) => nome.trim() !== "")
    .sort((a, b) =>
      a.localeCompare(b, "pt-BR", {
        sensitivity: "base",
      })
    );
}

function obterPontuacao(opcoes: OpcaoPontuada[], valor?: string) {
  return opcoes.find((opcao) => opcao.value === valor)?.pontuacao ?? 0;
}

function obterIntervencaoSugerida(pontuacao: number) {
  if (pontuacao <= 2) {
    return {
      intervencao:
        "Avaliação imediata do enfermeiro. Repetir o PEWS em 60 minutos, na permanência da pontuação, comunicar médico pediatra. Registrar orientações médicas em evolução de enfermagem e relatório técnico.",
      tempoControleSsvv: "Sinais Vitais de 4/4 horas.",
    };
  }

  if (pontuacao === 3) {
    return {
      intervencao:
        "Avaliação imediata do enfermeiro. Repetir o PEWS em 30 minutos, comunicar médico pediatra e definir a necessidade de chamado de intercorrência. Registrar orientações médicas em evolução de enfermagem e relatório técnico.",
      tempoControleSsvv: "Sinais Vitais de 2/2 horas.",
    };
  }

  if (pontuacao <= 6) {
    return {
      intervencao:
        "Avaliação/acompanhamento imediato do enfermeiro(a). Repetir o PEWS em 20 minutos, abrir chamado de intercorrência. Registrar orientações médicas em evolução de enfermagem e relatório técnico.",
      tempoControleSsvv: "Sinais Vitais de 1/1 hora.",
    };
  }

  return {
    intervencao:
      "Repetir o PEWS imediatamente por um segundo avaliador. Avaliação médica imediata. Considerar fluxo de PCR (Time de Resposta Rápida). Registrar orientações médicas em evolução de enfermagem e relatório técnico.",
    tempoControleSsvv: "Monitorização contínua.",
  };
}

export function PaginaNovaAvaliacao() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { token } = useSessao();

  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [gravando, setGravando] = useState(false);
  const [buscandoPacientes, setBuscandoPacientes] = useState(false);
  const [pontuacaoFinalizada, setPontuacaoFinalizada] = useState<
    number | undefined
  >(undefined);
  const [emesePontuada, setEmesePontuada] = useState(false);
  const [nebulizacaoPontuada, setNebulizacaoPontuada] = useState(false);
  const [opcoesPacientes, setOpcoesPacientes] = useState<
    { value: string; label: string }[]
  >([]);
  const temporizadorBuscaPaciente = useRef<number | undefined>(undefined);
  const buscaPacienteAtual = useRef(0);
  const [form] = Form.useForm<ValoresFormulario>();

  const pontuacaoRespiratoria =
    Form.useWatch("pontuacaoRespiratoria", form) ?? 0;
  const pontuacaoCardiovascular =
    Form.useWatch("pontuacaoCardiovascular", form) ?? 0;
  const pontuacaoNeurologica =
    Form.useWatch("pontuacaoNeurologica", form) ?? 0;

  const pontuacaoTotal = useMemo(
    () =>
      Number(pontuacaoRespiratoria) +
      Number(pontuacaoCardiovascular) +
      Number(pontuacaoNeurologica) +
      (emesePontuada ? 2 : 0) +
      (nebulizacaoPontuada ? 2 : 0),
    [
      pontuacaoCardiovascular,
      emesePontuada,
      nebulizacaoPontuada,
      pontuacaoNeurologica,
      pontuacaoRespiratoria,
    ]
  );
  const pontuacaoParaIntervencao =
    etapa === 3 ? pontuacaoFinalizada ?? pontuacaoTotal : pontuacaoTotal;
  const intervencaoSugerida = useMemo(
    () => obterIntervencaoSugerida(pontuacaoParaIntervencao),
    [pontuacaoParaIntervencao]
  );

  const buscarPacientes = useCallback(
    (nome: string) => {
      window.clearTimeout(temporizadorBuscaPaciente.current);
      buscaPacienteAtual.current += 1;
      const buscaAtual = buscaPacienteAtual.current;

      if (!token || nome.trim() === "") {
        setOpcoesPacientes([]);
        return;
      }

      temporizadorBuscaPaciente.current = window.setTimeout(async () => {
        setBuscandoPacientes(true);

        try {
          const pacientes = await apiListarPacientes(token, nome);

          if (buscaAtual !== buscaPacienteAtual.current) {
            return;
          }

          const nomesOrdenados = ordenarNomesPacientes(
            pacientes.map((paciente) => paciente.nome)
          );

          setOpcoesPacientes(
            nomesOrdenados.map((nomePaciente) => ({
              value: nomePaciente,
              label: nomePaciente,
            }))
          );
        } catch (e) {
          if (buscaAtual !== buscaPacienteAtual.current) {
            return;
          }

          setOpcoesPacientes([]);
          message.error(
            e instanceof Error
              ? e.message
              : "Não foi possível buscar pacientes."
          );
        } finally {
          if (buscaAtual === buscaPacienteAtual.current) {
            setBuscandoPacientes(false);
          }
        }
      }, 300);
    },
    [message, token]
  );

  async function avancarPrimeiraEtapa() {
    await form.validateFields([
      "nomePaciente",
      "faixaEtaria",
      "leito",
      "diagnostico",
      "dih",
    ]);
    setEtapa(2);
  }

  async function avancarSegundaEtapa() {
    await form.validateFields([
      "avaliacaoRespiratoria",
      "avaliacaoCardiovascular",
      "avaliacaoNeurologica",
    ]);

    const valores = form.getFieldsValue(true);
    const total =
      Number(valores.pontuacaoRespiratoria ?? 0) +
      Number(valores.pontuacaoCardiovascular ?? 0) +
      Number(valores.pontuacaoNeurologica ?? 0) +
      (valores.emesePosOperatorio ? 2 : 0) +
      (valores.nebulizacaoResgate ? 2 : 0);

    setPontuacaoFinalizada(total);
    setEtapa(3);
  }

  async function finalizarAvaliacao(proximaAcao: "nova" | "inicio") {
    if (!token) {
      return;
    }

    try {
      await form.validateFields();

      const valores = form.getFieldsValue(true);
      const corpo: CorpoCriarAvaliacao = {
        nomePaciente: texto(valores.nomePaciente),
        faixaEtaria: texto(valores.faixaEtaria),
        leito: texto(valores.leito),
        diagnostico: texto(valores.diagnostico),
        dih: texto(valores.dih),
        avaliacaoRespiratoria: texto(valores.avaliacaoRespiratoria),
        pontuacaoRespiratoria: valores.pontuacaoRespiratoria ?? 0,
        avaliacaoCardiovascular: texto(valores.avaliacaoCardiovascular),
        pontuacaoCardiovascular: valores.pontuacaoCardiovascular ?? 0,
        avaliacaoNeurologica: texto(valores.avaliacaoNeurologica),
        pontuacaoNeurologica: valores.pontuacaoNeurologica ?? 0,
        frequenciaRespiratoria: valores.frequenciaRespiratoria,
        frequenciaCardiaca: valores.frequenciaCardiaca,
        vigilia: valores.vigilia ?? false,
        emesePosOperatorio: valores.emesePosOperatorio ?? false,
        nebulizacaoResgate: valores.nebulizacaoResgate ?? false,
        pontuacaoTotal: pontuacaoParaIntervencao,
        intervencao: intervencaoSugerida.intervencao,
        tempoControleSsvv: intervencaoSugerida.tempoControleSsvv,
      };

      setGravando(true);
      await apiCriarAvaliacao(token, corpo);
      message.success("Avaliação cadastrada.");

      if (proximaAcao === "nova") {
        novaAvaliacao();
      } else {
        navigate("/inicio");
      }
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) {
        return;
      }

      message.error(
        e instanceof Error
          ? e.message
          : "Não foi possível cadastrar a avaliação."
      );
    } finally {
      setGravando(false);
    }
  }

  function novaAvaliacao() {
    form.resetFields();
    setPontuacaoFinalizada(undefined);
    setEmesePontuada(false);
    setNebulizacaoPontuada(false);
    setEtapa(1);
  }

  return (
    <div>
      <nav
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          margin: "-24px -24px 20px",
          background: verdeClaro,
        }}
      >
        <Button
          type="text"
          onClick={novaAvaliacao}
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Nova Avaliação
        </Button>
        <Button
          type="text"
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Histórico Geral
        </Button>
        <Button
          type="text"
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Como Utilizar o PEWS
        </Button>
      </nav>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          pontuacaoRespiratoria: 0,
          pontuacaoCardiovascular: 0,
          pontuacaoNeurologica: 0,
          vigilia: false,
          emesePosOperatorio: false,
          nebulizacaoResgate: false,
        }}
      >
        {etapa === 1 ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title
              level={2}
              style={{ color: "#064b24", textAlign: "center", margin: 0 }}
            >
              Formulário de Nova Avaliação
            </Title>

            <div style={painel}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 250px",
                  gap: "18px 76px",
                }}
              >
                <Form.Item name="nomePaciente" label="Nome do Paciente">
                  <AutoComplete
                    size="large"
                    options={opcoesPacientes}
                    onSearch={buscarPacientes}
                    placeholder="Digite o nome do paciente"
                    notFoundContent={
                      buscandoPacientes ? "Buscando..." : null
                    }
                    filterOption={false}
                    allowClear
                  />
                </Form.Item>

                <Form.Item name="faixaEtaria" label="Faixa Etária">
                  <Select
                    size="large"
                    placeholder="Selecione"
                    options={opcoesFaixaEtaria}
                  />
                </Form.Item>

                <Form.Item name="leito" label="Leito">
                  <Input size="large" />
                </Form.Item>

                <Form.Item name="diagnostico" label="Diagnóstico">
                  <Input size="large" />
                </Form.Item>

                <Form.Item name="dih" label="DIH">
                  <Input size="large" />
                </Form.Item>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 80,
              }}
            >
              <Button
                type="primary"
                style={botaoPrincipal}
                onClick={() => navigate("/inicio")}
              >
                Voltar
              </Button>
              <Button
                type="primary"
                style={botaoPrincipal}
                onClick={() => void avancarPrimeiraEtapa()}
              >
                Avançar
              </Button>
            </div>
          </Space>
        ) : null}

        {etapa === 2 ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title
              level={2}
              style={{ color: "#064b24", textAlign: "center", margin: 0 }}
            >
              Formulário de Nova Avaliação
            </Title>

            <div style={{ ...painel, width: "min(100%, 1028px)" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 54px 120px",
                  alignItems: "center",
                  gap: "18px 18px",
                }}
              >
                <Form.Item
                  name="avaliacaoRespiratoria"
                  label="Avaliação Respiratória"
                  rules={[
                    {
                      required: true,
                      message: "Selecione a avaliação respiratória.",
                    },
                  ]}
                  style={{ margin: 0 }}
                >
                  <Select
                    placeholder="Selecione"
                    options={opcoesAvaliacaoRespiratoria}
                    onChange={(valor) =>
                      form.setFieldValue(
                        "pontuacaoRespiratoria",
                        obterPontuacao(opcoesAvaliacaoRespiratoria, valor)
                      )
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="pontuacaoRespiratoria"
                  label=" "
                  style={{ margin: 0 }}
                >
                  <InputNumber min={0} style={{ width: 44 }} />
                </Form.Item>
                <div
                  style={{
                    gridRow: "1 / 4",
                    gridColumn: 3,
                    justifySelf: "center",
                    border: "1px solid #9a9a9a",
                    borderRadius: 4,
                    width: 84,
                    height: 84,
                    display: "grid",
                    placeItems: "center",
                    background: "#fff",
                    fontSize: 64,
                    lineHeight: 1,
                  }}
                >
                  {pontuacaoTotal}
                </div>

                <Form.Item
                  name="avaliacaoCardiovascular"
                  label="Avaliação Cardiovascular"
                  rules={[
                    {
                      required: true,
                      message: "Selecione a avaliação cardiovascular.",
                    },
                  ]}
                  style={{ margin: 0 }}
                >
                  <Select
                    placeholder="Selecione"
                    options={opcoesAvaliacaoCardiovascular}
                    onChange={(valor) =>
                      form.setFieldValue(
                        "pontuacaoCardiovascular",
                        obterPontuacao(opcoesAvaliacaoCardiovascular, valor)
                      )
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="pontuacaoCardiovascular"
                  label=" "
                  style={{ margin: 0 }}
                >
                  <InputNumber min={0} style={{ width: 44 }} />
                </Form.Item>

                <Form.Item
                  name="avaliacaoNeurologica"
                  label="Avaliação Neurológica"
                  rules={[
                    {
                      required: true,
                      message: "Selecione a avaliação neurológica.",
                    },
                  ]}
                  style={{ margin: 0 }}
                >
                  <Select
                    placeholder="Selecione"
                    options={opcoesAvaliacaoNeurologica}
                    onChange={(valor) =>
                      form.setFieldValue(
                        "pontuacaoNeurologica",
                        obterPontuacao(opcoesAvaliacaoNeurologica, valor)
                      )
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="pontuacaoNeurologica"
                  label=" "
                  style={{ margin: 0 }}
                >
                  <InputNumber min={0} style={{ width: 44 }} />
                </Form.Item>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "250px 1fr",
                  gap: "18px 80px",
                  marginTop: 18,
                }}
              >
                <Form.Item
                  name="frequenciaRespiratoria"
                  label="Frequência Respiratória (ipm)"
                  style={{ margin: 0 }}
                >
                  <InputNumber min={0} style={{ width: 44 }} />
                </Form.Item>

                <Form.Item
                  name="emesePosOperatorio"
                  label="3 Episódios ou mais de êmese pós-operatório"
                  valuePropName="checked"
                  style={{ margin: 0 }}
                >
                  <Switch
                    checked={emesePontuada}
                    onChange={(checked) => {
                      setEmesePontuada(checked);
                      form.setFieldValue("emesePosOperatorio", checked);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="frequenciaCardiaca"
                  label="Frequência Cardíaca (bpm)"
                  style={{ margin: 0 }}
                >
                  <InputNumber min={0} style={{ width: 44 }} />
                </Form.Item>

                <Form.Item
                  name="nebulizacaoResgate"
                  label="Nebulização de resgate em 15 minutos"
                  valuePropName="checked"
                  style={{ margin: 0 }}
                >
                  <Switch
                    checked={nebulizacaoPontuada}
                    onChange={(checked) => {
                      setNebulizacaoPontuada(checked);
                      form.setFieldValue("nebulizacaoResgate", checked);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="vigilia"
                  label="Vigília"
                  valuePropName="checked"
                  style={{ margin: 0 }}
                >
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <Button
                type="primary"
                style={botaoPrincipal}
                onClick={() => setEtapa(1)}
              >
                Voltar
              </Button>
              <Button
                type="primary"
                style={botaoPrincipal}
                loading={gravando}
                onClick={() => void avancarSegundaEtapa()}
              >
                Finalizar
              </Button>
            </div>
          </Space>
        ) : null}

        {etapa === 3 ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title
              level={2}
              style={{ color: "#064b24", textAlign: "center", margin: 0 }}
            >
              Avaliação Finalizada
            </Title>

            <div style={{ ...painel, width: "min(100%, 672px)" }}>
              <Form.Item label="Intervenção">
                <div
                  style={{
                    minHeight: 96,
                    border: "1px solid #8c8c8c",
                    borderRadius: 4,
                    padding: "8px 10px",
                    background: "#fff",
                    color: "#000",
                    fontSize: 20,
                    lineHeight: 1.25,
                  }}
                >
                  {intervencaoSugerida.intervencao}
                </div>
              </Form.Item>

              <Form.Item
                label="Tempo de controle de SSVV"
                style={{ marginBottom: 0 }}
              >
                <div
                  style={{
                    minHeight: 96,
                    border: "1px solid #8c8c8c",
                    borderRadius: 4,
                    padding: "8px 10px",
                    background: "#fff",
                    color: "#000",
                    fontSize: 20,
                    lineHeight: 1.25,
                  }}
                >
                  {intervencaoSugerida.tempoControleSsvv}
                </div>
              </Form.Item>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 16,
                alignItems: "center",
                marginTop: 140,
              }}
            >
              <Button
                type="primary"
                style={botaoPrincipal}
                onClick={() => setEtapa(2)}
              >
                Voltar
              </Button>
              <Button
                type="primary"
                style={botaoPrincipal}
                loading={gravando}
                onClick={() => void finalizarAvaliacao("nova")}
              >
                Nova Avaliação
              </Button>
              <Button
                type="primary"
                style={{ ...botaoPrincipal, justifySelf: "end" }}
                loading={gravando}
                onClick={() => void finalizarAvaliacao("inicio")}
              >
                Início
              </Button>
            </div>
          </Space>
        ) : null}
      </Form>
    </div>
  );
}
