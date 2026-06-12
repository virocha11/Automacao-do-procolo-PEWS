import fs from "fs";
import path from "path";
import multer from "multer";
import { Router } from "express";

import {
  anexarArquivoAvaliacao,
  atualizarAvaliacao,
  cadastrarAvaliacao,
  excluirAvaliacao,
  excluirAnexoAvaliacao,
  listarAvaliacoes,
} from "../controllers/avaliacaoController";
import { exigirAdministrador } from "../middleware/exigirAdministrador";
import { exigirAutenticacao } from "../middleware/exigirAutenticacao";

const rotas = Router();
const uploadsDir = path.join(__dirname, "..", "uploads", "avaliacoes");
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

rotas.get("/avaliacoes", exigirAutenticacao, listarAvaliacoes);

rotas.post("/avaliacoes", exigirAutenticacao, cadastrarAvaliacao);
rotas.patch("/avaliacoes/:id", exigirAutenticacao, atualizarAvaliacao);
rotas.post(
  "/avaliacoes/:id/anexo",
  exigirAutenticacao,
  upload.single("anexo"),
  anexarArquivoAvaliacao
);
rotas.delete(
  "/avaliacoes/:id/anexo/:anexoId",
  exigirAutenticacao,
  excluirAnexoAvaliacao
);
rotas.delete("/avaliacoes/:id", exigirAdministrador, excluirAvaliacao);

export default rotas;
