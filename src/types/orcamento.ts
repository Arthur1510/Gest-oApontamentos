export type StatusOrcamento =
  | 'A contratar'
  | 'Em cotação'
  | 'Em contratação'
  | 'Contratado'
  | 'Cancelado';

export const STATUS_ORCAMENTO_OPCOES: StatusOrcamento[] = [
  'A contratar',
  'Em cotação',
  'Em contratação',
  'Contratado',
  'Cancelado',
];

export type CategoriaContrato =
  | 'Projeto'
  | 'Legalização'
  | 'Qualidade'
  | 'Orçamento'
  | 'Novos Negócios'
  | 'Obra';

export const CATEGORIA_CONTRATO_OPCOES: CategoriaContrato[] = [
  'Projeto',
  'Legalização',
  'Qualidade',
  'Orçamento',
  'Novos Negócios',
  'Obra',
];

export const CATEGORIA_CONTRATO_CONFIG: Record<
  CategoriaContrato,
  {
    label: string;
    plural: string;
    badge: string;
    activeButton: string;
    text: string;
    description: string;
  }
> = {
  Projeto: {
    label: 'Projeto',
    plural: 'Projetos',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30',
    activeButton: 'bg-[#00A3C4] text-white shadow-2xs',
    text: 'text-[#00A3C4]',
    description: 'Projetos / Eng.',
  },
  Legalização: {
    label: 'Legalização',
    plural: 'Legalização',
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    activeButton: 'bg-purple-600 text-white shadow-2xs',
    text: 'text-purple-600 dark:text-purple-400',
    description: 'Taxas / Órgãos',
  },
  Qualidade: {
    label: 'Qualidade',
    plural: 'Qualidade',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    activeButton: 'bg-emerald-600 text-white shadow-2xs',
    text: 'text-emerald-600 dark:text-emerald-400',
    description: 'Controle / Inspeção',
  },
  Orçamento: {
    label: 'Orçamento',
    plural: 'Orçamento',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    activeButton: 'bg-amber-600 text-white shadow-2xs',
    text: 'text-amber-600 dark:text-amber-400',
    description: 'Planejamento / Custos',
  },
  'Novos Negócios': {
    label: 'Novos Negócios',
    plural: 'Novos Negócios',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
    activeButton: 'bg-indigo-600 text-white shadow-2xs',
    text: 'text-indigo-600 dark:text-indigo-400',
    description: 'Novos Negócios / Comercial',
  },
  Obra: {
    label: 'Obra',
    plural: 'Obras',
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
    activeButton: 'bg-orange-600 text-white shadow-2xs',
    text: 'text-orange-600 dark:text-orange-400',
    description: 'Execução / Obras Civis',
  },
};

/**
 * Normaliza e infere a categoria correta a partir de texto (com ou sem acento) ou pela disciplina
 */
export function normalizeCategoria(cat?: string | null, disciplina?: string | null): CategoriaContrato {
  const clean = (str?: string | null) =>
    (str || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const c = clean(cat);
  const d = clean(disciplina);

  // 1. Categoria explícita com as novas tags
  if (c.includes('LEGALIZA') || c.includes('TAXA')) return 'Legalização';
  if (c.includes('QUALIDADE') || c === 'CQ') return 'Qualidade';
  if (c.includes('ORCAMENTO')) return 'Orçamento';
  if (c.includes('NEGOCIO')) return 'Novos Negócios';
  if (c === 'OBRA' || c.startsWith('OBRA ') || c.includes('EXECUCAO') || c.includes('CIVIL')) return 'Obra';

  // 2. Se a disciplina aponta diretamente para outra categoria específica (evita que o padrão legado 'Projeto' retenha o item)
  if (d) {
    if (d.includes('LEGALIZA') || d.includes('TAXA') || d.includes('PREFEITURA') || d.includes('ORGAO') || d.includes('PGRCC') || d.includes('PLANI') || d.includes('TOPOGRAF')) return 'Legalização';
    if (d.includes('QUALIDADE') || d === 'CQ' || d.includes('DESEMPENHO')) return 'Qualidade';
    if (d.includes('ORCAMENTO') || d.includes('PLANEJAMENTO')) return 'Orçamento';
    if (d.includes('NEGOCIO') || d.includes('NOVOS NEGOCIOS')) return 'Novos Negócios';
    if (d.includes('OBRA') || d.includes('EXECUCAO') || d.includes('CIVIL') || d.includes('ESQUADRIA') || d.includes('SEGURANCA') || d.includes('IMPERMEABILIZA')) return 'Obra';
  }

  // 3. Categoria explícita 'Projeto'
  if (c.includes('PROJETO') || c.includes('ENG')) return 'Projeto';

  return 'Projeto';
}

export function getCategoriaBadgeClass(cat?: CategoriaContrato | string | null): string {
  const norm = normalizeCategoria(cat);
  switch (norm) {
    case 'Legalização':
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30';
    case 'Qualidade':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
    case 'Orçamento':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';
    case 'Novos Negócios':
      return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30';
    case 'Obra':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30';
    case 'Projeto':
    default:
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30';
  }
}

export type StatusMedicao =
  | 'A Medir'
  | 'Medido'
  | 'A Pagar'
  | 'Pago'
  | 'Cancelado';

export const STATUS_MEDICAO_OPCOES: StatusMedicao[] = [
  'A Medir',
  'Medido',
  'A Pagar',
  'Pago',
  'Cancelado',
];

export type StatusObra = 'Ativa' | 'Paralisada' | 'Cancelada' | 'Concluída';

export const STATUS_OBRA_OPCOES: StatusObra[] = [
  'Ativa',
  'Paralisada',
  'Cancelada',
  'Concluída',
];

export const STATUS_OBRA_COLORS: Record<StatusObra, { bg: string; text: string; border: string }> = {
  Ativa: { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30' },
  Paralisada: { bg: 'bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/30' },
  Cancelada: { bg: 'bg-rose-500/15', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/30' },
  Concluída: { bg: 'bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/30' },
};

export interface Obra {
  id: string;
  cc: string;
  codigo: string;
  nome: string;
  endereco?: string | null;
  status?: StatusObra;
}

export interface Disciplina {
  id: string;
  disciplina: string;
  codigo: string;
}

export interface Subdisciplina {
  id: string;
  disciplina: string;
  cod_disciplina: string;
  subdisciplina: string;
  cod_subdisciplina: string;
}

export interface Fornecedor {
  id: string;
  id_sienge?: string | null;
  fornecedor: string;
  tipo: string;
}

export interface ItemOrcamento {
  id: string;
  obra: string;
  nome_obra?: string;
  disciplina: string;
  subdisciplina: string;
  orcamento_base: number;
  valor_contratado: number;
  saldo_a_contratar: number;
  valor_tendencia?: number | null; // Custo Final Previsto / Tendência de Contratação
  justificativa_tendencia?: string | null; // Premissa / Justificativa da Tendência
  saldo_tendencia?: number; // Saldo a contratar considerando a tendência (Tendência - Contratado)
  valor_medido: number;
  saldo_medicao: number;
  categoria: CategoriaContrato;
  status: StatusOrcamento;
}

export type NovoItemOrcamento = Omit<
  ItemOrcamento,
  'id' | 'valor_contratado' | 'saldo_a_contratar' | 'saldo_tendencia' | 'valor_medido' | 'saldo_medicao'
>;

export type StatusContrato = 'Ativo' | 'Distratado' | 'Concluído';

export const STATUS_CONTRATO_OPCOES: StatusContrato[] = [
  'Ativo',
  'Distratado',
  'Concluído',
];

export type TipoAditivo = 'Valor' | 'Prazo' | 'Escopo' | 'Misto';

export interface AditivoContrato {
  id: string;
  contrato_id: string;
  numero: number;
  data: string; // ISO YYYY-MM-DD
  tipo: TipoAditivo;
  valor: number; // valor monetário (+ para acréscimo, - para supressão, 0 para prazo/escopo)
  descricao: string;
  novo_prazo?: string | null;
  criado_em?: string;
}

export interface DistratoInfo {
  data: string; // ISO YYYY-MM-DD
  motivo: string;
  valor_acerto?: number;
  congelar_saldo?: boolean;
  observacoes?: string;
}

export interface Contrato {
  id: string;
  num_sienge: string;
  empresa: string;
  obra: string;
  disciplina: string;
  subdisciplina: string;
  valor_contrato: number;
  valor_original?: number;
  valor_aditivos?: number;
  aditivos?: AditivoContrato[];
  valor_medido: number;
  saldo_a_medir: number;
  percentual_medido: number; // 0 a 1
  categoria: CategoriaContrato;
  status?: StatusContrato;
  distrato?: DistratoInfo | null;
}

export type NovoContrato = Omit<Contrato, 'id' | 'valor_medido' | 'saldo_a_medir' | 'percentual_medido'>;

export interface Medicao {
  id: string;
  contrato_id: string;
  empresa: string;
  obra: string;
  etapa: string;
  percentual: number; // 0 a 1 (ex: 0.10)
  data_prevista: string | null; // ISO YYYY-MM-DD
  data_medicao: string | null; // ISO YYYY-MM-DD
  data_referencia: string | null; // ISO YYYY-MM-DD
  mes_competencia: string; // ex: "25/05", "26/02"
  valor_medicao: number;
  status: StatusMedicao;
  nf?: string | null;
  data_pagamento?: string | null; // ISO YYYY-MM-DD
}

export type NovaMedicao = Omit<Medicao, 'id'>;

export interface CurvaDesembolsoPonto {
  mes: string; // "25/05"
  mesFormatado: string; // "Mai/25"
  mesSortKey: string; // "2025-05"
  pago?: number; // Desembolso realizado (Pago)
  aPagar?: number; // Comprometido / A Pagar (Medido/Com NF)
  aMedir?: number; // Previsto a Medir (Sem NF / Futuro)
  previsto: number;
  realizado: number;
  total: number;
  acumuladoPrevisto: number;
  acumuladoRealizado: number;
  acumuladoTotal: number;
}

export interface MesJanela306090 {
  mesSortKey: string;
  mesFormatado: string;
  medidoComNF: number; // 'A Pagar' ou 'Medido'
  aMedirPrevisto: number; // 'A Medir'
  total: number;
}

export interface JanelaCaixa306090 {
  mes30: MesJanela306090;
  mes60: MesJanela306090;
  mes90: MesJanela306090;
  total90Dias: {
    medidoComNF: number;
    aMedirPrevisto: number;
    total: number;
  };
  atrasadoAnterior: number;
}

export interface ItemConsolidadoDisciplina {
  disciplina: string;
  orcamentoBase: number;
  orcadoContratados: number; // Orçamento base apenas dos itens já contratados
  valorContratado: number;
  faltaContratar: number; // Soma dos itens ainda abertos dessa disciplina (obras ativas)
  faltaContratarPausado?: number; // Soma dos itens abertos em obras paralisadas
  totalPrevisto: number;  // valorContratado + faltaContratar (+ faltaContratarPausado)
  diferencaOrcamento: number; // totalPrevisto - orcamentoBase (> 0 = acima do orçado, < 0 = abaixo do orçado)
  diferencaContratados: number; // valorContratado - orcadoContratados (< 0 = economia nos contratados, > 0 = desvio nos contratados)
  economiaContratados: number; // Soma das economias conquistadas nos itens contratados abaixo do orçado
  estouroContratados: number;  // Soma dos desvios nos itens contratados acima do orçado
  valorMedido: number;
  valorAMedir: number;
  saldoPausado?: number;
  saldoADistratar?: number;
  percentualContratadoSobreBase: number;
  percentualMedidoSobreContratado: number;
  valorTendencia?: number;
}

export interface ItemConsolidadoContrato {
  id: string;
  num_sienge: string;
  empresa: string;
  obra: string;
  disciplina: string;
  subdisciplina: string;
  categoria: CategoriaContrato;
  status: StatusContrato;
  statusObra?: StatusObra;
  valorContrato: number;
  valorOriginal?: number;
  valorAditivos?: number;
  orcamentoBase?: number;
  valorDesvio?: number;      // Parcela decorrente de aditivos ou distratos
  tipoDesvio?: 'aditivo' | 'distrato' | 'supressao' | null;
  valorPago: number;
  valorMedidoAPagar: number; // Medido ou A Pagar (ainda não Pago)
  valorMedidoTotal: number;  // Pago + Medido a Pagar
  valorAMedir: number;       // Saldo a medir (apenas obras Ativas/Concluídas)
  saldoPausado?: number;     // Saldo não medido de contratos em obras Paralisadas
  saldoADistratar?: number;  // Saldo não medido de contratos ativos em obras Canceladas
  percentualPago: number;
  percentualMedidoAPagar: number;
  percentualMedidoTotal: number;
}

export interface ItemConsolidadoObra {
  codigo: string;
  nome: string;
  label: string;
  status?: StatusObra;
  orcamentoBase: number;
  orcadoContratados: number;
  valorContratado: number;
  faltaContratar: number;
  faltaContratarPausado?: number;
  totalPrevisto: number;
  diferencaOrcamento: number;
  diferencaContratados: number;
  economiaContratados: number;
  estouroContratados: number;
  valorMedido: number;
  valorPago: number;
  valorAMedir: number;
  saldoPausado?: number;
  saldoADistratar?: number;
  percentualContratadoSobreBase: number;
  percentualMedidoSobreContratado: number;
  contratosCount: number;
  orcamentosCount: number;
}

export interface KpiOrcamento {
  totalOrcado: number;
  orcadoContratados: number; // Orçamento base apenas dos itens já contratados
  totalContratado: number;
  saldoAContratar: number;
  percentualContratado: number;
  totalMedido: number;
  saldoAMedir: number;       // Saldo a medir de obras Ativas
  saldoPausado: number;      // Saldo de contratos em obras Paralisadas (possivelmente será medido)
  saldoADistratar: number;   // Saldo de contratos ativos em obras Canceladas (a distratar)
  percentualMedido: number;
  totalPago: number;
  totalMedidoPendente: number;
  totalPrevistoAMedir: number;
  totalCancelado: number;
  totalContratosCount: number;
  totalMedicoesCount: number;
  // Métricas específicas por Categoria
  totalProjetosContratado: number;
  totalLegalizacaoContratado: number;
  totalQualidadeContratado?: number;
  totalOrcamentoContratado?: number;
  totalNegociosContratado?: number;
  totalNovosNegociosContratado?: number;
  totalObraContratado?: number;
  // Métricas de Medições em Atraso (Vencidas no Cronograma)
  totalEmAtraso: number;
  qtdEmAtraso: number;
  totalMedidoNaoPago: number;
  qtdMedidoNaoPago: number;
  totalAMedirAtrasado: number;
  qtdAMedirAtrasado: number;
  // Saldo contratual ainda sem parcelas/cronograma de medição cadastrado
  saldoSemCronograma?: number;
  // Valor real que ainda falta contratar (obras Ativas)
  faltaContratar: number;
  qtdFaltaContratar: number;
  // Valor de contratação suspensa (obras Paralisadas)
  faltaContratarPausado: number;
  qtdFaltaContratarPausado: number;
  custoTotalPrevisto: number; // totalContratado + faltaContratar + faltaContratarPausado
  diferencaOrcamento: number; // custoTotalPrevisto - totalOrcado (> 0 = ficará acima do orçado; < 0 = economia)
  diferencaContratados: number; // contratadoDosContratados - orcadoContratados (< 0 = economia líquida nos contratados)
  totalEconomiaItens: number; // soma das economias em itens já contratados abaixo do orçado
  totalEstouroItens: number;  // soma dos valores contratados acima do orçado nos itens
  totalTendencia?: number;    // Soma total das tendências projetadas de todos os itens
  desvioTendencia?: number;   // totalTendencia - totalOrcado
  resumoViabilidade?: ResumoViabilidadeCategoria[]; // Resumo sintético por categoria para atualização de viabilidade
}

export interface ResumoViabilidadeCategoria {
  categoria: CategoriaContrato;
  orcamentoBase: number;
  valorContratado: number;
  saldoAContratar: number;
  valorTendencia: number;
  desvioValor: number;        // valorTendencia - orcamentoBase
  desvioPercentual: number;   // % de variação vs base
  percentualContratado: number;
  qtdItens: number;
  qtdContratos: number;
}

export const STATUS_MEDICAO_COLORS: Record<StatusMedicao, { bg: string; text: string; border: string; badge: string }> = {
  'Pago': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-white',
  },
  'Medido': {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500 text-white',
  },
  'A Pagar': {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-500/30',
    badge: 'bg-indigo-500 text-white',
  },
  'A Medir': {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-white',
  },
  'Cancelado': {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500 text-white',
  },
};

export const STATUS_ORCAMENTO_COLORS: Record<StatusOrcamento, { bg: string; text: string; border: string }> = {
  'Contratado': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  'Em contratação': {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
  },
  'Em cotação': {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  'A contratar': {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-500/30',
  },
  'Cancelado': {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
  },
};

export const STATUS_CONTRATO_COLORS: Record<StatusContrato, { bg: string; text: string; border: string; badge: string }> = {
  'Ativo': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-white',
  },
  'Distratado': {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-600 text-white',
  },
  'Concluído': {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-600 text-white',
  },
};

