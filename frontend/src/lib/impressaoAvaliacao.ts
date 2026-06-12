export type ImpressaoAvaliacaoDados = {
  pacienteNome: string;
  faixaEtaria?: string;
  leito?: string;
  diagnostico?: string;
  dih?: string | number;
  avaliadorNome?: string;
  criadoEm: string;
  avaliacaoRespiratoria?: string;
  pontuacaoRespiratoria?: number;
  avaliacaoCardiovascular?: string;
  pontuacaoCardiovascular?: number;
  avaliacaoNeurologica?: string;
  pontuacaoNeurologica?: number;
  frequenciaRespiratoria?: number;
  frequenciaCardiaca?: number;
  vigilia?: boolean;
  emesePosOperatorio?: boolean;
  nebulizacaoResgate?: boolean;
  pontuacaoTotal: number;
  intervencao?: string;
  tempoControleSsvv?: string;
};

type Classificacao = {
  texto: string;
  cor: string;
};

function escapeHtml(valor: string | number | boolean | null | undefined) {
  if (valor === null || valor === undefined) {
    return "-";
  }

  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatarDataHora(valor: string | Date) {
  const data = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function classificarPontuacao(pontuacao: number): Classificacao {
  if (pontuacao >= 5) {
    return { texto: "Alto risco", cor: "#f5222d" };
  }

  if (pontuacao >= 3) {
    return { texto: "Atenção", cor: "#faad14" };
  }

  return { texto: "Baixo risco", cor: "#52c41a" };
}

export function imprimirAvaliacao(
  dados: ImpressaoAvaliacaoDados,
  titulo: string
) {
  const classificacao = classificarPontuacao(dados.pontuacaoTotal);
  const criadoEmFormatado = formatarDataHora(dados.criadoEm);
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(titulo)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
      h1 { font-size: 24px; margin-bottom: 8px; }
      h2 { font-size: 18px; margin: 18px 0 8px; }
      .header { border-bottom: 1px solid #ccc; padding-bottom: 12px; margin-bottom: 20px; }
      .metadata { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .field { display: flex; gap: 8px; margin-bottom: 8px; }
      .label { width: 180px; font-weight: 700; }
      .value { word-break: break-word; }
      .box { padding: 12px; border: 1px solid #ccc; border-radius: 6px; background: #fafafa; }
      .badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; border-radius: 999px; color: #fff; font-weight: 700; margin-bottom: 8px; }
      .badge-risk { background: ${classificacao.cor}; }
      .section { margin-bottom: 18px; }
      .section:last-child { margin-bottom: 0; }
      .footer { margin-top: 24px; font-size: 14px; color: #555; }
      @media print { body { margin: 0; } }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${escapeHtml(titulo)}</h1>
      <div class="field"><span class="label">Data / Hora</span><span class="value">${escapeHtml(criadoEmFormatado)}</span></div>
      <div class="field"><span class="label">Avaliador</span><span class="value">${escapeHtml(dados.avaliadorNome ?? "-")}</span></div>
      <div class="field"><span class="label">Paciente</span><span class="value">${escapeHtml(dados.pacienteNome)}</span></div>
      <div class="field"><span class="label">Faixa etária</span><span class="value">${escapeHtml(dados.faixaEtaria)}</span></div>
    </div>

    <div class="section box">
      <div class="badge badge-risk">${escapeHtml(classificacao.texto)} • PEWS ${escapeHtml(dados.pontuacaoTotal)}</div>
      <div class="field"><span class="label">Leito</span><span class="value">${escapeHtml(dados.leito)}</span></div>
      <div class="field"><span class="label">Diagnóstico</span><span class="value">${escapeHtml(dados.diagnostico)}</span></div>
      <div class="field"><span class="label">DIH</span><span class="value">${escapeHtml(dados.dih)}</span></div>
    </div>

    <div class="section">
      <h2>Sinais e critérios</h2>
      <div class="box">
        <div class="field"><span class="label">Avaliação respiratória</span><span class="value">${escapeHtml(dados.avaliacaoRespiratoria)} (${escapeHtml(dados.pontuacaoRespiratoria)})</span></div>
        <div class="field"><span class="label">Avaliação cardiovascular</span><span class="value">${escapeHtml(dados.avaliacaoCardiovascular)} (${escapeHtml(dados.pontuacaoCardiovascular)})</span></div>
        <div class="field"><span class="label">Avaliação neurológica</span><span class="value">${escapeHtml(dados.avaliacaoNeurologica)} (${escapeHtml(dados.pontuacaoNeurologica)})</span></div>
        <div class="field"><span class="label">Frequência respiratória</span><span class="value">${escapeHtml(dados.frequenciaRespiratoria)}</span></div>
        <div class="field"><span class="label">Frequência cardíaca</span><span class="value">${escapeHtml(dados.frequenciaCardiaca)}</span></div>
        <div class="field"><span class="label">Vigília</span><span class="value">${escapeHtml(dados.vigilia)}</span></div>
        <div class="field"><span class="label">Êmese pós-operatório</span><span class="value">${escapeHtml(dados.emesePosOperatorio)}</span></div>
        <div class="field"><span class="label">Nebulização de resgate</span><span class="value">${escapeHtml(dados.nebulizacaoResgate)}</span></div>
      </div>
    </div>

    <div class="section">
      <h2>Intervenção</h2>
      <div class="box">${escapeHtml(dados.intervencao)}</div>
    </div>

    <div class="section">
      <h2>Controle SSVV</h2>
      <div class="box">${escapeHtml(dados.tempoControleSsvv)}</div>
    </div>

    <div class="footer">Documento gerado pelo sistema PEWS.</div>
  </body>
</html>`;

  const janela = window.open("", "_blank", "width=900,height=700");
  if (!janela) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
    return;
  }

  janela.document.write(html);
  janela.document.close();
  janela.focus();
  janela.print();
}
