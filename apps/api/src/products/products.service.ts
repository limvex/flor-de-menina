import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createId,
  prisma,
  Prisma,
  StockMovementType,
  StockMovementSource,
} from '@flor/database';
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
    const limit = dto.limit ?? 24;
    const skip = (page - 1) * limit;

    const variantWhere: Prisma.ProductVariantWhereInput = { isActive: true };
    if (dto.sizes?.length) variantWhere.size = { in: dto.sizes };
    if (dto.colors?.length) variantWhere.color = { in: dto.colors };

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (dto.categorySlug) where.category = { slug: dto.categorySlug };

    // Busca textual com pg_trgm: tolerante a typos (ex: "vestdo" → "vestido").
    // word_similarity casa termos curtos com substrings de textos maiores —
    // mais robusto que similarity() puro para nome de produto + descrição longa.
    // Para termos muito curtos (1 char) caímos em ILIKE puro pra não exigir trigram.
    let trigramOrderIds: string[] | null = null;
    const searchTerm = dto.search?.trim() ?? '';
    if (searchTerm.length >= 2) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Product"
        WHERE "isActive" = true
          AND "deletedAt" IS NULL
          AND (
            name ILIKE ${`%${searchTerm}%`}
            OR description ILIKE ${`%${searchTerm}%`}
            OR word_similarity(${searchTerm}, name) > 0.35
            OR (description IS NOT NULL AND word_similarity(${searchTerm}, description) > 0.35)
          )
        ORDER BY
          GREATEST(
            word_similarity(${searchTerm}, name),
            COALESCE(word_similarity(${searchTerm}, description), 0)
          ) DESC
        LIMIT 500
      `;
      const ids = rows.map((r) => r.id);
      if (ids.length === 0) {
        return { items: [], total: 0, page, limit, totalPages: 0 };
      }
      where.id = { in: ids };
      trigramOrderIds = ids;
    } else if (searchTerm.length === 1) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (dto.minPrice != null || dto.maxPrice != null) {
      where.basePrice = {};
      if (dto.minPrice != null)
        (where.basePrice as Prisma.DecimalFilter).gte = dto.minPrice;
      if (dto.maxPrice != null)
        (where.basePrice as Prisma.DecimalFilter).lte = dto.maxPrice;
    }

    // Filtro de variantes — produto deve ter ao menos uma variante com tamanho/cor informados
    if (dto.sizes?.length || dto.colors?.length) {
      where.variants = { some: variantWhere };
    }

    // Ordenação. Quando há busca trigram com sort=relevance, ordenamos pelo ranking
    // calculado no SQL raw (trigramOrderIds) — Prisma não tem operador de similarity nativo.
    let orderBy: Prisma.ProductOrderByWithRelationInput | undefined = {
      createdAt: 'desc',
    };
    if (dto.sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (dto.sort === 'price_asc') orderBy = { basePrice: 'asc' };
    else if (dto.sort === 'price_desc') orderBy = { basePrice: 'desc' };
    else if (dto.sort === 'relevance' && trigramOrderIds) {
      // Vamos ordenar manualmente em memória após o fetch
      orderBy = undefined;
    }
    // bestselling: padrão mais recente até Task #18+ trazer dados de pedido

    // Considera "novidade" produtos criados nos últimos 30 dias.
    const NEW_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

    // Quando ordenamos por relevância trigram, buscamos todos os IDs candidatos
    // (sem skip/take) e fatiamos manualmente para preservar a ordem do ranking.
    const useTrigramOrder = orderBy === undefined && trigramOrderIds != null;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        ...(useTrigramOrder ? {} : { skip, take: limit }),
        ...(orderBy ? { orderBy } : {}),
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: { position: 'asc' },
            take: 2,
            select: { cardUrl: true, url: true },
          },
          variants: {
            where: { isActive: true },
            select: {
              stock: true,
              price: true,
              size: true,
              color: true,
              colorHex: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    let pagedProducts = products;
    if (useTrigramOrder && trigramOrderIds) {
      const rank = new Map(trigramOrderIds.map((id, idx) => [id, idx]));
      const sorted = [...products].sort(
        (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
      );
      pagedProducts = sorted.slice(skip, skip + limit);
    }

    const items = pagedProducts.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      const isOutOfStock = totalStock === 0;
      // Mostra "Última peça" quando há 1 ou 2 unidades no estoque total.
      const isLastPiece = !isOutOfStock && totalStock <= 2;
      const isNew = Date.now() - p.createdAt.getTime() < NEW_THRESHOLD_MS;

      // Cores únicas (nome + hex) para swatches acessíveis no frontend.
      const colorHexSet = new Map<string, string>();
      p.variants.forEach((v) => {
        if (v.color) colorHexSet.set(v.color, v.colorHex ?? '#999999');
      });
      const availableColors = Array.from(colorHexSet.entries()).map(
        ([name, hex]) => ({ name, hex }),
      );

      const primaryImage = p.images[0]?.cardUrl ?? p.images[0]?.url ?? null;
      const secondaryImage = p.images[1]?.cardUrl ?? p.images[1]?.url ?? null;

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        basePrice: Number(p.basePrice),
        compareAtPrice:
          p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
        primaryImage,
        secondaryImage,
        isOutOfStock,
        isLastPiece,
        isNew,
        availableColors,
        category: p.category,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async getFacets(categorySlug?: string) {
    const productWhere: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(categorySlug && { category: { slug: categorySlug } }),
    };

    const [variants, priceAgg] = await Promise.all([
      prisma.productVariant.findMany({
        where: { isActive: true, product: productWhere },
        select: { size: true, color: true, colorHex: true },
      }),
      prisma.product.aggregate({
        where: productWhere,
        _min: { basePrice: true },
        _max: { basePrice: true },
      }),
    ]);

    const sizeSet = new Set<string>();
    variants.forEach((v) => {
      if (v.size) sizeSet.add(v.size);
    });
    const sizes = Array.from(sizeSet).sort();

    const colorsMap = new Map<string, string>();
    variants.forEach((v) => {
      if (v.color) colorsMap.set(v.color, v.colorHex ?? '#999999');
    });
    const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({
      name,
      hex,
    }));

    return {
      sizes,
      colors,
      priceMin: Number(priceAgg._min.basePrice ?? 0),
      priceMax: Number(priceAgg._max.basePrice ?? 1000),
    };
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
          select: { id: true, name: true, slug: true, sizeChart: true },
        },
        images: { orderBy: { position: 'asc' } },
        variants: {
          where: { isActive: true },
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
        },
      },
    });

    if (!product || !product.isActive || product.deletedAt) {
      throw new NotFoundException('Produto não encontrado');
    }

    const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
    const isOutOfStock = totalStock === 0;
    const isLastPiece = !isOutOfStock && totalStock <= 2;
    const NEW_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
    const isNew = Date.now() - product.createdAt.getTime() < NEW_THRESHOLD_MS;

    // Busca 4 produtos relacionados (mesma categoria, excluindo o atual)
    const relatedRaw = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        deletedAt: null,
      },
      take: 4,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: {
        images: {
          take: 2,
          orderBy: { position: 'asc' },
          select: { cardUrl: true, url: true },
        },
        variants: {
          where: { isActive: true },
          select: { stock: true, color: true, colorHex: true },
        },
        category: { select: { name: true, slug: true } },
      },
    });

    const relatedProducts = relatedRaw.map((p) => {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      const colorHexSet = new Map<string, string>();
      p.variants.forEach((v) => {
        if (v.color) colorHexSet.set(v.color, v.colorHex ?? '#999999');
      });
      const availableColors = Array.from(colorHexSet.entries()).map(
        ([name, hex]) => ({ name, hex }),
      );
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        basePrice: Number(p.basePrice),
        compareAtPrice:
          p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
        primaryImage: p.images[0]?.cardUrl ?? p.images[0]?.url ?? null,
        secondaryImage: p.images[1]?.cardUrl ?? p.images[1]?.url ?? null,
        availableColors,
        totalStock: stock,
        isOutOfStock: stock === 0,
        isLastPiece: stock > 0 && stock <= 2,
        isNew: Date.now() - p.createdAt.getTime() < NEW_THRESHOLD_MS,
        category: p.category,
      };
    });

    return {
      ...product,
      basePrice: Number(product.basePrice),
      compareAtPrice:
        product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
      totalStock,
      isOutOfStock,
      isLastPiece,
      isNew,
      relatedProducts,
    };
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
                source:
                  stockDiff > 0
                    ? StockMovementSource.MANUAL_IN
                    : StockMovementSource.MANUAL_ADJUST,
                quantity: Math.abs(stockDiff),
                stockBefore: existing.stock,
                stockAfter: variant.stock,
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
                source: StockMovementSource.MANUAL_IN,
                quantity: variant.stock,
                stockBefore: 0,
                stockAfter: variant.stock,
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
