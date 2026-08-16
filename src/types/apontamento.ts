export type StatusApontamento = 'Aberto' | 'Resolvido';
export type PrioridadeApontamento = 'Baixa' | 'Média' | 'Alta';
export type StatusProjeto = 'Ativo' | 'Inativo';

export type TipoConflito =
  | 'Conflito Físico'
  | 'Concepção Técnica'
  | 'Inconsistência Normativa'
  | 'Definição de Produto'
  | 'Informação Incompleta';

export const TIPOS_CONFLITO_OPCOES: TipoConflito[] = [
  'Conflito Físico',
  'Concepção Técnica',
  'Inconsistência Normativa',
  'Definição de Produto',
  'Informação Incompleta',
];

export interface Projeto {
  id: string;
  created_at: string;
  nome: string;
  descricao?: string | null;
  status: StatusProjeto;
}

export type NovoProjeto = Omit<Projeto, 'id' | 'created_at'>;

export interface Apontamento {
  id: string;
  created_at: string;
  titulo: string;
  descricao: string;
  disciplina_origem: string;
  disciplina_destino: string;
  status: StatusApontamento;
  prioridade: PrioridadeApontamento;
  tipo_conflito?: TipoConflito;
  solucao?: string | null;
  url_imagem?: string | null;
  projeto_id?: string | null;
  projetos?: { nome: string } | null;
}

export type NovoApontamento = Omit<Apontamento, 'id' | 'created_at' | 'projetos'>;

export const DISCIPLINAS_OPCOES = [
  'Arquitetura',
  'Estrutura',
  'Elétrica',
  'Hidráulica',
  'Climatização (HVAC)',
  'Incêndio',
  'Fundações',
  'Telecomunicações / Automação',
  'Geral / Outros'
] as const;
