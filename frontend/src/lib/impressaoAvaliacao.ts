import type { Avaliacao } from "../types/avaliacao";

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

export function imprimirListaAvaliacoes(
  avaliacoes: Avaliacao[],
  filtroPaciente: string
) {
  // 1. Calcular estatísticas de risco
  let altoRisco = 0;
  let atencao = 0;
  let baixoRisco = 0;

  avaliacoes.forEach((av) => {
    const p = av.pontuacaoTotal;
    if (p >= 5) altoRisco++;
    else if (p >= 3) atencao++;
    else baixoRisco++;
  });

  const filtroTexto = filtroPaciente.trim() ? filtroPaciente.trim() : "Todos";
  const dataEmissao = formatarDataHora(new Date());

  // 2. Construir tabela HTML
  const linhasTabela = avaliacoes
    .map((av) => {
      const classif = classificarPontuacao(av.pontuacaoTotal);
      const dataFormatada = formatarDataHora(av.criadoEm);
      return `
        <tr>
          <td>${escapeHtml(av.nomePaciente)}</td>
          <td>${escapeHtml(av.avaliadorNome)}</td>
          <td style="text-align: center; font-weight: bold;">${av.pontuacaoTotal}</td>
          <td style="text-align: center;">${escapeHtml(dataFormatada)}</td>
          <td style="text-align: center;">
            <span class="badge" style="background-color: ${classif.cor}; padding: 3px 8px; border-radius: 12px; color: #fff; font-size: 11px; font-weight: bold;">
              ${escapeHtml(classif.texto)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatório de Avaliações PEWS</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 24px; font-size: 14px; }
      h1 { font-size: 22px; color: #1f6b3a; margin-bottom: 4px; margin-top: 0; }
      .header-info { display: flex; justify-content: space-between; border-bottom: 2px solid #1f6b3a; padding-bottom: 8px; margin-bottom: 20px; }
      .info-item { margin-bottom: 4px; }
      .info-label { font-weight: bold; }
      
      .stats-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      .stat-card { border: 1px solid #ddd; border-radius: 6px; padding: 12px; text-align: center; background: #fafafa; }
      .stat-val { font-size: 20px; font-weight: bold; margin-top: 4px; }
      .stat-card.alto { border-left: 4px solid #f5222d; }
      .stat-card.alto .stat-val { color: #f5222d; }
      .stat-card.atencao { border-left: 4px solid #faad14; }
      .stat-card.atencao .stat-val { color: #faad14; }
      .stat-card.baixo { border-left: 4px solid #52c41a; }
      .stat-card.baixo .stat-val { color: #52c41a; }
      .stat-card.total { border-left: 4px solid #1f6b3a; }
      .stat-card.total .stat-val { color: #1f6b3a; }
      
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
      th { background-color: #f5f5f5; font-weight: bold; color: #333; }
      tr:nth-child(even) { background-color: #fafafa; }
      
      .badge { display: inline-block; text-align: center; min-width: 80px; }
      .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 11px; color: #777; text-align: center; }
      
      @media print {
        body { margin: 0; }
        .stat-card { background: #fff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        tr { page-break-inside: avoid; }
        th { background-color: #f5f5f5 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="header-info">
      <div>
        <h1>Relatório de Avaliações PEWS</h1>
        <div class="info-item"><span class="info-label">Paciente pesquisado:</span> ${escapeHtml(filtroTexto)}</div>
      </div>
      <div style="text-align: right; align-self: flex-end;">
        <div class="info-item"><span class="info-label">Gerado em:</span> ${escapeHtml(dataEmissao)}</div>
      </div>
    </div>

    <div class="stats-container">
      <div class="stat-card total">
        <div class="info-label">Total de Avaliações</div>
        <div class="stat-val">${avaliacoes.length}</div>
      </div>
      <div class="stat-card baixo">
        <div class="info-label">Baixo Risco</div>
        <div class="stat-val">${baixoRisco}</div>
      </div>
      <div class="stat-card atencao">
        <div class="info-label">Atenção</div>
        <div class="stat-val">${atencao}</div>
      </div>
      <div class="stat-card alto">
        <div class="info-label">Alto Risco</div>
        <div class="stat-val">${altoRisco}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Paciente</th>
          <th>Avaliador</th>
          <th style="text-align: center; width: 80px;">Pontuação</th>
          <th style="text-align: center; width: 140px;">Data/Hora</th>
          <th style="text-align: center; width: 110px;">Classificação</th>
        </tr>
      </thead>
      <tbody>
        ${linhasTabela ? linhasTabela : '<tr><td colspan="5" style="text-align: center;">Nenhuma avaliação encontrada.</td></tr>'}
      </tbody>
    </table>

    <div class="footer">
      Relatório gerado pelo sistema PEWS.
    </div>
  </body>
</html>`;

  const janela = window.open("", "_blank", "width=1000,height=800");
  if (!janela) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
    return;
  }

  janela.document.write(html);
  janela.document.close();
  janela.focus();
  janela.print();
}
