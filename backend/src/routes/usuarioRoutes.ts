import { Router } from "express";
import {
  listarUsuarios,
  cadastrarUsuario,
  obterUsuarioPorId,
  alterarUsuario,
  excluirUsuario,
} from "../controllers/usuarioController";

const rotas = Router();

rotas.get("/usuarios", listarUsuarios);
rotas.post("/usuarios", cadastrarUsuario);
rotas.get("/usuarios/:id", obterUsuarioPorId);
rotas.put("/usuarios/:id", alterarUsuario);
rotas.delete("/usuarios/:id", excluirUsuario);

export default rotas;
