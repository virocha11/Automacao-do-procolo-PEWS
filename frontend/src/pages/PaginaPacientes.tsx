import {
    App,
    Button,
    Form,
    Input,
    Modal,
    Popconfirm,
    Space,
    Table,
    Typography,
  } from "antd";
  
  import type { ColumnsType } from "antd/es/table";
  import { useCallback, useEffect, useState } from "react";
  
  import {
    apiAtualizarPaciente,
    apiCriarPaciente,
    apiExcluirPaciente,
    apiListarPacientes,
  } from "../api/pacienteServico";
  
  import { useSessao } from "../contexts/SessaoContext";
  import type { Paciente } from "../types/paciente";
  
  const { Title } = Typography;
  
  type ValoresFormulario = {
    nome: string;
    dataNascimento?: string;
    nomeResponsavelLegal: string;
    telefoneResponsavelLegal?: string;
    endereco?: string;
  };
  
  function formatarDataCurta(valor: string | null | undefined): string {
    if (!valor) {
      return "—";
    }
  
    return valor.slice(0, 10);
  }
  
  export function PaginaPacientes() {
    const { message } = App.useApp();
  
    const { token } = useSessao();
  
    const [lista, setLista] = useState<Paciente[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [gravando, setGravando] = useState(false);
  
    const [pacienteEmEdicao, setPacienteEmEdicao] =
      useState<Paciente | null>(null);
  
    const [form] = Form.useForm<ValoresFormulario>();
  
    const carregar = useCallback(async () => {
      if (!token) {
        return;
      }
  
      setCarregando(true);
  
      try {
        const dados = await apiListarPacientes(token);
  
        setLista(dados);
      } catch (e) {
        message.error(
          e instanceof Error
            ? e.message
            : "Erro ao listar pacientes."
        );
      } finally {
        setCarregando(false);
      }
    }, [token, message]);
  
    useEffect(() => {
      void carregar();
    }, [carregar]);
  
    function abrirCriar() {
      setPacienteEmEdicao(null);
  
      form.resetFields();
  
      setModalAberto(true);
    }
  
    function abrirEditar(p: Paciente) {
      setPacienteEmEdicao(p);
  
      form.setFieldsValue({
        nome: p.nome,
        dataNascimento: p.dataNascimento
          ? formatarDataCurta(p.dataNascimento)
          : undefined,
        nomeResponsavelLegal: p.nomeResponsavelLegal,
        telefoneResponsavelLegal:
          p.telefoneResponsavelLegal ?? undefined,
        endereco: p.endereco ?? undefined,
      });
  
      setModalAberto(true);
    }
  
    async function enviarFormulario() {
      if (!token) {
        return;
      }
  
      try {
        const v = await form.validateFields();
  
        setGravando(true);
  
        const corpo = {
          nome: v.nome.trim(),
          dataNascimento: v.dataNascimento!.trim(),
          nomeResponsavelLegal: v.nomeResponsavelLegal.trim(),
          telefoneResponsavelLegal:
            v.telefoneResponsavelLegal!.trim(),
          endereco: v.endereco!.trim(),
        };
  
        if (pacienteEmEdicao == null) {
          await apiCriarPaciente(token, corpo);
  
          message.success("Paciente cadastrado.");
        } else {
          await apiAtualizarPaciente(
            token,
            pacienteEmEdicao.id,
            corpo
          );
  
          message.success("Paciente atualizado.");
        }
  
        setModalAberto(false);
  
        await carregar();
      } catch (e) {
        if (e && typeof e === "object" && "errorFields" in e) {
          return;
        }
  
        message.error(
          e instanceof Error
            ? e.message
            : "Não foi possível salvar."
        );
      } finally {
        setGravando(false);
      }
    }
  
    async function remover(id: number) {
      if (!token) {
        return;
      }
  
      try {
        await apiExcluirPaciente(token, id);
  
        message.success("Paciente removido.");
  
        await carregar();
      } catch (e) {
        message.error(
          e instanceof Error
            ? e.message
            : "Erro ao remover."
        );
      }
    }
  
    const colunas: ColumnsType<Paciente> = [
      {
        title: "Nome",
        dataIndex: "nome",
        key: "nome",
      },
      {
        title: "Nascimento",
        dataIndex: "dataNascimento",
        key: "dataNascimento",
        render: (d: string | null | undefined) =>
          formatarDataCurta(d),
      },
      {
        title: "Responsável",
        dataIndex: "nomeResponsavelLegal",
        key: "nomeResponsavelLegal",
      },
      {
        title: "Telefone",
        dataIndex: "telefoneResponsavelLegal",
        key: "telefoneResponsavelLegal",
        render: (v: string | null | undefined) => v ?? "—",
      },
      {
        title: "Endereço",
        dataIndex: "endereco",
        key: "endereco",
        render: (v: string | null | undefined) => v ?? "—",
      },
      {
        title: "Ações",
        key: "acoes",
        render: (_, registro) => (
          <Space>
            <Button
              type="link"
              onClick={() => abrirEditar(registro)}
            >
              Editar
            </Button>
  
            <Popconfirm
              title="Excluir paciente?"
              okText="Excluir"
              cancelText="Cancelar"
              onConfirm={() => remover(registro.id)}
            >
              <Button type="link" danger>
                Excluir
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  
    return (
      <div>
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%" }}
        >
          <Space
            align="center"
            style={{
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Pacientes
            </Title>
  
            <Button type="primary" onClick={abrirCriar}>
              Novo paciente
            </Button>
          </Space>
  
          <Table<Paciente>
            rowKey="id"
            loading={carregando}
            columns={colunas}
            dataSource={lista}
            pagination={{ pageSize: 10 }}
          />
        </Space>
  
        <Modal
          title={
            pacienteEmEdicao
              ? "Editar paciente"
              : "Novo paciente"
          }
          open={modalAberto}
          onCancel={() => setModalAberto(false)}
          okText={
            pacienteEmEdicao ? "Salvar" : "Cadastrar"
          }
          cancelText="Cancelar"
          confirmLoading={gravando}
          onOk={() => void enviarFormulario()}
          destroyOnClose
          width={520}
        >
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="nome"
              label="Nome"
              rules={[
                {
                  required: true,
                  message: "Informe o nome.",
                },
              ]}
            >
              <Input />
            </Form.Item>
  
            <Form.Item
              name="dataNascimento"
              label="Data de nascimento"
              rules={[
                {
                  required: true,
                  message: "Informe a data de nascimento.",
                },
              ]}
            >
              <Input type="date" />
            </Form.Item>
  
            <Form.Item
              name="nomeResponsavelLegal"
              label="Responsável legal"
              rules={[
                {
                  required: true,
                  message: "Informe o responsável.",
                },
              ]}
            >
              <Input />
            </Form.Item>
  
            <Form.Item
              name="telefoneResponsavelLegal"
              label="Telefone"
              rules={[
                {
                  required: true,
                  message: "Informe o telefone do responsável legal.",
                },
              ]}
            >
              <Input />
            </Form.Item>
  
            <Form.Item
              name="endereco"
              label="Endereço"
              rules={[
                {
                  required: true,
                  message: "Informe o endereço",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }