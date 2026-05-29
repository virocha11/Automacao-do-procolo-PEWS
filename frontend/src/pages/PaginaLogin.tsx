import { App, Button, Card, Form, Input, Layout, Modal, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fazerLogin, recuperarSenha } from "../api/requisicoes";
import { CabecalhoLogin } from "../components/CabecalhoLogin";
import { useSessao } from "../contexts/SessaoContext";

type CamposLogin = {
  email: string;
  senha: string;
};

type CamposRecuperacaoSenha = {
  email: string;
};

function mascararEmail(email: string) {
  const [usuario, dominio] = email.trim().split("@");

  if (!usuario || !dominio) {
    return email;
  }

  const visivel = usuario.slice(0, Math.min(2, usuario.length));

  return `${visivel}${"*".repeat(Math.max(3, usuario.length - visivel.length))}@${dominio}`;
}

export function PaginaLogin() {
  const { token, definirSessao } = useSessao();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<CamposLogin>();
  const [formRecuperacao] = Form.useForm<CamposRecuperacaoSenha>();
  const [modalRecuperacaoAberto, setModalRecuperacaoAberto] = useState(false);
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");

  useEffect(() => {
    if (token) {
      navigate("/inicio", { replace: true });
    }
  }, [token, navigate]);

  async function aoEnviar(valores: CamposLogin) {
    try {
      const resposta = await fazerLogin(valores.email.trim(), valores.senha);
      definirSessao(resposta.token, resposta.usuario);
      message.success(resposta.mensagem);
      navigate("/inicio", { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Erro ao entrar.");
    }
  }

  function abrirRecuperacaoSenha() {
    const email = form.getFieldValue("email");
    formRecuperacao.setFieldsValue({
      email: typeof email === "string" ? email : undefined,
    });
    setEmailRecuperacao("");
    setModalRecuperacaoAberto(true);
  }

  async function enviarRecuperacaoSenha() {
    try {
      const valores = await formRecuperacao.validateFields();
      const email = valores.email.trim();

      setEnviandoRecuperacao(true);
      await recuperarSenha(email);
      setEmailRecuperacao(email);
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) {
        return;
      }

      message.error(
        e instanceof Error ? e.message : "Não foi possível recuperar a senha."
      );
    } finally {
      setEnviandoRecuperacao(false);
    }
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      <CabecalhoLogin />
      <Layout.Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          flex: 1,
        }}
      >
        <Card title="Login" style={{ width: "100%", maxWidth: 380 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={aoEnviar}
            requiredMark={false}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Informe o email." },
                { type: "email", message: "Email inválido." },
              ]}
            >
              <Input placeholder="seu@email.com" autoComplete="email" />
            </Form.Item>
            <Form.Item
              label="Senha"
              name="senha"
              rules={[{ required: true, message: "Informe a senha." }]}
            >
              <Input.Password placeholder="Senha" autoComplete="current-password" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Entrar
              </Button>
            </Form.Item>
            <Button
              type="link"
              block
              style={{ padding: 0, marginTop: 12 }}
              onClick={abrirRecuperacaoSenha}
            >
              Esqueci minha senha
            </Button>
          </Form>
        </Card>
      </Layout.Content>
      <Modal
        title="Recuperar senha"
        open={modalRecuperacaoAberto}
        onCancel={() => setModalRecuperacaoAberto(false)}
        onOk={() => {
          if (emailRecuperacao) {
            setModalRecuperacaoAberto(false);
            return;
          }

          void enviarRecuperacaoSenha();
        }}
        okText={emailRecuperacao ? "Fechar" : "Enviar nova senha"}
        cancelText="Cancelar"
        confirmLoading={enviandoRecuperacao}
        cancelButtonProps={{ style: emailRecuperacao ? { display: "none" } : undefined }}
      >
        {emailRecuperacao ? (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            Enviaremos uma nova senha para o e-mail{" "}
            <strong>{mascararEmail(emailRecuperacao)}</strong>.
          </Typography.Paragraph>
        ) : (
          <Form form={formRecuperacao} layout="vertical" requiredMark={false}>
            <Form.Item
              label="E-mail cadastrado"
              name="email"
              rules={[
                { required: true, message: "Informe o e-mail." },
                { type: "email", message: "E-mail inválido." },
              ]}
            >
              <Input placeholder="seu@email.com" autoComplete="email" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Layout>
  );
}
