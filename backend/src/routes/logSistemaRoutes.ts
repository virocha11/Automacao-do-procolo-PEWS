import { Router } from "express";
import { listarLogs } from "../controllers/logSistemaController";
import { exigirAdministrador } from "../middleware/exigirAdministrador";

const rotas = Router();

rotas.get("/logs", exigirAdministrador, listarLogs);

export default rotas;
