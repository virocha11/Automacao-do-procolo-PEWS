import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import rotasAutenticacao from "./routes/autenticacaoRoutes";
import rotasUsuario from "./routes/usuarioRoutes";
import rotasAvaliacao from "./routes/avaliacaoRoutes";
import rotasPaciente from "./routes/pacienteRoutes";
import {
  buscarAvaliacaoAnexoPorCaminho,
  buscarAvaliacaoPorCaminho,
} from "./repositories/avaliacaoRepository";

const app = express();
const uploadsDir = path.join(__dirname, "uploads", "avaliacoes");
const legacyUploadsDir = path.join(__dirname, "routes", "uploads", "avaliacoes");
fs.mkdirSync(uploadsDir, { recursive: true });

function resolverCaminhoAnexo(arquivo: string) {
  const caminhoAtual = path.join(uploadsDir, arquivo);

  if (fs.existsSync(caminhoAtual)) {
    return caminhoAtual;
  }

  const caminhoLegado = path.join(legacyUploadsDir, arquivo);

  if (fs.existsSync(caminhoLegado)) {
    return caminhoLegado;
  }

  return caminhoAtual;
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/anexos/:arquivo", async (req, res, next) => {
  try {
    const arquivo = req.params.arquivo;

    if (!arquivo) {
      return res.status(404).end();
    }

    const anexo = await buscarAvaliacaoAnexoPorCaminho(arquivo);
    const avaliacao = anexo
      ? null
      : await buscarAvaliacaoPorCaminho(arquivo);

    const metadata = anexo
      ? { nomeOriginal: anexo.nomeOriginal }
      : avaliacao
      ? { nomeOriginal: avaliacao.anexoNomeOriginal ?? arquivo }
      : null;

    if (!metadata) {
      return next();
    }

    const caminhoArquivo = resolverCaminhoAnexo(arquivo);

    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ erro: "Arquivo não encontrado." });
    }

    const extensao = path.extname(metadata.nomeOriginal).toLowerCase();
    const tipos: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".csv": "text/csv",
      ".json": "application/json",
      ".html": "text/html",
    };

    if (tipos[extensao]) {
      res.type(tipos[extensao]);
    }

    res.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(metadata.nomeOriginal)}"`
    );
    res.sendFile(caminhoArquivo);
  } catch (erro) {
    next(erro);
  }
});

app.use("/anexos", express.static(uploadsDir));
app.use(rotasAutenticacao);
app.use(rotasUsuario);
app.use(rotasAvaliacao);
app.use(rotasPaciente);

export default app;
