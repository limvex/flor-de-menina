import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../products.service';
import { prisma, createId } from '@flor/database';

/**
 * Suite de integração do catálogo público.
 *
 * Rodam contra o Postgres real (com pg_trgm) usando o seed padrão
 * (`pnpm --filter @flor/database db:reset`). Cada bloco cria um cenário
 * isolado com produtos prefixados por `tst-public-` e limpa ao final, sem
 * tocar nos produtos do seed (usados em alguns asserts somente leitura).
 */

const TEST_PREFIX = 'tst-public';

async function deleteTestProducts() {
  const products = await prisma.product.findMany({
    where: { slug: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  if (products.length === 0) return;
  const ids = products.map((p) => p.id);
  await prisma.stockMovement.deleteMany({
    where: { variant: { productId: { in: ids } } },
  });
  await prisma.productVariant.deleteMany({
    where: { productId: { in: ids } },
  });
  await prisma.product.deleteMany({ where: { id: { in: ids } } });
}

async function createTestProduct(opts: {
  name: string;
  slug?: string;
  basePrice: number;
  categorySlug?: string;
  isActive?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  description?: string;
  variants?: Array<{
    size?: string | null;
    color?: string;
    colorHex?: string;
    stock: number;
    isActive?: boolean;
  }>;
}) {
  const category = opts.categorySlug
    ? await prisma.category.findFirst({
        where: { slug: opts.categorySlug, parentId: null },
      })
    : await prisma.category.findFirst({
        where: { slug: 'vestidos', parentId: null },
      });
  if (!category) throw new Error('Categoria não encontrada para teste');

  const slug = opts.slug ?? `${TEST_PREFIX}-${createId().slice(-6)}`;
  const product = await prisma.product.create({
    data: {
      id: createId(),
      slug,
      name: opts.name,
      description: opts.description ?? `Descrição de teste — ${opts.name}`,
      basePrice: opts.basePrice,
      categoryId: category.id,
      isActive: opts.isActive ?? true,
      deletedAt: opts.deletedAt ?? null,
      createdAt: opts.createdAt ?? new Date(),
    },
  });

  for (const v of opts.variants ?? []) {
    await prisma.productVariant.create({
      data: {
        id: createId(),
        productId: product.id,
        sku: `${slug.slice(-6)}-${v.size ?? 'UN'}-${(v.color ?? 'XX').slice(0, 3)}-${createId().slice(-3)}`,
        size: v.size ?? null,
        color: v.color ?? null,
        colorHex: v.colorHex ?? null,
        stock: v.stock,
        isActive: v.isActive ?? true,
      },
    });
  }

  return product;
}

describe('ProductsService.listPublic — integração', () => {
  let service: ProductsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();
    service = module.get(ProductsService);

    await deleteTestProducts();
  });

  afterAll(async () => {
    await deleteTestProducts();
    await prisma.$disconnect();
  });

  describe('paginação', () => {
    it('retorna estrutura paginada com totalPages correto', async () => {
      const result = await service.listPublic({ page: 1, limit: 2 });
      expect(result).toMatchObject({
        page: 1,
        limit: 2,
      });
      expect(result.items.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThan(0);
      expect(result.totalPages).toBe(Math.ceil(result.total / 2));
    });

    it('respeita o parâmetro page', async () => {
      const all = await service.listPublic({ page: 1, limit: 100 });
      const p1 = await service.listPublic({ page: 1, limit: 2 });
      const p2 = await service.listPublic({ page: 2, limit: 2 });
      const p1Ids = p1.items.map((i) => i.id);
      const p2Ids = p2.items.map((i) => i.id);
      // Garantia de não sobrepor
      expect(p1Ids.some((id) => p2Ids.includes(id))).toBe(false);
      // Soma das páginas <= total
      expect(p1Ids.length + p2Ids.length).toBeLessThanOrEqual(all.total);
    });
  });

  describe('filtros', () => {
    it('filtra por categorySlug', async () => {
      const vestidos = await service.listPublic({
        categorySlug: 'vestidos',
        limit: 50,
      });
      expect(vestidos.items.length).toBeGreaterThan(0);
      expect(vestidos.items.every((p) => p.category.slug === 'vestidos')).toBe(
        true,
      );
    });

    it('filtra por sizes (multi)', async () => {
      const result = await service.listPublic({ sizes: ['M', 'G'], limit: 50 });
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('filtra por colors (multi)', async () => {
      const result = await service.listPublic({
        colors: ['Bege', 'Marrom'],
        limit: 50,
      });
      expect(result.items.length).toBeGreaterThan(0);
      // Todo produto retornado deve ter pelo menos uma das cores buscadas
      result.items.forEach((p) => {
        const names = p.availableColors.map((c) => c.name);
        const hasMatch = names.some((n) => ['Bege', 'Marrom'].includes(n));
        expect(hasMatch).toBe(true);
      });
    });

    it('filtra por minPrice/maxPrice', async () => {
      const result = await service.listPublic({
        minPrice: 200,
        maxPrice: 400,
        limit: 50,
      });
      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((p) => {
        expect(p.basePrice).toBeGreaterThanOrEqual(200);
        expect(p.basePrice).toBeLessThanOrEqual(400);
      });
    });

    it('combina vários filtros (categoria + tamanho + faixa)', async () => {
      const result = await service.listPublic({
        categorySlug: 'vestidos',
        sizes: ['M'],
        minPrice: 200,
        maxPrice: 500,
        limit: 50,
      });
      result.items.forEach((p) => {
        expect(p.category.slug).toBe('vestidos');
        expect(p.basePrice).toBeGreaterThanOrEqual(200);
        expect(p.basePrice).toBeLessThanOrEqual(500);
      });
    });

    it('filtro impossível retorna empty result sem erro', async () => {
      const result = await service.listPublic({
        sizes: ['XXX-INEXISTENTE'],
        colors: ['CorQueNaoExiste'],
        limit: 10,
      });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('busca pg_trgm', () => {
    it('encontra produto por nome (match exato)', async () => {
      const result = await service.listPublic({ search: 'vestido', limit: 20 });
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(
        result.items.every((p) => p.name.toLowerCase().includes('vestido')),
      ).toBe(true);
    });

    it('encontra produto com TYPO (vestdo → vestido)', async () => {
      const result = await service.listPublic({ search: 'vestdo', limit: 20 });
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(
        result.items.some((p) => p.name.toLowerCase().includes('vestido')),
      ).toBe(true);
    });

    it('busca em descrição também (renda → Blusa de Renda)', async () => {
      const result = await service.listPublic({ search: 'renda', limit: 20 });
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(
        result.items.some((p) => p.name.toLowerCase().includes('renda')),
      ).toBe(true);
    });

    it('busca sem resultado retorna lista vazia (não erro)', async () => {
      const result = await service.listPublic({
        search: 'xyz-termo-zero-resultado-zzz',
        limit: 10,
      });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('busca vazia (string em branco) não filtra', async () => {
      const all = await service.listPublic({ limit: 50 });
      const blank = await service.listPublic({ search: '   ', limit: 50 });
      expect(blank.total).toBe(all.total);
    });
  });

  describe('ordenação', () => {
    it('sort=price_asc ordena ascendente', async () => {
      const result = await service.listPublic({
        sort: 'price_asc',
        limit: 50,
      });
      const prices = result.items.map((p) => p.basePrice);
      const sorted = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sorted);
    });

    it('sort=price_desc ordena descendente', async () => {
      const result = await service.listPublic({
        sort: 'price_desc',
        limit: 50,
      });
      const prices = result.items.map((p) => p.basePrice);
      const sorted = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sorted);
    });

    it('sort=newest ordena por createdAt desc', async () => {
      const result = await service.listPublic({ sort: 'newest', limit: 50 });
      const dates = result.items.map((p) => new Date(p.createdAt).getTime());
      const sorted = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sorted);
    });
  });

  describe('exclusões', () => {
    it('exclui produtos inativos (isActive: false)', async () => {
      const inactive = await createTestProduct({
        name: 'Tst Produto Inativo',
        basePrice: 50,
        isActive: false,
        variants: [{ size: 'M', color: 'Preto', stock: 5 }],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        expect(result.items.find((p) => p.id === inactive.id)).toBeUndefined();
      } finally {
        await deleteTestProducts();
      }
    });

    it('exclui produtos com deletedAt', async () => {
      const deleted = await createTestProduct({
        name: 'Tst Produto Deletado',
        basePrice: 50,
        deletedAt: new Date(),
        variants: [{ size: 'M', color: 'Preto', stock: 5 }],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        expect(result.items.find((p) => p.id === deleted.id)).toBeUndefined();
      } finally {
        await deleteTestProducts();
      }
    });
  });

  describe('campos calculados', () => {
    it('isOutOfStock = true quando soma das variantes ativas é zero', async () => {
      const p = await createTestProduct({
        name: 'Tst Esgotado',
        basePrice: 100,
        variants: [
          { size: 'P', color: 'Preto', stock: 0 },
          { size: 'M', color: 'Preto', stock: 0 },
        ],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        const found = result.items.find((x) => x.id === p.id);
        expect(found).toBeDefined();
        expect(found!.isOutOfStock).toBe(true);
        expect(found!.isLastPiece).toBe(false);
      } finally {
        await deleteTestProducts();
      }
    });

    it('isLastPiece = true quando totalStock <= 2 e > 0', async () => {
      const p = await createTestProduct({
        name: 'Tst Ultima Peca',
        basePrice: 100,
        variants: [{ size: 'M', color: 'Preto', stock: 2 }],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        const found = result.items.find((x) => x.id === p.id);
        expect(found?.isLastPiece).toBe(true);
        expect(found?.isOutOfStock).toBe(false);
      } finally {
        await deleteTestProducts();
      }
    });

    it('isLastPiece = false quando totalStock > 2', async () => {
      const p = await createTestProduct({
        name: 'Tst Estoque OK',
        basePrice: 100,
        variants: [{ size: 'M', color: 'Preto', stock: 5 }],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        const found = result.items.find((x) => x.id === p.id);
        expect(found?.isLastPiece).toBe(false);
        expect(found?.isOutOfStock).toBe(false);
      } finally {
        await deleteTestProducts();
      }
    });

    it('isNew = true quando createdAt < 30 dias', async () => {
      const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const p = await createTestProduct({
        name: 'Tst Recente',
        basePrice: 100,
        createdAt: recent,
        variants: [{ size: 'M', color: 'Preto', stock: 5 }],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        const found = result.items.find((x) => x.id === p.id);
        expect(found?.isNew).toBe(true);
      } finally {
        await deleteTestProducts();
      }
    });

    it('isNew = false quando createdAt > 30 dias', async () => {
      const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const p = await createTestProduct({
        name: 'Tst Antigo',
        basePrice: 100,
        createdAt: old,
        variants: [{ size: 'M', color: 'Preto', stock: 5 }],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        const found = result.items.find((x) => x.id === p.id);
        expect(found?.isNew).toBe(false);
      } finally {
        await deleteTestProducts();
      }
    });

    it('availableColors retorna cores únicas com nome+hex', async () => {
      const p = await createTestProduct({
        name: 'Tst Cores Unicas',
        basePrice: 100,
        variants: [
          { size: 'P', color: 'Preto', colorHex: '#000', stock: 3 },
          { size: 'M', color: 'Preto', colorHex: '#000', stock: 3 },
          { size: 'P', color: 'Branco', colorHex: '#FFF', stock: 3 },
        ],
      });
      try {
        const result = await service.listPublic({ limit: 200 });
        const found = result.items.find((x) => x.id === p.id);
        expect(found).toBeDefined();
        expect(found!.availableColors).toHaveLength(2);
        const names = found!.availableColors.map((c) => c.name).sort();
        expect(names).toEqual(['Branco', 'Preto']);
        const preto = found!.availableColors.find((c) => c.name === 'Preto');
        expect(preto?.hex).toBe('#000');
      } finally {
        await deleteTestProducts();
      }
    });

    it('aceita sort inválido sem erro (cai em relevance)', async () => {
      // Service recebe via DTO transform, mas por garantia: passar string fora
      // do enum não deve quebrar a query.
      const result = await service.listPublic({
        sort: 'xpto-invalido' as never,
        limit: 5,
      });
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('page muito alta (page=999) retorna lista vazia sem erro', async () => {
      const result = await service.listPublic({ page: 999, limit: 24 });
      expect(result.items).toEqual([]);
      expect(result.total).toBeGreaterThan(0);
    });
  });
});

describe('ProductsService.getFacets — integração', () => {
  let service: ProductsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();
    service = module.get(ProductsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('retorna sizes, colors com hex, priceMin e priceMax', async () => {
    const facets = await service.getFacets();
    expect(Array.isArray(facets.sizes)).toBe(true);
    expect(Array.isArray(facets.colors)).toBe(true);
    expect(facets.sizes.length).toBeGreaterThan(0);
    expect(facets.colors.length).toBeGreaterThan(0);
    facets.colors.forEach((c) => {
      expect(c.name).toBeDefined();
      expect(c.hex).toBeDefined();
      expect(c.hex).toMatch(/^#/);
    });
    expect(facets.priceMin).toBeGreaterThan(0);
    expect(facets.priceMax).toBeGreaterThanOrEqual(facets.priceMin);
  });

  it('sizes vem ordenado alfabeticamente', async () => {
    const facets = await service.getFacets();
    const sorted = [...facets.sizes].sort();
    expect(facets.sizes).toEqual(sorted);
  });

  it('filtrado por categorySlug retorna só facets daquela categoria', async () => {
    const allFacets = await service.getFacets();
    const bolsasFacets = await service.getFacets('bolsas');

    // Bolsas no seed só tem cor Caramelo, sem tamanho.
    expect(bolsasFacets.sizes).toEqual([]);
    expect(bolsasFacets.colors.map((c) => c.name)).toContain('Caramelo');
    // Cores totais devem incluir Caramelo + outras
    expect(allFacets.colors.length).toBeGreaterThan(bolsasFacets.colors.length);
  });

  it('categoria sem produtos retorna facets vazios + range default', async () => {
    const facets = await service.getFacets('categoria-que-nao-existe');
    expect(facets.sizes).toEqual([]);
    expect(facets.colors).toEqual([]);
    expect(facets.priceMin).toBe(0);
    expect(facets.priceMax).toBe(1000);
  });
});
