import "reflect-metadata";
import app from "./app";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";

dotenv.config();

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao inicializar o banco de dados:", error);
  });