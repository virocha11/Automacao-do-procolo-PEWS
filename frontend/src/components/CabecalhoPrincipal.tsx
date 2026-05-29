import {
  CameraOutlined,
  DownOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { App, Avatar, Button, Dropdown, Modal, Space } from "antd";
import type { MenuProps } from "antd";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiAtualizarMinhaFotoPerfil } from "../api/usuariosServico";
import { useSessao } from "../contexts/SessaoContext";
import { usuarioPossuiItensNoMenuLateral } from "../config/menuLateralDefinicao";
import { nomeDaFuncao } from "../lib/funcaoUsuario";

const verdeCabecalho = "#1b5e20";

function arquivoParaDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });
}

type PropsCabecalho = {
  menuAberto: boolean;
  onAlternarMenu: () => void;
};

export function CabecalhoPrincipal({
  menuAberto: _menuAberto,
  onAlternarMenu,
}: PropsCabecalho) {
  const { message } = App.useApp();
  const { usuario, token, atualizarUsuarioSessao, encerrarSessao } = useSessao();
  const navigate = useNavigate();
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  function deslogar() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

  const exibirMenu =
    usuario != null && usuarioPossuiItensNoMenuLateral(usuario.funcao);

  const itensPerfil: MenuProps["items"] = [
    {
      key: "foto",
      icon: <CameraOutlined />,
      label: "Alterar foto",
    },
    {
      key: "minhas-avaliacoes",
      icon: <FileTextOutlined />,
      label: "Minhas avaliações",
    },
    {
      type: "divider",
    },
    {
      key: "sair",
      icon: <LogoutOutlined />,
      label: "Sair",
      danger: true,
    },
  ];

  function abrirModalFoto() {
    setFotoPreview(usuario?.fotoPerfil ?? null);
    setModalFotoAberto(true);
  }

  async function carregarFotoPerfil(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
      message.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (arquivo.size > 1_000_000) {
      message.error("A foto deve ter no máximo 1 MB.");
      return;
    }

    try {
      setFotoPreview(await arquivoParaDataUrl(arquivo));
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : "Não foi possível carregar a foto."
      );
    }
  }

  async function salvarFotoPerfil() {
    if (!token) {
      return;
    }

    try {
      setSalvandoFoto(true);
      const usuarioAtualizado = await apiAtualizarMinhaFotoPerfil(
        token,
        fotoPreview
      );
      atualizarUsuarioSessao(usuarioAtualizado);
      setModalFotoAberto(false);
      message.success("Foto de perfil atualizada.");
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : "Não foi possível atualizar a foto."
      );
    } finally {
      setSalvandoFoto(false);
    }
  }

  return (
    <>
      <header
        style={{
          background: verdeCabecalho,
          color: "#fff",
          padding: "14px 20px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ justifySelf: "start" }}>
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
        </div>
        <button
          type="button"
          onClick={() => navigate("/inicio")}
          aria-label="Ir para o histórico geral"
          style={{
            background: "transparent",
            border: 0,
            color: "#fff",
            cursor: "pointer",
            margin: 0,
            letterSpacing: 3,
            textAlign: "center",
            textTransform: "uppercase",
            fontSize: 20,
            fontWeight: 600,
            lineHeight: 1.35,
            height: "auto",
            padding: "0 8px",
            fontFamily: "inherit",
          }}
        >
          PEWS
        </button>
        <div style={{ justifySelf: "end", minWidth: 0 }}>
          <Dropdown
            menu={{
              items: itensPerfil,
              onClick: ({ key }) => {
                if (key === "foto") {
                  abrirModalFoto();
                } else if (key === "minhas-avaliacoes") {
                  navigate("/minhas-avaliacoes");
                } else if (key === "sair") {
                  deslogar();
                }
              },
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
          <Button
            type="text"
            style={{ color: "#fff", height: 52, padding: "0 10px" }}
          >
            <Space size={8}>
              <Avatar
                src={usuario?.fotoPerfil || undefined}
                size={42}
                style={{ background: "#e6f4ea", color: verdeCabecalho }}
              >
                {usuario?.nome?.charAt(0).toUpperCase()}
              </Avatar>
              <span
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  maxWidth: 220,
                  minWidth: 0,
                  lineHeight: 1.15,
                }}
              >
                <span
                  style={{
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {usuario?.nome}
                </span>
                <span style={{ fontSize: 12, opacity: 0.82 }}>
                  {usuario ? nomeDaFuncao(usuario.funcao) : ""}
                </span>
              </span>
              <DownOutlined style={{ fontSize: 11 }} />
            </Space>
          </Button>
          </Dropdown>
        </div>
      </header>

      <Modal
        title="Foto de perfil"
        open={modalFotoAberto}
        onCancel={() => setModalFotoAberto(false)}
        onOk={() => void salvarFotoPerfil()}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={salvandoFoto}
      >
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          <Avatar size={96} src={fotoPreview || undefined}>
            {usuario?.nome?.charAt(0).toUpperCase()}
          </Avatar>
          <Space>
            <Button>
              <label style={{ cursor: "pointer" }}>
                Carregar foto
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(evento) => void carregarFotoPerfil(evento)}
                  style={{ display: "none" }}
                />
              </label>
            </Button>
            {fotoPreview ? (
              <Button onClick={() => setFotoPreview(null)}>Remover</Button>
            ) : null}
          </Space>
        </Space>
      </Modal>
    </>
  );
}
