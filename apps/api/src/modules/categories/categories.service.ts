import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, createId } from '@flor/database';
import type { Category, Prisma } from '@flor/database';
import { SizeChartSchema } from '@flor/types';
import type { SizeChart } from '@flor/types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQuery } from './dto/list-categories.query';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseSizeChart(raw: unknown): SizeChart | null {
  if (raw == null) return null;
  const result = SizeChartSchema.safeParse(raw);
  return result.success ? result.data : null;
}

type PartialParent = Pick<Category, 'id' | 'name' | 'slug'> & {
  sizeChart?: Category['sizeChart'];
};

function effectiveSizeChart(
  category: { sizeChart: Category['sizeChart'] } & {
    parent?: PartialParent | null;
  },
): SizeChart | null {
  const own = parseSizeChart(category.sizeChart);
  if (own) return own;
  if (category.parent) return parseSizeChart(category.parent.sizeChart);
  return null;
}

function formatCategory(
  category: Category & {
    parent?: PartialParent | null;
    _count?: { children: number; products: number };
  },
) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    parentId: category.parentId,
    sizeChart: parseSizeChart(category.sizeChart),
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    effectiveSizeChart: effectiveSizeChart(category),
    parent: category.parent
      ? {
          id: category.parent.id,
          name: category.parent.name,
          slug: category.parent.slug,
        }
      : null,
    _count: category._count ?? { children: 0, products: 0 },
  };
}

function formatCategoryPublic(
  category: Category & { parent?: PartialParent | null },
) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    parentId: category.parentId,
    sizeChart: parseSizeChart(category.sizeChart),
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    updatedAt: category.updatedAt.toISOString(),
    children: [],
  };
}

@Injectable()
export class CategoriesService {
  async findAllAdmin(query: ListCategoriesQuery) {
    const isActive =
      query.isActive === 'true'
        ? true
        : query.isActive === 'false'
          ? false
          : undefined;

    const orderField = query.sort ?? 'sortOrder';
    const orderDir = (query.order ?? 'asc') as 'asc' | 'desc';

    const categories = await prisma.category.findMany({
      where: {
        ...(query.search && {
          name: { contains: query.search, mode: 'insensitive' },
        }),
        ...(query.parentId !== undefined && {
          parentId: query.parentId === 'null' ? null : query.parentId,
        }),
        ...(isActive !== undefined && { isActive }),
        deletedAt: null,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true, products: true } },
      },
      orderBy: { [orderField]: orderDir },
    });

    return categories.map(formatCategory);
  }

  async findOneAdmin(id: string) {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        _count: { select: { children: true, products: true } },
      },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return formatCategory(category);
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent)
        throw new BadRequestException('Categoria pai não encontrada');
      if (parent.parentId !== null) {
        throw new BadRequestException(
          'Não é permitido criar categoria com mais de 2 níveis de hierarquia',
        );
      }
    }

    const slug = dto.slug ?? slugify(dto.name);

    await this.assertSlugUnique(slug, dto.parentId ?? null);

    if (dto.sizeChart != null) {
      const result = SizeChartSchema.safeParse(dto.sizeChart);
      if (!result.success) {
        throw new BadRequestException(
          `Tabela de medidas inválida: ${result.error.issues[0]?.message}`,
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        id: createId(),
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId ?? null,
        sizeChart:
          dto.sizeChart != null
            ? (dto.sizeChart as unknown as Prisma.InputJsonValue)
            : null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        parent: true,
        _count: { select: { children: true, products: true } },
      },
    });

    return formatCategory(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    if (dto.parentId !== undefined) {
      const newParentId = dto.parentId ?? null;
      if (newParentId) {
        const parent = await prisma.category.findFirst({
          where: { id: newParentId, deletedAt: null },
        });
        if (!parent)
          throw new BadRequestException('Categoria pai não encontrada');
        if (parent.parentId !== null) {
          throw new BadRequestException(
            'Não é permitido criar categoria com mais de 2 níveis de hierarquia',
          );
        }
      }
      const childCount = await prisma.category.count({
        where: { parentId: id, deletedAt: null },
      });
      if (childCount > 0 && newParentId !== null) {
        throw new BadRequestException(
          'Não é possível mover categoria-pai que possui subcategorias para dentro de outra categoria',
        );
      }
    }

    const targetParentId =
      dto.parentId !== undefined ? (dto.parentId ?? null) : existing.parentId;
    const targetSlug = dto.slug ?? existing.slug;
    if (dto.slug || dto.parentId !== undefined) {
      await this.assertSlugUnique(targetSlug, targetParentId, id);
    }

    if (dto.sizeChart != null) {
      const result = SizeChartSchema.safeParse(dto.sizeChart);
      if (!result.success) {
        throw new BadRequestException(
          `Tabela de medidas inválida: ${result.error.issues[0]?.message}`,
        );
      }
    }

    const updateData: Prisma.CategoryUncheckedUpdateInput = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId ?? null;
    if ('sizeChart' in dto) {
      updateData.sizeChart =
        dto.sizeChart != null
          ? (dto.sizeChart as unknown as Prisma.InputJsonValue)
          : null;
    }
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        _count: { select: { children: true, products: true } },
      },
    });

    return formatCategory(category);
  }

  async remove(id: string) {
    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    const childCount = await prisma.category.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw new ConflictException(
        'Categoria possui subcategorias. Remova-as antes de deletar.',
      );
    }

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new ConflictException(
        'Categoria possui produtos associados. Mova-os para outra categoria antes de deletar.',
      );
    }

    await prisma.category.delete({ where: { id } });
    return { id };
  }

  async toggleActive(id: string) {
    const existing = await prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    const category = await prisma.category.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: {
        parent: true,
        _count: { select: { children: true, products: true } },
      },
    });

    return formatCategory(category);
  }

  async findPublicTree() {
    const parents = await prisma.category.findMany({
      where: { parentId: null, isActive: true, deletedAt: null },
      include: {
        children: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return parents.map((p) => ({
      ...formatCategoryPublic(p),
      children: p.children.map((c) =>
        formatCategoryPublic({ ...c, parent: p }),
      ),
    }));
  }

  async findBySlug(slug: string) {
    const category = await prisma.category.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: { parent: true },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    if (category.parent && !category.parent.isActive) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return formatCategory(category);
  }

  private async assertSlugUnique(
    slug: string,
    parentId: string | null,
    excludeId?: string,
  ) {
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        parentId: parentId,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe uma categoria com o slug "${slug}" nesse nível`,
      );
    }
  }
}
