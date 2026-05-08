import { Test } from '@nestjs/testing';
import { WishlistService } from '../wishlist.service';

jest.mock('@flor/database', () => {
  const mockPrisma = {
    wishlist: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    wishlistItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
    createId: () => 'generated-id',
  };
});

import { prisma } from '@flor/database';

const p = prisma as jest.Mocked<typeof prisma>;

describe('WishlistService', () => {
  let service: WishlistService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [WishlistService],
    }).compile();
    service = module.get(WishlistService);
  });

  describe('getOrCreateWishlist', () => {
    it('retorna wishlist existente sem criar nova', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });

      const result = await service.getOrCreateWishlist('u1');

      expect(result).toEqual({ id: 'w1', userId: 'u1' });
      expect(p.wishlist.create).not.toHaveBeenCalled();
    });

    it('cria wishlist quando não existe', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue(null);
      (p.wishlist.create as jest.Mock).mockResolvedValue({
        id: 'w2',
        userId: 'u2',
      });

      const result = await service.getOrCreateWishlist('u2');

      expect(result).toEqual({ id: 'w2', userId: 'u2' });
      expect(p.wishlist.create).toHaveBeenCalledWith({
        data: { id: 'generated-id', userId: 'u2' },
      });
    });
  });

  describe('add', () => {
    it('cria item novo na wishlist', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.findFirst as jest.Mock).mockResolvedValue(null);
      (p.wishlistItem.create as jest.Mock).mockResolvedValue({
        id: 'wi1',
        wishlistId: 'w1',
        productId: 'p1',
      });

      const result = await service.add('u1', { productId: 'p1' });

      expect(result.id).toBe('wi1');
      expect(p.wishlistItem.create).toHaveBeenCalled();
    });

    it('retorna item existente sem duplicar (idempotência)', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'wi-existing',
        wishlistId: 'w1',
        productId: 'p1',
      });

      const result = await service.add('u1', { productId: 'p1' });

      expect(result.id).toBe('wi-existing');
      expect(p.wishlistItem.create).not.toHaveBeenCalled();
    });

    it('aceita variantId opcional como null', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.findFirst as jest.Mock).mockResolvedValue(null);
      (p.wishlistItem.create as jest.Mock).mockResolvedValue({ id: 'wi1' });

      await service.add('u1', { productId: 'p1' });

      expect(p.wishlistItem.findFirst).toHaveBeenCalledWith({
        where: { wishlistId: 'w1', productId: 'p1', variantId: null },
      });
    });
  });

  describe('remove', () => {
    it('chama deleteMany com productId correto', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.remove('u1', 'p1');

      expect(p.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { wishlistId: 'w1', productId: 'p1', variantId: null },
      });
    });

    it('inclui variantId no where quando fornecido', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.remove('u1', 'p1', 'v1');

      expect(p.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { wishlistId: 'w1', productId: 'p1', variantId: 'v1' },
      });
    });

    it('usa variantId: null quando não fornecido', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.remove('u1', 'p1');

      expect(
        (p.wishlistItem.deleteMany as jest.Mock).mock.calls[0][0].where,
      ).toEqual({
        wishlistId: 'w1',
        productId: 'p1',
        variantId: null,
      });
    });
  });

  describe('getProductIdsInWishlist', () => {
    it('retorna array de IDs quando wishlist existe', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.findMany as jest.Mock).mockResolvedValue([
        { productId: 'p1' },
        { productId: 'p2' },
      ]);

      const result = await service.getProductIdsInWishlist('u1');

      expect(result).toEqual(['p1', 'p2']);
    });

    it('retorna array vazio quando wishlist não existe', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getProductIdsInWishlist('u1');

      expect(result).toEqual([]);
      expect(p.wishlistItem.findMany).not.toHaveBeenCalled();
    });

    it('retorna array vazio quando wishlist está vazia', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getProductIdsInWishlist('u1');

      expect(result).toEqual([]);
    });
  });

  describe('list', () => {
    it('mapeia totalStock e primaryImage/secondaryImage corretamente', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'wi1',
          createdAt: new Date('2026-05-01'),
          product: {
            images: [{ url: 'img-1' }, { url: 'img-2' }],
            variants: [{ stock: 2 }, { stock: 3 }],
          },
        },
      ]);

      const result = await service.list('u1');
      const first = result[0] as {
        product: {
          totalStock: number;
          primaryImage: string | null;
          secondaryImage: string | null;
        };
      };

      expect(first.product.totalStock).toBe(5);
      expect(first.product.primaryImage).toBe('img-1');
      expect(first.product.secondaryImage).toBe('img-2');
    });

    it('ordena por createdAt desc', async () => {
      (p.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 'w1',
        userId: 'u1',
      });
      (p.wishlistItem.findMany as jest.Mock).mockResolvedValue([]);

      await service.list('u1');

      expect(p.wishlistItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });
  });
});
