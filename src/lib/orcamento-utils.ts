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
    const saldoAMedir = Math.max(0, c.valor_contrato - valorMedido);
    const percentualMedido = c.valor_contrato > 0 ? valorMedido / c.valor_contrato : 0;

    return {
      ...c,
      valor_medido: valorMedido,
      saldo_a_medir: saldoAMedir,
      percentual_medido: percentualMedido,
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
 * Gera pontos para o gráfico e tabela da Curva de Desembolso (Curva S)
 */
export function calculateCurvaDesembolso(
  medicoes: Medicao[],
  filtroObra?: string | null,
  filtroEmpresa?: string | null,
  contratos?: Contrato[] | null,
  filtroCategoria?: 'Projeto' | 'Legalização' | null
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
    const mesKey = m.mes_competencia || 'Sem data';
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

  for (const m of filteredMed) {
    if (m.status === 'Pago') totalPago += m.valor_medicao;
    else if (m.status === 'Medido') totalMedidoPendente += m.valor_medicao;
    else if (m.status === 'Cancelado' || (m.status as any) === 'Cancelada') totalCancelado += m.valor_medicao;
    else totalPrevistoAMedir += m.valor_medicao; // 'A Medir'
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
  };
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
