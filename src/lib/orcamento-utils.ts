import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  KpiOrcamento,
  Obra,
} from '@/types/orcamento';

/**
 * Formatação de valores monetários em Real (BRL)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatação abreviada para eixos de gráficos (ex: R$ 150k, R$ 1,2M)
 */
export function formatCurrencyShort(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}

/**
 * Formatação de percentual (ex: 0.15 => "15,0%")
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '0,0%';
  return `${(value * 100).toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato legível DD/MM/AAAA
 */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Normaliza rótulo de mês ("26/03" -> "Mar/26" e chave ordenável "2026-03")
 */
export function parseMesCompetencia(mesStr: string): { label: string; sortKey: string } {
  if (!mesStr) return { label: 'N/I', sortKey: '9999-99' };

  // Formato "AA/MM" (ex: "25/05", "26/02")
  const parts = mesStr.trim().split('/');
  if (parts.length === 2) {
    let ano = parts[0];
    let mes = parts[1];
    // Se invertido (ex: "05/25")
    if (parseInt(ano, 10) <= 12 && parseInt(mes, 10) > 12) {
      const tmp = ano;
      ano = mes;
      mes = tmp;
    }
    const anoCompleto = ano.length === 2 ? `20${ano}` : ano;
    const mesNum = parseInt(mes, 10);
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesNome = mesNum >= 1 && mesNum <= 12 ? mesesNomes[mesNum - 1] : mes;

    return {
      label: `${mesNome}/${ano.slice(-2)}`,
      sortKey: `${anoCompleto}-${String(mesNum).padStart(2, '0')}`,
    };
  }

  // Formato ISO "YYYY-MM" ou "YYYY-MM-DD"
  if (mesStr.includes('-')) {
    const parts = mesStr.trim().split('-');
    if (parts.length >= 2) {
      const ano = parts[0];
      const mesNum = parseInt(parts[1], 10);
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesNome = mesNum >= 1 && mesNum <= 12 ? mesesNomes[mesNum - 1] : parts[1];
      return {
        label: `${mesNome}/${ano.slice(-2)}`,
        sortKey: `${ano}-${String(mesNum).padStart(2, '0')}`,
      };
    }
  }

  return { label: mesStr, sortKey: mesStr };
}

/**
 * Recalcula contratos com base nas medições
 */
export function recalculateContratos(
  contratos: Contrato[],
  medicoes: Medicao[]
): Contrato[] {
  // Mapa de soma de medições realizadas por contrato
  const medidoPorContrato: Record<string, number> = {};

  for (const m of medicoes) {
    if (m.status === 'Pago' || m.status === 'Medido') {
      const cid = m.contrato_id;
      medidoPorContrato[cid] = (medidoPorContrato[cid] || 0) + (m.valor_medicao || 0);
    }
  }

  return contratos.map((c) => {
    const valorMedido = medidoPorContrato[c.id] || 0;
    
    // Aditivos
    const aditivos = c.aditivos || [];
    const totalAditivos = aditivos.reduce((acc, a) => acc + (Number(a.valor) || 0), 0);
    const valorOriginal = c.valor_original !== undefined ? c.valor_original : (c.valor_contrato - totalAditivos);
    const valorContratoVigente = valorOriginal + totalAditivos;

    // Distrato
    const isDistratado = c.status === 'Distratado';
    const congelar = c.distrato?.congelar_saldo !== false;
    const valorAcerto = Number(c.distrato?.valor_acerto) || 0;

    // Se o contrato foi distratado com congelamento de saldo, o valor final efetivo do contrato
    // reflete o que foi executado (valorMedido + valorAcerto), liberando o saldo não medido
    // de volta para o Orçamento Base da obra.
    const valorFinalContrato = (isDistratado && congelar)
      ? (valorMedido + valorAcerto)
      : valorContratoVigente;

    let saldoAMedir = Math.max(0, valorFinalContrato - valorMedido);
    if (isDistratado && congelar) {
      saldoAMedir = Math.max(0, valorAcerto);
    }

    const percentualMedido = valorFinalContrato > 0
      ? Math.min(1, valorMedido / valorFinalContrato)
      : (valorMedido > 0 ? 1 : 0);

    return {
      ...c,
      valor_original: valorOriginal,
      valor_aditivos: totalAditivos,
      valor_contrato: valorFinalContrato,
      valor_medido: valorMedido,
      saldo_a_medir: saldoAMedir,
      percentual_medido: percentualMedido,
      status: c.status || 'Ativo',
      aditivos,
    };
  });
}

/**
 * Recalcula orçamentos com base nos contratos
 */
export function recalculateOrcamentos(
  orcamentos: ItemOrcamento[],
  contratos: Contrato[]
): ItemOrcamento[] {
  // Mapa de contrato e medição acumulada por chave (OBRA + SUBDISCIPLINA)
  const contratadoMap: Record<string, number> = {};
  const medidoMap: Record<string, number> = {};

  for (const c of contratos) {
    const key = `${c.obra.trim().toUpperCase()}_${c.subdisciplina.trim().toUpperCase()}`;
    contratadoMap[key] = (contratadoMap[key] || 0) + (c.valor_contrato || 0);
    medidoMap[key] = (medidoMap[key] || 0) + (c.valor_medido || 0);
  }

  return orcamentos.map((o) => {
    const key = `${o.obra.trim().toUpperCase()}_${o.subdisciplina.trim().toUpperCase()}`;
    const valorContratado = contratadoMap[key] || 0;
    const valorMedido = medidoMap[key] || 0;
    const saldoAContratar = o.orcamento_base - valorContratado;
    const saldoMedicao = Math.max(0, valorContratado - valorMedido);

    return {
      ...o,
      valor_contratado: valorContratado,
      saldo_a_contratar: saldoAContratar,
      valor_medido: valorMedido,
      saldo_medicao: saldoMedicao,
    };
  });
}

/**
 * Extrai o mês e ano no formato "AA/MM" a partir de uma data ISO (YYYY-MM-DD)
 */
export function extractMesAno(dataIso?: string | null): string | null {
  if (!dataIso) return null;
  const parts = dataIso.trim().split('-');
  if (parts.length >= 2) {
    const ano = parts[0].length === 4 ? parts[0].slice(-2) : parts[0];
    const mes = parts[1].padStart(2, '0');
    return `${ano}/${mes}`;
  }
  return null;
}

/**
 * Critérios de agrupamento temporal da Curva S
 */
export type CriterioCurvaS = 'competencia' | 'desembolso' | 'medicao';

/**
 * Resolve o mês de referência de uma medição com fallback inteligente:
 * - 'competencia': Prioriza o preenchimento em m.mes_competencia. Se em branco, infere pelas datas.
 * - 'desembolso': Focado em Fluxo de Caixa / Pagamento. Se a medição estiver 'Pago' e tiver data_pagamento, usa o mês do pagamento. Se 'A Medir', usa a data prevista.
 * - 'medicao': Focado no avanço físico da obra. Usa data_medicao ou data_prevista.
 */
export function resolveMesMedicao(
  m: Medicao,
  criterio: CriterioCurvaS = 'competencia'
): string {
  // 1. Se critério for 'desembolso' (Fluxo de Caixa Real)
  if (criterio === 'desembolso') {
    if (m.status === 'Pago' && m.data_pagamento) {
      const extraido = extractMesAno(m.data_pagamento);
      if (extraido) return extraido;
    }
    if (m.data_prevista) {
      const extraido = extractMesAno(m.data_prevista);
      if (extraido) return extraido;
    }
    if (m.mes_competencia && m.mes_competencia.trim() !== '' && m.mes_competencia !== 'Sem data') {
      return m.mes_competencia.trim();
    }
  }

  // 2. Se critério for 'medicao' (Avanço Físico de Obra)
  if (criterio === 'medicao') {
    if (m.data_medicao) {
      const extraido = extractMesAno(m.data_medicao);
      if (extraido) return extraido;
    }
    if (m.data_prevista) {
      const extraido = extractMesAno(m.data_prevista);
      if (extraido) return extraido;
    }
    if (m.mes_competencia && m.mes_competencia.trim() !== '' && m.mes_competencia !== 'Sem data') {
      return m.mes_competencia.trim();
    }
  }

  // 3. Critério 'competencia' (Padrão) - Prioriza mes_competencia explícito
  if (m.mes_competencia && m.mes_competencia.trim() !== '' && m.mes_competencia !== 'Sem data') {
    return m.mes_competencia.trim();
  }

  // Fallbacks automáticos se mes_competencia estiver vazio:
  if (m.status === 'Pago' && m.data_pagamento) {
    const extraido = extractMesAno(m.data_pagamento);
    if (extraido) return extraido;
  }
  if (m.data_medicao) {
    const extraido = extractMesAno(m.data_medicao);
    if (extraido) return extraido;
  }
  if (m.data_prevista) {
    const extraido = extractMesAno(m.data_prevista);
    if (extraido) return extraido;
  }
  if (m.data_referencia) {
    const extraido = extractMesAno(m.data_referencia);
    if (extraido) return extraido;
  }

  return 'Sem data';
}

/**
 * Gera pontos para o gráfico e tabela da Curva de Desembolso (Curva S)
 */
export function calculateCurvaDesembolso(
  medicoes: Medicao[],
  filtroObra?: string | null,
  filtroEmpresa?: string | null,
  contratos?: Contrato[] | null,
  filtroCategoria?: 'Projeto' | 'Legalização' | null,
  criterio: CriterioCurvaS = 'competencia'
): CurvaDesembolsoPonto[] {
  // Mapa de categoria por contrato_id
  const catPorContrato: Record<string, string> = {};
  if (contratos) {
    contratos.forEach((c) => {
      catPorContrato[c.id] = c.categoria || 'Projeto';
    });
  }

  const filtered = medicoes.filter((m) => {
    if (m.status === 'Cancelado' || (m.status as any) === 'Cancelada') return false;
    if (filtroObra && m.obra !== filtroObra) return false;
    if (filtroEmpresa && m.empresa !== filtroEmpresa) return false;
    if (filtroCategoria && catPorContrato[m.contrato_id] && catPorContrato[m.contrato_id] !== filtroCategoria) {
      return false;
    }
    return true;
  });

  const mesMap: Record<string, { previsto: number; realizado: number }> = {};

  for (const m of filtered) {
    const mesKey = resolveMesMedicao(m, criterio);
    if (!mesMap[mesKey]) {
      mesMap[mesKey] = { previsto: 0, realizado: 0 };
    }

    if (m.status === 'Pago' || m.status === 'Medido') {
      mesMap[mesKey].realizado += m.valor_medicao;
    } else {
      // 'A Medir'
      mesMap[mesKey].previsto += m.valor_medicao;
    }
  }

  // Ordenar cronologicamente
  const mesesOrdenados = Object.keys(mesMap)
    .map((mes) => {
      const { label, sortKey } = parseMesCompetencia(mes);
      return {
        mesOriginal: mes,
        mesFormatado: label,
        mesSortKey: sortKey,
        previsto: mesMap[mes].previsto,
        realizado: mesMap[mes].realizado,
      };
    })
    .sort((a, b) => a.mesSortKey.localeCompare(b.mesSortKey));

  let acumPrevisto = 0;
  let acumRealizado = 0;
  let acumTotal = 0;

  return mesesOrdenados.map((item) => {
    const totalMes = item.previsto + item.realizado;
    acumPrevisto += item.previsto;
    acumRealizado += item.realizado;
    acumTotal += totalMes;

    return {
      mes: item.mesOriginal,
      mesFormatado: item.mesFormatado,
      mesSortKey: item.mesSortKey,
      previsto: item.previsto,
      realizado: item.realizado,
      total: totalMes,
      acumuladoPrevisto: acumPrevisto,
      acumuladoRealizado: acumRealizado,
      acumuladoTotal: acumTotal,
    };
  });
}

/**
 * Calcula os KPIs gerais para o painel de orçamentos e medições
 */
export function calculateKpis(
  orcamentos: ItemOrcamento[],
  contratos: Contrato[],
  medicoes: Medicao[],
  filtroObra?: string | null,
  filtroCategoria?: 'Projeto' | 'Legalização' | null
): KpiOrcamento {
  // Mapa de categoria por contrato
  const catPorContrato: Record<string, string> = {};
  contratos.forEach((c) => {
    catPorContrato[c.id] = c.categoria || 'Projeto';
  });

  const filteredOrc = orcamentos.filter((o) => {
    if (filtroObra && o.obra !== filtroObra) return false;
    if (filtroCategoria && o.categoria !== filtroCategoria) return false;
    return true;
  });

  const filteredCt = contratos.filter((c) => {
    if (filtroObra && c.obra !== filtroObra) return false;
    if (filtroCategoria && c.categoria !== filtroCategoria) return false;
    return true;
  });

  const filteredMed = medicoes.filter((m) => {
    if (filtroObra && m.obra !== filtroObra) return false;
    if (filtroCategoria && catPorContrato[m.contrato_id] && catPorContrato[m.contrato_id] !== filtroCategoria) {
      return false;
    }
    return true;
  });

  const totalOrcado = filteredOrc.reduce((acc, o) => acc + (o.orcamento_base || 0), 0);
  const totalContratado = filteredCt.reduce((acc, c) => acc + (c.valor_contrato || 0), 0);
  const saldoAContratar = totalOrcado - totalContratado;
  const percentualContratado = totalOrcado > 0 ? totalContratado / totalOrcado : 0;

  let totalPago = 0;
  let totalMedidoPendente = 0;
  let totalPrevistoAMedir = 0;
  let totalCancelado = 0;
  let totalEmAtraso = 0;
  let qtdEmAtraso = 0;
  let totalMedidoNaoPago = 0;
  let qtdMedidoNaoPago = 0;
  let totalAMedirAtrasado = 0;
  let qtdAMedirAtrasado = 0;

  for (const m of filteredMed) {
    if (m.status === 'Pago') {
      totalPago += m.valor_medicao;
    } else if (m.status === 'Medido') {
      totalMedidoPendente += m.valor_medicao;
      if (isMedicaoEmAtraso(m)) {
        totalEmAtraso += m.valor_medicao;
        qtdEmAtraso++;
        totalMedidoNaoPago += m.valor_medicao;
        qtdMedidoNaoPago++;
      }
    } else if (m.status === 'Cancelado' || (m.status as any) === 'Cancelada') {
      totalCancelado += m.valor_medicao;
    } else {
      // 'A Medir'
      totalPrevistoAMedir += m.valor_medicao;
      if (isMedicaoEmAtraso(m)) {
        totalEmAtraso += m.valor_medicao;
        qtdEmAtraso++;
        totalAMedirAtrasado += m.valor_medicao;
        qtdAMedirAtrasado++;
      }
    }
  }

  const totalMedido = totalPago + totalMedidoPendente;
  const saldoAMedir = Math.max(0, totalContratado - totalMedido);
  const percentualMedido = totalContratado > 0 ? totalMedido / totalContratado : 0;

  const totalProjetosContratado = contratos
    .filter((c) => (!filtroObra || c.obra === filtroObra) && c.categoria === 'Projeto')
    .reduce((acc, c) => acc + c.valor_contrato, 0);

  const totalLegalizacaoContratado = contratos
    .filter((c) => (!filtroObra || c.obra === filtroObra) && c.categoria === 'Legalização')
    .reduce((acc, c) => acc + c.valor_contrato, 0);

  return {
    totalOrcado,
    totalContratado,
    saldoAContratar,
    percentualContratado,
    totalMedido,
    saldoAMedir,
    percentualMedido,
    totalPago,
    totalMedidoPendente,
    totalPrevistoAMedir,
    totalCancelado,
    totalContratosCount: filteredCt.length,
    totalMedicoesCount: filteredMed.length,
    totalProjetosContratado,
    totalLegalizacaoContratado,
    totalEmAtraso,
    qtdEmAtraso,
    totalMedidoNaoPago,
    qtdMedidoNaoPago,
    totalAMedirAtrasado,
    qtdAMedirAtrasado,
  };
}

/**
 * Verifica se uma medição está em atraso em relação à data atual
 * (Prevista para uma data/mês no passado, mas ainda não paga)
 */
export function isMedicaoEmAtraso(m: Medicao, dataReferencia?: string): boolean {
  if (m.status === 'Pago' || m.status === 'Cancelado' || (m.status as any) === 'Cancelada') {
    return false;
  }

  const todayStr = dataReferencia || new Date().toISOString().split('T')[0];

  // Se tiver data prevista explícita
  if (m.data_prevista) {
    return m.data_prevista < todayStr;
  }

  // Se não tiver data prevista, verificar pelo mês de competência (formato "AA/MM")
  if (m.mes_competencia) {
    const { sortKey } = parseMesCompetencia(m.mes_competencia);
    const todaySortKey = todayStr.substring(0, 7); // "YYYY-MM"
    return sortKey < todaySortKey;
  }

  return false;
}

/**
 * Retorna a quantidade de dias em atraso de uma medição
 */
export function getDiasAtraso(m: Medicao, dataReferencia?: string): number {
  if (!isMedicaoEmAtraso(m, dataReferencia)) return 0;
  const todayStr = dataReferencia || new Date().toISOString().split('T')[0];
  const refDate = new Date(todayStr);

  let targetDate: Date | null = null;
  if (m.data_prevista) {
    targetDate = new Date(m.data_prevista);
  } else if (m.mes_competencia) {
    const { sortKey } = parseMesCompetencia(m.mes_competencia);
    targetDate = new Date(`${sortKey}-28`);
  }

  if (!targetDate || isNaN(targetDate.getTime())) return 0;
  const diffMs = refDate.getTime() - targetDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Mapeia obras cadastradas com nome e código legível
 */
export function getObraLabel(codigo: string, obras: Obra[]): string {
  const found = obras.find((o) => o.codigo.toUpperCase() === codigo.toUpperCase());
  if (found) {
    return `${found.codigo} - ${found.nome}`;
  }
  return codigo;
}
