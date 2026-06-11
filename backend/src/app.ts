import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import rotasAutenticacao from "./routes/autenticacaoRoutes";
import rotasUsuario from "./routes/usuarioRoutes";
import rotasAvaliacao from "./routes/avaliacaoRoutes";
import rotasPaciente from "./routes/pacienteRoutes";

const app = express();
const uploadsDir = path.join(__dirname, "..", "uploads", "avaliacoes");
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/anexos", express.static(uploadsDir));
app.use(rotasAutenticacao);
app.use(rotasUsuario);
app.use(rotasAvaliacao);
app.use(rotasPaciente);

export default app;
