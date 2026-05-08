import { Injectable } from '@nestjs/common';
import { prisma, createId } from '@flor/database';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Injectable()
export class WishlistService {
  async getOrCreateWishlist(userId: string) {
    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { id: createId(), userId },
      });
    }
    return wishlist;
  }

  async list(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        product: {
          include: {
            images: { take: 2, orderBy: { position: 'asc' } },
            category: { select: { name: true, slug: true } },
            variants: { where: { isActive: true }, select: { stock: true } },
          },
        },
        variant: {
          select: { id: true, size: true, color: true, colorHex: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        totalStock: item.product.variants.reduce(
          (s: number, v: { stock: number }) => s + v.stock,
          0,
        ),
        primaryImage: item.product.images[0]?.url ?? null,
        secondaryImage: item.product.images[1]?.url ?? null,
      },
    }));
  }

  async add(userId: string, dto: AddToWishlistDto) {
    const wishlist = await this.getOrCreateWishlist(userId);

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });
    if (existing) return existing;

    return prisma.wishlistItem.create({
      data: {
        id: createId(),
        wishlistId: wishlist.id,
        productId: dto.productId,
        variantId: dto.variantId,
      },
    });
  }

  async remove(userId: string, productId: string, variantId?: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    return prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
        ...(variantId ? { variantId } : { variantId: null }),
      },
    });
  }

  async getProductIdsInWishlist(userId: string): Promise<string[]> {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) return [];

    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  }
}
