import { Router } from "express";
import { entrar } from "../controllers/autenticacaoController";

const rotas = Router();

rotas.post("/login", entrar);

export default rotas;
