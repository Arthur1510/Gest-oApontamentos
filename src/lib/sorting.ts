import { Apontamento } from '@/types/apontamento';

export type SortCriteria =
  | 'data_desc'
  | 'data_asc'
  | 'pavimento'
  | 'prioridade_desc'
  | 'prioridade_asc'
  | 'disciplina'
  | 'tipo_conflito'
  | 'titulo'
  | 'manual';

export interface SortOptionMeta {
  value: SortCriteria;
  label: string;
  description: string;
}

export const SORT_OPTIONS: SortOptionMeta[] = [
  { value: 'data_desc', label: 'Mais Recentes Primeiro', description: 'Data de criação decrescente' },
  { value: 'data_asc', label: 'Mais Antigos Primeiro', description: 'Data de criação crescente' },
  { value: 'pavimento', label: 'Por Pavimento / Nível (Subsolo ➔ Cobertura)', description: 'Ordem cronológica estrutural da edificação' },
  { value: 'prioridade_desc', label: 'Prioridade: Alta ➔ Baixa', description: 'Críticos e urgentes primeiro' },
  { value: 'prioridade_asc', label: 'Prioridade: Baixa ➔ Alta', description: 'Menos críticos primeiro' },
  { value: 'disciplina', label: 'Por Disciplina de Origem (A-Z)', description: 'Agrupado por disciplina' },
  { value: 'tipo_conflito', label: 'Por Tipo de Apontamento (A-Z)', description: 'Agrupado por tipo' },
  { value: 'titulo', label: 'Título Alfabético (A-Z)', description: 'Ordem alfabética do título' },
  { value: 'manual', label: 'Personalizada (Manual)', description: 'Ordem customizada manualmente' },
];

export function getPavimentoRank(pavimento?: string | null): number {
  if (!pavimento) return 999;
  const p = pavimento.toLowerCase().trim();

  // Subsolos
  if (p.includes('subsolo 4') || p.includes('ss4') || p.includes('-4')) return 10;
  if (p.includes('subsolo 3') || p.includes('ss3') || p.includes('-3')) return 20;
  if (p.includes('subsolo 2') || p.includes('ss2') || p.includes('-2')) return 30;
  if (p.includes('subsolo 1') || p.includes('ss1') || p.includes('-1') || p.includes('subsolo')) return 40;

  // Térreo, Implantação e Hall
  if (p.includes('implantação') || p.includes('implantacao') || p.includes('externa')) return 48;
  if (p.includes('térreo') || p.includes('terreo') || p.includes('hall')) return 50;
  if (p.includes('mezanino')) return 60;
  if (p.includes('garagem') || p.includes('estacionamento')) return 65;
  if (p.includes('pilotis') || p.includes('lazer') || p.includes('piscina') || p.includes('puc')) return 70;

  // Pavimentos Numerados (1º, 2º, 3º... 25º)
  const numMatch = p.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    return 100 + num;
  }

  // Pavimentos Tipo
  if (p.includes('tipo')) return 200;
  if (p.includes('penthouse') || p.includes('duplex')) return 280;

  // Cobertura e Áticos
  if (p.includes('cobertura') || p.includes('rooftop')) return 300;
  if (p.includes('ático') || p.includes('atico')) return 310;
  if (p.includes('barrilete')) return 320;
  if (p.includes('casa de máquina') || p.includes('casa de maquinas') || p.includes('reservatório') || p.includes('reservatorio')) return 330;

  return 500;
}

const PRIORIDADE_WEIGHT: Record<string, number> = {
  'Alta': 3,
  'Média': 2,
  'Baixa': 1,
};

export function sortApontamentos(list: Apontamento[], criteria: SortCriteria): Apontamento[] {
  if (criteria === 'manual') return [...list];

  const sorted = [...list];
  switch (criteria) {
    case 'data_desc':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'data_asc':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'pavimento':
      return sorted.sort((a, b) => {
        const rankA = getPavimentoRank(a.pavimento);
        const rankB = getPavimentoRank(b.pavimento);
        if (rankA !== rankB) return rankA - rankB;
        return (a.pavimento || '').localeCompare(b.pavimento || '');
      });
    case 'prioridade_desc':
      return sorted.sort((a, b) => (PRIORIDADE_WEIGHT[b.prioridade] || 0) - (PRIORIDADE_WEIGHT[a.prioridade] || 0));
    case 'prioridade_asc':
      return sorted.sort((a, b) => (PRIORIDADE_WEIGHT[a.prioridade] || 0) - (PRIORIDADE_WEIGHT[b.prioridade] || 0));
    case 'disciplina':
      return sorted.sort((a, b) => (a.disciplina_origem || '').localeCompare(b.disciplina_origem || ''));
    case 'tipo_conflito':
      return sorted.sort((a, b) => (a.tipo_conflito || '').localeCompare(b.tipo_conflito || ''));
    case 'titulo':
      return sorted.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
    default:
      return sorted;
  }
}
