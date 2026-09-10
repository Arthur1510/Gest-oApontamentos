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
  const clean = cleanArcisPdfText(raw).toLowerCase().trim();
  if (clean.includes('urgent')) return 'Urgente';
  if (clean.includes('alta') || clean.includes('crítica') || clean.includes('critica')) return 'Alta';
  if (clean.includes('baixa')) return 'Baixa';
  if (clean.includes('modera') || clean.includes('normal') || clean.includes('média') || clean.includes('media')) return 'Normal';
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
  if (normalized.includes('fisic')) return 'Conflito Físico';
  if (normalized.includes('funcio')) return 'Conflito Funcional';
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
    .replace(/C\s*o\s*n\s*f\s*l\s*i\s*t\s*o\s+F\s*í\s*s\s*i\s*c\s*o/gi, 'Conflito Físico')
    .replace(/C\s*o\s*n\s*f\s*l\s*i\s*t\s*o\s+F\s*u\s*n\s*c\s*i\s*o\s*n\s*a\s*l/gi, 'Conflito Funcional')
    .replace(/P\s*e\s*n\s*d\s*ê\s*n\s*c\s*i\s*a\s*s?\s+d\s*e\s+I\s*n\s*f\s*o\s*r\s*m\s*a\s*ç\s*õ\s*e\s*s/gi, 'Informação')
    .replace(/C\s*o\s*n\s*f\s*l\s*i\s*t\s*o\s+d\s*e\s+I\s*n\s*f\s*o\s*r\s*m\s*a\s*ç\s*õ\s*e\s*s/gi, 'Informação')
    .replace(/I\s*n\s*f\s*o\s*r\s*m\s*a\s*ç\s*ã\s*o/gi, 'Informação');

  // Status e prioridades
  res = res
    .replace(/\bN\s*o\s*r\s*m\s*a\s*l\b/gi, 'Normal')
    .replace(/\bU\s*r\s*g\s*e\s*n\s*t\s*e\b/gi, 'Urgente')
    .replace(/\b(urgent|URGENT)\s+(e|E)\b/g, '$1$2')
    .replace(/\b(mo|MO)\s+(derado|derada|derados|deradas|DERADO|DERADA|DERADOS|DERADAS)\b/g, '$1$2')
    .replace(/\bA\s*g\s*u\s*a\s*r\s*d\s*a\s*n\s*d\s*o\b/gi, 'Aguardando')
    .replace(/\bA\s*p\s*r\s*o\s*v\s*a\s*d\s*a\b/gi, 'Aprovada')
    .replace(/\bE\s*n\s*c\s*e\s*r\s*r\s*a\s*d\s*o\b/gi, 'Encerrado');

  // 2. Elementos de Engenharia, Códigos de Projeto, Dimensões e Unidades
  // Ordinais (ex: 14 º -> 14º)
  res = res
    .replace(/(\d+)\s+º/g, '$1º')
    .replace(/(\d+)\s+ª/g, '$1ª');

  // Clíticos com hífen (ex: VERIFICOU- S E -> VERIFICOU-SE)
  res = res.replace(/-\s*([sS])\s*([eE])(?=$|[\s\p{P}])/gu, '-$1$2');

  // Tags de Elementos Estruturais (Vigas V450, Lajes L28, Pilares PS37, Pilares P23)
  res = res
    .replace(/\b([VvLl])(\d+)\s+(\d+)\s+(\d+)\b/g, '$1$2$3$4')
    .replace(/\b([VvLl])(\d+)\s+(\d+)\b/g, '$1$2$3')
    .replace(/\b(PS|ps|Ps)\s+(\d+)\s+(\d+)\b/g, '$1$2$3')
    .replace(/\b(PS|ps|Ps)\s+(\d+)\b/g, '$1$2')
    .replace(/\b(P|p)\s+(\d+)\b/g, '$1$2');

  // Códigos de projeto e extensões (ex: WCC-4 7 -> WCC-47, FORMAS -R12 -> FORMAS-R12)
  res = res
    .replace(/\b(WCC|ALT)-(\d+)\s+(\d+)\b/g, '$1-$2$3')
    .replace(/\b(FORMAS)\s+-/g, '$1-');

  // Datas e Pranchas quebradas por barra (ex: 29/07 /2026 -> 29/07/2026, 04 /07 -> 04/07)
  res = res
    .replace(/(\d{1,2}\/\d{1,2})\s+\/(\d{4})/g, '$1/$2')
    .replace(/(\d{1,2})\s+\/(\d{1,2})/g, '$1/$2');

  // Dimensões, cotas e porcentagens (ex: +7 99,10m -> +799,10m; 3,4 5m -> 3,45m; 4 8cm -> 48cm; 21,7 % -> 21,7%)
  res = res
    .replace(/\+(\d+)\s+(\d+,\d+m)/g, '+$1$2')
    .replace(/\b(\d+,\d+)\s+(\d+)\s*(m|cm|mm)\b/g, '$1$2$3')
    .replace(/\b(\d+)\s+(\d+)\s*(cm|mm)\b/g, '$1$2$3')
    .replace(/(\d+,\d+)\s+%/g, '$1%');

  // 3. Palavras técnicas essenciais com quebras internas (DEVEM rodar ANTES das regras genéricas de prefixo!)
  // Evita falsas junções do tipo "LAJ ES PROXIMO" -> "LAJ ESPROXIMO" ou "LAJ ES NAS" -> "LAJ ESNAS"
  res = res
    .replace(/\b(laj|LAJ)\s+(e|es|E|ES)\b/gu, '$1$2')
    .replace(/\b(sej|SEJ)\s+(a|am|A|AM)\b/gu, '$1$2')
    .replace(/\b(mes|MES)\s+(mo|ma|mos|mas|MO|MA|MOS|MAS)\b/gu, '$1$2')
    .replace(/\b(aj|AJ)\s+(us|US)\s+(te|tes|tar|tado|tada|tados|tadas|tou|tam|TE|TES|TAR|TADO|TADA|TADOS|TADAS|TOU|TAM)\b/gu, '$1$2$3')
    .replace(/\b(dimens|DIMENS)\s+(ão|ões|ionamento|ionamentos|iona[\p{L}]*|ÃO|ÕES|IONAMENTO|IONAMENTOS|IONA[\p{L}]*)\b/gu, '$1$2')
    .replace(/\b(revis|REVIS)\s+(ão|ões|ÃO|ÕES)\b/gu, '$1$2')
    .replace(/\b(previs|PREVIS)\s+(ão|ões|to|ta|tos|tas|ÃO|ÕES|TO|TA|TOS|TAS)\b/gu, '$1$2')
    .replace(/\b(pos|POS)\s+(ição|ições|iciona[\p{L}]*|IÇÃO|IÇÕES|ICIONA[\p{L}]*)\b/gu, '$1$2')
    .replace(/\b(repos|REPOS)\s+(ição|ições|iciona[\p{L}]*|IÇÃO|IÇÕES|ICIONA[\p{L}]*)\b/gu, '$1$2')
    .replace(/\b(analis|ANALIS)\s+(ado|ada|ados|adas|ar|ando|ou|am|ADO|ADA|ADOS|ADAS|AR|ANDO|OU|AM)\b/gu, '$1$2')
    .replace(/\b(cons|CONS)\s+(equente|equentemente|equência|equências|EQUENTE|EQUENTEMENTE|EQUÊNCIA|EQUÊNCIAS)\b/gu, '$1$2')
    .replace(/\b(s\s*is|sis|S\s*IS|SIS)\s+(tema|temas|TEMA|TEMAS)\b/gu, (m) => preserveCase(m, 'sistema'))
    .replace(/\b(pres|PRES)\s*([sS])\s*(uriza[\p{L}]*|URIZA[\p{L}]*)\b/gu, '$1$2$3')
    .replace(/\b(impos|IMPOS)\s*([sS])\s*(ibilita[\p{L}]*|ível|íveis|ibilidade|abilidades|IBILITA[\p{L}]*|ÍVEL|ÍVEIS|IBILIDADE|IBILIDADES)\b/gu, '$1$2$3')
    .replace(/\b(pos|POS)\s*([sS])\s*(a|e|o|as|es|os|am|em|ui|uem|uir|uído|uída|uídos|uídas|ível|íveis|ibilidade|abilidades|A|E|O|AS|ES|OS|AM|EM|UI|UEM|UIR|UÍDO|UÍDA|UÍDOS|UÍDAS|ÍVEL|ÍVEIS|IBILIDADE|IBILIDADES)\b/gu, '$1$2$3')
    .replace(/\b(neces|NECES)\s*([sS])\s*(idade|idades|ário|ária|ários|árias|ario|aria|arios|arias|ita|itam|itar|itando|IDADE|IDADES|ÁRIO|ÁRIA|ÁRIOS|ÁRIAS|ARIO|ARIA|ARIOS|ARIAS|ITA|ITAM|ITAR|ITANDO)\b/gu, '$1$2$3')
    .replace(/\b([sS])\s*(hafts?|HAFTS?)\b/gu, '$1$2')
    .replace(/\b(shaft|SHAFT)\s+([sS])\b/gu, '$1$2')
    .replace(/\b(repres|REPRES)\s+(enta[\p{L}]*|ENTA[\p{L}]*)\b/gu, '$1$2')
    .replace(/\b(nas|NAS)\s+(ce|cem|cer|cendo|ceu|CE|CEM|CER|CENDO|CEU)\b/gu, '$1$2')
    .replace(/\b(funcio|FUNCIO)\s+(nal|nais|namento|namentos|nar|NAL|NAIS|NAMENTO|NAMENTOS|NAR)\b/gu, '$1$2')
    .replace(/\b(muret|MURET)\s+(a|as|A|AS)\b/gu, '$1$2');

  // 4. Junção de palavras de raiz quebrada com duplo SS
  res = res
    .replace(/(?:^|(?<=[\s\p{P}]))(des|DES)\s*([sS])\s*(a|e|as|es|A|E|AS|ES)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(es|ES)\s*([sS])\s*(a|e|as|es|te|ta|tes|tas|A|E|AS|ES|TE|TA|TES|TAS)(?=$|[\s\p{P}])/gu, '$1$2$3')
    .replace(/(?:^|(?<=[\s\p{P}]))(aces|ACES)\s*([sS])\s*(o|os|ível|íveis|O|OS|ÍVEL|ÍVEIS)(?=$|[\s\p{P}])/gu, '$1$2$3')
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

  // 5. Quebras triplas de RES IS TÊNCIA / RES IS TÊNCIAS
  res = res.replace(/(?:^|(?<=[\s\p{P}]))(res|RES)\s+(is|IS)\s+(t[êe]ncia[s]?|tente[s]?|T[ÊE]NCIA[S]?|TENTE[S]?)(?=$|[\s\p{P}])/gu, '$1$2$3');

  // 6. Prefixos do português com proteção contra palavras avulsas comuns
  // (es, des, res, cons, dis, ins, proj, adj, trans, obs, subs)
  res = res
    .replace(/(?:^|(?<=[\s\p{P}]))(es|ES)\s+(?!(?:da|do|de|das|dos|na|no|nas|nos|que|para|por|com|sem|ao|aos|em|se|um|uma|umas|uns|já|ou|e|o|a|os|as|laje|lajes|viga|vigas|pilar|pilares|forma|formas|próximo|proximo)\b)(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(des|DES)\s+(?!(?:da|do|de|das|dos|na|no|nas|nos|que|para|por|com|sem|ao|aos|em|se|um|uma|umas|uns|já|ou|e|o|a|os|as)\b)(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
    .replace(/(?:^|(?<=[\s\p{P}]))(res|RES)\s+(?!(?:da|do|de|das|dos|na|no|nas|nos|que|para|por|com|sem|ao|aos|em|se|um|uma|umas|uns|já|ou|e|o|a|os|as)\b)(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2')
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

  // 7. Letra 's', 'S', 'j', 'J' isolada no início da palavra quebrada (Unicode-aware)
  // Resolve casos como "s imbologia" -> "simbologia", "S AÍDA" -> "SAÍDA", "s istema" -> "sistema", "J ANELA" -> "JANELA"
  res = res.replace(/(?<!\d\s*)(?:^|(?<=[\s\p{P}]))([sSjJ])\s+(\p{L}+)(?=$|[\s\p{P}])/gu, '$1$2');

  // 8. Quebras internas comuns em laudos técnicos e normas
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

  // Espaços soltos antes de sinais de pontuação ou parênteses
  res = res
    .replace(/\s+([,;:!?])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');

  return res;
}

export function cleanDescriptionText(desc?: string | null): string {
  if (!desc || typeof desc !== 'string') return '';
  // 1. Aplica a limpeza de quebras fonéticas e estruturais
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
