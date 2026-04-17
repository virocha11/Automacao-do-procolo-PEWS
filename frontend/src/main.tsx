import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App as AntdApp, ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import "./index.css";
import App from "./App.tsx";
import { ProvedorSessao } from "./contexts/SessaoContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: "#1b5e20",
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <ProvedorSessao>
            <App />
          </ProvedorSessao>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
);
