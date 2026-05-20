const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MIN_PRODUCT_IMAGE_WIDTH = 600;
export const MIN_PRODUCT_IMAGE_HEIGHT = 800;

/** Lê dimensões naturais do arquivo antes do upload (validação UX). */
export function measureImageFile(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('read_failed'));
    };
    img.src = url;
  });
}

export function resolveImageMime(file: File): (typeof ALLOWED_MIMES)[number] {
  if (ALLOWED_MIMES.includes(file.type as (typeof ALLOWED_MIMES)[number])) {
    return file.type as (typeof ALLOWED_MIMES)[number];
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/** Garante bytes em memória + mimetype aceito pelo Multer (evita File “morto” após await). */
export async function snapshotImageFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Arquivo vazio');
  }

  const type = resolveImageMime(file);
  const name =
    file.name?.trim() ||
    `imagem.${type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'}`;

  return new File([buffer], name, { type, lastModified: file.lastModified });
}
