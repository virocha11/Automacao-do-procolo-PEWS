import { Router } from "express";

import {
  cadastrarAvaliacao,
  excluirAvaliacao,
  listarAvaliacoes,
} from "../controllers/avaliacaoController";
import { exigirAdministrador } from "../middleware/exigirAdministrador";
import { exigirAutenticacao } from "../middleware/exigirAutenticacao";

const rotas = Router();

rotas.get("/avaliacoes", exigirAutenticacao, listarAvaliacoes);

rotas.post("/avaliacoes", exigirAutenticacao, cadastrarAvaliacao);

rotas.delete("/avaliacoes/:id", exigirAdministrador, excluirAvaliacao);

export default rotas;
