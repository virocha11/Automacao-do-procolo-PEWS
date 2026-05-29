import { Router } from "express";
import { entrar, recuperarSenha } from "../controllers/autenticacaoController";

const rotas = Router();

rotas.post("/login", entrar);
rotas.post("/recuperar-senha", recuperarSenha);

export default rotas;
