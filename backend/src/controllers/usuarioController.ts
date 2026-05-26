import { Request, Response } from "express";
import { FuncaoUsuario, Usuario } from "../entities/Usuario";
import {
  buscarTodosUsuarios,
  buscarUsuarioPorId,
  criarUsuario,
  atualizarUsuario,
  removerUsuario,
} from "../repositories/usuarioRepository";

function jsonSemSenha(usuario: Usuario) {
  const { senha: _, ...resto } = usuario;
  return resto;
}

const CODIGOS_FUNCAO_VALIDOS = [
  FuncaoUsuario.ADMINISTRADOR,
  FuncaoUsuario.ENFERMEIRO,
  FuncaoUsuario.MEDICO,
];

function funcaoValida(valor: unknown): valor is FuncaoUsuario {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    CODIGOS_FUNCAO_VALIDOS.includes(valor as FuncaoUsuario)
  );
}

function fotoPerfilValida(valor: unknown): valor is string | null | undefined {
  return (
    valor === undefined ||
    valor === null ||
    (typeof valor === "string" &&
      valor.length <= 1_500_000 &&
      /^data:image\/(png|jpeg|jpg|webp);base64,/.test(valor))
  );
}

export async function listarUsuarios(req: Request, res: Response) {
  try {
    const usuarios = await buscarTodosUsuarios();
    res.json(usuarios.map(jsonSemSenha));
  } catch {
    res.status(500).json({ erro: "Não foi possível listar os usuários." });
  }
}

export async function cadastrarUsuario(req: Request, res: Response) {
  try {
    const { nome, email, senha, funcao, dataNascimento, celular, fotoPerfil } =
      req.body;

    if (!nome || !email || !senha || funcao === undefined || funcao === null) {
      return res.status(400).json({
        erro: "Campos obrigatórios: nome, email, senha e função do usuário.",
      });
    }

    if (!funcaoValida(funcao)) {
      return res.status(400).json({
        erro: `Função do usuário inválida.`,
      });
    }

    if (!fotoPerfilValida(fotoPerfil)) {
      return res.status(400).json({ erro: "Foto de perfil inválida." });
    }

    let data: Date | null = null;
    if (dataNascimento) {
      const convertida = new Date(dataNascimento);
      if (Number.isNaN(convertida.getTime())) {
        return res.status(400).json({ erro: "Data de nascimento inválida." });
      }
      data = convertida;
    }

    const usuario = await criarUsuario({
      nome,
      email,
      senha,
      funcao,
      dataNascimento: data,
      celular: celular ?? null,
      fotoPerfil: fotoPerfil ?? null,
    });

    res.status(201).json(jsonSemSenha(usuario));
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Não foi possível cadastrar o usuário." });
  }
}

export async function obterUsuarioPorId(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const usuario = await buscarUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    res.json(jsonSemSenha(usuario));
  } catch {
    res.status(500).json({ erro: "Não foi possível buscar o usuário." });
  }
}

export async function alterarUsuario(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { nome, email, senha, funcao, dataNascimento, celular, fotoPerfil } =
      req.body;

    if (funcao !== undefined && funcao !== null && !funcaoValida(funcao)) {
      return res.status(400).json({
        erro: `Função do usuário inválida.`,
      });
    }

    if (!fotoPerfilValida(fotoPerfil)) {
      return res.status(400).json({ erro: "Foto de perfil inválida." });
    }

    let data: Date | null | undefined = undefined;
    if (dataNascimento !== undefined) {
      if (dataNascimento === null || dataNascimento === "") {
        data = null;
      } else {
        const convertida = new Date(dataNascimento);
        if (Number.isNaN(convertida.getTime())) {
          return res.status(400).json({ erro: "Data de nascimento inválida." });
        }
        data = convertida;
      }
    }

    const usuario = await atualizarUsuario(id, {
      nome,
      email,
      senha,
      funcao: funcao === undefined || funcao === null ? undefined : funcao,
      dataNascimento: data,
      celular:
        celular === undefined
          ? undefined
          : celular === "" || celular === null
            ? null
            : celular,
      fotoPerfil: fotoPerfil === undefined ? undefined : fotoPerfil,
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    res.json(jsonSemSenha(usuario));
  } catch {
    res.status(500).json({ erro: "Não foi possível atualizar o usuário." });
  }
}

export async function alterarMinhaFotoPerfil(req: Request, res: Response) {
  try {
    const autenticado = req.usuarioAutenticado;

    if (!autenticado) {
      return res.status(401).json({ erro: "Usuário não autenticado." });
    }

    const { fotoPerfil } = req.body;

    if (!fotoPerfilValida(fotoPerfil)) {
      return res.status(400).json({ erro: "Foto de perfil inválida." });
    }

    const usuario = await atualizarUsuario(autenticado.id, {
      fotoPerfil: fotoPerfil ?? null,
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    res.json(jsonSemSenha(usuario));
  } catch {
    res.status(500).json({ erro: "Não foi possível atualizar a foto." });
  }
}

export async function excluirUsuario(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const existe = await buscarUsuarioPorId(id);

    if (!existe) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const autenticado = req.usuarioAutenticado;
    if (autenticado && id === autenticado.id) {
      return res.status(400).json({
        erro: "Não é possível remover a própria conta por aqui.",
      });
    }

    await removerUsuario(id);
    res.json({ mensagem: "Usuário removido com sucesso." });
  } catch {
    res.status(500).json({ erro: "Não foi possível remover o usuário." });
  }
}
