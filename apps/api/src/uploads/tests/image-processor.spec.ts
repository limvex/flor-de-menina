import { Test } from '@nestjs/testing';
import { ImageProcessorService } from '../image-processor.service';
import sharp from 'sharp';

async function makeTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 150, b: 100 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe('ImageProcessorService', () => {
  let service: ImageProcessorService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ImageProcessorService],
    }).compile();
    service = module.get(ImageProcessorService);
  });

  describe('validateImage', () => {
    it('rejeita buffer que não é imagem', async () => {
      const result = await service.validateImage(Buffer.from('nao-e-imagem'));
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejeita imagem menor que 600x800', async () => {
      const small = await makeTestImage(400, 600);
      const result = await service.validateImage(small);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('600x800');
    });

    it('aceita JPEG com tamanho correto', async () => {
      const ok = await makeTestImage(800, 1200);
      const result = await service.validateImage(ok);
      expect(result.valid).toBe(true);
    });

    it('aceita PNG com tamanho correto', async () => {
      const png = await sharp({
        create: {
          width: 800,
          height: 1200,
          channels: 4,
          background: { r: 200, g: 150, b: 100, alpha: 1 },
        },
      })
        .png()
        .toBuffer();
      const result = await service.validateImage(png);
      expect(result.valid).toBe(true);
    });

    it('aceita WebP com tamanho correto', async () => {
      const webp = await sharp({
        create: {
          width: 800,
          height: 1200,
          channels: 3,
          background: { r: 200, g: 150, b: 100 },
        },
      })
        .webp()
        .toBuffer();
      const result = await service.validateImage(webp);
      expect(result.valid).toBe(true);
    });
  });

  describe('processProductImage', () => {
    let inputImage: Buffer;

    beforeAll(async () => {
      inputImage = await makeTestImage(1500, 2000);
    });

    it('retorna 3 buffers não vazios', async () => {
      const result = await service.processProductImage(inputImage);
      expect(result.thumb).toBeInstanceOf(Buffer);
      expect(result.card).toBeInstanceOf(Buffer);
      expect(result.full).toBeInstanceOf(Buffer);
      expect(result.thumb.length).toBeGreaterThan(0);
      expect(result.card.length).toBeGreaterThan(0);
      expect(result.full.length).toBeGreaterThan(0);
    });

    it('thumb tem dimensões 200x200', async () => {
      const result = await service.processProductImage(inputImage);
      const meta = await sharp(result.thumb).metadata();
      expect(meta.width).toBe(200);
      expect(meta.height).toBe(200);
    });

    it('card tem dimensões 600x800', async () => {
      const result = await service.processProductImage(inputImage);
      const meta = await sharp(result.card).metadata();
      expect(meta.width).toBe(600);
      expect(meta.height).toBe(800);
    });

    it('full tem dimensões 1200x1600', async () => {
      const result = await service.processProductImage(inputImage);
      const meta = await sharp(result.full).metadata();
      expect(meta.width).toBe(1200);
      expect(meta.height).toBe(1600);
    });

    it('todos os outputs são WebP', async () => {
      const result = await service.processProductImage(inputImage);
      for (const buf of [result.thumb, result.card, result.full]) {
        const meta = await sharp(buf).metadata();
        expect(meta.format).toBe('webp');
      }
    });
  });
});
