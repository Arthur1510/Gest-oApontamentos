import { ConflitoArcis, RelatorioArcisMetadata, StatusConflitoArcis, PrioridadeArcis } from '@/types/arcis';
import { parseDateToISO, formatDateBR, normalizeStatusArcis } from '@/lib/arcis-utils';

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

export interface ExtractedPdfPage {
  text: string;
  imageFile?: File | null;
  imageUrl?: string | null;
}

/**
 * Converte dados de imagem brutos do PDF (RGB/RGBA) para WebP otimizado no navegador via Canvas.
 */
export async function convertPdfImageToWebp(
  img: { width: number; height: number; kind: number; data: Uint8Array | Uint8ClampedArray },
  fileName: string
): Promise<{ file: File; dataUrl: string } | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const imgData = ctx.createImageData(img.width, img.height);
      const src = img.data;
      const dst = imgData.data;

      if (img.kind === 2) {
        // RGB_24BPP (3 bytes por pixel) -> RGBA (4 bytes)
        let j = 0;
        for (let i = 0; i < src.length; i += 3) {
          dst[j] = src[i];
          dst[j + 1] = src[i + 1];
          dst[j + 2] = src[i + 2];
          dst[j + 3] = 255;
          j += 4;
        }
      } else if (img.kind === 3 || src.length === img.width * img.height * 4) {
        // RGBA_32BPP
        dst.set(src);
      } else if (img.kind === 1) {
        // GRAYSCALE_1BPP
        let j = 0;
        for (let i = 0; i < src.length; i++) {
          dst[j] = src[i];
          dst[j + 1] = src[i];
          dst[j + 2] = src[i];
          dst[j + 3] = 255;
          j += 4;
        }
      } else {
        dst.set(src.subarray(0, dst.length));
      }

      ctx.putImageData(imgData, 0, 0);

      // Redimensionar suavemente se for excessivamente grande (> 1920px) mantendo resolução Full HD e nitidez
      let finalCanvas = canvas;
      if (img.width > 1920 || img.height > 1920) {
        const scale = Math.min(1920 / img.width, 1920 / img.height);
        const scaledWidth = Math.round(img.width * scale);
        const scaledHeight = Math.round(img.height * scale);
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = scaledWidth;
        resizedCanvas.height = scaledHeight;
        const rCtx = resizedCanvas.getContext('2d');
        if (rCtx) {
          rCtx.imageSmoothingEnabled = true;
          rCtx.imageSmoothingQuality = 'high';
          rCtx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
          finalCanvas = resizedCanvas;
        }
      }

      const dataUrl = finalCanvas.toDataURL('image/webp', 0.82);

      finalCanvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], `${fileName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve({ file, dataUrl });
        },
        'image/webp',
        0.82
      );
    } catch (err) {
      console.warn('Erro ao processar imagem do PDF para WebP:', err);
      resolve(null);
    }
  });
}

async function uploadWebpBufferToSupabase(buffer: Buffer, fileNamePrefix: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const fileName = `uploads/${Date.now()}_${fileNamePrefix}_${Math.random().toString(36).substring(2, 8)}.webp`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/clashes/${fileName}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'image/webp',
        'cache-control': '31536000',
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    });

    if (res.ok) {
      return `${supabaseUrl}/storage/v1/object/public/clashes/${fileName}`;
    }
  } catch (err) {
    console.warn('Erro no upload para o Supabase Storage via servidor:', err);
  }
  return null;
}

async function processServerPdfImage(
  img: { width: number; height: number; kind: number; data: Uint8Array | Uint8ClampedArray },
  fileNamePrefix: string
): Promise<{ imageUrl: string } | null> {
  try {
    const sharp = (await import('sharp')).default;
    const expectedChannels = Math.round(img.data.length / (img.width * img.height));
    const channels = (expectedChannels === 1 || expectedChannels === 3 || expectedChannels === 4)
      ? (expectedChannels as 1 | 3 | 4)
      : (img.kind === 2 ? 3 : 4);

    let sharpInstance = sharp(Buffer.from(img.data), {
      raw: {
        width: img.width,
        height: img.height,
        channels: channels,
      },
    });

    if (img.width > 1920 || img.height > 1920) {
      sharpInstance = sharpInstance.resize(1920, 1920, { fit: 'inside' });
    }

    const webpBuffer = await sharpInstance.webp({ quality: 82 }).toBuffer();

    // 1. Tentar upload direto no bucket 'clashes' do Supabase Storage
    const uploadedUrl = await uploadWebpBufferToSupabase(webpBuffer, fileNamePrefix);
    if (uploadedUrl) {
      return { imageUrl: uploadedUrl };
    }

    // 2. Fallback para base64 WebP
    return { imageUrl: `data:image/webp;base64,${webpBuffer.toString('base64')}` };
  } catch (err) {
    console.warn('Erro ao processar imagem no servidor com sharp:', err);
    return null;
  }
}

/**
 * Extração de páginas e imagens de PDF universal (Browser e Servidor).
 * - No browser: extrai texto e imagens WebP diretamente no cliente via Canvas.
 * - No servidor: extrai texto e comprime imagens WebP via Sharp enviando para Supabase Storage.
 */
async function extractPdfPages(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<ExtractedPdfPage[]> {
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
    const pages: ExtractedPdfPage[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (typeof item === 'object' && item !== null && 'str' in item ? String((item as { str: unknown }).str) : ''))
        .join('\n');

      let imageFile: File | null = null;
      let imageUrl: string | null = null;

      // Extração de imagens técnicas de conflitos (suporta Servidor com Sharp e Navegador com Canvas)
      if (i > 1) {
        try {
          const ops = await page.getOperatorList();
          for (let j = 0; j < ops.fnArray.length; j++) {
            if (ops.fnArray[j] === pdfjs.OPS.paintImageXObject) {
              const objId = ops.argsArray[j][0];
              const img = await new Promise<any>((resolve) => {
                const timer = setTimeout(() => resolve(null), 2500);
                try {
                  if (page.objs.has(objId)) {
                    clearTimeout(timer);
                    resolve(page.objs.get(objId));
                    return;
                  }
                  page.objs.get(objId, (imgData: any) => {
                    clearTimeout(timer);
                    resolve(imgData);
                  });
                } catch {
                  clearTimeout(timer);
                  resolve(null);
                }
              });

              if (img && img.width > 120 && img.height > 120 && img.data) {
                if (typeof window === 'undefined') {
                  // Ambiente Node.js (Servidor / API Route) -> Sharp + Supabase Storage
                  const sRes = await processServerPdfImage(img, `conflito_arcis_p${i}`);
                  if (sRes) {
                    imageUrl = sRes.imageUrl;
                    break;
                  }
                } else {
                  // Ambiente Browser (Navegador) -> Canvas WebP
                  const cRes = await convertPdfImageToWebp(img, `conflito_arcis_p${i}`);
                  if (cRes) {
                    imageFile = cRes.file;
                    imageUrl = cRes.dataUrl;
                    break;
                  }
                }
              }
            }
          }
        } catch (imgErr) {
          console.warn(`Aviso na extração de imagem da prancha ${i}:`, imgErr);
        }
      }

      pages.push({ text: pageText, imageFile, imageUrl });
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
        return res.pages.map((p) => ({ text: p.text }));
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
  const coverText = cleanPdfText(pages[0].text);
  
  // Extrair Cliente (ex: WCC CONSTRUTORA)
  const clienteMatch = coverText.match(/(WCC\s+CONSTRUTORA|[A-Z0-9\s]{3,30}(?:CONSTRUTORA|ENGENHARIA|INCORPORADORA))/i);
  const cliente = clienteMatch ? clienteMatch[1].trim() : 'WCC CONSTRUTORA';

  // Extrair Empreendimento (ex: ALTAMIRA 47)
  const obraMatch = coverText.match(/(?:WCC\s+CONSTRUTORA\s*\n\s*|Relatório\s+Serviços\s+de\s+Compatibilização\s+)([^\n\r]+?)(?=\s*(?:Total\s+de|\n|\r|$))/i);
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
    const rawPage = cleanPdfText(pages[i].text);

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

    const cleanStr = (val: string | null | undefined, maxLen: number, fallback = ''): string => {
      if (!val) return fallback;
      return val.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
    };

    conflitos.push({
      id: `arcis-conf-${codigo}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projeto_id: projetoId || null,
      codigo_conflito: codigo,
      status_arcis: cleanStr(statusArcis, 80, 'Aguardando Solução') as any,
      prioridade: cleanStr(prioridade, 30, 'Normal') as any,
      tipo_conflito: cleanStr(tipoConflito, 100, 'Conflito Normativo'),
      disciplina_principal: cleanStr(discPrincipal, 100, 'ARQUITETURA').toUpperCase(),
      disciplinas_envolvidas: discEnvolvidas.map((d) => cleanStr(d, 100).toUpperCase()).filter(Boolean),
      edificacao: cleanStr(edificacao, 100, 'TORRE').toUpperCase(),
      pavimentos: pavimentosList,
      local_edificacao: localEdificacao ? cleanStr(localEdificacao, 255) : null,
      localizacao: localizacao ? cleanStr(localizacao, 255) : null,
      descricao: descricaoRaw.replace(/\s+/g, ' ').trim(),
      url_imagem: pages[i].imageUrl || null,
      imagens: pages[i].imageUrl ? [pages[i].imageUrl as string] : [],
      tempImageFile: pages[i].imageFile || null,
      data_criacao_arcis: parseDateToISO(dataCriacao),
      data_ultima_alteracao: parseDateToISO(dtUltima) || parseDateToISO(dataCriacao),
      numero_relatorio: cleanStr(`RSC_${empreendimento.replace(/\s+/g, '_')}`, 50, 'RSC_ARCIS'),
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

export { parseDateToISO, formatDateBR, normalizeStatusArcis } from '@/lib/arcis-utils';
