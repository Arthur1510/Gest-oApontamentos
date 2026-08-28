import { ConflitoArcis, RelatorioArcisMetadata, PrioridadeArcis } from '@/types/arcis';
import {
  parseDateToISO,
  normalizeStatusArcis,
  normalizePrioridadeArcis,
  normalizeTipoConflitoArcis,
  cleanArcisPdfText,
  cleanDescriptionText,
} from '@/lib/arcis-utils';
import { uploadImageToClashesBucket, isSupabaseConfigured } from '@/lib/supabase/client';

export async function convertCanvasToWebp(
  img: any,
  fileName: string
): Promise<{ file: File; dataUrl: string } | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !img) return null;

  return new Promise((resolve) => {
    try {
      let canvas: HTMLCanvasElement | null = null;

      // 1. ImageBitmap ou objeto contendo bitmap
      const isBitmap =
        (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) ||
        (img.bitmap && typeof ImageBitmap !== 'undefined' && img.bitmap instanceof ImageBitmap);

      if (isBitmap) {
        const bmp: ImageBitmap = img instanceof ImageBitmap ? img : img.bitmap;
        canvas = document.createElement('canvas');
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(bmp, 0, 0);
      } else if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
        // 2. Elemento Canvas
        canvas = img;
      } else if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
        // 3. Elemento Imagem DOM
        canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
      } else if (img.data && img.width && img.height) {
        // 3. Array de Pixels brutos (RGB / RGBA / Grayscale)
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        const imgData = ctx.createImageData(img.width, img.height);
        const dataLen = img.data.length;
        const expectedRgba = img.width * img.height * 4;
        const expectedRgb = img.width * img.height * 3;

        if (dataLen === expectedRgba) {
          imgData.data.set(img.data);
        } else if (dataLen === expectedRgb) {
          let srcIdx = 0;
          let dstIdx = 0;
          while (srcIdx < dataLen) {
            imgData.data[dstIdx] = img.data[srcIdx];
            imgData.data[dstIdx + 1] = img.data[srcIdx + 1];
            imgData.data[dstIdx + 2] = img.data[srcIdx + 2];
            imgData.data[dstIdx + 3] = 255;
            srcIdx += 3;
            dstIdx += 4;
          }
        } else {
          for (let i = 0; i < Math.min(dataLen, expectedRgba); i++) {
            imgData.data[i] = img.data[i];
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        resolve(null);
        return;
      }

      // Redimensiona mantendo proporção se for muito grande (>1920px) para máxima performance
      let finalCanvas = canvas;
      if (canvas.width > 1920 || canvas.height > 1920) {
        const scale = Math.min(1920 / canvas.width, 1920 / canvas.height);
        const scaledWidth = Math.round(canvas.width * scale);
        const scaledHeight = Math.round(canvas.height * scale);
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

      const dataUrl = finalCanvas.toDataURL('image/webp', 0.85);
      finalCanvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file: new File([], `${fileName}.webp`, { type: 'image/webp' }),
              dataUrl,
            });
            return;
          }
          const file = new File([blob], `${fileName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve({ file, dataUrl });
        },
        'image/webp',
        0.85
      );
    } catch (err) {
      console.warn('Erro ao processar imagem no Canvas:', err);
      resolve(null);
    }
  });
}

/**
 * Parser de PDF no Navegador (Client-Side).
 * Não tem limites de 4.5 MB da Vercel e extrai fotos técnicas compactadas em WebP diretamente para o Supabase Storage.
 */
export async function parseArcisPdfClientSide(
  file: File,
  projetoId?: string,
  onProgress?: (msg: string) => void
): Promise<RelatorioArcisMetadata> {
  onProgress?.('Carregando motor PDF no navegador...');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  onProgress?.('Lendo arquivo do relatório...');
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjs.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  if (numPages === 0) {
    throw new Error('O arquivo PDF está vazio ou corrompido.');
  }

  // 1. Extrair Capa (Página 1)
  onProgress?.('Extraindo informações da capa...');
  const page1 = await doc.getPage(1);
  const textContent1 = await page1.getTextContent();
  const coverRaw = textContent1.items
    .map((item) => (typeof item === 'object' && item !== null && 'str' in item ? String((item as { str: unknown }).str) : ''))
    .join('\n');
  const coverText = cleanArcisPdfText(coverRaw);

  const clienteMatch = coverText.match(/(WCC\s+CONSTRUTORA|[A-Z0-9\s]{3,30}(?:CONSTRUTORA|ENGENHARIA|INCORPORADORA))/i);
  const cliente = clienteMatch ? clienteMatch[1].trim() : 'WCC CONSTRUTORA';

  const obraMatch = coverText.match(/(?:WCC\s+CONSTRUTORA\s*\n\s*|Relatório\s+Serviços\s+de\s+Compatibilização\s+)([^\n\r]+?)(?=\s*(?:Total\s+de|\n|\r|$))/i);
  const empreendimento = obraMatch ? obraMatch[1].trim() : 'ALTAMIRA 47';

  const dataMatch = coverText.match(/(\d{2}\/\d{2}\/\d{4})/);
  const dataRelatorio = dataMatch ? dataMatch[1] : new Date().toLocaleDateString('pt-BR');

  const totalMatch = coverText.match(/Total\s+de\s+Conflito\(s\):\s*(\d+)/i);
  const totalConflitos = totalMatch ? parseInt(totalMatch[1], 10) : numPages - 1;

  const conflitos: ConflitoArcis[] = [];

  // 2. Extrair Conflitos e Fotos das páginas 2 em diante
  for (let i = 2; i <= numPages; i++) {
    onProgress?.(`Analisando prancha ${i} de ${numPages}...`);
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageRaw = textContent.items
      .map((item) => (typeof item === 'object' && item !== null && 'str' in item ? String((item as { str: unknown }).str) : ''))
      .join('\n');
    const rawPage = cleanArcisPdfText(pageRaw);

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
    const tipoConflitoRaw = getField('Tipo Conflito', ['Disciplina Principal', 'Disciplinas Envolvidas', 'Edificação']);
    const tipoConflito = normalizeTipoConflitoArcis(tipoConflitoRaw);
    const discPrincipalRaw = getField('Disciplina Principal', ['Disciplinas Envolvidas', 'Edificação', 'Pavimento']);
    const discPrincipal = discPrincipalRaw.toUpperCase().trim() || 'ARQUITETURA LEGAL';
    const discEnvolvidasRaw = getField('Disciplinas Envolvidas', ['Edificação', 'Pavimento', 'Localização', 'Local Edificação']);
    const edificacao = getField('Edificação', ['Pavimento', 'Local Edificação', 'Localização', 'Descrição']) || 'TORRE';
    const pavimentoRaw = getField('Pavimento', ['Local Edificação', 'Localização', 'Descrição']);
    const localEdificacao = getField('Local Edificação', ['Localização', 'Descrição']);
    const localizacao = getField('Localização', ['Descrição', 'Relatório Serviços']) || localEdificacao || '';
    const descricaoRaw = getField('Descrição', ['Relatório Serviços', 'Grupo ARCIS']);
    const descricao = cleanDescriptionText(descricaoRaw);

    const pavimentosList = pavimentoRaw
      ? pavimentoRaw.split(/,|\n/).map((p) => p.trim().replace(/\s+/g, ' ')).filter(Boolean)
      : [];

    const discEnvolvidas = discEnvolvidasRaw
      ? discEnvolvidasRaw.split(/,|\n/).map((d) => d.trim().toUpperCase()).filter(Boolean)
      : [];

    const prioridade: PrioridadeArcis = normalizePrioridadeArcis(prioridadeRaw);

    // Extrair imagem técnica via Canvas
    let imageUrl: string | null = null;
    let imageFile: File | null = null;

    try {
      const ops = await page.getOperatorList();
      for (let j = 0; j < ops.fnArray.length; j++) {
        if (
          ops.fnArray[j] === pdfjs.OPS.paintImageXObject ||
          ops.fnArray[j] === pdfjs.OPS.paintInlineImageXObject
        ) {
          const objId = ops.argsArray[j][0];
          const img = await new Promise<any>((resolve) => {
            const timer = setTimeout(() => resolve(null), 3500);
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

          const imgWidth = img?.width || (img?.bitmap ? img.bitmap.width : 0);
          const imgHeight = img?.height || (img?.bitmap ? img.bitmap.height : 0);

          if (img && (imgWidth > 80 || imgHeight > 80 || img.data)) {
            const res = await convertCanvasToWebp(img, `conflito_arcis_c${codigo}`);
            if (res && res.dataUrl) {
              imageFile = res.file;
              imageUrl = res.dataUrl;

              // Upload direto para o Supabase Storage se configurado
              if (isSupabaseConfigured()) {
                try {
                  const uploadedUrl = await uploadImageToClashesBucket(res.file);
                  if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                  }
                } catch (upErr) {
                  console.warn(`Upload imediato do conflito #${codigo} falhou, será mantido para confirmação:`, upErr);
                }
              }
              break;
            }
          }
        }
      }
    } catch (imgErr) {
      console.warn(`Erro na imagem do conflito #${codigo}:`, imgErr);
    }

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
      descricao: descricao,
      url_imagem: imageUrl,
      imagens: imageUrl ? [imageUrl] : [],
      tempImageFile: imageFile,
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
