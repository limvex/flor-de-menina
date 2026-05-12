import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, ReviewStatus } from '@flor/database';
import type { ListAdminReviewsQuery } from './dto/list-admin-reviews.query';
import type { ModerateReviewDto } from './dto/moderate-review.dto';

@Injectable()
export class AdminReviewsService {
  async list(query: ListAdminReviewsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const status = query.status ?? ReviewStatus.PENDING;

    const [rows, total] = await Promise.all([
      prisma.review.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.review.count({ where: { status } }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        photos: r.photos,
        createdAt: r.createdAt.toISOString(),
        product: r.product,
        user: r.user,
      })),
      total,
      page,
      pageSize,
    };
  }

  async moderate(id: string, dto: ModerateReviewDto, moderatorId: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review não encontrada');
    if (review.status !== ReviewStatus.PENDING) {
      throw new BadRequestException('Só é possível moderar reviews pendentes');
    }
    if (dto.status === ReviewStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Informe o motivo da rejeição');
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        status: dto.status,
        moderatedById: moderatorId,
        moderatedAt: new Date(),
        rejectionReason:
          dto.status === ReviewStatus.REJECTED
            ? (dto.rejectionReason?.trim() ?? null)
            : null,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      rating: updated.rating,
      title: updated.title,
      comment: updated.comment,
      photos: updated.photos,
      rejectionReason: updated.rejectionReason,
      moderatedAt: updated.moderatedAt?.toISOString() ?? null,
      product: updated.product,
      user: updated.user,
    };
  }
}
