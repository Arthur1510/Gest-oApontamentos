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
  
  // Normalizar removendo acentos e espaços para identificação infalível
  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  if (normalized.includes('normat')) return 'Conflito Normativo';
  if (normalized.includes('critic') || normalized.includes('inicial')) return 'Análise Crítica Inicial';
  if (normalized.includes('geomet') || normalized.includes('interfer')) return 'Interferência Geométrica';
  if (normalized.includes('inconsist') || normalized.includes('tecnic')) return 'Inconsistência Técnica';
  if (normalized.includes('produt') || normalized.includes('defini')) return 'Definição de Produto';
  if (normalized.includes('informa')) return 'Informação';

  return raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Conflito Normativo';
}

function preserveCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original === original.toLowerCase()) return replacement.toLowerCase();
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
  }
  return replacement;
}

export function cleanFieldText(val?: string | null): string {
  if (!val || typeof val !== 'string') return '';
  return cleanArcisPdfText(val)
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanArcisPdfText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let res = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Correções estruturais de rótulos e cabeçalhos do relatório ARCIS
  res = res
    .replace(/\bT\s*o\s*t\s*a\s*l\b/gi, 'Total')
    .replace(/\bS\s*e\s*r\s*v\s*i\s*ç\s*o\s*s\b/gi, 'Serviços')
    .replace(/\bR\s*S\s*C\b/gi, 'RSC')
    .replace(/\bC\s*o\s*n\s*f\s*l\s*i\s*t\s*o\b/gi, 'Conflito')
    .replace(/T\s*i\s*p\s*o\s+C\s*o\s*n\s*f\s*l\s*i\s*t\s*o/gi, 'Tipo Conflito')
    .replace(/\bP\s*r\s*i\s*o\s*r\s*i\s*d\s*a\s*d\s*e\b/gi, 'Prioridade')
    .replace(/D\s*a\s*t\s*a\s+d\s*e\s+C\s*r\s*i\s*a\s*ç\s*ã\s*o/gi, 'Data de Criação')
    .replace(/D\s*t\.\s*ú\s*l\s*t\s*i\s*m\s*a\s+a\s*l\s*t\s*e\s*r\s*a\s*ç\s*ã\s*o/gi, 'Dt. última alteração')
    .replace(/D\s*i\s*s\s*c\s*i\s*p\s*l\s*i\s*n\s*a\s+P\s*r\s*i\s*n\s*c\s*i\s*p\s*a\s*l/gi, 'Disciplina Principal')
    .replace(/D\s*i\s*s\s*c\s*i\s*p\s*l\s*i\s*n\s*a\s*s\s+E\s*n\s*v\s*o\s*l\s*v\s*i\s*d\s*a\s*s/gi, 'Disciplinas Envolvidas')
    .replace(/E\s*d\s*i\s*f\s*i\s*c\s*a\s*ç\s*ã\s*o/gi, (m) => preserveCase(m, 'Edificação'))
    .replace(/P\s*a\s*v\s*i\s*m\s*e\s*n\s*t\s*o/gi, (m) => preserveCase(m, 'Pavimento'))
    .replace(/L\s*o\s*c\s*a\s*l\s+E\s*d\s*i\s*f\s*i\s*c\s*a\s*ç\s*ã\s*o/gi, 'Local Edificação')
    .replace(/L\s*o\s*c\s*a\s*l\s*i\s*z\s*a\s*ç\s*ã\s*o/gi, 'Localização')
    .replace(/D\s*e\s*s\s*c\s*r\s*i\s*ç\s*ã\s*o/gi, 'Descrição')
    .replace(/S\s*o\s*l\s*u\s*ç\s*ã\s*o/gi, 'Solução');

  // Tipos de conflitos conhecidos da ARCIS
  res = res
    .replace(/C\s*o\s*n\s*f\s*l\s*i\s*t\s*o\s+N\s*o\s*r\s*m\s*a\s*t\s*i\s*v\s*o/gi, 'Conflito Normativo')
    .replace(/A\s*n\s*á\s*l\s*i\s*s\s*e\s+C\s*r\s*í\s*t\s*i\s*c\s*a\s+I\s*n\s*i\s*c\s*i\s*a\s*l/gi, 'Análise Crítica Inicial')
    .replace(/I\s*n\s*t\s*e\s*r\s*f\s*e\s*r\s*ê\s*n\s*c\s*i\s*a\s+G\s*e\s*o\s*m\s*é\s*t\s*r\s*i\s*c\s*a/gi, 'Interferência Geométrica')
    .replace(/I\s*n\s*c\s*o\s*n\s*s\s*i\s*s\s*t\s*ê\s*n\s*c\s*i\s*a\s+T\s*é\s*c\s*n\s*i\s*c\s*a/gi, 'Inconsistência Técnica')
    .replace(/D\s*e\s*f\s*i\s*n\s*i\s*ç\s*ã\s*o\s+d\s*e\s+P\s*r\s*o\s*d\s*u\s*t\s*o/gi, 'Definição de Produto')
    .replace(/I\s*n\s*f\s*o\s*r\s*m\s*a\s*ç\s*ã\s*o/gi, 'Informação');

  // Status e prioridades
  res = res
    .replace(/\bN\s*o\s*r\s*m\s*a\s*l\b/gi, 'Normal')
    .replace(/\bA\s*g\s*u\s*a\s*r\s*d\s*a\s*n\s*d\s*o\b/gi, 'Aguardando')
    .replace(/\bA\s*p\s*r\s*o\s*v\s*a\s*d\s*a\b/gi, 'Aprovada')
    .replace(/\bE\s*n\s*c\s*e\s*r\s*r\s*a\s*d\s*o\b/gi, 'Encerrado');

  // Ordinais (ex: 14 º -> 14º)
  res = res
    .replace(/(\d+)\s+º/g, '$1º')
    .replace(/(\d+)\s+ª/g, '$1ª');

  // Clíticos com hífen (ex: VERIFICOU- S E -> VERIFICOU-SE)
  res = res.replace(/-\s*([sS])\s*([eE])(?=$|[\s\p{P}])/gu, '-$1$2');

  // 2. Junção de palavras de raiz quebrada com duplo SS (ex: DES S A -> DESSA, ES S E -> ESSE, NECES S IDADE -> NECESSIDADE, ACES S OS -> ACESSOS)
  res = res
    .replace(/(?:^|(?<=[\s\p{P}]))(des|DES)\s*([sS])\s*(a|e|as|es|A|E|AS|ES)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(es|ES)\s*([sS])\s*(a|e|as|es|te|ta|tes|tas|A|E|AS|ES|TE|TA|TES|TAS)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(neces|NECES)\s*([sS])\s*(idade|idades|ário|ária|ários|árias|IDADE|IDADES|ÁRIO|ÁRIA|ÁRIOS|ÁRIAS)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(aces|ACES)\s*([sS])\s*(o|os|ível|íveis|O|OS|ÍVEL|ÍVEIS)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(pos|POS)\s*([sS])\s*(o|ível|íveis|ibilidade|ibilidades|O|ÍVEL|ÍVEIS|IBILIDADE|IBILIDADES)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(pas|PAS)\s*([sS])\s*(o|os|agem|agens|ar|ou|am|O|OS|AGEM|AGENS|AR|OU|AM)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(pres|PRES)\s*([sS])\s*(ão|ões|ÃO|ÕES)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(is|IS)\s*([sS])\s*(o|O)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(as|AS)\s*([sS])\s*(im|IM)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(dis|DIS)\s*([sS])\s*(o|O)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(proces|PROCES)\s*([sS])\s*(o|os|O|OS)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(exces|EXCES)\s*([sS])\s*(o|os|ivo|iva|ivos|ivas|O|OS|IVO|IVA|IVOS|IVAS)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(mis|MIS)\s*([sS])\s*(ão|ões|ÃO|ÕES)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(impres|IMPRES)\s*([sS])\s*(ão|ões|ÃO|ÕES)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(exten|EXTEN)\s*([sS])\s*(ão|ões|ÃO|ÕES)(?=$|[\s\p{P}])/gu, '$1$2$3');

  // 3. Quebras triplas de RES IS TÊNCIA / RES IS TÊNCIAS
  res = res.replace(/(?:^|(?<=[\s\p{P}]))(res|RES)\s+(is|IS)\s+(t[êe]ncia[s]?|tente[s]?|T[ÊE]NCIA[S]?|TENTE[S]?)(?=$|[\s\p{P}])/gu, '$1$2$3');

  // 4. Prefixos e raízes do português que NUNCA existem isoladas como palavra
  // (es, des, res, cons, dis, ins, proj, adj, trans, obs, subs, neces, aces)
  res = res
    .replace(/(?:^|(?<=[\s\p{P}]))(es|ES)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(des|DES)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(res|RES)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(neces|NECES)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(aces|ACES)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(cons|CONS)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(dis|DIS)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(ins|INS)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(proj|PROJ)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(adj|ADJ)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(trans|TRANS)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(obs|OBS)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(subs|SUBS)\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2');

  // 5. Letra 's', 'S', 'j', 'J' isolada no início da palavra quebrada (Unicode-aware)
  // Resolve casos como "s imbologia" -> "simbologia", "S AÍDA" -> "SAÍDA", "s istema" -> "sistema", "J ANELA" -> "JANELA", "s er" -> "ser", "s e" -> "se", "s ó" -> "só"
  // Não consome se for precedido por número (ex: 30 s)
  res = res.replace(/(?<!\d\s*)(?:^|(?<=[\s\p{P}]))([sSjJ])\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2');

  // 6. Quebras internas comuns em laudos técnicos e normas (ex: PREVIS TO, REQUIS ITO, PRES ENTE, CAS O, etc.)
  res = res
    .replace(/(?:^|(?<=[\s\p{P}]))(enclaus|ENCLAUS)\s+(urado|urada|urados|uradas|URADO|URADA|URADOS|URADAS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(penthous|PENTHOUS)\s+(e|E)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(previs|PREVIS)\s+(to|ta|tos|tas|TO|TA|TOS|TAS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(requis|REQUIS)\s+(ito|ita|itos|itas|ITO|ITA|ITOS|ITAS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(pres|PRES)\s+(ente|entes|ENTE|ENTES)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(apres|APRES)\s+(enta|entam|ente|entem|entado|entada|entados|entadas|entar|ENTA|ENTAM|ENTE|ENTEM|ENTADO|ENTADA|ENTADOS|ENTADAS|ENTAR)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(dimens|DIMENS)\s+(ionamento|ionamentos|IONAMENTO|IONAMENTOS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(legis|LEGIS)\s+(lação|lações|LAÇÃO|LAÇÕES)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(cas|CAS)\s+(o|os|O|OS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(avis|AVIS)\s+(o|os|O|OS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(pis|PIS)\s+(o|os|O|OS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(us|US)\s+(o|os|O|OS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(is|IS)\s+(tência|tências|tente|tentes|TÊNCIA|TÊNCIAS|TENTE|TENTES)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(exis|EXIS)\s+(tência|tências|tente|tentes|tir|tem|te|TÊNCIA|TÊNCIAS|TENTE|TENTES|TIR|TEM|TE)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(consis|CONSIS)\s+(tência|tências|tente|tentes|TÊNCIA|TÊNCIAS|TENTE|TENTES)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(inconsis|INCONSIS)\s+(tência|tências|tente|tentes|TÊNCIA|TÊNCIAS|TENTE|TENTES)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(assis|ASSIS)\s+(tência|tências|tente|tentes|tir|TÊNCIA|TÊNCIAS|TENTE|TENTES|TIR)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(res|RES)\s+(ervatório|ervatórios|ERVATÓRIO|ERVATÓRIOS)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(res|RES)\s+(peitado|peitada|peitados|peitadas|peitar|peito|PEITADO|PEITADA|PEITADOS|PEITADAS|PEITAR|PEITO)(?=$|[\s\p{P}])/gu, '$1$2');

  // Espaços soltos antes de sinais de pontuação
  res = res.replace(/\s+([,;:!?])/g, '$1');

  return res;
}

export function cleanDescriptionText(desc?: string | null): string {
  if (!desc || typeof desc !== 'string') return '';
  // 1. Aplica a limpeza de quebras fonéticas
  let text = cleanArcisPdfText(desc);

  // 2. Corrige espaços soltos antes de sinais de pontuação
  text = text.replace(/\s+([.,;:!?])/g, '$1');

  // 3. Corrige números decimais ou de itens normativos quebrados (ex: 5.7 .1.1 -> 5.7.1.1)
  text = text.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');
  text = text.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');

  // 4. Corrige aspas espaçadas (ex: " C" -> "C", " D" -> "D")
  text = text.replace(/["']\s*([A-Za-z0-9])\s*["']/g, '"$1"');

  // 5. Normaliza parágrafos mantendo saltos duplos quando houver quebra de linha intencional
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}
