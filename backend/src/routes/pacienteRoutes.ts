import { Router } from "express";

import {
  listarPacientes,
  cadastrarPaciente,
  obterPacientePorId,
  alterarPaciente,
  excluirPaciente,
} from "../controllers/pacienteController";
import { exigirAdministrador } from "../middleware/exigirAdministrador";

const rotas = Router();

rotas.get("/pacientes", listarPacientes);

rotas.post("/pacientes", cadastrarPaciente);

rotas.get("/pacientes/:id", obterPacientePorId);

rotas.put("/pacientes/:id", alterarPaciente);

rotas.delete("/pacientes/:id", exigirAdministrador, excluirPaciente);

export default rotas;
