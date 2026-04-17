import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Usuario } from "../entities/Usuario";
import { buscarUsuarioPorEmailComSenha } from "../repositories/usuarioRepository";

function usuarioSemSenha(usuario: Usuario) {
  const { senha: _, ...resto } = usuario;
  return resto;
}

export async function entrar(req: Request, res: Response) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Informe email e senha." });
    }

    const usuario = await buscarUsuarioPorEmailComSenha(email);

    if (!usuario) {
      return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha);
    if (!senhaConfere) {
      return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    const chaveSecreta = process.env.JWT_SECRET;
    if (!chaveSecreta) {
      return res.status(500).json({ erro: "Erro interno do servidor." });
    }

    const tempoDeVida = process.env.JWT_EXPIRACAO || "7d";
    const opcoesToken: SignOptions = {
      expiresIn: tempoDeVida as SignOptions["expiresIn"],
    };

    const token = jwt.sign(
      { idUsuario: usuario.id, email: usuario.email },
      chaveSecreta,
      opcoesToken
    );

    res.json({
      mensagem: "Login realizado com sucesso.",
      token,
      usuario: usuarioSemSenha(usuario),
    });
  } catch {
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
}
