import { Request, Response } from "express";
import { createUser, getUsers, getUserById } from "../repositories/userRepository";

export async function listUsers(req: Request, res: Response) {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
}

export async function addUser(req: Request, res: Response) {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name e email são obrigatórios" });
    }

    const user = await createUser({ name, email });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

export async function listUsersById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "id é obrigatório" });
    }

    const user = await getUserById(Number(id));
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuário por ID" });
  }
}