import { StatusConflitoArcis } from '@/types/arcis';

export function parseDateToISO(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  // Match DD/MM/YYYY, DD-MM-YYYY, or DD.MM.YYYY
  const brMatch = clean.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-](\d{4})/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Match YYYY-MM-DD, YYYY/MM/DD, or YYYY.MM.DD
  const isoMatch = clean.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  const clean = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
  const isoMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return clean;
}

export function normalizeStatusArcis(raw: string): StatusConflitoArcis {
  const lower = raw.toLowerCase();
  if (lower.includes('encerrado') || lower.includes('resolvido')) return 'Encerrado';
  if (lower.includes('aprovad')) return 'Solução Aprovada';
  if (lower.includes('aguardando aprova')) return 'Solução Aguardando Aprovação';
  if (lower.includes('portobello')) return 'Solução Proposta por Portobello';
  if (lower.includes('cliente')) return 'Solução Proposta por Cliente';
  if (lower.includes('projetista')) return 'Solução Proposta por Projetista';
  return 'Aguardando Solução';
}
