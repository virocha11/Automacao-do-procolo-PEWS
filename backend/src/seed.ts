import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { AppDataSource } from "./config/database";
import { Usuario, FuncaoUsuario } from "./entities/Usuario";
import { Paciente } from "./entities/Paciente";

const CUSTO_BCRYPT = 10;

interface DadosSeed {
  nome: string;
  email: string;
  senha: string;
  funcao: FuncaoUsuario;
  dataNascimento: Date | null;
  celular: string | null;
}

const usuariosIniciais: DadosSeed[] = [
  {
    nome: "Vivian",
    email: "vivian@pews.com",
    senha: "Admin@123",
    funcao: FuncaoUsuario.ADMINISTRADOR,
    dataNascimento: null,
    celular: null,
  },
  {
    nome: "Leticia",
    email: "leticia@pews.com",
    senha: "Admin@123",
    funcao: FuncaoUsuario.ADMINISTRADOR,
    dataNascimento: null,
    celular: null,
  },
  {
    nome: "João Tester",
    email: "joao.tester@pews.com",
    senha: "Medico@123",
    funcao: FuncaoUsuario.MEDICO,
    dataNascimento: null,
    celular: null,
  },
  {
    nome: "Maria Chiquinha",
    email: "maria.chiquinha@pews.com",
    senha: "Enfermeiro@123",
    funcao: FuncaoUsuario.ENFERMEIRO,
    dataNascimento: null,
    celular: null,
  },
];

function dataNascimentoComIdade(anos: number, meses: number = 0): Date {
  const hoje = new Date();
  return new Date(hoje.getFullYear() - anos, hoje.getMonth() - meses, hoje.getDate());
}

interface DadosPacienteSeed {
  nome: string;
  dataNascimento: Date;
  nomeResponsavelLegal: string;
  telefoneResponsavelLegal: string;
  endereco: string;
}

const pacientesIniciais: DadosPacienteSeed[] = [
  // --- Menores de 1 ano ---
  {
    nome: "Ana Silva",
    dataNascimento: dataNascimentoComIdade(0, 3),
    nomeResponsavelLegal: "Carla Silva",
    telefoneResponsavelLegal: "(44) 99901-0001",
    endereco: "Rua das Flores, 100 - Campo Mourão/PR",
  },
  {
    nome: "Pedro Costa",
    dataNascimento: dataNascimentoComIdade(0, 7),
    nomeResponsavelLegal: "Fernanda Costa",
    telefoneResponsavelLegal: "(44) 99902-0002",
    endereco: "Av. Brasil, 250 - Campo Mourão/PR",
  },
  {
    nome: "Laura Mendes",
    dataNascimento: dataNascimentoComIdade(0, 10),
    nomeResponsavelLegal: "Juliana Mendes",
    telefoneResponsavelLegal: "(44) 99903-0003",
    endereco: "Rua Paraná, 45 - Campo Mourão/PR",
  },
  // --- Entre 1 e 12 anos ---
  {
    nome: "Lucas Oliveira",
    dataNascimento: dataNascimentoComIdade(1, 6),
    nomeResponsavelLegal: "Mariana Oliveira",
    telefoneResponsavelLegal: "(44) 99904-0004",
    endereco: "Rua Minas Gerais, 320 - Campo Mourão/PR",
  },
  {
    nome: "Sofia Rodrigues",
    dataNascimento: dataNascimentoComIdade(2, 4),
    nomeResponsavelLegal: "Patrícia Rodrigues",
    telefoneResponsavelLegal: "(44) 99905-0005",
    endereco: "Rua São Paulo, 88 - Campo Mourão/PR",
  },
  {
    nome: "Miguel Santos",
    dataNascimento: dataNascimentoComIdade(4),
    nomeResponsavelLegal: "Roberto Santos",
    telefoneResponsavelLegal: "(44) 99906-0006",
    endereco: "Av. Irmãos Pereira, 500 - Campo Mourão/PR",
  },
  {
    nome: "Helena Ferreira",
    dataNascimento: dataNascimentoComIdade(6),
    nomeResponsavelLegal: "Tatiane Ferreira",
    telefoneResponsavelLegal: "(44) 99907-0007",
    endereco: "Rua Santa Catarina, 72 - Campo Mourão/PR",
  },
  {
    nome: "Arthur Lima",
    dataNascimento: dataNascimentoComIdade(8, 3),
    nomeResponsavelLegal: "Vanessa Lima",
    telefoneResponsavelLegal: "(44) 99908-0008",
    endereco: "Rua Rio de Janeiro, 140 - Campo Mourão/PR",
  },
  {
    nome: "Valentina Almeida",
    dataNascimento: dataNascimentoComIdade(10),
    nomeResponsavelLegal: "Cristina Almeida",
    telefoneResponsavelLegal: "(44) 99909-0009",
    endereco: "Av. Capitão Indío Bandeira, 600 - Campo Mourão/PR",
  },
  {
    nome: "Téo Barbosa",
    dataNascimento: dataNascimentoComIdade(11, 8),
    nomeResponsavelLegal: "Diego Barbosa",
    telefoneResponsavelLegal: "(44) 99910-0010",
    endereco: "Rua Goiás, 33 - Campo Mourão/PR",
  },
];

async function seed() {
  console.log("Iniciando seed do banco de dados...\n");

  await AppDataSource.initialize();
  console.log("Conexão com o banco de dados estabelecida.\n");

  const repositorio = AppDataSource.getRepository(Usuario);

  for (const dados of usuariosIniciais) {
    const existente = await repositorio.findOneBy({ email: dados.email });

    if (existente) {
      console.log(`Usuário "${dados.nome}" (${dados.email}) já existe. Pulando...`);
      continue;
    }

    const senhaHash = await bcrypt.hash(dados.senha, CUSTO_BCRYPT);

    const usuario = repositorio.create({
      nome: dados.nome,
      email: dados.email,
      senha: senhaHash,
      funcao: dados.funcao,
      dataNascimento: dados.dataNascimento,
      celular: dados.celular,
      fotoPerfil: null,
    });

    await repositorio.save(usuario);

    const funcaoNome =
      dados.funcao === FuncaoUsuario.ADMINISTRADOR
        ? "Administrador"
        : dados.funcao === FuncaoUsuario.MEDICO
          ? "Médico"
          : "Enfermeiro";

    console.log(`[NEW] Usuário criado: ${dados.nome} | ${dados.email} | ${funcaoNome}`);
  }

  // --- Seed de Pacientes ---
  console.log("\n--- Populando pacientes ---\n");

  const repoPaciente = AppDataSource.getRepository(Paciente);

  for (const dados of pacientesIniciais) {
    const existente = await repoPaciente.findOneBy({ nome: dados.nome });

    if (existente) {
      console.log(`Paciente "${dados.nome}" já existe. Pulando...`);
      continue;
    }

    const paciente = repoPaciente.create({
      nome: dados.nome,
      dataNascimento: dados.dataNascimento,
      nomeResponsavelLegal: dados.nomeResponsavelLegal,
      telefoneResponsavelLegal: dados.telefoneResponsavelLegal,
      endereco: dados.endereco,
    });

    await repoPaciente.save(paciente);

    const idadeMs = Date.now() - dados.dataNascimento.getTime();
    const idadeAnos = Math.floor(idadeMs / (365.25 * 24 * 60 * 60 * 1000));
    const idadeMeses = Math.floor(idadeMs / (30.44 * 24 * 60 * 60 * 1000));
    const idadeTexto = idadeAnos >= 1 ? `${idadeAnos} ano(s)` : `${idadeMeses} mês(es)`;

    console.log(`[NEW] Paciente criado: ${dados.nome} | Idade: ${idadeTexto}`);
  }

  console.log("\nSeed finalizado com sucesso!");

  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch((erro) => {
  console.error("[ERROR]Erro ao executar seed:", erro);
  process.exit(1);
});
