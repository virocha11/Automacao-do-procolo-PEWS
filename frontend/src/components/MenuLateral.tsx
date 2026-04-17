import { Drawer, Menu } from "antd";
import type { MenuProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSessao } from "../contexts/SessaoContext";
import { itensMenuAntdParaUsuario } from "../config/menuLateralDefinicao";

type Props = {
  aberto: boolean;
  onFechar: () => void;
};

export function MenuLateral({ aberto, onFechar }: Props) {
  const { usuario } = useSessao();
  const navigate = useNavigate();
  const location = useLocation();
  const [chavesAbertas, setChavesAbertas] = useState<string[]>([]);

  const itens = useMemo(() => {
    if (usuario == null) {
      return [] as MenuProps["items"];
    }
    return itensMenuAntdParaUsuario(usuario.funcao);
  }, [usuario]);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/cadastros")) {
      setChavesAbertas(["submenu:cadastros"]);
    }
  }, [location.pathname]);

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key.startsWith("submenu:")) {
      return;
    }
    navigate(key);
    onFechar();
  };

  return (
    <Drawer
      title="Menu"
      placement="left"
      onClose={onFechar}
      open={aberto}
      width={280}
      styles={{ body: { padding: 0 } }}
    >
      <Menu
        mode="inline"
        items={itens}
        selectedKeys={[location.pathname]}
        openKeys={chavesAbertas}
        onOpenChange={setChavesAbertas}
        onClick={onMenuClick}
      />
    </Drawer>
  );
}
