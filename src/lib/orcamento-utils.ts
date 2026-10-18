import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  KpiOrcamento,
  Obra,
  StatusObra,
  StatusOrcamento,
  MesJanela306090,
  JanelaCaixa306090,
  ItemConsolidadoDisciplina,
  ItemConsolidadoContrato,
  ItemConsolidadoObra,
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
 * Retorna o status cadastrado de uma obra ('Ativa' | 'Paralisada' | 'Cancelada' | 'Concluída')
 */
export function getObraStatus(obraStr?: string | null, obrasList?: Obra[]): StatusObra {
  if (!obraStr || !obrasList || obrasList.length === 0) return 'Ativa';
  const clean = normalizeText(obraStr);
  for (const o of obrasList) {
    if (
      clean === normalizeText(o.codigo) ||
      clean === normalizeText(o.nome) ||
      clean === normalizeText(o.cc) ||
      clean === normalizeText(o.id)
    ) {
      return o.status || 'Ativa';
    }
  }
  return 'Ativa';
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

    // Preserva o status definido no item (inclusive escolhas manuais do usuário como 'Em cotação', 'Cancelado', etc.)
    // Quando já possui valor contratado (> 0) e estava como 'A contratar' ou sem status, passa para 'Contratado'
    const statusAtual: StatusOrcamento =
      o.status === 'Cancelado'
        ? 'Cancelado'
        : valorContratado > 0 && (!o.status || o.status === 'A contratar')
        ? 'Contratado'
        : o.status || (valorContratado > 0 ? 'Contratado' : 'A contratar');

    // Se o item estiver Cancelado, zeramos o saldo a contratar restante
    const saldoAContratar = statusAtual === 'Cancelado' ? 0 : o.orcamento_base - valorContratado;
    const saldoMedicao = Math.max(0, valorContratado - valorMedido);

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
  criterio: CriterioCurvaS = 'desembolso'
): string {
  // 1. Se critério for 'desembolso' (Fluxo de Caixa Real)
  if (criterio === 'desembolso') {
    // Se tiver data_pagamento (seja 'Pago' ou 'A Pagar' com quitação agendada), prioriza o mês do desembolso
    if (m.data_pagamento) {
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
  if (m.data_pagamento) {
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
  criterio: CriterioCurvaS = 'desembolso',
  obras?: Obra[]
): CurvaDesembolsoPonto[] {
  // Mapa de categoria por contrato_id
  const catPorContrato: Record<string, string> = {};
  if (contratos) {
    contratos.forEach((c) => {
      catPorContrato[c.id] = c.categoria || 'Projeto';
    });
  }

  const canonFiltro = filtroObra ? getCanonicalObra(filtroObra, obras) : '';
  const matchObra = (val?: string | null) => !canonFiltro || getCanonicalObra(val, obras) === canonFiltro;

  const filtered = medicoes.filter((m) => {
    if (m.status === 'Cancelado' || (m.status as any) === 'Cancelada') return false;
    if (!matchObra(m.obra)) return false;
    if (filtroEmpresa && m.empresa !== filtroEmpresa) return false;
    if (filtroCategoria && catPorContrato[m.contrato_id] && catPorContrato[m.contrato_id] !== filtroCategoria) {
      return false;
    }
    // Medições futuras ('A Medir') de obras Paralisadas ou Canceladas não entram na projeção da Curva S
    if (m.status === 'A Medir' && obras && obras.length > 0) {
      const stObra = getObraStatus(m.obra, obras);
      if (stObra === 'Paralisada' || stObra === 'Cancelada') return false;
    }
    return true;
  });

  const mesMap: Record<
    string,
    { pago: number; aPagar: number; aMedir: number; previsto: number; realizado: number }
  > = {};

  for (const m of filtered) {
    const mesKey = resolveMesMedicao(m, criterio);
    if (!mesMap[mesKey]) {
      mesMap[mesKey] = { pago: 0, aPagar: 0, aMedir: 0, previsto: 0, realizado: 0 };
    }

    const valor = Number(m.valor_medicao) || 0;

    // Classificação por status
    if (m.status === 'Pago') {
      mesMap[mesKey].pago += valor;
    } else if (m.status === 'Medido' || m.status === 'A Pagar') {
      // Medido / A Pagar: serviço atestado/com nota fiscal emitida, aguardando quitação
      mesMap[mesKey].aPagar += valor;
    } else {
      // 'A Medir': serviço futuro sem nota fiscal emitida
      mesMap[mesKey].aMedir += valor;
    }

    // Alocação de previsto x realizado conforme o critério
    if (criterio === 'desembolso') {
      // Fluxo de Caixa Real: Realizado é apenas o que já foi liquidado (Pago).
      // Previsto a desembolsar no futuro é o comprometido (A Pagar com NF) + estimado (A Medir sem NF).
      if (m.status === 'Pago') {
        mesMap[mesKey].realizado += valor;
      } else {
        mesMap[mesKey].previsto += valor;
      }
    } else {
      // 'medicao' (Avanço Físico) ou 'competencia' (Despesa Incorrida):
      // Realizado é tudo o que já foi medido/atestado em campo (Pago + Medido + A Pagar).
      // Previsto é apenas o que ainda está A Medir.
      if (m.status === 'Pago' || m.status === 'Medido' || m.status === 'A Pagar') {
        mesMap[mesKey].realizado += valor;
      } else {
        mesMap[mesKey].previsto += valor;
      }
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
        pago: mesMap[mes].pago,
        aPagar: mesMap[mes].aPagar,
        aMedir: mesMap[mes].aMedir,
        previsto: mesMap[mes].previsto,
        realizado: mesMap[mes].realizado,
      };
    })
    .sort((a, b) => a.mesSortKey.localeCompare(b.mesSortKey));

  let acumPrevisto = 0;
  let acumRealizado = 0;
  let acumTotal = 0;

  return mesesOrdenados.map((item) => {
    const totalMes = item.pago + item.aPagar + item.aMedir;
    acumPrevisto += item.previsto;
    acumRealizado += item.realizado;
    acumTotal += totalMes;

    return {
      mes: item.mesOriginal,
      mesFormatado: item.mesFormatado,
      mesSortKey: item.mesSortKey,
      pago: item.pago,
      aPagar: item.aPagar,
      aMedir: item.aMedir,
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
  filtroCategoria?: 'Projeto' | 'Legalização' | null,
  obras?: Obra[]
): KpiOrcamento {
  // Mapa de categoria por contrato
  const catPorContrato: Record<string, string> = {};
  contratos.forEach((c) => {
    catPorContrato[c.id] = c.categoria || 'Projeto';
  });

  const canonFiltro = filtroObra ? getCanonicalObra(filtroObra, obras) : '';
  const matchObra = (val?: string | null) => !canonFiltro || getCanonicalObra(val, obras) === canonFiltro;

  const filteredOrc = orcamentos.filter((o) => {
    if (!matchObra(o.obra || o.nome_obra)) return false;
    if (filtroCategoria && o.categoria !== filtroCategoria) return false;
    return true;
  });

  const filteredCt = contratos.filter((c) => {
    if (!matchObra(c.obra)) return false;
    if (filtroCategoria && c.categoria !== filtroCategoria) return false;
    return true;
  });

  const filteredMed = medicoes.filter((m) => {
    if (!matchObra(m.obra)) return false;
    if (filtroCategoria && catPorContrato[m.contrato_id] && catPorContrato[m.contrato_id] !== filtroCategoria) {
      return false;
    }
    return true;
  });

  const totalOrcado = filteredOrc.reduce((acc, o) => acc + (o.orcamento_base || 0), 0);
  const totalContratado = filteredCt.reduce((acc, c) => acc + (c.valor_contrato || 0), 0);
  const percentualContratado = totalOrcado > 0 ? totalContratado / totalOrcado : 0;

  // Valor real que ainda falta contratar e apuração de economia / desvio
  let faltaContratar = 0;
  let qtdFaltaContratar = 0;
  let faltaContratarPausado = 0;
  let qtdFaltaContratarPausado = 0;
  let orcadoContratados = 0;
  let contratadoNosOrcamentos = 0;
  let totalEconomiaItens = 0;
  let totalEstouroItens = 0;
  let orcadoComparavel = 0;

  for (const o of filteredOrc) {
    const base = Number(o.orcamento_base) || 0;
    const contratadoItem = Number(o.valor_contratado) || 0;
    const stObra = getObraStatus(o.obra || o.nome_obra, obras);

    if (o.status === 'Cancelado') {
      if (stObra === 'Cancelada') {
        // Em obras totalmente canceladas, linhas abertas não geram economia artificial
        continue;
      }
      // Em obras ativas/pausadas, o cancelamento da linha do orçamento elimina a necessidade
      // de contratação futura daquele saldo, gerando economia real em relação ao orçamento base.
      orcadoContratados += base;
      orcadoComparavel += base;
      contratadoNosOrcamentos += contratadoItem;
      if (base > contratadoItem) {
        totalEconomiaItens += (base - contratadoItem);
      } else if (contratadoItem > base) {
        totalEstouroItens += (contratadoItem - base);
      }
      continue;
    }

    // Um item é considerado contratado/fechado se possuir status 'Contratado' ou já tiver contrato vinculado (contratadoItem > 0)
    const isFechado = o.status === 'Contratado' || contratadoItem > 0;

    if (!isFechado) {
      if (stObra === 'Cancelada') {
        // Em obras canceladas, itens ainda não contratados têm faltaContratar zerado e não contam como economia
        continue;
      }
      const saldoAberto = Math.max(0, base - contratadoItem);
      if (saldoAberto > 0) {
        if (stObra === 'Paralisada') {
          faltaContratarPausado += saldoAberto;
          qtdFaltaContratarPausado++;
        } else {
          faltaContratar += saldoAberto;
          qtdFaltaContratar++;
        }
      }
      orcadoComparavel += base;
    } else {
      orcadoContratados += base;
      orcadoComparavel += base;
      contratadoNosOrcamentos += contratadoItem;
      if (contratadoItem < base) {
        totalEconomiaItens += base - contratadoItem;
      } else if (contratadoItem > base) {
        totalEstouroItens += contratadoItem - base;
      }
    }
  }

  // O saldo real a contratar considera apenas as linhas não canceladas (ativas + pausadas)
  const saldoAContratar = faltaContratar + faltaContratarPausado;

  // Compara o valor contratado dos itens fechados apenas contra o Orçado Base desses itens já contratados
  const diferencaContratados = contratadoNosOrcamentos - orcadoContratados; // < 0 = economia nos contratados; > 0 = desvio nos contratados
  const custoTotalPrevisto = totalContratado + faltaContratar + faltaContratarPausado;
  const diferencaOrcamento =
    orcadoComparavel > 0 ? custoTotalPrevisto - orcadoComparavel : custoTotalPrevisto - totalOrcado;

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

  const medidoPorContrato: Record<string, number> = {};

  for (const m of filteredMed) {
    const cid = String(m.contrato_id).trim();
    const valMed = Number(m.valor_medicao) || 0;
    const stObraMed = getObraStatus(m.obra, obras);

    if (m.status === 'Pago') {
      totalPago += valMed;
      medidoPorContrato[cid] = (medidoPorContrato[cid] || 0) + valMed;
    } else if (m.status === 'Medido' || m.status === 'A Pagar') {
      totalMedidoPendente += valMed;
      medidoPorContrato[cid] = (medidoPorContrato[cid] || 0) + valMed;
      if (isMedicaoEmAtraso(m, undefined, obras)) {
        totalEmAtraso += valMed;
        qtdEmAtraso++;
        totalMedidoNaoPago += valMed;
        qtdMedidoNaoPago++;
      }
    } else if (m.status === 'Cancelado' || (m.status as any) === 'Cancelada') {
      totalCancelado += valMed;
    } else {
      // 'A Medir' — apenas soma no previsto a medir ativo se a obra não estiver Paralisada nem Cancelada
      if (stObraMed !== 'Paralisada' && stObraMed !== 'Cancelada') {
        totalPrevistoAMedir += valMed;
        if (isMedicaoEmAtraso(m, undefined, obras)) {
          totalEmAtraso += valMed;
          qtdEmAtraso++;
          totalAMedirAtrasado += valMed;
          qtdAMedirAtrasado++;
        }
      }
    }
  }

  const totalMedido = totalPago + totalMedidoPendente;

  // Separação do saldo contratual não medido conforme status da Obra:
  // - Obras Ativas/Concluídas -> saldoAMedir
  // - Obras Paralisadas -> saldoPausado (possivelmente será medido, mas não entra na tag 'A Medir')
  // - Obras Canceladas (com contrato ativo não distratado) -> saldoADistratar
  let saldoAMedir = 0;
  let saldoPausado = 0;
  let saldoADistratar = 0;

  for (const c of filteredCt) {
    const cid = String(c.id).trim();
    const medCt = medidoPorContrato[cid] ?? (Number(c.valor_medido) || 0);
    const saldoCt = Math.max(0, (Number(c.valor_contrato) || 0) - medCt);
    if (saldoCt <= 0) continue;

    const stObra = getObraStatus(c.obra, obras);
    if (stObra === 'Paralisada') {
      if (c.status !== 'Distratado') {
        saldoPausado += saldoCt;
      }
    } else if (stObra === 'Cancelada') {
      if (c.status !== 'Distratado') {
        saldoADistratar += saldoCt;
      }
    } else {
      saldoAMedir += saldoCt;
    }
  }

  const percentualMedido = totalContratado > 0 ? totalMedido / totalContratado : 0;
  const saldoSemCronograma = Math.max(0, saldoAMedir - totalPrevistoAMedir);

  const totalProjetosContratado = filteredCt
    .filter((c) => c.categoria === 'Projeto')
    .reduce((acc, c) => acc + c.valor_contrato, 0);

  const totalLegalizacaoContratado = filteredCt
    .filter((c) => c.categoria === 'Legalização')
    .reduce((acc, c) => acc + c.valor_contrato, 0);

  return {
    totalOrcado,
    orcadoContratados,
    totalContratado,
    saldoAContratar,
    percentualContratado,
    totalMedido,
    saldoAMedir,
    saldoPausado,
    saldoADistratar,
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
    saldoSemCronograma,
    faltaContratar,
    qtdFaltaContratar,
    faltaContratarPausado,
    qtdFaltaContratarPausado,
    custoTotalPrevisto,
    diferencaOrcamento,
    diferencaContratados,
    totalEconomiaItens,
    totalEstouroItens,
  };
}

/**
 * Calcula a relação limpa de desembolso para 30, 60 e 90 dias
 */
export function calculateJanela306090(
  medicoes: Medicao[],
  contratos?: Contrato[] | null,
  filtroObra?: string | null,
  filtroFornecedor?: string | null,
  filtroCategoria?: 'Projeto' | 'Legalização' | null,
  dataReferencia?: string,
  obras?: Obra[]
): JanelaCaixa306090 {
  const catPorContrato: Record<string, string> = {};
  if (contratos) {
    contratos.forEach((c) => {
      catPorContrato[c.id] = c.categoria || 'Projeto';
    });
  }

  const canonFiltro = filtroObra ? getCanonicalObra(filtroObra, obras) : '';
  const matchObra = (val?: string | null) => !canonFiltro || getCanonicalObra(val, obras) === canonFiltro;

  const pendentes = medicoes.filter((m) => {
    if (m.status === 'Pago' || m.status === 'Cancelado' || (m.status as any) === 'Cancelada') return false;
    if (!matchObra(m.obra)) return false;
    if (filtroFornecedor && m.empresa !== filtroFornecedor) return false;
    if (filtroCategoria && catPorContrato[m.contrato_id] && catPorContrato[m.contrato_id] !== filtroCategoria) {
      return false;
    }
    // Medições 'A Medir' de obras Paralisadas ou Canceladas não entram na janela de desembolso 30/60/90d
    if (m.status === 'A Medir' && obras && obras.length > 0) {
      const stObra = getObraStatus(m.obra, obras);
      if (stObra === 'Paralisada' || stObra === 'Cancelada') return false;
    }
    return true;
  });

  const todayStr = dataReferencia || new Date().toISOString().split('T')[0];
  const [anoRefStr, mesRefStr] = todayStr.split('-');
  const anoBase = parseInt(anoRefStr, 10);
  const mesBase = parseInt(mesRefStr, 10);

  const buildMonth = (y: number, m: number): { sortKey: string; label: string } => {
    const dt = new Date(y, m - 1, 1);
    const yr = dt.getFullYear();
    const mo = dt.getMonth() + 1;
    const sortKey = `${yr}-${String(mo).padStart(2, '0')}`;
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const label = `${mesesNomes[mo - 1]}/${String(yr).slice(-2)}`;
    return { sortKey, label };
  };

  let m30 = buildMonth(anoBase, mesBase);
  let m60 = buildMonth(anoBase, mesBase + 1);
  let m90 = buildMonth(anoBase, mesBase + 2);

  // Se o cronograma ativo estiver concentrado em outros meses, ancora nos 3 próximos meses com saldo pendente
  const mesesAtivos = new Set<string>();
  for (const m of pendentes) {
    const { sortKey } = parseMesCompetencia(resolveMesMedicao(m, 'desembolso'));
    if (sortKey !== '9999-99') mesesAtivos.add(sortKey);
  }

  if (
    !mesesAtivos.has(m30.sortKey) &&
    !mesesAtivos.has(m60.sortKey) &&
    !mesesAtivos.has(m90.sortKey) &&
    mesesAtivos.size > 0
  ) {
    const ordenados = Array.from(mesesAtivos).sort();
    const idxFuturo = ordenados.findIndex((k) => k >= m30.sortKey);
    const anchor = idxFuturo >= 0 ? ordenados[idxFuturo] : ordenados[Math.max(0, ordenados.length - 3)];
    const [yS, mS] = anchor.split('-');
    const yN = parseInt(yS, 10);
    const mN = parseInt(mS, 10);
    if (!isNaN(yN) && !isNaN(mN)) {
      m30 = buildMonth(yN, mN);
      m60 = buildMonth(yN, mN + 1);
      m90 = buildMonth(yN, mN + 2);
    }
  }

  const makeMes = (info: { sortKey: string; label: string }): MesJanela306090 => ({
    mesSortKey: info.sortKey,
    mesFormatado: info.label,
    medidoComNF: 0,
    aMedirPrevisto: 0,
    total: 0,
  });

  const mes30 = makeMes(m30);
  const mes60 = makeMes(m60);
  const mes90 = makeMes(m90);
  let atrasadoAnterior = 0;

  for (const m of pendentes) {
    const { sortKey } = parseMesCompetencia(resolveMesMedicao(m, 'desembolso'));
    const val = Number(m.valor_medicao) || 0;
    const isMedido = m.status === 'A Pagar' || m.status === 'Medido';

    if (sortKey < m30.sortKey) {
      atrasadoAnterior += val;
    } else if (sortKey === m30.sortKey) {
      if (isMedido) mes30.medidoComNF += val;
      else mes30.aMedirPrevisto += val;
      mes30.total += val;
    } else if (sortKey === m60.sortKey) {
      if (isMedido) mes60.medidoComNF += val;
      else mes60.aMedirPrevisto += val;
      mes60.total += val;
    } else if (sortKey === m90.sortKey) {
      if (isMedido) mes90.medidoComNF += val;
      else mes90.aMedirPrevisto += val;
      mes90.total += val;
    }
  }

  return {
    mes30,
    mes60,
    mes90,
    total90Dias: {
      medidoComNF: mes30.medidoComNF + mes60.medidoComNF + mes90.medidoComNF,
      aMedirPrevisto: mes30.aMedirPrevisto + mes60.aMedirPrevisto + mes90.aMedirPrevisto,
      total: mes30.total + mes60.total + mes90.total,
    },
    atrasadoAnterior,
  };
}

/**
 * Consolida os dados por Disciplina para exibição visual com barra de progresso
 */
export function calculateConsolidadoDisciplinas(
  orcamentos: ItemOrcamento[],
  filtroObra?: string | null,
  filtroCategoria?: 'Projeto' | 'Legalização' | null,
  obras?: Obra[]
): ItemConsolidadoDisciplina[] {
  const canonFiltro = filtroObra ? getCanonicalObra(filtroObra, obras) : '';
  const matchObra = (val?: string | null) => !canonFiltro || getCanonicalObra(val, obras) === canonFiltro;

  const filtered = orcamentos.filter((o) => {
    if (!matchObra(o.obra || o.nome_obra)) return false;
    if (filtroCategoria && o.categoria !== filtroCategoria) return false;
    return true;
  });

  const map: Record<
    string,
    {
      orcamentoBase: number;
      orcadoComparavel: number;
      orcadoContratados: number;
      valorContratado: number;
      faltaContratar: number;
      faltaContratarPausado: number;
      economiaContratados: number;
      estouroContratados: number;
      valorMedido: number;
      valorAMedir: number;
      saldoPausado: number;
      saldoADistratar: number;
    }
  > = {};

  for (const o of filtered) {
    const disc = o.disciplina || 'OUTROS';
    if (!map[disc]) {
      map[disc] = {
        orcamentoBase: 0,
        orcadoComparavel: 0,
        orcadoContratados: 0,
        valorContratado: 0,
        faltaContratar: 0,
        faltaContratarPausado: 0,
        economiaContratados: 0,
        estouroContratados: 0,
        valorMedido: 0,
        valorAMedir: 0,
        saldoPausado: 0,
        saldoADistratar: 0,
      };
    }

    const base = Number(o.orcamento_base) || 0;
    const contratado = Number(o.valor_contratado) || 0;
    const medido = Number(o.valor_medido) || 0;
    const stObra = getObraStatus(o.obra || o.nome_obra, obras);

    map[disc].orcamentoBase += base;
    map[disc].valorContratado += contratado;
    map[disc].valorMedido += medido;

    const saldoMedItem = Math.max(0, contratado - medido);
    if (saldoMedItem > 0) {
      if (stObra === 'Paralisada') {
        map[disc].saldoPausado += saldoMedItem;
      } else if (stObra === 'Cancelada') {
        map[disc].saldoADistratar += saldoMedItem;
      } else {
        map[disc].valorAMedir += saldoMedItem;
      }
    }

    if (o.status === 'Cancelado') {
      if (stObra === 'Cancelada') {
        // Obra cancelada não gera economia artificial
        continue;
      }
      map[disc].orcadoContratados += base;
      map[disc].orcadoComparavel += base;
      if (base > contratado) {
        map[disc].economiaContratados += base - contratado;
      } else if (contratado > base) {
        map[disc].estouroContratados += contratado - base;
      }
      continue;
    }

    const isFechado = o.status === 'Contratado' || contratado > 0;
    if (!isFechado) {
      if (stObra === 'Cancelada') {
        // Obra cancelada não gera falta contratar nem economia artificial
        continue;
      }
      const aberto = Math.max(0, base - contratado);
      if (stObra === 'Paralisada') {
        map[disc].faltaContratarPausado += aberto;
      } else {
        map[disc].faltaContratar += aberto;
      }
      map[disc].orcadoComparavel += base;
    } else {
      map[disc].orcadoContratados += base;
      map[disc].orcadoComparavel += base;
      if (contratado < base) {
        map[disc].economiaContratados += base - contratado;
      } else if (contratado > base) {
        map[disc].estouroContratados += contratado - base;
      }
    }
  }

  return Object.entries(map)
    .map(([disciplina, d]) => {
      const totalPrevisto = d.valorContratado + d.faltaContratar + d.faltaContratarPausado;
      const baseRef = d.orcadoComparavel > 0 ? d.orcadoComparavel : d.orcamentoBase;
      const diferencaOrcamento = totalPrevisto - baseRef;
      const diferencaContratados = d.valorContratado - d.orcadoContratados;
      return {
        disciplina,
        orcamentoBase: d.orcamentoBase,
        orcadoContratados: d.orcadoContratados,
        valorContratado: d.valorContratado,
        faltaContratar: d.faltaContratar,
        faltaContratarPausado: d.faltaContratarPausado,
        totalPrevisto,
        diferencaOrcamento,
        diferencaContratados,
        economiaContratados: d.economiaContratados,
        estouroContratados: d.estouroContratados,
        valorMedido: d.valorMedido,
        valorAMedir: d.valorAMedir,
        saldoPausado: d.saldoPausado,
        saldoADistratar: d.saldoADistratar,
        percentualContratadoSobreBase: d.orcamentoBase > 0 ? d.valorContratado / d.orcamentoBase : 0,
        percentualMedidoSobreContratado: d.valorContratado > 0 ? d.valorMedido / d.valorContratado : 0,
      };
    })
    .sort((a, b) => b.totalPrevisto - a.totalPrevisto);
}

/**
 * Consolida os Contratos com barras de progresso (Pago, Medido a Pagar, Valor a Medir e Desvio vs. Orçado)
 */
export function calculateConsolidadoContratos(
  contratos: Contrato[],
  medicoes: Medicao[],
  filtroObra?: string | null,
  filtroFornecedor?: string | null,
  filtroCategoria?: 'Projeto' | 'Legalização' | null,
  orcamentos?: ItemOrcamento[] | null,
  obras?: Obra[]
): ItemConsolidadoContrato[] {
  const pagoPorContrato: Record<string, number> = {};
  const aPagarPorContrato: Record<string, number> = {};

  for (const m of medicoes) {
    const cid = String(m.contrato_id).trim();
    const val = Number(m.valor_medicao) || 0;
    if (m.status === 'Pago') {
      pagoPorContrato[cid] = (pagoPorContrato[cid] || 0) + val;
    } else if (m.status === 'Medido' || m.status === 'A Pagar') {
      aPagarPorContrato[cid] = (aPagarPorContrato[cid] || 0) + val;
    }
  }

  const canonFiltro = filtroObra ? getCanonicalObra(filtroObra, obras) : '';
  const matchObra = (val?: string | null) => !canonFiltro || getCanonicalObra(val, obras) === canonFiltro;

  return contratos
    .filter((c) => {
      if (!matchObra(c.obra)) return false;
      if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
      if (filtroCategoria && c.categoria !== filtroCategoria) return false;
      return true;
    })
    .map((c) => {
      const cid = String(c.id).trim();
      const valorContrato = Number(c.valor_contrato) || 0;
      const valorPago = pagoPorContrato[cid] || 0;
      const valorMedidoAPagar = aPagarPorContrato[cid] || 0;
      const valorMedidoTotal = valorPago + valorMedidoAPagar;
      const saldoRestante = Math.max(0, valorContrato - valorMedidoTotal);
      const statusObra = getObraStatus(c.obra, obras);

      let valorAMedir = 0;
      let saldoPausado = 0;
      let saldoADistratar = 0;

      if (statusObra === 'Paralisada' && c.status !== 'Distratado') {
        saldoPausado = saldoRestante;
      } else if (statusObra === 'Cancelada' && c.status !== 'Distratado') {
        saldoADistratar = saldoRestante;
      } else {
        valorAMedir = saldoRestante;
      }

      // Na Consolidação de Contratos, o desvio refere-se estritamente a alterações contratuais (aditivos ou distratos).
      // A comparação com o Orçamento Base da disciplina pertence exclusivamente à Consolidação por Disciplina.
      const valorAditivos = Number(c.valor_aditivos) || 0;
      const valorOriginal = Number(c.valor_original) || Math.max(0, valorContrato - valorAditivos);
      const isDistratado = c.status === 'Distratado' || !!c.distrato;

      let valorDesvio = 0;
      let tipoDesvio: 'aditivo' | 'distrato' | 'supressao' | null = null;

      if (valorAditivos > 1) {
        valorDesvio = valorAditivos;
        tipoDesvio = 'aditivo';
      } else if (valorAditivos < -1) {
        valorDesvio = Math.abs(valorAditivos);
        tipoDesvio = 'supressao';
      } else if (isDistratado) {
        tipoDesvio = 'distrato';
        const reducao = valorOriginal > valorContrato ? valorOriginal - valorContrato : 0;
        if (reducao > 1) {
          valorDesvio = reducao;
        }
      }

      const orcamentoBase = valorOriginal;

      return {
        id: c.id,
        num_sienge: c.num_sienge,
        empresa: c.empresa,
        obra: c.obra,
        disciplina: c.disciplina,
        subdisciplina: c.subdisciplina,
        categoria: c.categoria || 'Projeto',
        status: c.status || 'Ativo',
        statusObra,
        valorContrato,
        valorOriginal,
        valorAditivos,
        orcamentoBase,
        valorDesvio,
        tipoDesvio,
        valorPago,
        valorMedidoAPagar,
        valorMedidoTotal,
        valorAMedir,
        saldoPausado,
        saldoADistratar,
        percentualPago: valorContrato > 0 ? Math.min(1, valorPago / valorContrato) : 0,
        percentualMedidoAPagar: valorContrato > 0 ? Math.min(1, valorMedidoAPagar / valorContrato) : 0,
        percentualMedidoTotal: valorContrato > 0 ? Math.min(1, valorMedidoTotal / valorContrato) : 0,
      };
    })
    .sort((a, b) => b.valorContrato - a.valorContrato);
}

/**
 * Verifica se uma medição está em atraso em relação à data atual
 * (Prevista para uma data/mês no passado, mas ainda não paga).
 * Medições de obras Paralisadas ou Canceladas NÃO são consideradas em atraso,
 * a não ser que a respectiva obra volte a ter status ativo.
 */
export function isMedicaoEmAtraso(m: Medicao, dataReferencia?: string, obras?: Obra[]): boolean {
  // O atraso é considerado exclusivamente quando o status da medição for 'A Medir'
  if (m.status !== 'A Medir') {
    return false;
  }

  // Obras Paralisadas ou Canceladas não entram em atraso
  if (obras && obras.length > 0) {
    const stObra = getObraStatus(m.obra, obras);
    if (stObra === 'Paralisada' || stObra === 'Cancelada') {
      return false;
    }
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
export function getDiasAtraso(m: Medicao, dataReferencia?: string, obras?: Obra[]): number {
  if (!isMedicaoEmAtraso(m, dataReferencia, obras)) return 0;
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

/**
 * Consolida os indicadores financeiros por Obra para o Quadro Resumo Executivo do Portfólio
 * Retorna apenas obras que possuam ao menos 1 item de orçamento ou 1 contrato (respeitando filtros)
 */
export function calculateConsolidadoObras(
  orcamentos: ItemOrcamento[],
  contratos: Contrato[],
  medicoes: Medicao[],
  obras: Obra[],
  filtroFornecedor?: string | null,
  filtroCategoria?: 'Projeto' | 'Legalização' | null
): ItemConsolidadoObra[] {
  // Mapa de chave canônica para dados representativos da obra
  const canonMap = new Map<
    string,
    { codigo: string; nome: string; status: StatusObra }
  >();

  // 1. Cadastros oficiais de obras
  for (const o of obras) {
    const canon = getCanonicalObra(o.codigo, obras);
    if (canon && !canonMap.has(canon)) {
      canonMap.set(canon, {
        codigo: o.codigo,
        nome: o.nome || o.codigo,
        status: o.status || 'Ativa',
      });
    }
  }

  // 2. Obras presentes em orçamentos
  for (const item of orcamentos) {
    const val = item.obra || item.nome_obra;
    if (val) {
      const canon = getCanonicalObra(val, obras);
      if (canon && !canonMap.has(canon)) {
        const found = obras.find((o) => getCanonicalObra(o.codigo, obras) === canon);
        canonMap.set(canon, {
          codigo: found ? found.codigo : val,
          nome: found ? found.nome : val,
          status: found?.status || 'Ativa',
        });
      }
    }
  }

  // 3. Obras presentes em contratos
  for (const c of contratos) {
    if (c.obra) {
      const canon = getCanonicalObra(c.obra, obras);
      if (canon && !canonMap.has(canon)) {
        const found = obras.find((o) => getCanonicalObra(o.codigo, obras) === canon);
        canonMap.set(canon, {
          codigo: found ? found.codigo : c.obra,
          nome: found ? found.nome : c.obra,
          status: found?.status || 'Ativa',
        });
      }
    }
  }

  const result: ItemConsolidadoObra[] = [];

  for (const [canon, info] of Array.from(canonMap.entries())) {
    const orcObra = orcamentos.filter((o) => {
      if (getCanonicalObra(o.obra || o.nome_obra, obras) !== canon) return false;
      if (filtroCategoria && o.categoria !== filtroCategoria) return false;
      return true;
    });

    const ctObra = contratos.filter((c) => {
      if (getCanonicalObra(c.obra, obras) !== canon) return false;
      if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
      if (filtroCategoria && c.categoria !== filtroCategoria) return false;
      return true;
    });

    // Exibir apenas obras que possuam orçamento ou contrato cadastrado nos filtros ativos
    if (orcObra.length === 0 && ctObra.length === 0) continue;

    // Se houver filtro de fornecedor ativo, filtramos contratos e medições daquele fornecedor
    const medObra = medicoes.filter((m) => {
      if (getCanonicalObra(m.obra, obras) !== canon) return false;
      if (filtroFornecedor && m.empresa !== filtroFornecedor) return false;
      return true;
    });

    const kpiObra = calculateKpis(orcObra, ctObra, medObra, null, filtroCategoria || null, obras);

    result.push({
      codigo: info.codigo,
      nome: info.nome,
      label: getObraLabel(info.codigo, obras),
      status: info.status,
      orcamentoBase: kpiObra.totalOrcado,
      orcadoContratados: kpiObra.orcadoContratados,
      valorContratado: kpiObra.totalContratado,
      faltaContratar: kpiObra.faltaContratar,
      faltaContratarPausado: kpiObra.faltaContratarPausado,
      totalPrevisto: kpiObra.custoTotalPrevisto,
      diferencaOrcamento: kpiObra.diferencaOrcamento,
      diferencaContratados: kpiObra.diferencaContratados,
      economiaContratados: kpiObra.totalEconomiaItens,
      estouroContratados: kpiObra.totalEstouroItens,
      valorMedido: kpiObra.totalMedido,
      valorPago: kpiObra.totalPago,
      valorAMedir: kpiObra.saldoAMedir,
      saldoPausado: kpiObra.saldoPausado,
      saldoADistratar: kpiObra.saldoADistratar,
      percentualContratadoSobreBase: kpiObra.percentualContratado,
      percentualMedidoSobreContratado: kpiObra.percentualMedido,
      contratosCount: ctObra.length,
      orcamentosCount: orcObra.length,
    });
  }

  return result.sort((a, b) => b.totalPrevisto - a.totalPrevisto);
}

