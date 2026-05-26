import { Router } from "express";
import {
  listarUsuarios,
  cadastrarUsuario,
  obterUsuarioPorId,
  alterarUsuario,
  alterarMinhaFotoPerfil,
  excluirUsuario,
} from "../controllers/usuarioController";
import { exigirAutenticacao } from "../middleware/exigirAutenticacao";
import { exigirAdministrador } from "../middleware/exigirAdministrador";

const rotas = Router();

rotas.get("/usuarios", listarUsuarios);
rotas.post("/usuarios", cadastrarUsuario);
rotas.put("/usuarios/me/foto", exigirAutenticacao, alterarMinhaFotoPerfil);
rotas.get("/usuarios/:id", obterUsuarioPorId);
rotas.put("/usuarios/:id", exigirAdministrador, alterarUsuario);
rotas.delete("/usuarios/:id", exigirAdministrador, excluirUsuario);

export default rotas;
