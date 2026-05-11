import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, createId } from '@flor/database';
import type { PrismaClient } from '@flor/database';
import { CART_RESERVATION_MINUTES } from '@flor/types';
import type {
  CartResponse,
  CartItemResponse,
  CouponValidationResult,
} from '@flor/types';
import type { AddItemDto } from './dto/add-item.dto';
import type { UpdateItemDto } from './dto/update-item.dto';
import type { MergeCartDto } from './dto/merge-cart.dto';
import { CouponsService } from '../coupons/coupons.service';

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

function reservedUntilDate(): Date {
  return new Date(Date.now() + CART_RESERVATION_MINUTES * 60 * 1000);
}

function buildVariantLabel(size: string | null, color: string | null): string {
  const parts = [size, color].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : 'Padrão';
}

@Injectable()
export class CartService {
  constructor(private readonly couponsService: CouponsService) {}

  async getAvailableStock(
    variantId: string,
    excludeCartId?: string,
    tx?: Tx,
  ): Promise<number> {
    const db = tx ?? prisma;
    const now = new Date();

    const [variant, reserved] = await Promise.all([
      db.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true },
      }),
      db.cartItem.aggregate({
        where: {
          variantId,
          reservedUntil: { gt: now },
          ...(excludeCartId ? { cartId: { not: excludeCartId } } : {}),
        },
        _sum: { quantity: true },
      }),
    ]);

    if (!variant) throw new NotFoundException('Variante não encontrada');
    return variant.stock - (reserved._sum.quantity ?? 0);
  }

  async getOrCreateCart(userId: string): Promise<{ id: string }> {
    const existing = await prisma.cart.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (existing) return existing;

    return prisma.cart.create({
      data: { id: createId(), userId },
      select: { id: true },
    });
  }

  async getCart(userId: string): Promise<CartResponse> {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      select: {
        id: true,
        couponCode: true,
        items: {
          select: {
            id: true,
            variantId: true,
            quantity: true,
            reservedUntil: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                categoryId: true,
                images: {
                  select: { cardUrl: true, url: true },
                  orderBy: { position: 'asc' },
                  take: 1,
                },
              },
            },
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                price: true,
                product: { select: { basePrice: true, compareAtPrice: true } },
              },
            },
          },
        },
      },
    });

    const storeSettings = await prisma.storeSettings.findFirst({
      select: { freeShippingGlobalThreshold: true },
    });
    const freeShippingThreshold =
      storeSettings?.freeShippingGlobalThreshold != null
        ? storeSettings.freeShippingGlobalThreshold.toNumber()
        : null;

    if (!cart) {
      const newCart = await this.getOrCreateCart(userId);
      return this.buildCartResponse(
        { id: newCart.id, items: [], couponCode: null },
        freeShippingThreshold,
        null,
      );
    }

    const itemsWithStock = await Promise.all(
      cart.items.map(async (item) => {
        const available = await this.getAvailableStock(item.variantId, cart.id);
        return { ...item, availableStock: available };
      }),
    );

    // Validate coupon if one is stored
    let couponValidation: CouponValidationResult | null = null;
    if (cart.couponCode) {
      const subtotal = itemsWithStock.reduce((sum, item) => {
        const basePrice = item.variant.product.basePrice.toNumber();
        const rawVariantPrice = item.variant.price?.toNumber() ?? null;
        const price =
          rawVariantPrice != null && rawVariantPrice > 0
            ? rawVariantPrice
            : basePrice;
        return sum + price * item.quantity;
      }, 0);

      couponValidation = await this.couponsService.validate({
        code: cart.couponCode,
        subtotal,
        items: itemsWithStock.map((item) => {
          const basePrice = item.variant.product.basePrice.toNumber();
          const rawVariantPrice = item.variant.price?.toNumber() ?? null;
          const price =
            rawVariantPrice != null && rawVariantPrice > 0
              ? rawVariantPrice
              : basePrice;
          return {
            variantId: item.variantId,
            quantity: item.quantity,
            price,
            categoryId: item.product.categoryId ?? '',
          };
        }),
      });
    }

    return this.buildCartResponse(
      { ...cart, items: itemsWithStock, couponCode: cart.couponCode },
      freeShippingThreshold,
      couponValidation,
    );
  }

  private buildCartResponse(
    cart: {
      id: string;
      couponCode?: string | null;
      items: Array<{
        id: string;
        variantId: string;
        quantity: number;
        reservedUntil: Date | null;
        availableStock?: number;
        product: {
          id: string;
          name: string;
          slug: string;
          images: Array<{ cardUrl: string | null; url: string }>;
        };
        variant: {
          id: string;
          size: string | null;
          color: string | null;
          price: { toNumber(): number } | null;
          product: {
            basePrice: { toNumber(): number };
            compareAtPrice: { toNumber(): number } | null;
          };
        };
      }>;
    },
    freeShippingThreshold: number | null,
    couponValidation: CouponValidationResult | null,
  ): CartResponse {
    const items: CartItemResponse[] = cart.items.map((item) => {
      const basePrice = item.variant.product.basePrice.toNumber();
      const rawVariantPrice = item.variant.price?.toNumber() ?? null;
      const variantPrice =
        rawVariantPrice != null && rawVariantPrice > 0
          ? rawVariantPrice
          : basePrice;
      const compareAt = item.variant.product.compareAtPrice?.toNumber() ?? null;

      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        reservedUntil: item.reservedUntil?.toISOString() ?? null,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image:
            item.product.images[0]?.cardUrl ??
            item.product.images[0]?.url ??
            '',
        },
        variant: {
          id: item.variant.id,
          size: item.variant.size,
          color: item.variant.color,
          label: buildVariantLabel(item.variant.size, item.variant.color),
          price: variantPrice,
          compareAtPrice: compareAt,
        },
        availableStock: item.availableStock ?? 0,
      };
    });

    const subtotal = items.reduce(
      (sum, i) => sum + i.variant.price * i.quantity,
      0,
    );
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const now = new Date();
    const futureExpiries = items
      .map((i) => (i.reservedUntil ? new Date(i.reservedUntil) : null))
      .filter((d): d is Date => d !== null && d > now)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      id: cart.id,
      items,
      subtotal,
      itemCount,
      nextExpiry: futureExpiries[0]?.toISOString() ?? null,
      freeShippingThreshold,
      freeShippingRemaining:
        freeShippingThreshold == null
          ? null
          : Math.max(0, freeShippingThreshold - subtotal),
      couponCode: cart.couponCode ?? null,
      couponValidation,
    };
  }

  async addItem(userId: string, dto: AddItemDto): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId);

    await prisma.$transaction(async (tx) => {
      // Bloqueia a linha da variante para evitar race condition
      const rows = await tx.$queryRaw<{ id: string; stock: number }[]>`
        SELECT id, stock FROM "ProductVariant" WHERE id = ${dto.variantId} FOR UPDATE
      `;
      if (!rows[0]) throw new NotFoundException('Variante não encontrada');

      const available = await this.getAvailableStock(
        dto.variantId,
        cart.id,
        tx,
      );

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: { cartId: cart.id, variantId: dto.variantId },
        },
        select: { id: true, quantity: true, productId: true },
      });

      const newQty = (existing?.quantity ?? 0) + dto.quantity;
      if (newQty > available + (existing?.quantity ?? 0)) {
        const realAvailable = available + (existing?.quantity ?? 0);
        throw new ConflictException({
          message: `Apenas ${realAvailable} unidade(s) disponível(is)`,
          available: realAvailable,
        });
      }

      if (newQty > available) {
        throw new ConflictException({
          message: `Apenas ${available} unidade(s) disponível(is)`,
          available,
        });
      }

      const product = await tx.product.findFirst({
        where: { variants: { some: { id: dto.variantId } } },
        select: { id: true },
      });
      if (!product) throw new NotFoundException('Produto não encontrado');

      await tx.cartItem.upsert({
        where: {
          cartId_variantId: { cartId: cart.id, variantId: dto.variantId },
        },
        create: {
          id: createId(),
          cartId: cart.id,
          productId: product.id,
          variantId: dto.variantId,
          quantity: dto.quantity,
          reservedUntil: reservedUntilDate(),
        },
        update: {
          quantity: newQty,
          reservedUntil: reservedUntilDate(),
        },
      });
    });

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    variantId: string,
    dto: UpdateItemDto,
  ): Promise<CartResponse> {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!cart) throw new NotFoundException('Carrinho não encontrado');

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "ProductVariant" WHERE id = ${variantId} FOR UPDATE
      `;

      const available = await this.getAvailableStock(variantId, cart.id, tx);

      if (dto.quantity > available) {
        throw new ConflictException({
          message: `Apenas ${available} unidade(s) disponível(is)`,
          available,
        });
      }

      const updated = await tx.cartItem.updateMany({
        where: { cartId: cart.id, variantId },
        data: { quantity: dto.quantity, reservedUntil: reservedUntilDate() },
      });

      if (updated.count === 0)
        throw new NotFoundException('Item não encontrado no carrinho');
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, variantId: string): Promise<CartResponse> {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!cart) throw new NotFoundException('Carrinho não encontrado');

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string, tx?: Tx): Promise<void> {
    const db = tx ?? prisma;

    const cart = await db.cart.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!cart) return;
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  async mergeCart(userId: string, dto: MergeCartDto) {
    const cart = await this.getOrCreateCart(userId);
    const discarded: Array<{
      variantId: string;
      reason: 'out_of_stock' | 'capped';
    }> = [];

    await prisma.$transaction(async (tx) => {
      for (const incoming of dto.items) {
        const available = await this.getAvailableStock(
          incoming.variantId,
          cart.id,
          tx,
        );

        if (available <= 0) {
          discarded.push({
            variantId: incoming.variantId,
            reason: 'out_of_stock',
          });
          continue;
        }

        const existing = await tx.cartItem.findUnique({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId: incoming.variantId,
            },
          },
          select: { id: true, quantity: true, productId: true },
        });

        let finalQty = (existing?.quantity ?? 0) + incoming.quantity;
        const wasCapped = finalQty > available;
        if (wasCapped) {
          finalQty = available;
          discarded.push({ variantId: incoming.variantId, reason: 'capped' });
        }

        const product = existing
          ? { id: existing.productId }
          : await tx.product.findFirst({
              where: { variants: { some: { id: incoming.variantId } } },
              select: { id: true },
            });

        if (!product) continue;

        await tx.cartItem.upsert({
          where: {
            cartId_variantId: {
              cartId: cart.id,
              variantId: incoming.variantId,
            },
          },
          create: {
            id: createId(),
            cartId: cart.id,
            productId: product.id,
            variantId: incoming.variantId,
            quantity: finalQty,
            reservedUntil: reservedUntilDate(),
          },
          update: {
            quantity: finalQty,
            reservedUntil: reservedUntilDate(),
          },
        });
      }
    });

    const cartResponse = await this.getCart(userId);
    return { cart: cartResponse, discarded };
  }

  async applyCouponToCart(userId: string, code: string): Promise<CartResponse> {
    const normalizedCode = code.toUpperCase().trim();
    const cart = await this.getOrCreateCart(userId);

    const currentCart = await this.getCart(userId);
    const validation = await this.couponsService.validate(
      {
        code: normalizedCode,
        subtotal: currentCart.subtotal,
        items: currentCart.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.variant.price,
          categoryId: '',
        })),
      },
      userId,
    );

    if (!validation.valid) {
      const firstError = validation.errors?.[0];
      const err: Record<string, unknown> = {
        error: firstError?.code ?? 'INVALID_COUPON',
        message: firstError?.message ?? 'Cupom inválido',
      };
      if (firstError?.details) err['details'] = firstError.details;
      throw new ConflictException(err);
    }

    // Buscar itens com categoryId para validação completa
    const cartWithCategories = await prisma.cart.findFirst({
      where: { userId },
      select: {
        id: true,
        items: {
          select: {
            variantId: true,
            quantity: true,
            product: { select: { categoryId: true, basePrice: true } },
            variant: {
              select: { price: true, product: { select: { basePrice: true } } },
            },
          },
        },
      },
    });

    const itemsForValidation = (cartWithCategories?.items ?? []).map((item) => {
      const basePrice = item.variant.product.basePrice.toNumber();
      const rawVariantPrice = item.variant.price?.toNumber() ?? null;
      const price =
        rawVariantPrice != null && rawVariantPrice > 0
          ? rawVariantPrice
          : basePrice;
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        categoryId: item.product.categoryId ?? '',
      };
    });

    const subtotal = itemsForValidation.reduce(
      (s, i) => s + i.price * i.quantity,
      0,
    );
    const fullValidation = await this.couponsService.validate(
      { code: normalizedCode, subtotal, items: itemsForValidation },
      userId,
    );

    if (!fullValidation.valid) {
      const firstError = fullValidation.errors?.[0];
      throw new ConflictException({
        error: firstError?.code ?? 'INVALID_COUPON',
        message: firstError?.message ?? 'Cupom inválido',
      });
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: normalizedCode },
    });

    return this.getCart(userId);
  }

  async removeCouponFromCart(userId: string): Promise<CartResponse> {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (cart) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null },
      });
    }
    return this.getCart(userId);
  }
}
