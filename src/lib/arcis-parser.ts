import { ConflitoArcis, RelatorioArcisMetadata, StatusConflitoArcis, PrioridadeArcis } from '@/types/arcis';

// Inicializador seguro do worker do PDF.js para ambientes Browser e Node.js (Vercel / Local)
async function ensurePdfWorkerInitialized() {
  if (typeof window !== 'undefined') {
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      }
    } catch (e) {
      console.warn('Aviso: Configuração de worker no browser:', e);
    }
    return;
  }

  // Ambiente Node.js (Servidor)
  if (typeof globalThis !== 'undefined' && !('pdfjsWorker' in globalThis)) {
    try {
      // @ts-expect-error - legacy worker import
      const worker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
      // @ts-expect-error - assign to globalThis for pdfjs-dist
      globalThis.pdfjsWorker = worker;
    } catch (e) {
      console.warn('Aviso: Carregamento direto de worker do pdfjs:', e);
    }
  }
}

function toCleanUint8Array(input: Buffer | Uint8Array | ArrayBuffer): Uint8Array {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  if (typeof Buffer !== 'undefined' && input instanceof Buffer) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

/**
 * Extração de páginas de PDF universal (Browser e Servidor).
 * - No browser: extrai diretamente no cliente sem limites de tamanho de payload da Vercel (4.5 MB).
 * - No servidor: utiliza o fake worker em loopback sem requisições de chunks.
 */
async function extractPdfPages(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<string[]> {
  await ensurePdfWorkerInitialized();

  const data = toCleanUint8Array(buffer);

  // Estratégia 1: pdfjs-dist direto (funciona no Browser e no Node.js)
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });

    const doc = await loadingTask.promise;
    const pages: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (typeof item === 'object' && item !== null && 'str' in item ? String((item as { str: unknown }).str) : ''))
        .join('\n');
      pages.push(pageText);
    }

    if (pages.length > 0) {
      return pages;
    }
  } catch (err) {
    console.warn('Extração via pdfjs-dist falhou, tentando alternativa:', err);
  }

  // Estratégia 2: Fallback via pdf-parse (apenas em ambiente Node.js / servidor)
  if (typeof window === 'undefined') {
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse(data);
      const res = await parser.getText();
      if (res && res.pages && res.pages.length > 0) {
        return res.pages.map((p) => p.text);
      }
    } catch (err) {
      console.error('Fallback com pdf-parse também falhou no servidor:', err);
    }
  }

  throw new Error('Não foi possível extrair páginas legíveis do arquivo PDF.');
}

export function cleanPdfText(text: string): string {
  return text
    // Cabeçalhos e Rótulos principais
    .replace(/T\s*otal/gi, 'Total')
    .replace(/S\s*erviços/gi, 'Serviços')
    .replace(/RS\s*C/gi, 'RSC')
    .replace(/Co\s*nf\s*lit\s*o/gi, 'Conflito')
    .replace(/No\s*rmat\s*ivo/gi, 'Normativo')
    .replace(/Edif\s*icação/gi, 'Edificação')
    .replace(/ES\s*CADA/gi, 'ESCADA')
    .replace(/D\s*ata\s+de\s+Criação/gi, 'Data de Criação')
    .replace(/D\s*t\.\s*últim\s*a\s+alte\s*ração/gi, 'Dt. última alteração')
    .replace(/T\s*ipo\s+Conflito/gi, 'Tipo Conflito')
    .replace(/D\s*isciplina\s+Principal/gi, 'Disciplina Principal')
    .replace(/D\s*isciplinas\s+Envo\s*lvidas/gi, 'Disciplinas Envolvidas')
    .replace(/D\s*e\s*scrição/gi, 'Descrição')
    .replace(/Prio\s*ridade/gi, 'Prioridade')
    .replace(/Pavim\s*e\s*nto/gi, 'Pavimento')
    .replace(/L\s*o\s*calização/gi, 'Localização')
    .replace(/L\s*o\s*cal\s+Edif\s*icação/gi, 'Local Edificação')
    .replace(/Análise\s+Crít\s*ica/gi, 'Análise Crítica')
    .replace(/No\s*rmal/gi, 'Normal')
    .replace(/PENTHOUS\s*E/gi, 'PENTHOUSE')
    // Normalizações de palavras com espaçamentos OCR
    .replace(/\bS\s+ER\b/gi, 'SER')
    .replace(/\bS\s+E\b/gi, 'SE')
    .replace(/\bS\s+AÍDA\b/gi, 'SAÍDA')
    .replace(/\bS\s+OMATÓRIO\b/gi, 'SOMATÓRIO')
    .replace(/\bDES\s+CARGA\b/gi, 'DESCARGA')
    .replace(/\bDES\s+S\s*A\b/gi, 'DESSA')
    .replace(/\bES\s+TACIONAMENTO\b/gi, 'ESTACIONAMENTO')
    .replace(/\bES\s+TRUTURAL\b/gi, 'ESTRUTURAL')
    .replace(/\bES\s+PECIFICADAS\b/gi, 'ESPECIFICADAS')
    .replace(/\bES\s+COAMENTO\b/gi, 'ESCOAMENTO')
    .replace(/\bPRES\s+ENTE\b/gi, 'PRESENTE')
    .replace(/\bRES\s+IS\s*TÊNCIA\b/gi, 'RESISTÊNCIA')
    .replace(/\bRES\s+PEITADO\b/gi, 'RESPEITADO')
    .replace(/\bPREVIS\s+TO\b/gi, 'PREVISTO')
    .replace(/\bPREVIS\s+TAS\b/gi, 'PREVISTAS')
    .replace(/\bPREVIS\s+TOS\b/gi, 'PREVISTOS')
    .replace(/\bNECES\s+S\s*IDADE\b/gi, 'NECESSIDADE')
    .replace(/\bDIMENS\s+IONAMENTO\b/gi, 'DIMENSIONAMENTO')
    .replace(/\bLEGIS\s+LAÇÃO\b/gi, 'LEGISLAÇÃO')
    .replace(/\bPROJ\s+ETO\b/gi, 'PROJETO')
    .replace(/\bCAS\s+O\b/gi, 'CASO')
    .replace(/\bJ\s+ANELA\b/gi, 'JANELA')
    .replace(/\bACES\s+S\s*OS\b/gi, 'ACESSOS')
    .replace(/\bRES\s+ERVATÓRIO\b/gi, 'RESERVATÓRIO');
}

export async function parseArcisPdfBuffer(buffer: Buffer | Uint8Array | ArrayBuffer, projetoId?: string): Promise<RelatorioArcisMetadata> {
  const pages = await extractPdfPages(buffer);

  if (!pages || pages.length === 0) {
    throw new Error('Não foi possível extrair páginas do PDF fornecido.');
  }

  // Página 1: Capa com informações gerais
  const coverText = cleanPdfText(pages[0]);
  
  // Extrair Cliente (ex: WCC CONSTRUTORA)
  const clienteMatch = coverText.match(/(WCC\s+CONSTRUTORA|[A-Z0-9\s]{3,30}(?:CONSTRUTORA|ENGENHARIA|INCORPORADORA))/i);
  const cliente = clienteMatch ? clienteMatch[1].trim() : 'WCC CONSTRUTORA';

  // Extrair Empreendimento (ex: ALTAMIRA 47)
  const obraMatch = coverText.match(/(?:WCC\s+CONSTRUTORA\s*\n\s*|Relatório\s+Serviços\s+de\s+Compatibilização\s+)([A-Z0-9\s_-]{3,40})/i);
  const empreendimento = obraMatch ? obraMatch[1].trim() : 'ALTAMIRA 47';

  // Extrair Data (ex: 16/08/2026)
  const dataMatch = coverText.match(/(\d{2}\/\d{2}\/\d{4})/);
  const dataRelatorio = dataMatch ? dataMatch[1] : new Date().toLocaleDateString('pt-BR');

  // Extrair Total de Conflitos (ex: 4)
  const totalMatch = coverText.match(/Total\s+de\s+Conflito\(s\):\s*(\d+)/i);
  const totalConflitos = totalMatch ? parseInt(totalMatch[1], 10) : pages.length - 1;

  const conflitos: ConflitoArcis[] = [];

  // Extrair páginas subsequentes (cada página representa 1 conflito)
  for (let i = 1; i < pages.length; i++) {
    const rawPage = cleanPdfText(pages[i]);

    const conflictMatch = rawPage.match(/Conflito\s*#\s*(\d+)\s*-\s*([^\n]+)/i);
    if (!conflictMatch) continue;

    const codigo = parseInt(conflictMatch[1], 10);
    const statusRaw = conflictMatch[2].trim();
    const statusArcis = normalizeStatusArcis(statusRaw);

    const getField = (label: string, nextLabels: string[]): string => {
      const regex = new RegExp(label + '\\s*\\n?([\\s\\S]*?)(?=(' + nextLabels.join('|') + '|$))', 'i');
      const m = rawPage.match(regex);
      return m ? m[1].trim() : '';
    };

    const prioridadeRaw = getField('Prioridade', ['Data de Criação', 'Dt. última alteração', 'Tipo Conflito']);
    const dataCriacao = getField('Data de Criação', ['Dt. última alteração', 'Tipo Conflito', 'Disciplina Principal']);
    const dtUltima = getField('Dt. última alteração', ['Tipo Conflito', 'Disciplina Principal']);
    const tipoConflito = getField('Tipo Conflito', ['Disciplina Principal', 'Disciplinas Envolvidas', 'Edificação']) || 'Conflito Normativo';
    const discPrincipal = getField('Disciplina Principal', ['Disciplinas Envolvidas', 'Edificação', 'Pavimento']) || 'ARQUITETURA';
    const discEnvolvidasRaw = getField('Disciplinas Envolvidas', ['Edificação', 'Pavimento', 'Localização', 'Local Edificação']);
    const edificacao = getField('Edificação', ['Pavimento', 'Local Edificação', 'Localização', 'Descrição']) || 'TORRE';
    const pavimentoRaw = getField('Pavimento', ['Local Edificação', 'Localização', 'Descrição']);
    const localEdificacao = getField('Local Edificação', ['Localização', 'Descrição']);
    const localizacao = getField('Localização', ['Descrição', 'Relatório Serviços']) || localEdificacao || '';
    const descricaoRaw = getField('Descrição', ['Relatório Serviços', 'Grupo ARCIS']);

    const pavimentosList = pavimentoRaw
      ? pavimentoRaw
          .split(/,|\n/)
          .map((p) => p.trim().replace(/\s+/g, ' '))
          .filter(Boolean)
      : [];

    const discEnvolvidas = discEnvolvidasRaw
      ? discEnvolvidasRaw
          .split(/,|\n/)
          .map((d) => d.trim())
          .filter(Boolean)
      : [];

    const prioridade: PrioridadeArcis =
      prioridadeRaw.toLowerCase().includes('alta') || prioridadeRaw.toLowerCase().includes('urgente')
        ? 'Alta'
        : prioridadeRaw.toLowerCase().includes('baixa')
        ? 'Baixa'
        : 'Normal';

    conflitos.push({
      id: `arcis-conf-${codigo}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projeto_id: projetoId || null,
      codigo_conflito: codigo,
      status_arcis: statusArcis,
      prioridade,
      tipo_conflito: tipoConflito.replace(/\s+/g, ' '),
      disciplina_principal: discPrincipal.replace(/\s+/g, ' ').toUpperCase(),
      disciplinas_envolvidas: discEnvolvidas.map((d) => d.replace(/\s+/g, ' ').toUpperCase()),
      edificacao: edificacao.replace(/\s+/g, ' ').toUpperCase(),
      pavimentos: pavimentosList,
      local_edificacao: localEdificacao ? localEdificacao.replace(/\s+/g, ' ') : null,
      localizacao: localizacao ? localizacao.replace(/\s+/g, ' ') : null,
      descricao: descricaoRaw.replace(/\s+/g, ' ').trim(),
      data_criacao_arcis: dataCriacao || null,
      data_ultima_alteracao: dtUltima || null,
      numero_relatorio: `RSC_${empreendimento.replace(/\s+/g, '_')}`,
      created_at: new Date().toISOString(),
    });
  }

  return {
    empresa: 'Grupo ARCIS - RSC',
    cliente,
    empreendimento,
    data_relatorio: dataRelatorio,
    total_conflitos: totalConflitos,
    conflitos,
  };
}

function normalizeStatusArcis(raw: string): StatusConflitoArcis {
  const lower = raw.toLowerCase();
  if (lower.includes('encerrado') || lower.includes('resolvido')) return 'Encerrado';
  if (lower.includes('aprovad')) return 'Solução Aprovada';
  if (lower.includes('aguardando aprova')) return 'Solução Aguardando Aprovação';
  if (lower.includes('portobello')) return 'Solução Proposta por Portobello';
  if (lower.includes('cliente')) return 'Solução Proposta por Cliente';
  if (lower.includes('projetista')) return 'Solução Proposta por Projetista';
  return 'Aguardando Solução';
}
