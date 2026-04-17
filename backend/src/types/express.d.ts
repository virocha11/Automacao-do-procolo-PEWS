import type { Usuario } from "../entities/Usuario";

declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: Usuario;
    }
  }
}

export {};
