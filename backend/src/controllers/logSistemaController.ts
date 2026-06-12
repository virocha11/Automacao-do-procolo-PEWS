import { Request, Response } from "express";
import { listarLogsSistema } from "../repositories/logSistemaRepository";

export async function listarLogs(req: Request, res: Response) {
  try {
    const logs = await listarLogsSistema();
    res.json(logs);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível listar os logs." });
  }
}
