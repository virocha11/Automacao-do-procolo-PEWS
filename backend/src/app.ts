import cors from "cors";
import express from "express";
import rotasAutenticacao from "./routes/autenticacaoRoutes";
import rotasUsuario from "./routes/usuarioRoutes";
import rotasAvaliacao from "./routes/avaliacaoRoutes";
import rotasPaciente from "./routes/pacienteRoutes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(rotasAutenticacao);
app.use(rotasUsuario);
app.use(rotasAvaliacao);
app.use(rotasPaciente);

export default app;
