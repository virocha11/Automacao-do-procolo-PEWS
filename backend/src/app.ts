import express from "express";
import rotasUsuario from "./routes/usuarioRoutes";

const app = express();

app.use(express.json());
app.use(rotasUsuario);

export default app;