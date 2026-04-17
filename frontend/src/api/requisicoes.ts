import type { RespostaLogin } from "../types/usuario";

export function urlBaseApi(): string {
  const doEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (doEnv && doEnv.trim() !== "") {
    return doEnv.replace(/\/$/, "");
  }
  return "/api";
}

export async function fazerLogin(email: string, senha: string): Promise<RespostaLogin> {
  const resposta = await fetch(`${urlBaseApi()}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const corpo = (await resposta.json()) as { erro?: string } & Partial<RespostaLogin>;

  if (!resposta.ok) {
    throw new Error(corpo.erro ?? "Não foi possível entrar.");
  }

  if (!corpo.token || !corpo.usuario) {
    throw new Error("Resposta inválida do servidor.");
  }

  return corpo as RespostaLogin;
}
