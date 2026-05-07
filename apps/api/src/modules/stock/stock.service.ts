import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  createId,
  StockMovementType,
  StockMovementSource,
} from '@flor/database';
import type { PrismaClient } from '@flor/database';
import { LOW_STOCK_THRESHOLD } from '@flor/types';
import type { CreateMovementDto } from './dto/create-movement.dto';
import type { CounterSaleDto } from './dto/counter-sale.dto';
import type { ListStockQuery } from './dto/list-stock.query';
import type { ListMovementsQuery } from './dto/list-movements.query';

// Source válidos por tipo de movimento
const SOURCE_BY_TYPE: Record<StockMovementType, StockMovementSource[]> = {
  IN: [StockMovementSource.MANUAL_IN, StockMovementSource.RETURN],
  OUT: [StockMovementSource.LOSS],
  ADJUST: [StockMovementSource.MANUAL_ADJUST],
};

export type ApplyMovementInput = {
  variantId: string;
  type: StockMovementType;
  source: StockMovementSource;
  quantity: number;
  reason?: string;
  orderId?: string;
  userId?: string | null;
  allowNegative?: boolean;
};

function stockStatus(stock: number): 'ok' | 'low' | 'out' {
  if (stock <= 0) return 'out';
  if (stock < LOW_STOCK_THRESHOLD) return 'low';
  return 'ok';
}

function formatMovement(m: {
  id: string;
  type: StockMovementType;
  source: StockMovementSource;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  orderId: string | null;
  userId: string | null;
  createdAt: Date;
  user?: { name: string } | null;
}) {
  return {
    id: m.id,
    type: m.type,
    source: m.source,
    quantity: m.quantity,
    stockBefore: m.stockBefore,
    stockAfter: m.stockAfter,
    reason: m.reason,
    orderId: m.orderId,
    userId: m.userId,
    userName: m.user?.name ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

@Injectable()
export class StockService {
  async listProductsWithStock(query: ListStockQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;
    const skip = (page - 1) * pageSize;

    const productWhere: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      productWhere.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.categoryId) {
      productWhere.categoryId = query.categoryId;
    }

    const orderBy =
      query.sort === 'name'
        ? { name: 'asc' as const }
        : query.sort === 'updated'
          ? { updatedAt: 'desc' as const }
          : { createdAt: 'desc' as const };

    const products = await prisma.product.findMany({
      where: productWhere,
      orderBy,
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: {
          select: { thumbUrl: true },
          where: { position: 0 },
          take: 1,
        },
        variants: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            colorHex: true,
            stock: true,
            isActive: true,
          },
          where: { isActive: true },
        },
      },
    });

    // Filtrar por status se solicitado (filtra após buscar, pois é calculado)
    const filtered = products.filter((p) => {
      if (!query.status) return true;
      const total = p.variants.reduce((s, v) => s + v.stock, 0);
      const someOut = p.variants.every((v) => v.stock <= 0);
      const someLow = p.variants.some(
        (v) => v.stock > 0 && v.stock < LOW_STOCK_THRESHOLD,
      );
      if (query.status === 'out') return someOut;
      if (query.status === 'low') return !someOut && someLow;
      if (query.status === 'ok')
        return total >= LOW_STOCK_THRESHOLD && !someOut && !someLow;
      return true;
    });

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + pageSize);

    const items = paged.map((p) => {
      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
      const allOut =
        p.variants.length > 0 && p.variants.every((v) => v.stock <= 0);
      const anyLow = p.variants.some(
        (v) => v.stock > 0 && v.stock < LOW_STOCK_THRESHOLD,
      );
      const status = allOut ? 'out' : anyLow ? 'low' : 'ok';

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        thumbUrl: p.images[0]?.thumbUrl ?? null,
        totalStock,
        status,
        updatedAt: p.updatedAt.toISOString(),
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          stock: v.stock,
          status: stockStatus(v.stock),
          isActive: v.isActive,
        })),
      };
    });

    return { items, total, page, pageSize };
  }

  async getVariantStock(variantId: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        sku: true,
        size: true,
        color: true,
        colorHex: true,
        stock: true,
        isActive: true,
        productId: true,
        product: { select: { name: true } },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!variant) throw new NotFoundException('Variante não encontrada');

    return {
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      stock: variant.stock,
      status: stockStatus(variant.stock),
      isActive: variant.isActive,
      productId: variant.productId,
      productName: variant.product.name,
      recentMovements: variant.stockMovements.map(formatMovement),
    };
  }

  async listMovements(variantId: string, query: ListMovementsQuery) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });
    if (!variant) throw new NotFoundException('Variante não encontrada');

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { variantId };
    if (query.type) where.type = query.type;
    if (query.source) where.source = query.source;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(query.to) }),
      };
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { user: { select: { name: true } } },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      items: movements.map(formatMovement),
      total,
      page,
      pageSize,
    };
  }

  async createMovement(dto: CreateMovementDto, userId: string | null) {
    const allowedSources = SOURCE_BY_TYPE[dto.type];
    if (!allowedSources.includes(dto.source as StockMovementSource)) {
      throw new ConflictException(
        `Fonte "${dto.source}" não é válida para tipo "${dto.type}". Use: ${allowedSources.join(', ')}`,
      );
    }

    return this.applyMovement({
      variantId: dto.variantId,
      type: dto.type as StockMovementType,
      source: dto.source as StockMovementSource,
      quantity: dto.quantity,
      reason: dto.reason,
      userId,
      allowNegative: dto.allowNegative ?? false,
    });
  }

  async createCounterSale(dto: CounterSaleDto, userId: string | null) {
    return this.applyMovement({
      variantId: dto.variantId,
      type: StockMovementType.OUT,
      source: StockMovementSource.COUNTER_SALE,
      quantity: dto.quantity,
      reason: dto.reason ?? 'Venda balcão',
      userId,
      allowNegative: dto.allowNegative ?? false,
    });
  }

  /**
   * Método central de movimentação de estoque.
   * Aceita `tx` para ser chamado dentro de uma transação maior (ex: pedidos).
   */
  async applyMovement(
    input: ApplyMovementInput,
    tx?: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  ) {
    if (tx) {
      return this._applyMovementInTx(input, tx);
    }
    return prisma.$transaction((t) => this._applyMovementInTx(input, t));
  }

  private async _applyMovementInTx(
    input: ApplyMovementInput,
    t: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  ) {
    // FOR UPDATE locks the row until this transaction commits, preventing race conditions
    const rows = await t.$queryRaw<{ id: string; stock: number }[]>`
        SELECT id, stock FROM "ProductVariant" WHERE id = ${input.variantId} FOR UPDATE
      `;
    const variant = rows[0] ?? null;
    if (!variant) throw new NotFoundException('Variante não encontrada');

    let delta: number;
    let newStock: number;

    if (input.type === StockMovementType.IN) {
      delta = input.quantity;
      newStock = variant.stock + delta;
    } else if (input.type === StockMovementType.OUT) {
      delta = -input.quantity;
      newStock = variant.stock + delta;
    } else {
      // ADJUST: quantity é o estoque-alvo final
      newStock = input.quantity;
      delta = newStock - variant.stock;
    }

    if (newStock < 0 && !input.allowNegative) {
      throw new ConflictException(
        `Operação resultaria em estoque negativo (${newStock}). Marque "Permitir negativo" para forçar.`,
      );
    }

    await t.productVariant.update({
      where: { id: input.variantId },
      data: { stock: newStock },
    });

    const movement = await t.stockMovement.create({
      data: {
        id: createId(),
        variantId: input.variantId,
        type: input.type,
        source: input.source,
        quantity: Math.abs(delta),
        stockBefore: variant.stock,
        stockAfter: newStock,
        reason: input.reason ?? null,
        orderId: input.orderId ?? null,
        userId: input.userId ?? null,
      },
      include: { user: { select: { name: true } } },
    });

    return formatMovement(movement);
  }
}
