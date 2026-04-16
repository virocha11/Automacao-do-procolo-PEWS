import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { Usuario, FuncaoUsuario } from "../entities/Usuario";

const repositorio = AppDataSource.getRepository(Usuario);

const custoBcrypt = 10;

export type DadosCriarUsuario = {
  nome: string;
  email: string;
  senha: string;
  funcao: FuncaoUsuario;
  dataNascimento: Date | null;
  celular: string | null;
};

export type DadosAtualizarUsuario = {
  nome?: string;
  email?: string;
  senha?: string;
  funcao?: FuncaoUsuario;
  dataNascimento?: Date | null;
  celular?: string | null;
};

export async function buscarTodosUsuarios(): Promise<Usuario[]> {
  return repositorio.find();
}

export async function buscarUsuarioPorId(id: number): Promise<Usuario | null> {
  return repositorio.findOneBy({ id });
}

export async function buscarUsuarioPorEmailComSenha(
  email: string
): Promise<Usuario | null> {
  const emailLimpo = email.trim();
  return repositorio
    .createQueryBuilder("usuario")
    .addSelect("usuario.senha")
    .where("usuario.email = :email", { email: emailLimpo })
    .getOne();
}

export async function criarUsuario(dados: DadosCriarUsuario): Promise<Usuario> {
  const senhaHash = await bcrypt.hash(dados.senha, custoBcrypt);
  const novo = repositorio.create({
    nome: dados.nome,
    email: dados.email,
    senha: senhaHash,
    funcao: dados.funcao,
    dataNascimento: dados.dataNascimento,
    celular: dados.celular?.trim() || null,
  });
  return repositorio.save(novo);
}

export async function atualizarUsuario(
  id: number,
  dados: DadosAtualizarUsuario
): Promise<Usuario | null> {
  const usuario = await repositorio.findOneBy({ id });
  if (!usuario) {
    return null;
  }

  if (dados.nome !== undefined) {
    usuario.nome = dados.nome;
  }
  if (dados.email !== undefined) {
    usuario.email = dados.email;
  }
  if (dados.senha !== undefined && dados.senha.length > 0) {
    usuario.senha = await bcrypt.hash(dados.senha, custoBcrypt);
  }
  if (dados.funcao !== undefined) {
    usuario.funcao = dados.funcao;
  }
  if (dados.dataNascimento !== undefined) {
    usuario.dataNascimento = dados.dataNascimento;
  }
  if (dados.celular !== undefined) {
    usuario.celular = dados.celular?.trim() || null;
  }

  return repositorio.save(usuario);
}

export async function removerUsuario(id: number): Promise<boolean> {
  const resultado = await repositorio.delete(id);
  return !!resultado.affected && resultado.affected > 0;
}
