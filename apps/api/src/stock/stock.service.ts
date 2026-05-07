import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockMovementType } from '@flor/database';
import { createId } from '@paralleldrive/cuid2';
import {
  CreateMovementDto,
  StockMovementTypeDto,
} from './dto/create-movement.dto';
import { QuickSaleDto } from './dto/quick-sale.dto';
import { ListStockDto } from './dto/list-stock.dto';
import { ListMovementsDto } from './dto/list-movements.dto';

const QUICK_SALE_REASON = 'Venda balcão';
const ONLINE_SALE_REASON = 'Venda online';
const ORDER_CANCEL_REASON = 'Pedido cancelado/reembolsado';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista variações com estoque atual + dados do produto + status calculado.
   * USADO em /admin/estoque
   */
  async listStock(filter: ListStockDto, lowStockThreshold: number = 5) {
    const where: any = {};

    if (filter.search) {
      where.OR = [
        { product: { name: { contains: filter.search, mode: 'insensitive' } } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.categoryId) where.product = { categoryId: filter.categoryId };
    if (filter.productId) where.productId = filter.productId;
    if (filter.status === 'low')
      where.stock = { gt: 0, lte: lowStockThreshold };
    if (filter.status === 'zero') where.stock = 0;
    if (filter.status === 'available') where.stock = { gt: lowStockThreshold };

    const [items, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              images: { take: 1, orderBy: { position: 'asc' } },
            },
          },
        },
        orderBy: this.buildSort(filter.sortBy, filter.sortOrder),
        skip: ((filter.page ?? 1) - 1) * (filter.limit ?? 50),
        take: filter.limit ?? 50,
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return {
      items: items.map((v) => ({
        ...v,
        statusLabel:
          v.stock === 0
            ? 'zero'
            : v.stock <= lowStockThreshold
              ? 'low'
              : 'available',
      })),
      total,
      page: filter.page ?? 1,
      limit: filter.limit ?? 50,
    };
  }

  /**
   * Cria movimentação manual (IN, OUT, ADJUST) com transação atômica.
   * USADO no botão "Movimentar" do admin
   */
  async createMovement(dto: CreateMovementDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: dto.variantId },
        include: { product: { select: { name: true } } },
      });

      if (!variant) throw new NotFoundException('Variação não encontrada');

      const newStock = this.calculateNewStock(
        variant.stock,
        dto.type,
        dto.quantity,
      );

      if (newStock < 0 && !dto.forced) {
        throw new BadRequestException(
          `Operação resultaria em estoque negativo (${newStock}). Use force=true se for proposital.`,
        );
      }

      const movement = await tx.stockMovement.create({
        data: {
          id: createId(),
          variantId: dto.variantId,
          userId,
          type: dto.type as StockMovementType,
          quantity: dto.quantity,
          reason: dto.reason,
          previousStock: variant.stock,
          newStock,
        },
      });

      await tx.productVariant.update({
        where: { id: dto.variantId },
        data: { stock: newStock },
      });

      return { movement, variant: { ...variant, stock: newStock } };
    });
  }

  /**
   * Quick action "Venda balcão" — saída rápida com motivo padrão.
   * USADO no botão de quick action do admin (UX < 30s)
   */
  async quickSale(dto: QuickSaleDto, userId: string) {
    return this.createMovement(
      {
        variantId: dto.variantId,
        type: StockMovementTypeDto.OUT,
        quantity: dto.quantity,
        reason: QUICK_SALE_REASON,
        forced: false,
      },
      userId,
    );
  }

  /**
   * Histórico de movimentações com filtros.
   */
  async listMovements(filter: ListMovementsDto) {
    const where: any = {};
    if (filter.variantId) where.variantId = filter.variantId;
    if (filter.userId) where.userId = filter.userId;
    if (filter.type) where.type = filter.type;
    if (filter.reason)
      where.reason = { contains: filter.reason, mode: 'insensitive' };
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.productId) where.variant = { productId: filter.productId };
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.createdAt.lte = new Date(filter.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { take: 1 },
                },
              },
            },
          },
          order: { select: { id: true, number: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((filter.page ?? 1) - 1) * (filter.limit ?? 50),
        take: filter.limit ?? 50,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { items, total, page: filter.page ?? 1, limit: filter.limit ?? 50 };
  }

  /**
   * Export CSV do histórico (todos filtros aplicáveis).
   */
  async exportMovementsCsv(filter: ListMovementsDto): Promise<string> {
    const { items } = await this.listMovements({ ...filter, limit: 10000 });
    const { stringify } = await import('csv-stringify/sync');

    const rows = items.map((m) => ({
      Data: m.createdAt.toISOString(),
      Tipo: m.type,
      Produto: m.variant.product.name,
      SKU: m.variant.sku,
      Tamanho: m.variant.size ?? '',
      Cor: m.variant.color ?? '',
      Quantidade: m.quantity,
      'Estoque anterior': m.previousStock,
      'Estoque novo': m.newStock,
      Motivo: m.reason,
      Usuário: m.user?.name ?? '(sistema)',
      Pedido: m.order?.number ?? '',
    }));

    return stringify(rows, { header: true });
  }

  /**
   * Resumo / estatísticas pra dashboard.
   */
  async getSummary(lowStockThreshold: number = 5) {
    const [total, zero, low, totalUnits] = await Promise.all([
      this.prisma.productVariant.count({ where: { isActive: true } }),
      this.prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),
      this.prisma.productVariant.count({
        where: { isActive: true, stock: { gt: 0, lte: lowStockThreshold } },
      }),
      this.prisma.productVariant.aggregate({
        where: { isActive: true },
        _sum: { stock: true },
      }),
    ]);

    return {
      totalVariants: total,
      zeroStock: zero,
      lowStock: low,
      availableStock: total - zero - low,
      totalUnits: totalUnits._sum.stock ?? 0,
    };
  }

  // =========================================================================
  // INTEGRAÇÕES FUTURAS (chamadas pelas Tasks #19 e #20 quando chegarem)
  // =========================================================================

  /**
   * Decrementa estoque quando pedido é pago.
   * IDEMPOTENTE — não duplica se chamado múltiplas vezes pro mesmo pedido.
   */
  async decrementStockForOrder(orderId: string) {
    const existing = await this.prisma.stockMovement.findFirst({
      where: { orderId, type: 'OUT' },
    });
    if (existing) {
      // Idempotente — já foi processado
      return { skipped: true, reason: 'already_processed' };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    return this.prisma.$transaction(async (tx) => {
      const movements = [];
      for (const item of order.items) {
        const variant = await tx.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
        });
        const newStock = variant.stock - item.quantity;

        movements.push(
          await tx.stockMovement.create({
            data: {
              id: createId(),
              variantId: item.variantId,
              type: 'OUT',
              quantity: item.quantity,
              reason: ONLINE_SALE_REASON,
              orderId: order.id,
              previousStock: variant.stock,
              newStock,
            },
          }),
        );

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: newStock },
        });
      }
      return { skipped: false, movements };
    });
  }

  /**
   * Restaura estoque quando pedido é cancelado/reembolsado.
   * IDEMPOTENTE.
   */
  async restoreStockForOrder(orderId: string) {
    const existingRestore = await this.prisma.stockMovement.findFirst({
      where: { orderId, type: 'IN' },
    });
    if (existingRestore) return { skipped: true, reason: 'already_restored' };

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    return this.prisma.$transaction(async (tx) => {
      const movements = [];
      for (const item of order.items) {
        const variant = await tx.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
        });
        const newStock = variant.stock + item.quantity;

        movements.push(
          await tx.stockMovement.create({
            data: {
              id: createId(),
              variantId: item.variantId,
              type: 'IN',
              quantity: item.quantity,
              reason: ORDER_CANCEL_REASON,
              orderId: order.id,
              previousStock: variant.stock,
              newStock,
            },
          }),
        );

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: newStock },
        });
      }
      return { skipped: false, movements };
    });
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private calculateNewStock(
    current: number,
    type: StockMovementTypeDto,
    qty: number,
  ): number {
    if (type === StockMovementTypeDto.IN) return current + qty;
    if (type === StockMovementTypeDto.OUT) return current - qty;
    return qty; // ADJUST seta valor absoluto
  }

  private buildSort(sortBy?: string, order?: 'asc' | 'desc') {
    const dir = order ?? 'asc';
    if (sortBy === 'name') return { product: { name: dir } };
    if (sortBy === 'category') return { product: { category: { name: dir } } };
    return { stock: dir };
  }
}

// TODO(integração-sistema-offline):
// - Endpoint /stock/import-csv pra importar movimentações em lote
// - Endpoint /stock/sync-webhook pra receber updates do sistema offline da loja
// - Implementar quando cliente confirmar formato dos dados
