import {
  App,
  AutoComplete,
  Button,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import type { ChangeEvent, CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  apiAnexarArquivoAvaliacao,
  apiAtualizarAvaliacao,
  apiCriarAvaliacao,
  apiExcluirAnexoAvaliacao,
} from "../api/avaliacaoServico";
import {
  apiBuscarPacientePorId,
  apiListarPacientes,
} from "../api/pacienteServico";
import { urlBaseApi } from "../api/requisicoes";
import { useSessao } from "../contexts/SessaoContext";
import { imprimirAvaliacao } from "../lib/impressaoAvaliacao";
import { CloseOutlined, UploadOutlined } from "@ant-design/icons";
import type { CorpoCriarAvaliacao } from "../types/avaliacao";
import type { Paciente } from "../types/paciente";

type AnexoSelecionado = {
  id: number;
  caminho: string;
  nomeOriginal: string;
  criadoEm: string;
};

const { Title } = Typography;

type ValoresFormulario = {
  pacienteId?: number;
  nomePaciente?: string;
  faixaEtaria?: string;
  leito?: string;
  diagnostico?: string;
  dih?: number;
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

type OpcaoPaciente = {
  value: string;
  label: string;
  pacienteId: number;
  faixaEtaria: string;
};

type EstadoNavegacaoAvaliacao = {
  nomePaciente?: string;
  faixaEtaria?: string;
};

const verde = "#1f6b3a";
const verdeClaro = "#88a98f";

const etapasAvaliacao = [1, 2, 3] as const;

const opcoesFaixaEtaria = [
  { value: "0 a 11 meses", label: "0 a 11 meses" },
  { value: "1 a 4 anos", label: "1 a 4 anos" },
  { value: "5 a 12 anos", label: "5 a 12 anos" },
  { value: "13 ou mais anos", label: "13 ou mais anos" },
];

const opcoesLeito = [
  { value: "LEITO_01", label: "Leito 01" },
  { value: "LEITO_02", label: "Leito 02" },
  { value: "LEITO_03", label: "Leito 03" },
  { value: "LEITO_04", label: "Leito 04" },
  { value: "LEITO_05", label: "Leito 05" },
  { value: "LEITO_06", label: "Leito 06" },
  { value: "LEITO_07", label: "Leito 07" },
  { value: "LEITO_08", label: "Leito 08" },
  { value: "LEITO_09", label: "Leito 09" },
  { value: "LEITO_10", label: "Leito 10" },
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

const botaoVoltar: CSSProperties = {
  ...botaoPrincipal,
  justifySelf: "start",
};

const navegacaoFormulario: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  marginTop: 20,
};

const painelEtapaFormulario: CSSProperties = {
  ...painel,
  minHeight: 360,
};

function texto(valor: string | undefined) {
  const limpo = valor?.trim();

  return limpo === "" ? undefined : limpo;
}

function calcularFaixaEtaria(dataNascimento: string | null | undefined) {
  if (!dataNascimento) {
    return undefined;
  }

  const nascimento = new Date(`${dataNascimento}T00:00:00`);

  if (Number.isNaN(nascimento.getTime())) {
    return undefined;
  }

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() < nascimento.getDate());

  if (aindaNaoFezAniversario) {
    idade -= 1;
  }

  if (idade < 1) {
    return "0 a 11 meses";
  }

  if (idade <= 4) {
    return "1 a 4 anos";
  }

  if (idade <= 12) {
    return "5 a 12 anos";
  }

  return "13 ou mais anos";
}

function ordenarPacientes(pacientes: Paciente[]) {
  return [...pacientes]
    .filter((paciente) => paciente.nome.trim() !== "")
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", {
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
  const location = useLocation();
  const [parametrosBusca] = useSearchParams();
  const { token, usuario } = useSessao();
  const pacienteIdInicial = Number(parametrosBusca.get("pacienteId"));
  const estadoNavegacao = location.state as EstadoNavegacaoAvaliacao | null;

  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [gravando, setGravando] = useState(false);
  const [buscandoPacientes, setBuscandoPacientes] = useState(false);
  const [carregandoPacienteInicial, setCarregandoPacienteInicial] =
    useState(false);
  const [pacienteFixoId, setPacienteFixoId] = useState<number | undefined>(
    Number.isFinite(pacienteIdInicial) && pacienteIdInicial > 0
      ? pacienteIdInicial
      : undefined
  );
  const [pacienteFixo, setPacienteFixo] = useState<Paciente | null>(null);
  const [pontuacaoFinalizada, setPontuacaoFinalizada] = useState<
    number | undefined
  >(undefined);
  const [emesePontuada, setEmesePontuada] = useState(false);
  const [nebulizacaoPontuada, setNebulizacaoPontuada] = useState(false);
  const [opcoesPacientes, setOpcoesPacientes] = useState<OpcaoPaciente[]>([]);
  const temporizadorBuscaPaciente = useRef<number | undefined>(undefined);
  const buscaPacienteAtual = useRef(0);
  const [form] = Form.useForm<ValoresFormulario>();
  const arquivoInputRef = useRef<HTMLInputElement | null>(null);
  const [avaliacaoIdSalva, setAvaliacaoIdSalva] = useState<number>();
  const [anexosSelecionados, setAnexosSelecionados] = useState<AnexoSelecionado[]>([]);
  const [anexoCarregando, setAnexoCarregando] = useState(false);

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

  const preencherPaciente = useCallback(
    (paciente: Paciente) => {
      const faixaEtaria = calcularFaixaEtaria(paciente.dataNascimento);

      form.setFieldsValue({
        pacienteId: paciente.id,
        nomePaciente: paciente.nome,
        faixaEtaria,
      });
      setPacienteFixo(paciente);
      setPacienteFixoId(paciente.id);
    },
    [form]
  );

  useEffect(() => {
    const proximoPacienteId = Number(parametrosBusca.get("pacienteId"));

    if (Number.isFinite(proximoPacienteId) && proximoPacienteId > 0) {
      setPacienteFixoId(proximoPacienteId);
    }
  }, [parametrosBusca]);

  useEffect(() => {
    if (pacienteFixoId || !estadoNavegacao) {
      return;
    }

    form.setFieldsValue({
      nomePaciente: estadoNavegacao.nomePaciente,
      faixaEtaria: estadoNavegacao.faixaEtaria,
    });
  }, [estadoNavegacao, form, pacienteFixoId]);

  useEffect(() => {
    if (!token || !pacienteFixoId) {
      return;
    }

    let cancelado = false;
    const tokenAtual = token;
    const idPacienteAtual = pacienteFixoId;

    async function carregarPacienteInicial() {
      setCarregandoPacienteInicial(true);

      try {
        const paciente = await apiBuscarPacientePorId(
          tokenAtual,
          idPacienteAtual
        );

        if (!cancelado) {
          preencherPaciente(paciente);
        }
      } catch (e) {
        if (!cancelado) {
          message.error(
            e instanceof Error
              ? e.message
              : "Não foi possível buscar os dados do paciente."
          );
        }
      } finally {
        if (!cancelado) {
          setCarregandoPacienteInicial(false);
        }
      }
    }

    void carregarPacienteInicial();

    return () => {
      cancelado = true;
    };
  }, [message, pacienteFixoId, preencherPaciente, token]);

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

          const pacientesOrdenados = ordenarPacientes(pacientes);

          setOpcoesPacientes(
            pacientesOrdenados.map((paciente) => ({
              value: paciente.nome,
              label: paciente.nome,
              pacienteId: paciente.id,
              faixaEtaria:
                calcularFaixaEtaria(paciente.dataNascimento) ?? "",
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
      "nomePaciente",
      "faixaEtaria",
      "leito",
      "diagnostico",
      "dih",
      "avaliacaoRespiratoria",
      "avaliacaoCardiovascular",
      "avaliacaoNeurologica",
      "frequenciaRespiratoria",
      "frequenciaCardiaca",
    ]);

    const total =
      Number(pontuacaoRespiratoria) +
      Number(pontuacaoCardiovascular) +
      Number(pontuacaoNeurologica) +
      (emesePontuada ? 2 : 0) +
      (nebulizacaoPontuada ? 2 : 0);

    setPontuacaoFinalizada(total);

    try {
      await salvarAvaliacaoParcial();
      message.success("Avaliação salva com sucesso.");
      setEtapa(3);
    } catch (erro) {
      message.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar a avaliação."
      );
    }
  }

  function construirCorpoAvaliacao(): CorpoCriarAvaliacao {
    const valores = form.getFieldsValue(true);

    return {
      pacienteId: valores.pacienteId,
      nomePaciente: texto(valores.nomePaciente),
      faixaEtaria: texto(valores.faixaEtaria),
      leito: texto(valores.leito),
      diagnostico: texto(valores.diagnostico),
      dih:
        valores.dih !== undefined && valores.dih !== null
          ? String(valores.dih)
          : undefined,
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
  }

  async function salvarAvaliacaoParcial() {
    if (!token) {
      throw new Error("Token ausente.");
    }

    const corpo = construirCorpoAvaliacao();

    if (avaliacaoIdSalva) {
      const avaliacaoAtualizada = await apiAtualizarAvaliacao(
        token,
        avaliacaoIdSalva,
        corpo
      );
      setAvaliacaoIdSalva(avaliacaoAtualizada.id);
      return avaliacaoAtualizada.id;
    }

    const novaAvaliacao = await apiCriarAvaliacao(token, corpo);
    setAvaliacaoIdSalva(novaAvaliacao.id);
    return novaAvaliacao.id;
  }

  async function anexarArquivoAvaliacao(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!token) {
      message.error("Usuário não autenticado.");
      return;
    }

    if (anexosSelecionados.length >= 3) {
      message.warning(
        "São permitidos 3 arquivos por avaliação. Limite atingido"
      );
      return;
    }

    setAnexoCarregando(true);

    try {
      const avaliacaoId = await salvarAvaliacaoParcial();
      const avaliacaoAtualizada = await apiAnexarArquivoAvaliacao(
        token,
        avaliacaoId,
        arquivo
      );

      setAnexosSelecionados(avaliacaoAtualizada.anexos ?? [
        ...anexosSelecionados,
        {
          id: Date.now(),
          caminho: avaliacaoAtualizada.anexoCaminho ?? arquivo.name,
          nomeOriginal:
            avaliacaoAtualizada.anexoNomeOriginal ?? arquivo.name,
          criadoEm: new Date().toISOString(),
        },
      ]);
      setAvaliacaoIdSalva(avaliacaoAtualizada.id);
      message.success("Arquivo anexado com sucesso.");
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : "Não foi possível anexar o arquivo."
      );
    } finally {
      setAnexoCarregando(false);
      if (arquivoInputRef.current) {
        arquivoInputRef.current.value = "";
      }
    }
  }

  async function finalizarAvaliacao(proximaAcao: "nova" | "inicio") {
    if (!token) {
      return;
    }

    try {
      await form.validateFields();

      const corpo = construirCorpoAvaliacao();
      setGravando(true);

      if (avaliacaoIdSalva) {
        const avaliacaoAtualizada = await apiAtualizarAvaliacao(
          token,
          avaliacaoIdSalva,
          corpo
        );
        setAvaliacaoIdSalva(avaliacaoAtualizada.id);
      } else {
        const novaAvaliacao = await apiCriarAvaliacao(token, corpo);
        setAvaliacaoIdSalva(novaAvaliacao.id);
      }

      message.success("Avaliação salva com sucesso.");

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
    if (pacienteFixo) {
      preencherPaciente(pacienteFixo);
    } else if (pacienteFixoId) {
      form.setFieldsValue({ pacienteId: pacienteFixoId });
    }
    setPontuacaoFinalizada(undefined);
    setEmesePontuada(false);
    setNebulizacaoPontuada(false);
    setAvaliacaoIdSalva(undefined);
    setAnexosSelecionados([]);
    setEtapa(1);
  }

  const imprimirAvaliacaoAtual = useCallback(async () => {
    try {
      await form.validateFields();

      const valores = form.getFieldsValue(true);

      imprimirAvaliacao(
        {
          pacienteNome: texto(valores.nomePaciente) ?? "-",
          faixaEtaria: texto(valores.faixaEtaria),
          leito: texto(valores.leito),
          diagnostico: texto(valores.diagnostico),
          dih: valores.dih,
          avaliadorNome: usuario?.nome,
          criadoEm: new Date().toISOString(),
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
        },
        "Avaliação PEWS"
      );
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : "Não foi possível gerar a impressão."
      );
    }
  }, [form, intervencaoSugerida, message, pontuacaoParaIntervencao, usuario?.nome]);

  function renderNavegacaoEtapas() {
    return (
      <nav
        aria-label="Etapas da avaliação"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          minHeight: 28,
        }}
      >
        {etapasAvaliacao.map((numeroEtapa) => {
          const ativa = numeroEtapa === etapa;
          const desabilitada = numeroEtapa > etapa;

          return (
            <button
              key={numeroEtapa}
              type="button"
              aria-current={ativa ? "step" : undefined}
              disabled={desabilitada}
              onClick={() => setEtapa(numeroEtapa)}
              style={{
                width: 28,
                height: 28,
                border: 0,
                borderRadius: ativa ? 6 : 0,
                background: ativa ? verde : "transparent",
                color: ativa ? "#fff" : "#111",
                fontSize: 14,
                lineHeight: "28px",
                padding: 0,
                cursor: desabilitada ? "default" : "pointer",
                opacity: desabilitada && !ativa ? 0.45 : 1,
              }}
            >
              {numeroEtapa}
            </button>
          );
        })}
      </nav>
    );
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
          onClick={() => navigate("/inicio")}
          style={{ color: "#fff", height: 40, fontSize: 22 }}
        >
          Histórico Geral
        </Button>
        <Button
          type="text"
          onClick={novaAvaliacao}
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

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          pacienteId: pacienteFixoId,
          pontuacaoRespiratoria: 0,
          pontuacaoCardiovascular: 0,
          pontuacaoNeurologica: 0,
          vigilia: false,
          emesePosOperatorio: false,
          nebulizacaoResgate: false,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <input
            ref={arquivoInputRef}
            type="file"
            accept="*/*"
            style={{ display: "none" }}
            hidden
            onChange={anexarArquivoAvaliacao}
          />
          <Button
            type="default"
            icon={<UploadOutlined />}
            loading={anexoCarregando}
            onClick={() => {
              if (anexosSelecionados.length >= 3) {
                message.warning(
                  "São permitidos 3 arquivos por avaliação. Limite atingido"
                );
                return;
              }

              arquivoInputRef.current?.click();
            }}
          >
            Anexar arquivo
          </Button>
          {anexosSelecionados.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Typography.Text type="secondary">Anexos:</Typography.Text>
              {anexosSelecionados.map((anexo) => (
                <Space key={anexo.id} size="small">
                  <Typography.Link
                    href={`${urlBaseApi()}/anexos/${encodeURIComponent(
                      anexo.caminho
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {anexo.nomeOriginal}
                  </Typography.Link>
                  <Popconfirm
                    title="Tem certeza que deseja excluir este anexo?"
                    okText="Excluir"
                    cancelText="Cancelar"
                    onConfirm={() => {
                      if (!avaliacaoIdSalva) {
                        return;
                      }

                      void apiExcluirAnexoAvaliacao(
                        token ?? "",
                        avaliacaoIdSalva,
                        anexo.id
                      )
                        .then((avaliacaoAtualizada) => {
                          setAnexosSelecionados(
                            avaliacaoAtualizada.anexos ?? []
                          );
                          message.success("Anexo excluído com sucesso.");
                        })
                        .catch((erro) => {
                          message.error(
                            erro instanceof Error
                              ? erro.message
                              : "Não foi possível excluir o anexo."
                          );
                        });
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                    />
                  </Popconfirm>
                </Space>
              ))}
            </div>
          ) : null}
        </div>
        {etapa === 1 ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title
              level={2}
              style={{ color: "#064b24", textAlign: "center", margin: 0 }}
            >
              Formulário de Nova Avaliação
            </Title>

            <div style={painelEtapaFormulario}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 250px",
                  gap: "18px 76px",
                }}
              >
                <Form.Item
                  name="nomePaciente"
                  label="Nome do Paciente"
                  rules={[
                    {
                      validator: async () => {
                        const pacienteId = form.getFieldValue("pacienteId");

                        if (pacienteId) {
                          return;
                        }

                        throw new Error("Selecione um paciente cadastrado.");
                      },
                    },
                  ]}
                >
                  <AutoComplete
                    size="large"
                    options={opcoesPacientes}
                    onSearch={buscarPacientes}
                    onSelect={(_, opcao) => {
                      form.setFieldsValue({
                        pacienteId: opcao.pacienteId,
                        nomePaciente: opcao.value,
                          faixaEtaria: opcao.faixaEtaria || undefined,
                        });
                        form.setFields([{ name: "nomePaciente", errors: [] }]);
                      }}
                    onChange={(valor) => {
                      if (!pacienteFixoId) {
                        form.setFieldsValue({
                          nomePaciente: valor,
                          pacienteId: undefined,
                        });
                      }
                    }}
                    placeholder="Digite o nome do paciente"
                    notFoundContent={buscandoPacientes ? "Buscando..." : null}
                    filterOption={false}
                    allowClear
                    disabled={!!pacienteFixoId || carregandoPacienteInicial}
                  />
                </Form.Item>

                <Form.Item name="faixaEtaria" label="Faixa Etária">
                  <Select
                    size="large"
                    placeholder="Selecione"
                    options={opcoesFaixaEtaria}
                    disabled={!!pacienteFixoId || carregandoPacienteInicial}
                  />
                </Form.Item>

                <Form.Item name="pacienteId" hidden>
                  <InputNumber />
                </Form.Item>

                <Form.Item name="leito" label="Leito">
                  <Select
                    size="large"
                    placeholder="Selecione"
                    options={opcoesLeito}
                  />
                </Form.Item>

                <Form.Item
                  name="diagnostico"
                  label="Diagnóstico"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "Informe o diagnóstico.",
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>

                <Form.Item
                  name="dih"
                  label="DIH"
                  rules={[
                    {
                      required: true,
                      message: "Informe os dias de internação hospitalar.",
                    },
                  ]}
                >
                  <InputNumber min={0} precision={0} size="large" />
                </Form.Item>
              </div>
            </div>

            <div style={navegacaoFormulario}>
              <Button
                type="primary"
                style={botaoVoltar}
                onClick={() => navigate("/inicio")}
              >
                Voltar
              </Button>
              {renderNavegacaoEtapas()}
              <Button
                type="primary"
                style={{ ...botaoPrincipal, justifySelf: "end" }}
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

            <div
              style={{ ...painelEtapaFormulario, width: "min(100%, 1028px)" }}
            >
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
                  gridTemplateColumns: "250px minmax(0, 1fr) 120px",
                  alignItems: "center",
                  gap: "18px 80px",
                  marginTop: 18,
                }}
              >
                <Form.Item
                  name="frequenciaRespiratoria"
                  label="Frequência Respiratória (ipm)"
                  rules={[
                    {
                      required: true,
                      message: "Informe a frequência respiratória.",
                    },
                  ]}
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
                  rules={[
                    {
                      required: true,
                      message: "Informe a frequência cardíaca.",
                    },
                  ]}
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
                  style={{
                    gridColumn: 3,
                    gridRow: "1 / 3",
                    justifySelf: "center",
                    margin: 0,
                  }}
                >
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div style={navegacaoFormulario}>
              <Button
                type="primary"
                style={botaoVoltar}
                onClick={() => setEtapa(1)}
              >
                Voltar
              </Button>
              {renderNavegacaoEtapas()}
              <Button
                type="primary"
                style={{ ...botaoPrincipal, justifySelf: "end" }}
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
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 140,
              }}
            >
              <Button
                type="primary"
                style={{
                  ...botaoPrincipal,
                  minWidth: 240,
                  width: 240,
                }}
                onClick={() => void imprimirAvaliacaoAtual()}
              >
                Imprimir
              </Button>
              <Button
                type="primary"
                style={{
                  ...botaoPrincipal,
                  minWidth: 240,
                  width: 240,
                }}
                onClick={() => {
                  const nome = texto(form.getFieldValue("nomePaciente"));
                  const pacienteId = form.getFieldValue("pacienteId");

                  if (pacienteId) {
                    navigate(`/historico/paciente/${pacienteId}`);
                    return;
                  }

                  if (nome) {
                    navigate(`/historico/paciente/${encodeURIComponent(nome)}`);
                    return;
                  }

                  navigate("/inicio");
                }}
              >
                Histórico de {texto(form.getFieldValue("nomePaciente"))}
              </Button>
            </div>
          </Space>
        ) : null}
      </Form>
    </div>
  );
}
