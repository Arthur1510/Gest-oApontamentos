import { ConflitoArcis, RelatorioArcisMetadata, PrioridadeArcis } from '@/types/arcis';
import { parseDateToISO, normalizeStatusArcis } from '@/lib/arcis-utils';
import { uploadImageToClashesBucket, isSupabaseConfigured } from '@/lib/supabase/client';

export async function convertCanvasToWebp(
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
        // RGB (3 bytes) -> RGBA (4 bytes)
        let j = 0;
        for (let i = 0; i < src.length; i += 3) {
          dst[j] = src[i];
          dst[j + 1] = src[i + 1];
          dst[j + 2] = src[i + 2];
          dst[j + 3] = 255;
          j += 4;
        }
      } else if (img.kind === 3 || src.length === img.width * img.height * 4) {
        dst.set(src);
      } else if (img.kind === 1) {
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

      // Redimensionar suavemente se for excessivamente grande (> 1920px) mantendo resolução Full HD
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
      console.warn('Erro ao processar imagem no Canvas:', err);
      resolve(null);
    }
  });
}

function cleanPdfText(text: string): string {
  return text
    .replace(/T\s*otal/gi, 'Total')
    .replace(/S\s*erviços/gi, 'Serviços')
    .replace(/C\s*onflito/gi, 'Conflito')
    .replace(/D\s*isciplina\s+Principal/gi, 'Disciplina Principal')
    .replace(/D\s*isciplinas\s+Envo\s*lvidas/gi, 'Disciplinas Envolvidas')
    .replace(/D\s*e\s*scrição/gi, 'Descrição')
    .replace(/Prio\s*ridade/gi, 'Prioridade')
    .replace(/Pavim\s*e\s*nto/gi, 'Pavimento')
    .replace(/L\s*o\s*calização/gi, 'Localização')
    .replace(/L\s*o\s*cal\s+Edif\s*icação/gi, 'Local Edificação')
    .replace(/Análise\s+Crít\s*ica/gi, 'Análise Crítica')
    .replace(/No\s*rmal/gi, 'Normal')
    .replace(/PENTHOUS\s*E/gi, 'PENTHOUSE');
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
  const coverText = cleanPdfText(coverRaw);

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
    const rawPage = cleanPdfText(pageRaw);

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
      ? pavimentoRaw.split(/,|\n/).map((p) => p.trim().replace(/\s+/g, ' ')).filter(Boolean)
      : [];

    const discEnvolvidas = discEnvolvidasRaw
      ? discEnvolvidasRaw.split(/,|\n/).map((d) => d.trim()).filter(Boolean)
      : [];

    const prioridade: PrioridadeArcis =
      prioridadeRaw.toLowerCase().includes('alta') || prioridadeRaw.toLowerCase().includes('urgente')
        ? 'Alta'
        : prioridadeRaw.toLowerCase().includes('baixa')
        ? 'Baixa'
        : 'Normal';

    // Extrair imagem técnica via Canvas
    let imageUrl: string | null = null;
    let imageFile: File | null = null;

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
            const res = await convertCanvasToWebp(img, `conflito_arcis_c${codigo}`);
            if (res) {
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
      url_imagem: imageUrl,
      imagens: imageUrl ? [imageUrl] : [],
      tempImageFile: imageFile,
      data_criacao_arcis: parseDateToISO(dataCriacao),
      data_ultima_alteracao: parseDateToISO(dtUltima) || parseDateToISO(dataCriacao),
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
