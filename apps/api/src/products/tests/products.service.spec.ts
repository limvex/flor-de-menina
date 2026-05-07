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

  describe('getBySlug', () => {
    it('retorna 404 para produto inativo', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        isActive: false,
        deletedAt: null,
      });
      await expect(service.getBySlug('slug-inativo')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna 404 para produto deletado', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        isActive: true,
        deletedAt: new Date(),
      });
      await expect(service.getBySlug('slug-deletado')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna 404 para produto inexistente', async () => {
      (p.product.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getBySlug('nao-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna produto ativo', async () => {
      const prod = { id: 'p1', isActive: true, deletedAt: null, slug: 'ok' };
      (p.product.findUnique as jest.Mock).mockResolvedValue(prod);
      const result = await service.getBySlug('ok');
      expect(result.id).toBe('p1');
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
});
