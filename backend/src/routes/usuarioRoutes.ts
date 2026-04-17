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

rotas.get("/usuarios", exigirAdministrador, listarUsuarios);
rotas.post("/usuarios", exigirAdministrador, cadastrarUsuario);
rotas.get("/usuarios/:id", exigirAdministrador, obterUsuarioPorId);
rotas.put("/usuarios/:id", exigirAdministrador, alterarUsuario);
rotas.delete("/usuarios/:id", exigirAdministrador, excluirUsuario);

export default rotas;
