import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Usuario } from "../entities/Usuario";
import { Avaliacao } from "../entities/Avaliacao";
import { AvaliacaoAnexo } from "../entities/AvaliacaoAnexo";
import { LogSistema } from "../entities/LogSistema";
import { Paciente } from "../entities/Paciente";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Usuario, Avaliacao, AvaliacaoAnexo, Paciente, LogSistema],
  synchronize: true,
  logging: false
});
