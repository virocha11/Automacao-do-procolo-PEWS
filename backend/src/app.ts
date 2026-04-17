import cors from "cors";
import express from "express";
import rotasAutenticacao from "./routes/autenticacaoRoutes";
import rotasUsuario from "./routes/usuarioRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(rotasAutenticacao);
app.use(rotasUsuario);
export default app;