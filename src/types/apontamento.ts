export type StatusApontamento = 'Aberto' | 'Resolvido';
export type PrioridadeApontamento = 'Baixa' | 'Média' | 'Alta';
export type StatusProjeto = 'Ativo' | 'Inativo';

export type TipoConflito =
  | 'Conflito Físico'
  | 'Concepção Técnica'
  | 'Inconsistência Normativa'
  | 'Definição de Produto'
  | 'Informação';

export const TIPOS_CONFLITO_OPCOES: TipoConflito[] = [
  'Conflito Físico',
  'Concepção Técnica',
  'Inconsistência Normativa',
  'Definição de Produto',
  'Informação',
];

export interface Projeto {
  id: string;
  created_at: string;
  nome: string;
  descricao?: string | null;
  status: StatusProjeto;
  pavimentos?: string[] | null;
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
  pavimento?: string | null;
  localizacao?: string | null;
  solucao?: string | null;
  url_imagem?: string | null;
  url_imagem_solucao?: string | null;
  imagens_apontamento?: string[] | null;
  imagens_solucao?: string[] | null;
  projeto_id?: string | null;
  projetos?: { nome: string; pavimentos?: string[] | null } | null;
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

export const SUGESTOES_PAVIMENTOS = [
  'Implantação / Área Externa',
  'Subsolo 3',
  'Subsolo 2',
  'Subsolo 1',
  'Térreo / Hall Social',
  'Mezanino',
  '1º Pavimento',
  'Pavimento Tipo',
  'Área de Lazer / Pilotis',
  'Cobertura / Rooftop',
  'Ático / Barrilete',
  'Reservatórios / Casa de Máquinas',
  'Geral / Todo o Edifício'
] as const;

