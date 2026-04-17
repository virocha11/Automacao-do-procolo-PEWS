import { App, Button, Card, Form, Input, Layout } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fazerLogin } from "../api/requisicoes";
import { CabecalhoLogin } from "../components/CabecalhoLogin";
import { useSessao } from "../contexts/SessaoContext";

type CamposLogin = {
  email: string;
  senha: string;
};

export function PaginaLogin() {
  const { token, definirSessao } = useSessao();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<CamposLogin>();

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
          </Form>
        </Card>
      </Layout.Content>
    </Layout>
  );
}
