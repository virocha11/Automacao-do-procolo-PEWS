import { Router } from "express";
import {
  listarUsuarios,
  cadastrarUsuario,
  obterUsuarioPorId,
  alterarUsuario,
  excluirUsuario,
} from "../controllers/usuarioController";
import { exigirAdministrador } from "../middleware/exigirAdministrador";

const rotas = Router();

rotas.get("/usuarios", listarUsuarios);
rotas.post("/usuarios", cadastrarUsuario);
rotas.get("/usuarios/:id", obterUsuarioPorId);
rotas.put("/usuarios/:id", exigirAdministrador, alterarUsuario);
rotas.delete("/usuarios/:id", exigirAdministrador, excluirUsuario);

export default rotas;
