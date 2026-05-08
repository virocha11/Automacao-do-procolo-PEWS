import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { buscarUsuarioPorId } from "../repositories/usuarioRepository";

type JwtPayload = { idUsuario: number };

export async function exigirAutenticacao(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ erro: "Token não informado." });
    }

    const segredo = process.env.JWT_SECRET;

    if (!segredo) {
      return res.status(500).json({ erro: "Erro interno do servidor." });
    }

    let decodificado: JwtPayload;

    try {
      decodificado = jwt.verify(auth.slice(7), segredo) as JwtPayload;
    } catch {
      return res.status(401).json({ erro: "Token inválido ou expirado." });
    }

    const usuario = await buscarUsuarioPorId(decodificado.idUsuario);

    if (!usuario) {
      return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    req.usuarioAutenticado = usuario;
    next();
  } catch {
    return res.status(500).json({ erro: "Erro ao validar autenticação." });
  }
}
