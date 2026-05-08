import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from '../products.service';

// Mock do módulo @flor/database
jest.mock('@flor/database', () => {
  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    productVariant: {
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    stockMovement: { create: jest.fn() },
    category: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  return {
    prisma: mockPrisma,
    createId: () => 'generated-id',
    Prisma: {},
    StockMovementType: { IN: 'IN', OUT: 'OUT', ADJUST: 'ADJUST' },
  };
});

import { prisma } from '@flor/database';

const p = prisma as jest.Mocked<typeof prisma>;

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('create', () => {
    it('gera slug único automaticamente', async () => {
      (p.product.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // slug check: não existe
        .mockResolvedValueOnce(null); // category check indireta
      (p.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat1' });
      (p.product.create as jest.Mock).mockResolvedValue({
        id: 'prod1',
        slug: 'vestido-midi',
        name: 'Vestido Midi',
      });

      await service.create({
        name: 'Vestido Midi',
        description: 'Descrição do vestido',
        basePrice: 199.9,
        categoryId: 'cat1',
      });

      expect(p.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'vestido-midi' }),
        }),
      );
    });

    it('adiciona sufixo numérico quando slug duplicado', async () => {
      (p.product.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'outro' }) // 'teste' existe
        .mockResolvedValueOnce({ id: 'outro2' }) // 'teste-2' existe
        .mockResolvedValueOnce(null) // 'teste-3' livre
        .mockResolvedValueOnce(null); // slug conflict check no create
      (p.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat1' });
      (p.product.create as jest.Mock).mockResolvedValue({
        id: 'p1',
        slug: 'teste-3',
      });

      await service.create({
        name: 'Teste',
        description: 'desc',
        basePrice: 10,
        categoryId: 'cat1',
      });

      expect(p.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'teste-3' }),
        }),
      );
    });

    it('lança ConflictException quando slug explícito já está em uso', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue({ id: 'outro' });
      (p.category.findUnique as jest.Mock).mockResolvedValue({ id: 'cat1' });

      await expect(
        service.create({
          name: 'Produto',
          slug: 'slug-existente',
          description: 'desc',
          basePrice: 10,
          categoryId: 'cat1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('seta deletedAt e isActive=false no banco', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
      (p.product.update as jest.Mock).mockResolvedValue({
        id: 'p1',
        deletedAt: new Date(),
      });

      await service.softDelete('p1');

      expect(p.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: expect.objectContaining({ isActive: false }),
      });
      expect(
        (p.product.update as jest.Mock).mock.calls[0][0].data.deletedAt,
      ).toBeDefined();
    });

    it('lança NotFoundException para produto inexistente', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.softDelete('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkSetActive', () => {
    it('chama updateMany com ids e active=true', async () => {
      (p.product.updateMany as jest.Mock).mockResolvedValue({ count: 3 });
      const result = await service.bulkSetActive(['a', 'b', 'c'], true);
      expect(p.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['a', 'b', 'c'] }, deletedAt: null },
        data: { isActive: true },
      });
      expect(result.updated).toBe(3);
    });
  });

  describe('list', () => {
    it('filtra por status=active', async () => {
      (p.product.findMany as jest.Mock).mockResolvedValue([]);
      (p.product.count as jest.Mock).mockResolvedValue(0);

      await service.list({ status: 'active' });

      expect(p.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('getBySlug', () => {
    const now = new Date('2026-05-09T00:00:00.000Z');

    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    function buildProduct(overrides: Partial<Record<string, unknown>> = {}) {
      return {
        id: 'p-main',
        slug: 'produto-main',
        name: 'Produto Main',
        isActive: true,
        deletedAt: null,
        categoryId: 'cat-1',
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        basePrice: '129.9',
        compareAtPrice: '179.9',
        variants: [
          {
            stock: 1,
            isActive: true,
            size: 'P',
            color: 'Preto',
            colorHex: '#000',
          },
          {
            stock: 1,
            isActive: true,
            size: 'M',
            color: 'Preto',
            colorHex: '#000',
          },
        ],
        images: [
          { cardUrl: 'img-1-card', url: 'img-1' },
          { cardUrl: 'img-2-card', url: 'img-2' },
        ],
        category: {
          id: 'cat-1',
          name: 'Bolsas',
          slug: 'bolsas',
          sizeChart: '<p>Tabela</p>',
        },
        ...overrides,
      };
    }

    function buildRelated(overrides: Partial<Record<string, unknown>> = {}) {
      return {
        id: 'p-related',
        slug: 'produto-related',
        name: 'Produto Related',
        createdAt: new Date('2026-05-03T00:00:00.000Z'),
        basePrice: '99.9',
        compareAtPrice: null,
        images: [
          { cardUrl: 'related-card-1', url: 'related-full-1' },
          { cardUrl: null, url: 'related-full-2' },
        ],
        variants: [
          { stock: 2, color: 'Azul', colorHex: '#00f' },
          { stock: 1, color: 'Azul', colorHex: '#00f' },
          { stock: 0, color: 'Verde', colorHex: '#0f0' },
        ],
        category: { name: 'Bolsas', slug: 'bolsas' },
        ...overrides,
      };
    }

    it('retorna produto com cálculos: totalStock, isOutOfStock, isLastPiece, isNew', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(buildProduct());
      (p.product.findMany as jest.Mock).mockResolvedValue([buildRelated()]);

      const result = await service.getBySlug('produto-main');

      expect(result.totalStock).toBe(2);
      expect(result.isOutOfStock).toBe(false);
      expect(result.isLastPiece).toBe(true);
      expect(result.isNew).toBe(true);
    });

    it('isOutOfStock = true quando totalStock = 0', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(
        buildProduct({ variants: [{ stock: 0 }, { stock: 0 }] }),
      );
      (p.product.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getBySlug('produto-main');
      expect(result.isOutOfStock).toBe(true);
    });

    it('isLastPiece = true quando stock entre 1 e 2', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(
        buildProduct({ variants: [{ stock: 2 }] }),
      );
      (p.product.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getBySlug('produto-main');
      expect(result.isLastPiece).toBe(true);
    });

    it('isLastPiece = false quando stock > 2', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(
        buildProduct({ variants: [{ stock: 3 }, { stock: 1 }] }),
      );
      (p.product.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getBySlug('produto-main');
      expect(result.isLastPiece).toBe(false);
    });

    it('isNew = true quando produto criado há menos de 30 dias', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(
        buildProduct({ createdAt: new Date('2026-04-20T00:00:00.000Z') }),
      );
      (p.product.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getBySlug('produto-main');
      expect(result.isNew).toBe(true);
    });

    it('isNew = false quando produto criado há mais de 30 dias', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(
        buildProduct({ createdAt: new Date('2026-03-20T00:00:00.000Z') }),
      );
      (p.product.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getBySlug('produto-main');
      expect(result.isNew).toBe(false);
    });

    it('lança NotFoundException quando produto não encontrado', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getBySlug('nao-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança NotFoundException quando produto tem deletedAt', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(
        buildProduct({ deletedAt: new Date() }),
      );

      await expect(service.getBySlug('deletado')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança NotFoundException quando isActive = false', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(
        buildProduct({ isActive: false }),
      );

      await expect(service.getBySlug('inativo')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna relatedProducts com primaryImage, secondaryImage, availableColors, totalStock', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(buildProduct());
      (p.product.findMany as jest.Mock).mockResolvedValue([buildRelated()]);

      const result = await service.getBySlug('produto-main');
      const related = result.relatedProducts[0];

      expect(related.primaryImage).toBe('related-card-1');
      expect(related.secondaryImage).toBe('related-full-2');
      expect(related.availableColors).toEqual([
        { name: 'Azul', hex: '#00f' },
        { name: 'Verde', hex: '#0f0' },
      ]);
      expect(related.totalStock).toBe(3);
    });

    it('relatedProducts: availableColors agrupa por cor (sem duplicatas)', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(buildProduct());
      (p.product.findMany as jest.Mock).mockResolvedValue([
        buildRelated({
          variants: [
            { stock: 1, color: 'Preto', colorHex: '#000' },
            { stock: 2, color: 'Preto', colorHex: '#000' },
            { stock: 2, color: 'Branco', colorHex: '#fff' },
          ],
        }),
      ]);

      const result = await service.getBySlug('produto-main');
      expect(result.relatedProducts[0].availableColors).toEqual([
        { name: 'Preto', hex: '#000' },
        { name: 'Branco', hex: '#fff' },
      ]);
    });

    it('basePrice e compareAtPrice são convertidos para Number', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(buildProduct());
      (p.product.findMany as jest.Mock).mockResolvedValue([buildRelated()]);

      const result = await service.getBySlug('produto-main');

      expect(typeof result.basePrice).toBe('number');
      expect(typeof result.compareAtPrice).toBe('number');
      expect(typeof result.relatedProducts[0].basePrice).toBe('number');
      expect(result.relatedProducts[0].compareAtPrice).toBeNull();
    });
  });
});
