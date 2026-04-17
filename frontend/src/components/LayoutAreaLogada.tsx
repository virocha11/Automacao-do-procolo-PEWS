import { Layout } from "antd";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CabecalhoPrincipal } from "./CabecalhoPrincipal";
import { MenuLateral } from "./MenuLateral";

export function LayoutAreaLogada() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      <CabecalhoPrincipal
        menuAberto={menuAberto}
        onAlternarMenu={() => setMenuAberto((v) => !v)}
      />
      <MenuLateral aberto={menuAberto} onFechar={() => setMenuAberto(false)} />
      <Layout.Content style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
