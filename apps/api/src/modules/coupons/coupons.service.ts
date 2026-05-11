import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, createId, CouponType, OrderStatus } from '@flor/database';
import type { PrismaClient } from '@flor/database';
import type {
  CouponValidationResult,
  CouponValidationError,
} from '@flor/types';
import type { CreateCouponDto } from './dto/create-coupon.dto';
import type { UpdateCouponDto } from './dto/update-coupon.dto';
import type { ListCouponsQuery } from './dto/list-coupons.query';
import { CouponStatusFilter } from './dto/list-coupons.query';
import type { ValidateCouponDto } from './dto/validate-coupon.dto';

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

@Injectable()
export class CouponsService {
  async create(dto: CreateCouponDto, adminId?: string) {
    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);

    if (validUntil <= validFrom) {
      throw new BadRequestException('Data final deve ser depois da inicial');
    }

    this.validateCouponValue(dto.type, dto.value);

    const existing = await prisma.coupon.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Já existe um cupom com este código');
    }

    return prisma.coupon.create({
      data: {
        id: createId(),
        code: dto.code,
        description: dto.description ?? null,
        type: dto.type,
        value: dto.value ?? 0,
        validFrom,
        validUntil,
        isActive: dto.isActive ?? true,
        maxTotalUses: dto.maxTotalUses ?? null,
        maxUsesPerCustomer: dto.maxUsesPerCustomer ?? 1,
        minCartValue: dto.minCartValue ?? null,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        firstOrderOnly: dto.firstOrderOnly ?? false,
        categoryIds: dto.categoryIds ?? [],
        createdBy: adminId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true, totalUses: true },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');

    if (dto.code) {
      const conflict = await prisma.coupon.findFirst({
        where: { code: dto.code, id: { not: id } },
        select: { id: true },
      });
      if (conflict)
        throw new ConflictException('Código já está em uso por outro cupom');
    }

    if (dto.type && dto.value !== undefined) {
      this.validateCouponValue(dto.type, dto.value);
    }

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : undefined;
    const validUntil = dto.validUntil ? new Date(dto.validUntil) : undefined;
    if (validFrom && validUntil && validUntil <= validFrom) {
      throw new BadRequestException('Data final deve ser depois da inicial');
    }

    return prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(validFrom && { validFrom }),
        ...(validUntil && { validUntil }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.maxTotalUses !== undefined && {
          maxTotalUses: dto.maxTotalUses,
        }),
        ...(dto.maxUsesPerCustomer !== undefined && {
          maxUsesPerCustomer: dto.maxUsesPerCustomer,
        }),
        ...(dto.minCartValue !== undefined && {
          minCartValue: dto.minCartValue,
        }),
        ...(dto.maxDiscountAmount !== undefined && {
          maxDiscountAmount: dto.maxDiscountAmount,
        }),
        ...(dto.firstOrderOnly !== undefined && {
          firstOrderOnly: dto.firstOrderOnly,
        }),
        ...(dto.categoryIds !== undefined && { categoryIds: dto.categoryIds }),
      },
    });
  }

  async delete(id: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true, totalUses: true },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');

    if (coupon.totalUses > 0) {
      // Soft delete: apenas desativa
      return prisma.coupon.update({ where: { id }, data: { isActive: false } });
    }

    await prisma.coupon.delete({ where: { id } });
    return { deleted: true };
  }

  async findAll(query: ListCouponsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    let where: Record<string, unknown> = {};

    if (query.search) {
      where = {
        ...where,
        OR: [
          {
            code: { contains: query.search.toUpperCase(), mode: 'insensitive' },
          },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    if (query.status && query.status !== CouponStatusFilter.ALL) {
      switch (query.status) {
        case CouponStatusFilter.ACTIVE:
          where = {
            ...where,
            isActive: true,
            validFrom: { lte: now },
            validUntil: { gte: now },
          };
          break;
        case CouponStatusFilter.EXPIRED:
          where = { ...where, validUntil: { lt: now } };
          break;
        case CouponStatusFilter.EXHAUSTED:
          where = { ...where, maxTotalUses: { not: null } };
          // filter exhausted after fetch
          break;
        case CouponStatusFilter.INACTIVE:
          where = { ...where, isActive: false };
          break;
      }
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    const mapped = coupons
      .map((c) => ({
        ...c,
        value: c.value.toNumber(),
        minCartValue: c.minCartValue?.toNumber() ?? null,
        maxDiscountAmount: c.maxDiscountAmount?.toNumber() ?? null,
        totalRevenue: c.totalRevenue.toNumber(),
        status: this.getCouponStatus(c, now),
      }))
      .filter((c) => {
        if (query.status === CouponStatusFilter.EXHAUSTED) {
          return c.status === 'exhausted';
        }
        return true;
      });

    return {
      data: mapped,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');

    const now = new Date();
    return {
      ...coupon,
      value: coupon.value.toNumber(),
      minCartValue: coupon.minCartValue?.toNumber() ?? null,
      maxDiscountAmount: coupon.maxDiscountAmount?.toNumber() ?? null,
      totalRevenue: coupon.totalRevenue.toNumber(),
      status: this.getCouponStatus(coupon, now),
    };
  }

  async findUsages(id: string, query: { page?: number; limit?: number }) {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      prisma.couponUsage.findMany({
        where: { couponId: id },
        include: {
          order: { select: { number: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.couponUsage.count({ where: { couponId: id } }),
    ]);

    return {
      data: usages.map((u) => ({
        id: u.id,
        orderId: u.orderId,
        orderNumber: u.order.number,
        customerName: u.user.name,
        customerEmail: u.user.email,
        discountAmount: u.discountAmount.toNumber(),
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async validate(
    dto: ValidateCouponDto,
    userId?: string,
  ): Promise<CouponValidationResult> {
    const code = dto.code.toUpperCase().trim();
    const now = new Date();

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    const totalItemsCount = dto.items.reduce((s, i) => s + i.quantity, 0);

    if (!coupon) {
      return this.invalidResult(
        dto.subtotal,
        dto.shippingCost ?? 0,
        totalItemsCount,
        [{ code: 'NOT_FOUND', message: 'Cupom não encontrado' }],
      );
    }

    if (!coupon.isActive) {
      return this.invalidResult(
        dto.subtotal,
        dto.shippingCost ?? 0,
        totalItemsCount,
        [{ code: 'INACTIVE', message: 'Cupom indisponível no momento' }],
      );
    }

    if (coupon.validFrom > now) {
      return this.invalidResult(
        dto.subtotal,
        dto.shippingCost ?? 0,
        totalItemsCount,
        [{ code: 'NOT_STARTED', message: 'Cupom ainda não está disponível' }],
      );
    }

    if (coupon.validUntil < now) {
      return this.invalidResult(
        dto.subtotal,
        dto.shippingCost ?? 0,
        totalItemsCount,
        [{ code: 'EXPIRED', message: 'Este cupom expirou' }],
      );
    }

    if (
      coupon.maxTotalUses !== null &&
      coupon.totalUses >= coupon.maxTotalUses
    ) {
      return this.invalidResult(
        dto.subtotal,
        dto.shippingCost ?? 0,
        totalItemsCount,
        [{ code: 'EXHAUSTED', message: 'Cupom esgotado' }],
      );
    }

    const minCartValue = coupon.minCartValue?.toNumber() ?? null;
    if (minCartValue !== null && dto.subtotal < minCartValue) {
      return this.invalidResult(
        dto.subtotal,
        dto.shippingCost ?? 0,
        totalItemsCount,
        [
          {
            code: 'MIN_CART_VALUE_NOT_MET',
            message: `Valor mínimo de ${this.formatCurrency(minCartValue)} não atingido`,
            details: { required: minCartValue, current: dto.subtotal },
          },
        ],
      );
    }

    if (coupon.firstOrderOnly) {
      if (!userId) {
        return this.invalidResult(
          dto.subtotal,
          dto.shippingCost ?? 0,
          totalItemsCount,
          [
            {
              code: 'LOGIN_REQUIRED',
              message: 'Faça login para usar este cupom',
            },
          ],
        );
      }
      const priorOrders = await prisma.order.count({
        where: { userId, status: { not: OrderStatus.CANCELLED } },
      });
      if (priorOrders > 0) {
        return this.invalidResult(
          dto.subtotal,
          dto.shippingCost ?? 0,
          totalItemsCount,
          [
            {
              code: 'NOT_FIRST_ORDER',
              message: 'Cupom válido apenas para primeira compra',
            },
          ],
        );
      }
    }

    if (userId) {
      const userUsages = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsages >= coupon.maxUsesPerCustomer) {
        return this.invalidResult(
          dto.subtotal,
          dto.shippingCost ?? 0,
          totalItemsCount,
          [
            {
              code: 'USER_LIMIT_REACHED',
              message: `Você já atingiu o limite de uso deste cupom`,
              details: { used: userUsages, max: coupon.maxUsesPerCustomer },
            },
          ],
        );
      }
    }

    // Filtrar itens elegíveis por categoria
    const eligibleItems =
      coupon.categoryIds.length > 0
        ? dto.items.filter((i) => coupon.categoryIds.includes(i.categoryId))
        : dto.items;

    if (coupon.categoryIds.length > 0 && eligibleItems.length === 0) {
      return this.invalidResult(
        dto.subtotal,
        dto.shippingCost ?? 0,
        totalItemsCount,
        [
          {
            code: 'NO_ELIGIBLE_ITEMS',
            message: 'Nenhum item do carrinho é elegível para este cupom',
          },
        ],
      );
    }

    const appliedToItemsCount = eligibleItems.reduce(
      (s, i) => s + i.quantity,
      0,
    );
    const eligibleSubtotal = eligibleItems.reduce(
      (s, i) => s + i.price * i.quantity,
      0,
    );

    const couponValue = coupon.value.toNumber();
    const maxDiscountAmount = coupon.maxDiscountAmount?.toNumber() ?? null;
    const shippingCost = dto.shippingCost ?? 0;

    let discount = 0;
    let finalShipping = shippingCost;

    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = eligibleSubtotal * (couponValue / 100);
        if (maxDiscountAmount !== null) {
          discount = Math.min(discount, maxDiscountAmount);
        }
        break;
      case CouponType.FIXED_AMOUNT:
        discount = Math.min(couponValue, eligibleSubtotal);
        break;
      case CouponType.FREE_SHIPPING:
        discount = 0;
        finalShipping = 0;
        break;
    }

    discount = Math.round(discount * 100) / 100;

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
        description: coupon.description,
      },
      discount,
      appliedToItemsCount,
      totalItemsCount,
      finalSubtotal: dto.subtotal - discount,
      finalShipping,
    };
  }

  async applyCoupon(
    tx: Tx,
    orderId: string,
    code: string,
    userId: string,
    discountAmount: number,
  ): Promise<void> {
    const coupon = await tx.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) throw new ConflictException('Cupom não encontrado');

    const now = new Date();
    if (!coupon.isActive || coupon.validUntil < now) {
      throw new ConflictException('Cupom expirado ou inativo');
    }
    if (
      coupon.maxTotalUses !== null &&
      coupon.totalUses >= coupon.maxTotalUses
    ) {
      throw new ConflictException('Cupom esgotado');
    }

    await tx.couponUsage.create({
      data: {
        id: createId(),
        couponId: coupon.id,
        userId,
        orderId,
        discountAmount,
      },
    });

    await tx.coupon.update({
      where: { id: coupon.id },
      data: {
        totalUses: { increment: 1 },
        totalRevenue: { increment: discountAmount },
      },
    });
  }

  async reverseCouponUsage(tx: Tx, orderId: string): Promise<void> {
    const usage = await tx.couponUsage.findUnique({ where: { orderId } });
    if (!usage) return;

    await tx.couponUsage.delete({ where: { id: usage.id } });
    await tx.coupon.update({
      where: { id: usage.couponId },
      data: {
        totalUses: { decrement: 1 },
        totalRevenue: { decrement: usage.discountAmount },
      },
    });
  }

  private getCouponStatus(
    coupon: {
      isActive: boolean;
      validFrom: Date;
      validUntil: Date;
      maxTotalUses: number | null;
      totalUses: number;
    },
    now: Date,
  ): string {
    if (!coupon.isActive) return 'inactive';
    if (coupon.validUntil < now) return 'expired';
    if (coupon.validFrom > now) return 'scheduled';
    if (coupon.maxTotalUses !== null && coupon.totalUses >= coupon.maxTotalUses)
      return 'exhausted';
    return 'active';
  }

  private invalidResult(
    subtotal: number,
    shippingCost: number,
    totalItemsCount: number,
    errors: CouponValidationError[],
  ): CouponValidationResult {
    return {
      valid: false,
      discount: 0,
      appliedToItemsCount: 0,
      totalItemsCount,
      finalSubtotal: subtotal,
      finalShipping: shippingCost,
      errors,
    };
  }

  private validateCouponValue(type: CouponType, value: number | undefined) {
    if (type === CouponType.PERCENTAGE) {
      if (!value || value <= 0 || value > 100) {
        throw new BadRequestException('Percentual deve ser entre 1 e 100');
      }
    } else if (type === CouponType.FIXED_AMOUNT) {
      if (!value || value <= 0) {
        throw new BadRequestException('Valor do desconto deve ser positivo');
      }
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
