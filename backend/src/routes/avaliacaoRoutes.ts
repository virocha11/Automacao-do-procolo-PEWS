import { Router } from "express";

import {
  cadastrarAvaliacao,
  listarAvaliacoes,
} from "../controllers/avaliacaoController";
import { exigirAutenticacao } from "../middleware/exigirAutenticacao";

const rotas = Router();

rotas.get("/avaliacoes", exigirAutenticacao, listarAvaliacoes);

rotas.post("/avaliacoes", exigirAutenticacao, cadastrarAvaliacao);

export default rotas;
