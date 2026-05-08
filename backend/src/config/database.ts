import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Usuario } from "../entities/Usuario"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Paciente } from "../entities/Paciente"; // eslint-disable-line @typescript-eslint/no-unused-vars

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [Usuario, Paciente],
  synchronize: true,
  logging: false
});