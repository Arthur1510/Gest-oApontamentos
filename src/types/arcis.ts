export type StatusConflitoArcis =
  | 'Aguardando Solução'
  | 'Solução Proposta por Portobello'
  | 'Solução Proposta por Projetista'
  | 'Solução Proposta por Cliente'
  | 'Solução Aguardando Aprovação'
  | 'Solução Aprovada'
  | 'Encerrado';

export const STATUS_ARCIS_OPCOES: StatusConflitoArcis[] = [
  'Aguardando Solução',
  'Solução Proposta por Portobello',
  'Solução Proposta por Projetista',
  'Solução Proposta por Cliente',
  'Solução Aguardando Aprovação',
  'Solução Aprovada',
  'Encerrado',
];

export type TipoConflitoArcis =
  | 'Conflito Normativo'
  | 'Análise Crítica Inicial'
  | 'Interferência Geométrica'
  | 'Inconsistência Técnica'
  | 'Definição de Produto'
  | 'Informação';

export const TIPOS_CONFLITO_ARCIS_OPCOES: TipoConflitoArcis[] = [
  'Conflito Normativo',
  'Análise Crítica Inicial',
  'Interferência Geométrica',
  'Inconsistência Técnica',
  'Definição de Produto',
  'Informação',
];

export type PrioridadeArcis = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';

export interface ConflitoArcis {
  id: string;
  projeto_id?: string | null;
  codigo_conflito: number; // Ex: 1, 2, 3, 4
  status_arcis: StatusConflitoArcis;
  prioridade: PrioridadeArcis;
  tipo_conflito: string; // Ex: 'Conflito Normativo', 'Análise Crítica Inicial'
  disciplina_principal: string; // Ex: 'ARQUITETURA LEGAL'
  disciplinas_envolvidas: string[]; // Ex: ['INCÊNDIO']
  edificacao: string; // Ex: 'TORRE'
  pavimentos: string[]; // Ex: ['ÁTICO', 'TÉRREO', '1º PAV - LAZER E VAGAS']
  local_edificacao?: string | null; // Ex: 'ESCADA EMERGÊNCIA'
  localizacao?: string | null; // Ex: 'ÁTRIO', 'FACHADA', 'ESCADA DE EMERGÊNCIA'
  descricao: string;
  solucao?: string | null;
  url_imagem?: string | null;
  imagens?: string[] | null;
  data_criacao_arcis?: string | null; // Formato YYYY-MM-DD ou DD/MM/YYYY
  data_ultima_alteracao?: string | null;
  numero_relatorio?: string | null; // Ex: 'RSC_47'
  created_at: string;
  projetos?: { nome: string; pavimentos?: string[] | null } | null;
}

export type NovoConflitoArcis = Omit<ConflitoArcis, 'id' | 'created_at' | 'projetos'>;

export interface RelatorioArcisMetadata {
  empresa: string; // 'Grupo ARCIS - RSC'
  cliente: string; // 'WCC CONSTRUTORA'
  empreendimento: string; // 'ALTAMIRA 47'
  data_relatorio: string; // '16/08/2026'
  total_conflitos: number;
  filtros_aplicados?: string;
  conflitos: ConflitoArcis[];
}

export const STATUS_ARCIS_COLORS: Record<StatusConflitoArcis, { bg: string; text: string; border: string; barColor: string }> = {
  'Aguardando Solução': {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    barColor: '#f59e0b',
  },
  'Solução Proposta por Portobello': {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-500/30',
    barColor: '#6366f1',
  },
  'Solução Proposta por Projetista': {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
    barColor: '#3b82f6',
  },
  'Solução Proposta por Cliente': {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-[#008EA9] dark:text-[#00C4EB]',
    border: 'border-[#00A3C4]/30',
    barColor: '#00a3c4',
  },
  'Solução Aguardando Aprovação': {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-500/30',
    barColor: '#a855f7',
  },
  'Solução Aprovada': {
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-500/30',
    barColor: '#14b8a6',
  },
  'Encerrado': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    barColor: '#10b981',
  },
};
