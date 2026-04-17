import { Typography } from "antd";

const { Title, Text } = Typography;

const verdeCabecalho = "#1b5e20";

export function CabecalhoLogin() {
  return (
    <header
      style={{
        background: verdeCabecalho,
        color: "#fff",
        padding: "20px 16px 24px",
        textAlign: "center",
      }}
    >
      <Title
        level={2}
        style={{
          color: "#fff",
          margin: 0,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        PEWS
      </Title>
      <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 15 }}>
        Pontuação de Alerta Precoce Pediátrico
      </Text>
    </header>
  );
}
