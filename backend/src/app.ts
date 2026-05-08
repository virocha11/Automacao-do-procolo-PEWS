import cors from "cors";
import express from "express";
import rotasAutenticacao from "./routes/autenticacaoRoutes";
import rotasUsuario from "./routes/usuarioRoutes";
import rotasAvaliacao from "./routes/avaliacaoRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(rotasAutenticacao);
app.use(rotasUsuario);
app.use(rotasAvaliacao);

export default app;
