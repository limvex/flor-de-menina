import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  createId,
  StockMovementType,
  StockMovementSource,
  PaymentProvider,
  ShippingProvider,
  PaymentMethod,
} from '@flor/database';
import type { PrismaClient } from '@flor/database';
import { StockService } from '../stock/stock.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { ShippingOptionDto } from './dto/shipping-options.dto';

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

const FREE_SHIPPING_SUBTOTAL = 299;

@Injectable()
export class OrdersService {
  constructor(private readonly stockService: StockService) {}

  getShippingOptions(subtotal: number): ShippingOptionDto[] {
    const options: ShippingOptionDto[] = [
      {
        id: 'pac',
        carrier: 'Correios',
        service: 'PAC',
        cost: 15.9,
        estimatedDays: 8,
        label: 'PAC — até 8 dias úteis',
      },
      {
        id: 'sedex',
        carrier: 'Correios',
        service: 'SEDEX',
        cost: 28.9,
        estimatedDays: 3,
        label: 'SEDEX — até 3 dias úteis',
      },
    ];

    if (subtotal >= FREE_SHIPPING_SUBTOTAL) {
      options.push({
        id: 'free',
        carrier: 'Correios',
        service: 'PAC',
        cost: 0,
        estimatedDays: 8,
        label: 'Frete grátis — até 8 dias úteis',
      });
    }

    return options;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    return prisma.$transaction(async (tx) => {
      // 1. Buscar carrinho do usuário com itens e variantes
      const cart = await tx.cart.findFirst({
        where: { userId },
        select: {
          id: true,
          items: {
            select: {
              id: true,
              variantId: true,
              quantity: true,
              productId: true,
              product: {
                select: {
                  name: true,
                  images: {
                    select: { cardUrl: true, url: true },
                    orderBy: { position: 'asc' },
                    take: 1,
                  },
                },
              },
              variant: {
                select: {
                  size: true,
                  color: true,
                  price: true,
                  product: { select: { basePrice: true } },
                },
              },
            },
          },
        },
      });

      // 2. Validar carrinho não vazio
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Carrinho está vazio');
      }

      // 3. Validar estoque de cada item
      const insufficientItems: Array<{
        productName: string;
        variantLabel: string;
        requested: number;
        available: number;
      }> = [];

      for (const item of cart.items) {
        const available = await this.getAvailableStockInTx(
          item.variantId,
          cart.id,
          tx,
        );
        if (available < item.quantity) {
          const size = item.variant.size;
          const color = item.variant.color;
          const parts = [size, color].filter(Boolean);
          insufficientItems.push({
            productName: item.product.name,
            variantLabel: parts.length > 0 ? parts.join(' - ') : 'Padrão',
            requested: item.quantity,
            available,
          });
        }
      }

      if (insufficientItems.length > 0) {
        throw new ConflictException({
          error: 'INSUFFICIENT_STOCK',
          items: insufficientItems,
        });
      }

      // 4. Calcular valores
      const subtotal = cart.items.reduce((sum, item) => {
        const price =
          item.variant.price?.toNumber() ??
          item.variant.product.basePrice.toNumber();
        return sum + price * item.quantity;
      }, 0);

      const shippingCost = dto.shippingOption.cost;
      const total = subtotal + shippingCost;

      // 5. Gerar número do pedido sequencial
      const orderNumber = await this.generateOrderNumber(tx);

      // 6. Buscar e snapshottear endereço
      const address = await tx.address.findUnique({
        where: { id: dto.addressId },
      });
      if (!address) throw new NotFoundException('Endereço não encontrado');
      if (address.userId !== userId) throw new ForbiddenException();

      const shippingAddress = {
        recipientName: address.recipientName,
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        country: address.country,
      };

      // 7. Criar Order + OrderItems
      const order = await tx.order.create({
        data: {
          id: createId(),
          userId,
          number: orderNumber,
          cpf: dto.cpf,
          subtotal,
          shippingCost,
          discount: 0,
          total,
          shippingAddress,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => {
              const price =
                item.variant.price?.toNumber() ??
                item.variant.product.basePrice.toNumber();
              return {
                id: createId(),
                productId: item.productId,
                variantId: item.variantId,
                productName: item.product.name,
                variantSize: item.variant.size,
                variantColor: item.variant.color,
                productImageUrl:
                  item.product.images[0]?.cardUrl ??
                  item.product.images[0]?.url ??
                  null,
                unitPrice: price,
                quantity: item.quantity,
                subtotal: price * item.quantity,
              };
            }),
          },
        },
      });

      // 8. Criar Payment
      await tx.payment.create({
        data: {
          id: createId(),
          orderId: order.id,
          provider: PaymentProvider.MOCK,
          method:
            dto.paymentMethod === 'PIX'
              ? PaymentMethod.PIX
              : PaymentMethod.CREDIT_CARD,
          status: 'PENDING',
          amount: total,
          installments: 1,
        },
      });

      // 9. Criar Shipping
      await tx.shipping.create({
        data: {
          id: createId(),
          orderId: order.id,
          provider: ShippingProvider.MOCK,
          serviceName: `${dto.shippingOption.carrier} ${dto.shippingOption.service}`,
          estimatedDays: dto.shippingOption.estimatedDays,
          cost: shippingCost,
        },
      });

      // 10. Baixa de estoque para cada item
      for (const item of cart.items) {
        await this.stockService.applyMovement(
          {
            variantId: item.variantId,
            type: StockMovementType.OUT,
            source: StockMovementSource.ONLINE_ORDER,
            quantity: item.quantity,
            orderId: order.id,
            userId: null,
          },
          tx,
        );
      }

      // 11. Limpar carrinho
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      // 12. Salvar CPF no perfil se ainda não tiver
      const userCpf = await tx.user.findUnique({
        where: { id: userId },
        select: { cpf: true },
      });
      if (!userCpf?.cpf) {
        const cpfDigits = dto.cpf.replace(/\D/g, '');
        const existing = await tx.user.findUnique({
          where: { cpf: cpfDigits },
          select: { id: true },
        });
        if (!existing) {
          await tx.user.update({
            where: { id: userId },
            data: { cpf: cpfDigits },
          });
        }
      }

      return this.getOrderById(order.id, tx);
    });
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  private async getOrderById(orderId: string, tx?: Tx) {
    const db = tx ?? prisma;
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payment: true,
        shipping: true,
      },
    });
    if (!order) return null;
    return this.formatOrder(order);
  }

  private formatOrder(order: {
    id: string;
    userId: string;
    number: string;
    status: string;
    cpf: string | null;
    subtotal: { toNumber(): number };
    shippingCost: { toNumber(): number };
    discount: { toNumber(): number };
    total: { toNumber(): number };
    shippingAddress: unknown;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      variantId: string;
      productId: string;
      productName: string;
      variantSize: string | null;
      variantColor: string | null;
      productImageUrl: string | null;
      unitPrice: { toNumber(): number };
      quantity: number;
      subtotal: { toNumber(): number };
    }>;
    payment: {
      id: string;
      method: string;
      status: string;
      amount: { toNumber(): number };
      installments: number;
      pixCopyPaste: string | null;
      qrCodeBase64: string | null;
      paidAt: Date | null;
    } | null;
    shipping: {
      id: string;
      serviceName: string;
      trackingCode: string | null;
      estimatedDays: number | null;
      cost: { toNumber(): number };
      shippedAt: Date | null;
      deliveredAt: Date | null;
    } | null;
  }) {
    return {
      id: order.id,
      userId: order.userId,
      number: order.number,
      status: order.status,
      cpf: order.cpf,
      subtotal: order.subtotal.toNumber(),
      shippingCost: order.shippingCost.toNumber(),
      discount: order.discount.toNumber(),
      total: order.total.toNumber(),
      shippingAddress: order.shippingAddress as {
        recipientName: string;
        zipCode: string;
        street: string;
        number: string;
        complement: string | null;
        neighborhood: string;
        city: string;
        state: string;
        country: string;
      },
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName,
        variantSize: item.variantSize,
        variantColor: item.variantColor,
        productImageUrl: item.productImageUrl,
        unitPrice: item.unitPrice.toNumber(),
        quantity: item.quantity,
        subtotal: item.subtotal.toNumber(),
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            method: order.payment.method,
            status: order.payment.status,
            amount: order.payment.amount.toNumber(),
            installments: order.payment.installments,
            pixCopyPaste: order.payment.pixCopyPaste,
            qrCodeBase64: order.payment.qrCodeBase64,
            paidAt: order.payment.paidAt?.toISOString() ?? null,
          }
        : null,
      shipping: order.shipping
        ? {
            id: order.shipping.id,
            carrier: order.shipping.serviceName,
            serviceName: order.shipping.serviceName,
            trackingCode: order.shipping.trackingCode,
            estimatedDays: order.shipping.estimatedDays,
            cost: order.shipping.cost.toNumber(),
            shippedAt: order.shipping.shippedAt?.toISOString() ?? null,
            deliveredAt: order.shipping.deliveredAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  private async generateOrderNumber(tx: Tx): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.order.count({
      where: {
        number: { startsWith: `FDM-${year}-` },
      },
    });
    const seq = String(count + 1).padStart(5, '0');
    return `FDM-${year}-${seq}`;
  }

  private async getAvailableStockInTx(
    variantId: string,
    excludeCartId: string,
    tx: Tx,
  ): Promise<number> {
    const now = new Date();
    const [variant, reserved] = await Promise.all([
      tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true },
      }),
      tx.cartItem.aggregate({
        where: {
          variantId,
          reservedUntil: { gt: now },
          cartId: { not: excludeCartId },
        },
        _sum: { quantity: true },
      }),
    ]);

    if (!variant) throw new NotFoundException('Variante não encontrada');
    return variant.stock - (reserved._sum.quantity ?? 0);
  }
}
