import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import {
  apiAtualizarUsuario,
  apiCriarUsuario,
  apiExcluirUsuario,
  apiListarUsuarios,
  type CorpoAtualizarUsuario,
} from "../api/usuariosServico";
import { useSessao } from "../contexts/SessaoContext";
import {
  CODIGO_FUNCAO_ADMINISTRADOR,
  CODIGO_FUNCAO_ENFERMEIRO,
  CODIGO_FUNCAO_MEDICO,
  nomeDaFuncao,
} from "../lib/funcaoUsuario";
import type { Usuario } from "../types/usuario";

const { Title } = Typography;

const opcoesFuncao = [
  { value: CODIGO_FUNCAO_ADMINISTRADOR, label: "Administrador" },
  { value: CODIGO_FUNCAO_ENFERMEIRO, label: "Enfermeiro" },
  { value: CODIGO_FUNCAO_MEDICO, label: "Médico" },
];

type ValoresFormulario = {
  nome: string;
  email: string;
  senha?: string;
  funcao: number;
  dataNascimento?: string;
  celular?: string;
};

function formatarDataCurta(valor: string | null | undefined): string {
  if (!valor) {
    return "—";
  }
  return valor.slice(0, 10);
}

export function PaginaUsuarios() {
  const { message } = App.useApp();
  const { token, usuario: usuarioSessao } = useSessao();
  const [lista, setLista] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null);
  const [form] = Form.useForm<ValoresFormulario>();

  const carregar = useCallback(async () => {
    if (!token) {
      return;
    }
    setCarregando(true);
    try {
      const dados = await apiListarUsuarios(token);
      setLista(dados);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Erro ao listar usuários.");
    } finally {
      setCarregando(false);
    }
  }, [token, message]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirCriar() {
    setUsuarioEmEdicao(null);
    form.resetFields();
    form.setFieldsValue({
      funcao: CODIGO_FUNCAO_ENFERMEIRO,
    });
    setModalAberto(true);
  }

  function abrirEditar(u: Usuario) {
    setUsuarioEmEdicao(u);
    form.setFieldsValue({
      nome: u.nome,
      email: u.email,
      funcao: u.funcao,
      dataNascimento: u.dataNascimento
        ? formatarDataCurta(u.dataNascimento)
        : undefined,
      celular: u.celular ?? undefined,
      senha: undefined,
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
      const dataNasc =
        v.dataNascimento && v.dataNascimento.trim() !== ""
          ? v.dataNascimento
          : null;
      const celular =
        v.celular && v.celular.trim() !== "" ? v.celular.trim() : null;

      if (usuarioEmEdicao == null) {
        if (!v.senha || v.senha.trim() === "") {
          message.error("Informe a senha do novo usuário.");
          setGravando(false);
          return;
        }
        await apiCriarUsuario(token, {
          nome: v.nome.trim(),
          email: v.email.trim(),
          senha: v.senha,
          funcao: v.funcao,
          dataNascimento: dataNasc,
          celular,
        });
        message.success("Usuário criado.");
      } else {
        const corpo: CorpoAtualizarUsuario = {
          nome: v.nome.trim(),
          email: v.email.trim(),
          funcao: v.funcao,
          dataNascimento: dataNasc,
          celular,
        };
        if (v.senha && v.senha.trim() !== "") {
          corpo.senha = v.senha;
        }
        await apiAtualizarUsuario(token, usuarioEmEdicao.id, corpo);
        message.success("Usuário atualizado.");
      }
      setModalAberto(false);
      await carregar();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) {
        return;
      }
      message.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setGravando(false);
    }
  }

  async function remover(id: number) {
    if (!token) {
      return;
    }
    try {
      await apiExcluirUsuario(token, id);
      message.success("Usuário removido.");
      await carregar();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Erro ao remover.");
    }
  }

  const colunas: ColumnsType<Usuario> = [
    { title: "Nome", dataIndex: "nome", key: "nome" },
    { title: "E-mail", dataIndex: "email", key: "email" },
    {
      title: "Função",
      dataIndex: "funcao",
      key: "funcao",
      render: (codigo: number) => (
        <Tag color={codigo === CODIGO_FUNCAO_ADMINISTRADOR ? "red" : "green"}>
          {nomeDaFuncao(codigo)}
        </Tag>
      ),
    },
    {
      title: "Nascimento",
      dataIndex: "dataNascimento",
      key: "dataNascimento",
      render: (d: string | null | undefined) => formatarDataCurta(d),
    },
    {
      title: "Celular",
      dataIndex: "celular",
      key: "celular",
      render: (c: string | null | undefined) => c ?? "—",
    },
    {
      title: "Ações",
      key: "acoes",
      render: (_, registro) => {
        const eProprioUsuario = usuarioSessao?.id === registro.id;
        return (
          <Space>
            <Button type="link" onClick={() => abrirEditar(registro)}>
              Editar
            </Button>
            <Popconfirm
              title="Remover este usuário?"
              okText="Remover"
              cancelText="Cancelar"
              onConfirm={() => remover(registro.id)}
              disabled={eProprioUsuario}
            >
              <Button type="link" danger disabled={eProprioUsuario}>
                Excluir
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%" }}
      >
        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
          <Title level={3} style={{ margin: 0 }}>
            Usuários
          </Title>
          <Button type="primary" onClick={abrirCriar}>
            Novo usuário
          </Button>
        </Space>
        <Table<Usuario>
          rowKey="id"
          loading={carregando}
          columns={colunas}
          dataSource={lista}
          pagination={{ pageSize: 10 }}
        />
      </Space>

      <Modal
        title={usuarioEmEdicao ? "Editar usuário" : "Novo usuário"}
        open={modalAberto}
        onCancel={() => setModalAberto(false)}
        okText={usuarioEmEdicao ? "Salvar" : "Cadastrar"}
        cancelText="Cancelar"
        confirmLoading={gravando}
        onOk={() => void enviarFormulario()}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nome"
            label="Nome completo"
            rules={[{ required: true, message: "Informe o nome." }]}
          >
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="E-mail"
            rules={[
              { required: true, message: "Informe o e-mail." },
              { type: "email", message: "E-mail inválido." },
            ]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="senha"
            label={usuarioEmEdicao ? "Nova senha (opcional)" : "Senha"}
            rules={
              usuarioEmEdicao
                ? []
                : [{ required: true, message: "Informe a senha." }]
            }
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="funcao"
            label="Função"
            rules={[{ required: true, message: "Selecione a função." }]}
          >
            <Select options={opcoesFuncao} />
          </Form.Item>
          <Form.Item name="dataNascimento" label="Data de nascimento">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="celular" label="Celular">
            <Input placeholder="(00) 00000-0000" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
