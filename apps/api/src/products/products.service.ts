import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createId, prisma, Prisma, StockMovementType } from '@flor/database';
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ListProductsDto,
  ListPublicProductsDto,
} from './dto/list-products.dto';
import { UpsertVariantsDto } from './dto/upsert-variants.dto';

@Injectable()
export class ProductsService {
  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let counter = 2;

    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) break;
      candidate = `${base}-${counter++}`;
    }
    return candidate;
  }

  async list(dto: ListProductsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    // Produtos inativos incluem deletados (necessário pro admin ver e restaurar)
    const where: Prisma.ProductWhereInput =
      dto.status === 'inactive' ? {} : { deletedAt: null };

    if (dto.categoryId) where.categoryId = dto.categoryId;

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { slug: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.status === 'active') {
      where.isActive = true;
      where.deletedAt = null;
    }
    if (dto.status === 'inactive') where.isActive = false;

    const sortField = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
        include: {
          category: { select: { id: true, name: true } },
          images: {
            where: { position: 0 },
            take: 1,
            select: { id: true, thumbUrl: true, url: true },
          },
          variants: {
            where: { isActive: true },
            select: { stock: true, price: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithStock = items.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      return { ...p, totalStock };
    });

    if (dto.stock === 'out_of_stock') {
      return {
        items: productsWithStock.filter((p) => p.totalStock === 0),
        total,
        page,
        limit,
      };
    }
    if (dto.stock === 'available') {
      return {
        items: productsWithStock.filter((p) => p.totalStock > 0),
        total,
        page,
        limit,
      };
    }

    return { items: productsWithStock, total, page, limit };
  }

  async listPublic(dto: ListPublicProductsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (dto.categoryId) where.categoryId = dto.categoryId;

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { slug: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const sortField = dto.sort ?? 'createdAt';

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: { position: 'asc' },
            take: 2,
            select: { id: true, thumbUrl: true, cardUrl: true, url: true },
          },
          variants: {
            where: { isActive: true },
            select: { stock: true, price: true, size: true, color: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true, measureTable: true },
        },
        images: { orderBy: { position: 'asc' } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!product || !product.isActive || product.deletedAt) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug ?? (await this.generateUniqueSlug(dto.name));

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug já em uso');

    const category = await prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Categoria não encontrada');

    return prisma.product.create({
      data: {
        id: createId(),
        slug,
        name: dto.name,
        description: dto.description,
        shortDescription: dto.shortDescription,
        basePrice: dto.basePrice,
        compareAtPrice: dto.compareAtPrice,
        categoryId: dto.categoryId,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        weight: dto.weight,
        width: dto.width,
        height: dto.height,
        length: dto.length,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
      },
      include: { category: true, images: true, variants: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    let slug = product.slug;
    if (dto.slug && dto.slug !== product.slug) {
      const existing = await prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug já em uso');
      }
      slug = dto.slug;
    }

    return prisma.product.update({
      where: { id },
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        shortDescription: dto.shortDescription,
        basePrice: dto.basePrice,
        compareAtPrice: dto.compareAtPrice,
        categoryId: dto.categoryId,
        isActive: dto.isActive,
        isFeatured: dto.isFeatured,
        weight: dto.weight,
        width: dto.width,
        height: dto.height,
        length: dto.length,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
      },
      include: { category: true, images: true, variants: true },
    });
  }

  async softDelete(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async restore(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    return prisma.product.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  async upsertVariants(productId: string, dto: UpsertVariantsDto) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const existingIds = new Set(product.variants.map((v) => v.id));
    const incomingIds = new Set(
      dto.variants.filter((v) => v.id).map((v) => v.id!),
    );

    const toDelete = product.variants.filter((v) => !incomingIds.has(v.id));

    await prisma.$transaction(async (tx) => {
      if (toDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: toDelete.map((v) => v.id) } },
        });
      }

      for (const variant of dto.variants) {
        const sku =
          variant.sku ||
          `${productId.slice(-6)}-${createId().slice(-4)}`.toUpperCase();

        if (variant.id && existingIds.has(variant.id)) {
          const existing = product.variants.find((v) => v.id === variant.id)!;
          const stockDiff = variant.stock - existing.stock;

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              sku,
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              price: variant.price,
              stock: variant.stock,
              isActive: variant.isActive ?? true,
            },
          });

          if (stockDiff !== 0) {
            await tx.stockMovement.create({
              data: {
                id: createId(),
                variantId: variant.id,
                type:
                  stockDiff > 0
                    ? StockMovementType.IN
                    : StockMovementType.ADJUST,
                quantity: Math.abs(stockDiff),
                reason: 'Ajuste manual via admin',
              },
            });
          }
        } else {
          const newId = createId();
          await tx.productVariant.create({
            data: {
              id: newId,
              productId,
              sku,
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              price: variant.price,
              stock: variant.stock,
              isActive: variant.isActive ?? true,
            },
          });

          if (variant.stock > 0) {
            await tx.stockMovement.create({
              data: {
                id: createId(),
                variantId: newId,
                type: StockMovementType.IN,
                quantity: variant.stock,
                reason: 'Estoque inicial',
              },
            });
          }
        }
      }
    });

    return this.getById(productId);
  }

  async bulkSetActive(ids: string[], active: boolean) {
    await prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { isActive: active },
    });
    return { updated: ids.length };
  }

  async getStats() {
    const [total, active, inactive] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { isActive: true, deletedAt: null } }),
      prisma.product.count({ where: { isActive: false, deletedAt: null } }),
    ]);

    const outOfStock = await prisma.product.count({
      where: {
        isActive: true,
        deletedAt: null,
        variants: {
          none: { stock: { gt: 0 }, isActive: true },
        },
      },
    });

    return { total, active, inactive, outOfStock };
  }
}
