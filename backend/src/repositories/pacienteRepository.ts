import { Like } from "typeorm";
import { AppDataSource } from "../config/database";
import { Paciente } from "../entities/Paciente";

const repositorio = AppDataSource.getRepository(Paciente);

export type DadosCriarPaciente = {
  nome: string;
  dataNascimento: Date;
  nomeResponsavelLegal: string;
  telefoneResponsavelLegal: string;
  endereco: string;
};

export type DadosAtualizarPaciente = {
  nome?: string;
  dataNascimento?: Date;
  nomeResponsavelLegal?: string;
  telefoneResponsavelLegal?: string;
  endereco?: string;
};

export async function buscarTodosPacientes(
  nome?: string
): Promise<Paciente[]> {
  if (nome) {
    return repositorio.find({
      where: {
        nome: Like(`%${nome}%`),
      },
    });
  }

  return repositorio.find();
}

export async function buscarPacientePorId(
  id: number
): Promise<Paciente | null> {
  return repositorio.findOneBy({ id });
}

export async function criarPaciente(
  dados: DadosCriarPaciente
): Promise<Paciente> {
  const novo = repositorio.create(dados);
  return repositorio.save(novo);
}

export async function atualizarPaciente(
  id: number,
  dados: DadosAtualizarPaciente
): Promise<Paciente | null> {
  const paciente = await repositorio.findOneBy({ id });

  if (!paciente) {
    return null;
  }

  Object.assign(paciente, dados);

  return repositorio.save(paciente);
}

export async function removerPaciente(id: number): Promise<boolean> {
  const resultado = await repositorio.delete(id);

  return !!resultado.affected && resultado.affected > 0;
}
