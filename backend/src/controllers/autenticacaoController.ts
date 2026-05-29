import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Usuario } from "../entities/Usuario";
import {
  atualizarUsuario,
  buscarUsuarioPorEmailComSenha,
} from "../repositories/usuarioRepository";
import { enviarEmail } from "../services/emailServico";

function usuarioSemSenha(usuario: Usuario) {
  const { senha: _, ...resto } = usuario;
  return resto;
}

function gerarNovaSenha() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let senha = "";

  for (let i = 0; i < 10; i += 1) {
    senha += caracteres[crypto.randomInt(caracteres.length)];
  }

  return senha;
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

export async function recuperarSenha(req: Request, res: Response) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";

    if (!email) {
      return res.status(400).json({ erro: "Informe o e-mail." });
    }

    const usuario = await buscarUsuarioPorEmailComSenha(email);

    if (usuario) {
      const novaSenha = gerarNovaSenha();
      await atualizarUsuario(usuario.id, { senha: novaSenha });

      await enviarEmail({
        para: usuario.email,
        assunto: "Nova senha de acesso ao PEWS",
        texto: [
          `Olá, ${usuario.nome}.`,
          "",
          "Uma nova senha foi gerada para acessar o PEWS.",
          "",
          `Nova senha: ${novaSenha}`,
          "",
          "Você pode manter essa senha ou alterá-la depois, se preferir.",
        ].join("\n"),
      });
    }

    res.json({
      mensagem: "Enviaremos uma nova senha para o e-mail informado.",
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível enviar a nova senha." });
  }
}
