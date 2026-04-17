import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useSessao } from "../contexts/SessaoContext";
import { usuarioPossuiItensNoMenuLateral } from "../config/menuLateralDefinicao";
import { nomeDaFuncao } from "../lib/funcaoUsuario";

const { Text } = Typography;

const verdeCabecalho = "#1b5e20";

type PropsCabecalho = {
  menuAberto: boolean;
  onAlternarMenu: () => void;
};

export function CabecalhoPrincipal({
  menuAberto: _menuAberto,
  onAlternarMenu,
}: PropsCabecalho) {
  const { usuario, encerrarSessao } = useSessao();
  const navigate = useNavigate();

  function deslogar() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

  const rotuloUsuario =
    usuario != null
      ? `${usuario.nome} - ${nomeDaFuncao(usuario.funcao)}`
      : "";

  const exibirMenu =
    usuario != null && usuarioPossuiItensNoMenuLateral(usuario.funcao);

  return (
    <header
      style={{
        background: verdeCabecalho,
        color: "#fff",
        padding: "12px 20px",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          justifySelf: "start",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
        }}
      >
        {exibirMenu ? (
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20, color: "#fff" }} />}
            onClick={onAlternarMenu}
            aria-expanded={_menuAberto}
            aria-label="Abrir ou fechar menu"
            style={{ color: "#fff", flexShrink: 0 }}
          />
        ) : null}
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {rotuloUsuario}
        </Text>
      </div>
      <Button
        type="text"
        onClick={() => navigate("/inicio")}
        aria-label="Ir para a página inicial"
        style={{
          color: "#fff",
          margin: 0,
          letterSpacing: 3,
          textAlign: "center",
          textTransform: "uppercase",
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1.35,
          height: "auto",
          padding: "0 8px",
        }}
      >
        PEWS
      </Button>
      <div style={{ justifySelf: "end" }}>
        <Button
          type="text"
          icon={<LogoutOutlined style={{ fontSize: 20, color: "#fff" }} />}
          onClick={deslogar}
          aria-label="Sair da conta"
          style={{ color: "#fff" }}
        />
      </div>
    </header>
  );
}
