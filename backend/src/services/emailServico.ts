import net from "net";
import tls from "tls";

type SocketSmtp = net.Socket | tls.TLSSocket;

type OpcoesEmail = {
  para: string;
  assunto: string;
  texto: string;
};

function obterConfiguracao() {
  const host = process.env.SMTP_HOST;
  const usuario = process.env.SMTP_USER;
  const senha = process.env.SMTP_PASS;
  const de = process.env.SMTP_FROM || usuario;
  const porta = Number(process.env.SMTP_PORT || 587);
  const seguro = process.env.SMTP_SECURE === "true" || porta === 465;

  if (!host || !usuario || !senha || !de) {
    throw new Error("Envio de e-mail não configurado.");
  }

  return { host, usuario, senha, de, porta, seguro };
}

function aguardarEvento(socket: SocketSmtp, evento: "connect" | "secureConnect") {
  return new Promise<void>((resolve, reject) => {
    socket.once(evento, () => resolve());
    socket.once("error", reject);
  });
}

function lerResposta(socket: SocketSmtp) {
  return new Promise<string>((resolve, reject) => {
    let bruto = "";

    function aoReceber(chunk: Buffer | string) {
      bruto += chunk.toString();
      const linhas = bruto.split(/\r?\n/).filter(Boolean);
      const ultima = linhas[linhas.length - 1];

      if (/^\d{3} /.test(ultima)) {
        socket.off("data", aoReceber);
        socket.off("error", reject);
        resolve(bruto);
      }
    }

    socket.on("data", aoReceber);
    socket.once("error", reject);
  });
}

async function enviarComando(socket: SocketSmtp, comando: string) {
  socket.write(`${comando}\r\n`);
  const resposta = await lerResposta(socket);
  const codigo = Number(resposta.slice(0, 3));

  if (codigo >= 400) {
    throw new Error(`Falha SMTP: ${resposta.trim()}`);
  }

  return resposta;
}

function codificarCabecalho(valor: string) {
  return `=?UTF-8?B?${Buffer.from(valor).toString("base64")}?=`;
}

function montarMensagem(de: string, opcoes: OpcoesEmail) {
  const texto = opcoes.texto.replace(/\r?\n\./g, "\r\n..");

  return [
    `From: ${de}`,
    `To: ${opcoes.para}`,
    `Subject: ${codificarCabecalho(opcoes.assunto)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    texto,
  ].join("\r\n");
}

export async function enviarEmail(opcoes: OpcoesEmail) {
  const config = obterConfiguracao();
  let socket: SocketSmtp = config.seguro
    ? tls.connect({ host: config.host, port: config.porta, servername: config.host })
    : net.connect({ host: config.host, port: config.porta });

  await aguardarEvento(socket, config.seguro ? "secureConnect" : "connect");
  await lerResposta(socket);
  await enviarComando(socket, `EHLO ${process.env.SMTP_EHLO || "localhost"}`);

  if (!config.seguro) {
    await enviarComando(socket, "STARTTLS");
    socket = tls.connect({ socket, servername: config.host });
    await aguardarEvento(socket, "secureConnect");
    await enviarComando(socket, `EHLO ${process.env.SMTP_EHLO || "localhost"}`);
  }

  await enviarComando(socket, "AUTH LOGIN");
  await enviarComando(socket, Buffer.from(config.usuario).toString("base64"));
  await enviarComando(socket, Buffer.from(config.senha).toString("base64"));
  await enviarComando(socket, `MAIL FROM:<${config.de}>`);
  await enviarComando(socket, `RCPT TO:<${opcoes.para}>`);
  await enviarComando(socket, "DATA");
  await enviarComando(socket, `${montarMensagem(config.de, opcoes)}\r\n.`);
  await enviarComando(socket, "QUIT");
  socket.end();
}
