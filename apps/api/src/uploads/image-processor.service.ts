import { Injectable } from '@nestjs/common';
import sharp = require('sharp');

const SIZES = {
  thumb: { width: 200, height: 200 },
  card: { width: 600, height: 800 },
  full: { width: 1200, height: 1600 },
} as const;

export type ImageSize = keyof typeof SIZES;

@Injectable()
export class ImageProcessorService {
  async processProductImage(input: Buffer): Promise<Record<ImageSize, Buffer>> {
    const results = {} as Record<ImageSize, Buffer>;

    for (const [size, dims] of Object.entries(SIZES)) {
      results[size as ImageSize] = await sharp(input)
        .resize(dims.width, dims.height, {
          fit: 'cover',
          position: 'attention',
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
    }

    return results;
  }

  async validateImage(
    input: Buffer,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const meta = await sharp(input).metadata();
      if (!meta.width || !meta.height) {
        return { valid: false, error: 'Imagem sem dimensões válidas' };
      }
      if (meta.width < 600 || meta.height < 800) {
        return {
          valid: false,
          error: 'Imagem deve ter no mínimo 600x800px',
        };
      }
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!meta.format || !allowedFormats.includes(meta.format)) {
        return {
          valid: false,
          error: `Formato não suportado: ${meta.format}`,
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Arquivo não é uma imagem válida' };
    }
  }
}
