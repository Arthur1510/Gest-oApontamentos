/**
 * Utilitário de Otimização e Compressão de Imagens no Navegador (Client-Side)
 * 
 * Converte prints pesados de BIM/CAD (PNGs de 5MB-15MB) em formato WebP de alta fidelidade (100KB-300KB),
 * reduzindo o consumo de espaço no Supabase Storage em até 95% mantendo nitidez para linhas, modelos 3D e textos.
 */

export interface CompressionOptions {
  /** Largura máxima permitida em pixels (padrão: 1920 - Full HD) */
  maxWidth?: number;
  /** Altura máxima permitida em pixels (padrão: 1920) */
  maxHeight?: number;
  /** Qualidade de compressão de 0 a 1 (padrão: 0.82) */
  quality?: number;
  /** Formato de saída preferencial (padrão: 'image/webp') */
  format?: 'image/webp' | 'image/jpeg';
}

/**
 * Comprime e converte uma imagem no navegador antes do upload para o Supabase.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    format = 'image/webp',
  } = options;

  // Se não estiver no ambiente de navegador ou se não for imagem
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  // SVGs e GIFs mantêm formato original
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      let needsResize = false;
      if (width > maxWidth || height > maxHeight) {
        needsResize = true;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
      }

      // Cria canvas para renderização em alta fidelidade
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Configuração para interpolação suave de linhas e detalhes finos
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Desenha imagem com fundo branco (caso haja transparência ao converter)
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Exporta em WebP ou JPEG de alta qualidade
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Se o arquivo resultante for maior (muito raro em PNGs), mantém original
          if (blob.size >= file.size && !needsResize && file.type === 'image/webp') {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const extension = format === 'image/webp' ? 'webp' : 'jpg';
          const newFileName = `${baseName}.${extension}`;

          const optimizedFile = new File([blob], newFileName, {
            type: format,
            lastModified: Date.now(),
          });

          console.log(
            `[WCC Optimizer] ${file.name} (${(file.size / 1024).toFixed(1)} KB) -> ${(optimizedFile.size / 1024).toFixed(1)} KB (Economia de ${(((file.size - optimizedFile.size) / file.size) * 100).toFixed(0)}%)`
          );

          resolve(optimizedFile);
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Formata bytes em formato legível (ex: 2.4 MB, 180 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Gira uma imagem (File ou URL) em 90 graus no sentido horário no navegador,
 * ajustando proporções e re-otimizando para WebP.
 */
export async function rotateImageFile(file: File, degrees: number = 90): Promise<File> {
  if (typeof window === 'undefined') return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const rads = (degrees * Math.PI) / 180;
      const is90or270 = Math.abs(degrees % 180) === 90;

      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = is90or270 ? origHeight : origWidth;
      canvas.height = is90or270 ? origWidth : origHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Move a origem para o centro e gira
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -origWidth / 2, -origHeight / 2);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/_rot\d+$/, '');
          const newFileName = `${baseName}_rot${Date.now().toString().slice(-4)}.webp`;

          const rotatedFile = new File([blob], newFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(rotatedFile);
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Gira uma URL ou base64 de imagem em 90 graus e retorna nova dataUrl WebP.
 */
export async function rotateImageUrl(imageUrl: string, degrees: number = 90): Promise<string> {
  if (typeof window === 'undefined') return imageUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const rads = (degrees * Math.PI) / 180;
      const is90or270 = Math.abs(degrees % 180) === 90;

      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = is90or270 ? origHeight : origWidth;
      canvas.height = is90or270 ? origWidth : origHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rads);
      ctx.drawImage(img, -origWidth / 2, -origHeight / 2);

      const rotatedDataUrl = canvas.toDataURL('image/webp', 0.85);
      resolve(rotatedDataUrl);
    };

    img.onerror = () => {
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

