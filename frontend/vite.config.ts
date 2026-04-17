import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envArquivo = loadEnv(mode, process.cwd(), "");
  const destinoApi =
    process.env.VITE_API_PROXY_TARGET ??
    envArquivo.VITE_API_PROXY_TARGET ??
    "http://127.0.0.1:3000";

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: destinoApi,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
