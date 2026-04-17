import { Typography } from "antd";

const { Paragraph } = Typography;

export function PaginaInicio() {
  return (
    <div>
      <Typography.Title level={3}>Início</Typography.Title>
      <Paragraph style={{ marginBottom: 0 }}>
        Quando houver itens liberados para o seu perfil, o menu fica à esquerda
        do seu nome no cabeçalho.
      </Paragraph>
    </div>
  );
}
