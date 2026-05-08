import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { prisma } from '@flor/database';

@Injectable()
export class CartCleanupService {
  private readonly logger = new Logger(CartCleanupService.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanExpiredReservations() {
    const now = new Date();

    // reservedUntil < now já exclui linhas NULL no SQL, sem necessidade de filtro adicional
    const result = await prisma.cartItem.updateMany({
      where: { reservedUntil: { lt: now } },
      data: { reservedUntil: null },
    });

    if (result.count > 0) {
      this.logger.log(`Liberadas ${result.count} reserva(s) expirada(s)`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanAnonymousCarts() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const carts = await prisma.cart.findMany({
      where: { userId: null, createdAt: { lt: sevenDaysAgo } },
      select: { id: true },
    });

    if (carts.length === 0) return;

    await prisma.cart.deleteMany({
      where: { id: { in: carts.map((c) => c.id) } },
    });

    this.logger.log(
      `Removidos ${carts.length} carrinho(s) anônimo(s) expirado(s)`,
    );
  }
}
