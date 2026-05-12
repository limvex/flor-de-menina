import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewStatus } from '@flor/database';
import { AdminReviewsService } from '../admin-reviews.service';

jest.mock('@flor/database', () => {
  const actual = jest.requireActual('@flor/database');
  return {
    ...actual,
    prisma: {
      review: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  };
});

import { prisma } from '@flor/database';

describe('AdminReviewsService', () => {
  let service: AdminReviewsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminReviewsService();
  });

  it('moderate exige motivo ao rejeitar', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue({
      id: 'r1',
      status: ReviewStatus.PENDING,
    });
    await expect(
      service.moderate('r1', { status: ReviewStatus.REJECTED }, 'mod1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('moderate lança se não pendente', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue({
      id: 'r1',
      status: ReviewStatus.APPROVED,
    });
    await expect(
      service.moderate('r1', { status: ReviewStatus.APPROVED }, 'mod1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('moderate aprova', async () => {
    (prisma.review.findUnique as jest.Mock).mockResolvedValue({
      id: 'r1',
      status: ReviewStatus.PENDING,
    });
    (prisma.review.update as jest.Mock).mockResolvedValue({
      id: 'r1',
      status: ReviewStatus.APPROVED,
      rating: 5,
      title: null,
      comment: 'ok',
      photos: [],
      rejectionReason: null,
      moderatedAt: new Date(),
      product: { id: 'p', name: 'P', slug: 'p' },
      user: { id: 'u', name: 'U', email: 'u@e.com' },
    });

    const r = await service.moderate(
      'r1',
      { status: ReviewStatus.APPROVED },
      'mod1',
    );
    expect(r.status).toBe(ReviewStatus.APPROVED);
    expect(prisma.review.update).toHaveBeenCalled();
  });
});
