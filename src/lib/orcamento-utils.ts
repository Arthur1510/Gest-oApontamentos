import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  KpiOrcamento,
  Obra,
  StatusOrcamento,
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
    // Sentinela "00/01" ou ano/mês zero
    if (parseInt(ano, 10) === 0 || parseInt(mes, 10) === 0) {
      return { label: 'A Definir', sortKey: '9999-99' };
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
 * Normaliza textos removendo acentos e espaços extras para matching seguro
 */
export function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Retorna o código canônico de uma obra para comparação confiável entre tabelas
 */
export function getCanonicalObra(obraStr?: string | null, obrasList?: Obra[]): string {
  if (!obraStr) return '';
  const clean = normalizeText(obraStr);
  const allObras = obrasList || [];
  for (const o of allObras) {
    if (
      clean === normalizeText(o.codigo) ||
      clean === normalizeText(o.nome) ||
      clean === normalizeText(o.cc) ||
      clean === normalizeText(o.id)
    ) {
      return normalizeText(o.codigo);
    }
  }
  return clean;
}

/**
 * Recalcula contratos com base nas medições, aditivos e distratos
 */
export function recalculateContratos(
  contratos: Contrato[],
  medicoes: Medicao[]
): Contrato[] {
  // Mapa de soma de medições realizadas por contrato
  const medidoPorContrato: Record<string, number> = {};

  for (const m of medicoes) {
    if (m.status === 'Pago' || m.status === 'Medido' || m.status === 'A Pagar') {
      const cid = String(m.contrato_id).trim();
      medidoPorContrato[cid] = (medidoPorContrato[cid] || 0) + (Number(m.valor_medicao) || 0);
    }
  }

  return contratos.map((c) => {
    const valorMedido = medidoPorContrato[String(c.id).trim()] || 0;
    
    // Aditivos
    const aditivos = c.aditivos || [];
    const totalAditivos = aditivos.reduce((acc, a) => acc + (Number(a.valor) || 0), 0);
    
    // Identificação correta e robusta do valor_original
    // Se c.valor_original já existe e é > 0, mantemos ele como o valor base imutável
    // Se não existir, verificamos se o contrato já possuía aditivos registrados no objeto.
    // Se possuía aditivos gravados, o valor_original é (valor_contrato - totalAditivos).
    // Caso contrário, o valor original é o valor_contrato base atual (e os aditivos somarão a ele).
    let valorOriginal = Number(c.valor_original);
    if (!valorOriginal || isNaN(valorOriginal) || valorOriginal <= 0) {
      const vContrato = Number(c.valor_contrato) || 0;
      if (Number(c.valor_aditivos) > 0 && totalAditivos > 0) {
        valorOriginal = Math.max(0, vContrato - totalAditivos);
      } else {
        valorOriginal = vContrato;
      }
    }

    const valorContratoVigente = valorOriginal + totalAditivos;

    // Distrato
    const isDistratado = c.status === 'Distratado' || !!c.distrato;
    const congelar = c.distrato?.congelar_saldo !== false;
    const valorAcerto = Number(c.distrato?.valor_acerto) || 0;

    let valorFinalContrato = valorContratoVigente;
    let saldoAMedir = Math.max(0, valorContratoVigente - valorMedido);

    if (isDistratado) {
      if (congelar) {
        // Se congelar_saldo está ativo, o saldo restante não medido é cancelado.
        // Se o valorAcerto for preenchido com o valor distratado (ex: 83.000 em contrato de 150.000):
        // ou se valorAcerto é 0: o contrato vigente reflete apenas o que foi executado (valorMedido).
        const saldoCancelado = Math.max(0, valorContratoVigente - valorMedido);
        if (valorAcerto > 0 && Math.abs(valorAcerto - saldoCancelado) < 1) {
          // valorAcerto informado é exatamente o saldo distratado/cancelado (ex: 83.000)
          valorFinalContrato = valorMedido;
        } else if (valorAcerto > 0 && valorAcerto > valorMedido && valorAcerto <= valorContratoVigente) {
          // valorAcerto informado como montante da dedução/rescisão do contrato
          valorFinalContrato = Math.max(valorMedido, valorContratoVigente - valorAcerto);
        } else if (valorAcerto > 0 && valorAcerto < saldoCancelado) {
          // valorAcerto é um valor residual de acerto além do já medido
          valorFinalContrato = valorMedido + valorAcerto;
        } else {
          valorFinalContrato = valorMedido;
        }
        saldoAMedir = 0;
      } else {
        // Se não congelar saldo, deduz o valor do distrato se informado
        if (valorAcerto > 0) {
          valorFinalContrato = Math.max(valorMedido, valorContratoVigente - valorAcerto);
          saldoAMedir = Math.max(0, valorFinalContrato - valorMedido);
        }
      }
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
 * Normaliza e limpa termos comuns para correspondência robusta
 */
function cleanTerm(str?: string | null): string {
  if (!str) return '';
  return normalizeText(str)
    .replace(/\bARQUITERURA\b/g, 'ARQUITETURA')
    .trim();
}

/**
 * Verifica se um contrato pertence a uma linha de orçamento base
 */
export function isContratoMatchOrcamento(
  c: Contrato,
  o: ItemOrcamento,
  obras?: Obra[],
  allOrcamentosDaObra?: ItemOrcamento[]
): boolean {
  const cObra = getCanonicalObra(c.obra, obras);
  const oObra = getCanonicalObra(o.obra || o.nome_obra, obras);
  if (cObra !== oObra) return false;

  const cDisc = normalizeText(c.disciplina);
  const oDisc = normalizeText(o.disciplina);
  const cSub = cleanTerm(c.subdisciplina);
  const oSub = cleanTerm(o.subdisciplina);

  // 1. Quando as disciplinas são iguais
  if (cDisc && oDisc && cDisc === oDisc) {
    // 1.1 Se as subdisciplinas são iguais (e ambas preenchidas)
    if (cSub && oSub && cSub === oSub) {
      return true;
    }

    const cSubIsGeneric = !cSub || cSub === cDisc;
    const oSubIsGeneric = !oSub || oSub === oDisc;

    // 1.2 Se ambos são genéricos da disciplina (ex: subdisciplina vazia ou igual à disciplina)
    if (cSubIsGeneric && oSubIsGeneric) {
      return true;
    }

    // 1.3 Se o contrato é genérico na disciplina (não especificou subdisciplina):
    if (cSubIsGeneric) {
      const itensMesmaDisc = allOrcamentosDaObra
        ? allOrcamentosDaObra.filter((item) => normalizeText(item.disciplina) === cDisc)
        : [];
      // Se há apenas 1 item da disciplina na obra, vincula a ele
      if (itensMesmaDisc.length <= 1) {
        return itensMesmaDisc.length === 1 ? itensMesmaDisc[0].id === o.id : true;
      }
      // Se há um item com subdisciplina genérica, vincula a ele
      const itemGenerico = itensMesmaDisc.find((item) => {
        const sub = cleanTerm(item.subdisciplina);
        return !sub || sub === cDisc;
      });
      if (itemGenerico) {
        return itemGenerico.id === o.id;
      }
      // Se não há item genérico, vincula unicamente ao primeiro item da disciplina para não duplicar
      return itensMesmaDisc[0].id === o.id;
    }

    // 1.4 Se o orçamento tem subdisciplina genérica e o contrato tem subdisciplina específica
    if (oSubIsGeneric) {
      // Se já existe um orçamento específico nesta mesma disciplina na obra para essa subdisciplina do contrato, NÃO vincula ao genérico
      const temOrcEspecifico = allOrcamentosDaObra
        ? allOrcamentosDaObra.some((item) => {
            if (item.id === o.id) return false;
            if (normalizeText(item.disciplina) !== cDisc) return false;
            const sub = cleanTerm(item.subdisciplina);
            return Boolean(sub && sub !== cDisc && (sub === cSub || sub.includes(cSub) || cSub.includes(sub)));
          })
        : false;

      if (!temOrcEspecifico) {
        return true;
      }
      return false;
    }

    // 1.5 Correspondência textual parcial na subdisciplina (ex: "ARQUITETURA LEGAL" e "LEGAL")
    if (cSub && oSub && (cSub.includes(oSub) || oSub.includes(cSub))) {
      return true;
    }

    // Mesma disciplina com subdisciplinas diferentes e não correlacionadas
    return false;
  }

  // 2. Casos em que subdisciplina e disciplina se cruzam (ex: "COMPLEMENTARES" vs "HIDROSSANITÁRIO")
  if (cSub && oDisc && cSub === oDisc) return true;
  if (cDisc && oSub && cDisc === oSub) return true;

  return false;
}

/**
 * Recalcula orçamentos com base nos contratos (com suporte a aditivos, distratos e normalização inteligente)
 */
export function recalculateOrcamentos(
  orcamentos: ItemOrcamento[],
  contratos: Contrato[],
  obras?: Obra[]
): ItemOrcamento[] {
  // Pré-agrupar orçamentos por obra canônica
  const orcamentosPorObra: Record<string, ItemOrcamento[]> = {};
  for (const o of orcamentos) {
    const oKey = getCanonicalObra(o.obra || o.nome_obra, obras);
    if (!orcamentosPorObra[oKey]) orcamentosPorObra[oKey] = [];
    orcamentosPorObra[oKey].push(o);
  }

  return orcamentos.map((o) => {
    const oObraKey = getCanonicalObra(o.obra || o.nome_obra, obras);
    const itensDaObra = orcamentosPorObra[oObraKey] || [];

    let valorContratado = 0;
    let valorMedido = 0;

    for (const c of contratos) {
      if (isContratoMatchOrcamento(c, o, obras, itensDaObra)) {
        valorContratado += Number(c.valor_contrato) || 0;
        valorMedido += Number(c.valor_medido) || 0;
      }
    }

    const saldoAContratar = o.orcamento_base - valorContratado;
    const saldoMedicao = Math.max(0, valorContratado - valorMedido);

    // Preserva o status definido no item (inclusive escolhas manuais do usuário como 'Em cotação', 'Em contratação', 'Cancelado', etc.)
    // Apenas infere automaticamente caso o item não possua status definido
    const statusAtual: StatusOrcamento = o.status || (valorContratado > 0 ? (saldoAContratar <= 0.01 ? 'Contratado' : 'Em contratação') : 'A contratar');

    return {
      ...o,
      valor_contratado: valorContratado,
      saldo_a_contratar: saldoAContratar,
      valor_medido: valorMedido,
      saldo_medicao: saldoMedicao,
      status: statusAtual,
    };
  });
}

export interface ResumoAditivosOrcamento {
  totalAditivos: number;
  qtdAditivos: number;
  valorOriginalTotal: number;
  contratosCount: number;
}

/**
 * Retorna o resumo consolidado de aditivos e valor original para um item de orçamento base
 */
export function getAditivosSummaryByOrcamento(
  o: ItemOrcamento,
  contratos: Contrato[],
  obras?: Obra[],
  allOrcamentosDaObra?: ItemOrcamento[]
): ResumoAditivosOrcamento {
  const matched = contratos.filter((c) => isContratoMatchOrcamento(c, o, obras, allOrcamentosDaObra));
  let totalAditivos = 0;
  let qtdAditivos = 0;
  let valorOriginalTotal = 0;

  for (const c of matched) {
    totalAditivos += Number(c.valor_aditivos) || 0;
    qtdAditivos += (c.aditivos || []).length;
    valorOriginalTotal += Number(c.valor_original ?? c.valor_contrato) || 0;
  }

  return {
    totalAditivos,
    qtdAditivos,
    valorOriginalTotal,
    contratosCount: matched.length,
  };
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

    if (m.status === 'Pago' || m.status === 'Medido' || m.status === 'A Pagar') {
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
    } else if (m.status === 'Medido' || m.status === 'A Pagar') {
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
  // O atraso é considerado exclusivamente quando o status da medição for 'A Medir'
  if (m.status !== 'A Medir') {
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
