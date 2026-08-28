import { StatusConflitoArcis, PrioridadeArcis } from '@/types/arcis';

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

export function normalizeStatusArcis(raw?: string | null): StatusConflitoArcis {
  if (!raw || typeof raw !== 'string') return 'Aguardando Solução';
  const lower = raw.toLowerCase();
  if (lower.includes('encerrado') || lower.includes('resolvido')) return 'Encerrado';
  if (lower.includes('aprovad')) return 'Solução Aprovada';
  if (lower.includes('aguardando aprova')) return 'Solução Aguardando Aprovação';
  if (lower.includes('portobello')) return 'Solução Proposta por Portobello';
  if (lower.includes('cliente')) return 'Solução Proposta por Cliente';
  if (lower.includes('projetista')) return 'Solução Proposta por Projetista';
  return 'Aguardando Solução';
}

export function normalizePrioridadeArcis(raw?: string | null): PrioridadeArcis {
  if (!raw || typeof raw !== 'string') return 'Normal';
  const lower = raw.toLowerCase();
  if (lower.includes('alta') || lower.includes('urgente') || lower.includes('crítica') || lower.includes('critica')) return 'Alta';
  if (lower.includes('baixa')) return 'Baixa';
  return 'Normal';
}

export function normalizeTipoConflitoArcis(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return 'Conflito Normativo';
  const clean = raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();

  if (lower.includes('normat')) return 'Conflito Normativo';
  if (lower.includes('crític') || lower.includes('critic') || lower.includes('inicial')) return 'Análise Crítica Inicial';
  if (lower.includes('geomét') || lower.includes('geomet') || lower.includes('interfer')) return 'Interferência Geométrica';
  if (lower.includes('inconsist') || lower.includes('técnic') || lower.includes('tecnic')) return 'Inconsistência Técnica';
  if (lower.includes('produt') || lower.includes('defini')) return 'Definição de Produto';
  if (lower.includes('informa')) return 'Informação';

  return clean || 'Conflito Normativo';
}

export function cleanDescriptionText(desc?: string | null): string {
  if (!desc || typeof desc !== 'string') return '';
  return desc
    // Corrige espaços soltos antes de sinais de pontuação
    .replace(/\s+([.,;:!?])/g, '$1')
    // Corrige números decimais ou de itens normativos quebrados (ex: 5.7 .1.1 -> 5.7.1.1)
    .replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2')
    // Corrige aspas espaçadas (ex: " C" -> "C", " D" -> "D")
    .replace(/["']\s*([A-Za-z0-9])\s*["']/g, '"$1"')
    // Normaliza parágrafos mantendo saltos duplos quando houver quebra de linha intencional
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

export function cleanArcisPdfText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let res = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Correções de quebras de cabeçalhos e rótulos de campos estruturados da ARCIS
  res = res
    .replace(/\bT\s*o\s*t\s*a\s*l\b/gi, 'Total')
    .replace(/\bS\s*e\s*r\s*v\s*i\s*ç\s*o\s*s\b/gi, 'Serviços')
    .replace(/\bR\s*S\s*C\b/gi, 'RSC')
    .replace(/\bC\s*o\s*n\s*f\s*l\s*i\s*t\s*o\b/gi, 'Conflito')
    .replace(/\bT\s*i\s*p\s*o\s+C\s*o\s*n\s*f\s*l\s*i\s*t\s*o\b/gi, 'Tipo Conflito')
    .replace(/\bP\s*r\s*i\s*o\s*r\s*i\s*d\s*a\s*d\s*e\b/gi, 'Prioridade')
    .replace(/\bD\s*a\s*t\s*a\s+d\s*e\s+C\s*r\s*i\s*a\s*ç\s*ã\s*o\b/gi, 'Data de Criação')
    .replace(/\bD\s*t\.\s*ú\s*l\s*t\s*i\s*m\s*a\s+a\s*l\s*t\s*e\s*r\s*a\s*ç\s*ã\s*o\b/gi, 'Dt. última alteração')
    .replace(/\bD\s*i\s*s\s*c\s*i\s*p\s*l\s*i\s*n\s*a\s+P\s*r\s*i\s*n\s*c\s*i\s*p\s*a\s*l\b/gi, 'Disciplina Principal')
    .replace(/\bD\s*i\s*s\s*c\s*i\s*p\s*l\s*i\s*n\s*a\s*s\s+E\s*n\s*v\s*o\s*l\s*v\s*i\s*d\s*a\s*s\b/gi, 'Disciplinas Envolvidas')
    .replace(/\bE\s*d\s*i\s*f\s*i\s*c\s*a\s*ç\s*ã\s*o\b/gi, (m) => (m === m.toUpperCase() ? 'EDIFICAÇÃO' : 'Edificação'))
    .replace(/\bP\s*a\s*v\s*i\s*m\s*e\s*n\s*t\s*o\b/gi, (m) => (m === m.toUpperCase() ? 'PAVIMENTO' : 'Pavimento'))
    .replace(/\bL\s*o\s*c\s*a\s*l\s+E\s*d\s*i\s*f\s*i\s*c\s*a\s*ç\s*ã\s*o\b/gi, 'Local Edificação')
    .replace(/\bL\s*o\s*c\s*a\s*l\s*i\s*z\s*a\s*ç\s*ã\s*o\b/gi, 'Localização')
    .replace(/\bD\s*e\s*s\s*c\s*r\s*i\s*ç\s*ã\s*o\b/gi, 'Descrição')
    .replace(/\bS\s*o\s*l\s*u\s*ç\s*ã\s*o\b/gi, 'Solução');

  // 2. Normalização de Tipos de Conflitos conhecidos da ARCIS
  res = res
    .replace(/\bC\s*o\s*n\s*f\s*l\s*i\s*t\s*o\s+N\s*o\s*r\s*m\s*a\s*t\s*i\s*v\s*o\b/gi, 'Conflito Normativo')
    .replace(/\bA\s*n\s*á\s*l\s*i\s*s\s*e\s+C\s*r\s*í\s*t\s*i\s*c\s*a\s+I\s*n\s*i\s*c\s*i\s*a\s*l\b/gi, 'Análise Crítica Inicial')
    .replace(/\bI\s*n\s*t\s*e\s*r\s*f\s*e\s*r\s*ê\s*n\s*c\s*i\s*a\s+G\s*e\s*o\s*m\s*é\s*t\s*r\s*i\s*c\s*a\b/gi, 'Interferência Geométrica')
    .replace(/\bI\s*n\s*c\s*o\s*n\s*s\s*i\s*s\s*t\s*ê\s*n\s*c\s*i\s*a\s+T\s*é\s*c\s*n\s*i\s*c\s*a\b/gi, 'Inconsistência Técnica')
    .replace(/\bD\s*e\s*f\s*i\s*n\s*i\s*ç\s*ã\s*o\s+d\s*e\s+P\s*r\s*o\s*d\s*u\s*t\s*o\b/gi, 'Definição de Produto')
    .replace(/\bI\s*n\s*f\s*o\s*r\s*m\s*a\s*ç\s*ã\s*o\b/gi, 'Informação');

  // 3. Normalização de Status e Prioridades
  res = res
    .replace(/\bN\s*o\s*r\s*m\s*a\s*l\b/gi, 'Normal')
    .replace(/\bA\s*g\s*u\s*a\s*r\s*d\s*a\s*n\s*d\s*o\b/gi, 'Aguardando')
    .replace(/\bA\s*p\s*r\s*o\s*v\s*a\s*d\s*a\b/gi, 'Aprovada')
    .replace(/\bE\s*n\s*c\s*e\s*r\s*r\s*a\s*d\s*o\b/gi, 'Encerrado');

  // 4. Correção Sistemática de Palavras do Vocabulário da Construção / Incêndio / Normas
  res = res
    .replace(/\bDES\s+CARGA\b/gi, 'DESCARGA')
    .replace(/\bDES\s+CARGAS\b/gi, 'DESCARGAS')
    .replace(/\bDES\s+S\s*A\b/gi, 'DESSA')
    .replace(/\bDES\s+S\s*E\b/gi, 'DESSE')
    .replace(/\bDES\s+S\s*ES\b/gi, 'DESSES')
    .replace(/\bDES\s+S\s*AS\b/gi, 'DESSAS')
    .replace(/\bS\s+AÍDA\b/gi, 'SAÍDA')
    .replace(/\bS\s+AÍDAS\b/gi, 'SAÍDAS')
    .replace(/\bS\s+ER\b/gi, 'SER')
    .replace(/\bS\s+ERÁ\b/gi, 'SERÁ')
    .replace(/\bS\s+ERÃO\b/gi, 'SERÃO')
    .replace(/\bS\s+E\b/gi, 'SE')
    .replace(/\bS\s+OMATÓRIO\b/gi, 'SOMATÓRIO')
    .replace(/\bES\s+CADA\b/gi, 'ESCADA')
    .replace(/\bES\s+CADAS\b/gi, 'ESCADAS')
    .replace(/\bES\s+TACIONAMENTO\b/gi, 'ESTACIONAMENTO')
    .replace(/\bES\s+TACIONAMENTOS\b/gi, 'ESTACIONAMENTOS')
    .replace(/\bES\s+TRUTURAL\b/gi, 'ESTRUTURAL')
    .replace(/\bES\s+TRUTURAIS\b/gi, 'ESTRUTURAIS')
    .replace(/\bES\s+PECIFICADAS\b/gi, 'ESPECIFICADAS')
    .replace(/\bES\s+PECIFICADO\b/gi, 'ESPECIFICADO')
    .replace(/\bES\s+PECIFICADOS\b/gi, 'ESPECIFICADOS')
    .replace(/\bES\s+PECIFICAR\b/gi, 'ESPECIFICAR')
    .replace(/\bES\s+COAMENTO\b/gi, 'ESCOAMENTO')
    .replace(/\bES\s+PAÇO\b/gi, 'ESPAÇO')
    .replace(/\bES\s+QUEMA\b/gi, 'ESQUEMA')
    .replace(/\bES\s+TUDO\b/gi, 'ESTUDO')
    .replace(/\bES\s+TÁ\b/gi, 'ESTÁ')
    .replace(/\bES\s+TÃO\b/gi, 'ESTÃO')
    .replace(/\bENCLAUS\s+URADO\b/gi, 'ENCLAUSURADO')
    .replace(/\bENCLAUS\s+URADA\b/gi, 'ENCLAUSURADA')
    .replace(/\bCONS\s+TRUTIVOS\b/gi, 'CONSTRUTIVOS')
    .replace(/\bCONS\s+TRUTIVO\b/gi, 'CONSTRUTIVO')
    .replace(/\bCONS\s+TRUÇÃO\b/gi, 'CONSTRUÇÃO')
    .replace(/\bRES\s+IS\s*TÊNCIA\b/gi, 'RESISTÊNCIA')
    .replace(/\bRES\s+PEITADO\b/gi, 'RESPEITADO')
    .replace(/\bRES\s+PEITADA\b/gi, 'RESPEITADA')
    .replace(/\bRES\s+PEITAR\b/gi, 'RESPEITAR')
    .replace(/\bRES\s+ERVATÓRIO\b/gi, 'RESERVATÓRIO')
    .replace(/\bRES\s+ERVATÓRIOS\b/gi, 'RESERVATÓRIOS')
    .replace(/\bPREVIS\s+TO\b/gi, 'PREVISTO')
    .replace(/\bPREVIS\s+TA\b/gi, 'PREVISTA')
    .replace(/\bPREVIS\s+TAS\b/gi, 'PREVISTAS')
    .replace(/\bPREVIS\s+TOS\b/gi, 'PREVISTOS')
    .replace(/\bACES\s+S\s*OS\b/gi, 'ACESSOS')
    .replace(/\bACES\s+S\s*O\b/gi, 'ACESSO')
    .replace(/\bADJ\s+ACENTES\b/gi, 'ADJACENTES')
    .replace(/\bADJ\s+ACENTE\b/gi, 'ADJACENTE')
    .replace(/\bES\s+S\s*E\b/gi, 'ESSE')
    .replace(/\bES\s+S\s*A\b/gi, 'ESSA')
    .replace(/\bES\s+S\s*ES\b/gi, 'ESSES')
    .replace(/\bES\s+S\s*AS\b/gi, 'ESSAS')
    .replace(/\bREQUIS\s+ITO\b/gi, 'REQUISITO')
    .replace(/\bREQUIS\s+ITOS\b/gi, 'REQUISITOS')
    .replace(/\bJ\s+ANELA\b/gi, 'JANELA')
    .replace(/\bJ\s+ANELAS\b/gi, 'JANELAS')
    .replace(/\bPRES\s+ENTE\b/gi, 'PRESENTE')
    .replace(/\bPRES\s+ENTES\b/gi, 'PRESENTES')
    .replace(/\bLEGIS\s+LAÇÃO\b/gi, 'LEGISLAÇÃO')
    .replace(/\bDIMENS\s+IONAMENTO\b/gi, 'DIMENSIONAMENTO')
    .replace(/\bNECES\s+S\s*IDADE\b/gi, 'NECESSIDADE')
    .replace(/\bNECES\s+S\s*ÁRIO\b/gi, 'NECESSÁRIO')
    .replace(/\bNECES\s+S\s*ÁRIA\b/gi, 'NECESSÁRIA')
    .replace(/\bAPRES\s+ENTEM\b/gi, 'APRESENTEM')
    .replace(/\bAPRES\s+ENTAR\b/gi, 'APRESENTAR')
    .replace(/\bAPRES\s+ENTA\b/gi, 'APRESENTA')
    .replace(/\bPROJ\s+ETO\b/gi, 'PROJETO')
    .replace(/\bPROJ\s+ETOS\b/gi, 'PROJETOS')
    .replace(/\bCAS\s+O\b/gi, 'CASO')
    .replace(/\bPENTHOUS\s*E\b/gi, 'PENTHOUSE')
    .replace(/(\d+)\s+º/g, '$1º')
    .replace(/(\d+)\s+ª/g, '$1ª')
    .replace(/\bES\s+CADA\s+DE\s+EMERG[ÂA]NCIA\b/gi, 'ESCADA DE EMERGÊNCIA');

  return res;
}
