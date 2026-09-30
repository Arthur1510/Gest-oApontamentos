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

export type CategoriaContrato = 'Projeto' | 'Legalização';

export const CATEGORIA_CONTRATO_OPCOES: CategoriaContrato[] = [
  'Projeto',
  'Legalização',
];

export type StatusMedicao =
  | 'A Medir'
  | 'Medido'
  | 'Pago'
  | 'Cancelado';

export const STATUS_MEDICAO_OPCOES: StatusMedicao[] = [
  'A Medir',
  'Medido',
  'Pago',
  'Cancelado',
];

export interface Obra {
  id: string;
  cc: string;
  codigo: string;
  nome: string;
  endereco?: string | null;
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
  valor_medido: number;
  saldo_medicao: number;
  categoria: CategoriaContrato;
  status: StatusOrcamento;
}

export type NovoItemOrcamento = Omit<ItemOrcamento, 'id' | 'valor_contratado' | 'saldo_a_contratar' | 'valor_medido' | 'saldo_medicao'>;

export interface Contrato {
  id: string;
  num_sienge: string;
  empresa: string;
  obra: string;
  disciplina: string;
  subdisciplina: string;
  valor_contrato: number;
  valor_medido: number;
  saldo_a_medir: number;
  percentual_medido: number; // 0 a 1
  categoria: CategoriaContrato;
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
  previsto: number;
  realizado: number;
  total: number;
  acumuladoPrevisto: number;
  acumuladoRealizado: number;
  acumuladoTotal: number;
}

export interface KpiOrcamento {
  totalOrcado: number;
  totalContratado: number;
  saldoAContratar: number;
  percentualContratado: number;
  totalMedido: number;
  saldoAMedir: number;
  percentualMedido: number;
  totalPago: number;
  totalMedidoPendente: number;
  totalPrevistoAMedir: number;
  totalCancelado: number;
  totalContratosCount: number;
  totalMedicoesCount: number;
  // Métricas específicas de Projetos vs Legalização
  totalProjetosContratado: number;
  totalLegalizacaoContratado: number;
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
