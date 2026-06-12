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
  registrarSinaisVitaisAvaliacao,
} from "../controllers/avaliacaoController";
import { exigirAdministrador } from "../middleware/exigirAdministrador";
import { exigirAutenticacao } from "../middleware/exigirAutenticacao";

const rotas = Router();
const uploadsDir = path.join(__dirname, "..", "uploads", "avaliacoes");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename(req, file, cb) {
    const extensao = path.extname(file.originalname);
    const nomeGerado = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extensao}`;
    cb(null, nomeGerado);
  },
});

const upload = multer({ storage });

rotas.get("/avaliacoes", exigirAutenticacao, listarAvaliacoes);

rotas.post("/avaliacoes", exigirAutenticacao, cadastrarAvaliacao);
rotas.patch("/avaliacoes/:id", exigirAutenticacao, atualizarAvaliacao);
rotas.post(
  "/avaliacoes/:id/sinais-vitais",
  exigirAutenticacao,
  registrarSinaisVitaisAvaliacao
);
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
