import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { prisma, createId, UserRole } from '@flor/database';

const TEST_EMAIL = 'e2e-pdp@test.local';
const TEST_PASSWORD = 'E2ePdp@123';
const PREFIX = '[E2E-#13]';

async function cleanup() {
  await prisma.wishlistItem.deleteMany({
    where: { product: { name: { startsWith: PREFIX } } },
  });
  await prisma.wishlist.deleteMany({
    where: {
      OR: [
        { user: { email: TEST_EMAIL } },
        { items: { some: { product: { name: { startsWith: PREFIX } } } } },
      ],
    },
  });
  await prisma.product.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.session.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('PDP + Wishlist (e2e)', () => {
  let app: INestApplication;
  let authCookie = '';
  let userId = '';
  let activeSlug = '';
  let activeProductId = '';
  let inactiveSlug = '';
  let deletedSlug = '';
  let variantId = '';

  beforeAll(async () => {
    await cleanup();

    const hash = await bcrypt.hash(TEST_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        id: createId(),
        email: TEST_EMAIL,
        passwordHash: hash,
        name: `${PREFIX} Customer`,
        role: UserRole.CUSTOMER,
        emailVerified: true,
      },
    });
    userId = user.id;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/customer/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers['set-cookie'];
    authCookie = Array.isArray(setCookie)
      ? setCookie.join('; ')
      : (setCookie ?? '');

    const category = await prisma.category.create({
      data: {
        id: createId(),
        name: `${PREFIX} Categoria`,
        slug: `e2e-13-cat-${Date.now()}`,
        isActive: true,
      },
    });

    const activeProduct = await prisma.product.create({
      data: {
        id: createId(),
        name: `${PREFIX} Produto Ativo`,
        slug: `e2e-13-ativo-${Date.now()}`,
        description: 'Produto ativo para e2e',
        basePrice: 149.9,
        categoryId: category.id,
        isActive: true,
      },
    });
    activeSlug = activeProduct.slug;
    activeProductId = activeProduct.id;

    const inactiveProduct = await prisma.product.create({
      data: {
        id: createId(),
        name: `${PREFIX} Produto Inativo`,
        slug: `e2e-13-inativo-${Date.now()}`,
        description: 'Produto inativo para e2e',
        basePrice: 199.9,
        categoryId: category.id,
        isActive: false,
      },
    });
    inactiveSlug = inactiveProduct.slug;

    const deletedProduct = await prisma.product.create({
      data: {
        id: createId(),
        name: `${PREFIX} Produto Deletado`,
        slug: `e2e-13-deletado-${Date.now()}`,
        description: 'Produto deletado para e2e',
        basePrice: 99.9,
        categoryId: category.id,
        isActive: true,
        deletedAt: new Date(),
      },
    });
    deletedSlug = deletedProduct.slug;

    await prisma.productImage.createMany({
      data: [
        {
          id: createId(),
          productId: activeProduct.id,
          url: 'https://example.com/full-1.jpg',
          cardUrl: 'https://example.com/card-1.jpg',
          thumbUrl: 'https://example.com/thumb-1.jpg',
          alt: 'Imagem 1',
          position: 0,
        },
        {
          id: createId(),
          productId: activeProduct.id,
          url: 'https://example.com/full-2.jpg',
          cardUrl: 'https://example.com/card-2.jpg',
          thumbUrl: 'https://example.com/thumb-2.jpg',
          alt: 'Imagem 2',
          position: 1,
        },
      ],
    });

    const variant = await prisma.productVariant.create({
      data: {
        id: createId(),
        productId: activeProduct.id,
        sku: `E2E13-${Date.now()}`,
        size: 'M',
        color: 'Caramelo',
        colorHex: '#a47149',
        stock: 2,
        isActive: true,
      },
    });
    variantId = variant.id;

    for (let i = 0; i < 6; i += 1) {
      const related = await prisma.product.create({
        data: {
          id: createId(),
          name: `${PREFIX} Relacionado ${i + 1}`,
          slug: `e2e-13-rel-${i}-${Date.now()}`,
          description: 'Relacionado',
          basePrice: 89.9 + i,
          categoryId: category.id,
          isActive: true,
        },
      });
      await prisma.productVariant.create({
        data: {
          id: createId(),
          productId: related.id,
          sku: `E2E13-REL-${i}-${Date.now()}`,
          size: 'P',
          color: 'Preto',
          colorHex: '#000000',
          stock: 3,
          isActive: true,
        },
      });
    }
  });

  afterAll(async () => {
    await cleanup();
    if (app) await app.close();
    if (userId) {
      await prisma.session.deleteMany({ where: { userId } });
    }
  });

  describe('GET /products/public/:slug', () => {
    it('retorna 200 com produto completo (id, name, slug, images, variants, category, relatedProducts)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/products/public/${activeSlug}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: activeProductId,
          name: expect.any(String),
          slug: activeSlug,
          images: expect.any(Array),
          variants: expect.any(Array),
          category: expect.objectContaining({
            name: expect.any(String),
            slug: expect.any(String),
          }),
          relatedProducts: expect.any(Array),
        }),
      );
    });

    it('retorna 200 e inclui totalStock, isOutOfStock, isLastPiece, isNew', async () => {
      const res = await request(app.getHttpServer()).get(
        `/products/public/${activeSlug}`,
      );
      expect(res.status).toBe(200);
      expect(typeof res.body.totalStock).toBe('number');
      expect(typeof res.body.isOutOfStock).toBe('boolean');
      expect(typeof res.body.isLastPiece).toBe('boolean');
      expect(typeof res.body.isNew).toBe('boolean');
    });

    it('retorna 200 e relatedProducts tem no máximo 4 itens', async () => {
      const res = await request(app.getHttpServer()).get(
        `/products/public/${activeSlug}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.relatedProducts.length).toBeLessThanOrEqual(4);
    });

    it('retorna 404 para slug inexistente', async () => {
      const res = await request(app.getHttpServer()).get(
        '/products/public/slug-inexistente-xyzabc',
      );
      expect(res.status).toBe(404);
    });

    it('retorna 404 para produto deletado (soft delete)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/products/public/${deletedSlug}`,
      );
      expect(res.status).toBe(404);
    });

    it('retorna 404 para produto inativo (isActive: false)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/products/public/${inactiveSlug}`,
      );
      expect(res.status).toBe(404);
    });

    it('campo basePrice é number (não string)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/products/public/${activeSlug}`,
      );
      expect(res.status).toBe(200);
      expect(typeof res.body.basePrice).toBe('number');
    });

    it('campo compareAtPrice é null quando não definido', async () => {
      const res = await request(app.getHttpServer()).get(
        `/products/public/${activeSlug}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.compareAtPrice).toBeNull();
    });
  });

  describe('Wishlist — autenticação', () => {
    it('GET /wishlist sem auth retorna 401', async () => {
      const res = await request(app.getHttpServer()).get('/wishlist');
      expect(res.status).toBe(401);
    });

    it('GET /wishlist/ids sem auth retorna 401', async () => {
      const res = await request(app.getHttpServer()).get('/wishlist/ids');
      expect(res.status).toBe(401);
    });

    it('POST /wishlist sem auth retorna 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/wishlist')
        .send({ productId: activeProductId });
      expect(res.status).toBe(401);
    });

    it('DELETE /wishlist/:id sem auth retorna 401', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/wishlist/${activeProductId}`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe('Wishlist — CRUD autenticado', () => {
    it('GET /wishlist retorna array vazio inicialmente', async () => {
      const res = await request(app.getHttpServer())
        .get('/wishlist')
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('GET /wishlist/ids retorna { ids: [] } inicialmente', async () => {
      const res = await request(app.getHttpServer())
        .get('/wishlist/ids')
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ids: [] });
    });

    it('POST /wishlist adiciona produto (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/wishlist')
        .set('Cookie', authCookie)
        .send({ productId: activeProductId });
      expect(res.status).toBe(201);
    });

    it('POST /wishlist com mesmo produto é idempotente (não duplica, retorna 200 ou 201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/wishlist')
        .set('Cookie', authCookie)
        .send({ productId: activeProductId });
      expect([200, 201]).toContain(res.status);

      const items = await prisma.wishlistItem.findMany({
        where: { productId: activeProductId, wishlist: { userId } },
      });
      expect(items.length).toBe(1);
    });

    it('GET /wishlist/ids inclui productId após adicionar', async () => {
      const res = await request(app.getHttpServer())
        .get('/wishlist/ids')
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body.ids).toContain(activeProductId);
    });

    it('GET /wishlist retorna item com product.name, product.primaryImage, product.totalStock', async () => {
      const res = await request(app.getHttpServer())
        .get('/wishlist')
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body[0].product.name).toBeTruthy();
      expect(res.body[0].product.primaryImage).toBeTruthy();
      expect(typeof res.body[0].product.totalStock).toBe('number');
    });

    it('DELETE /wishlist/:productId remove item (200)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/wishlist/${activeProductId}`)
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('GET /wishlist/ids não inclui productId após remover', async () => {
      const res = await request(app.getHttpServer())
        .get('/wishlist/ids')
        .set('Cookie', authCookie);
      expect(res.status).toBe(200);
      expect(res.body.ids).not.toContain(activeProductId);
    });

    it('POST /wishlist aceita variantId opcional', async () => {
      const res = await request(app.getHttpServer())
        .post('/wishlist')
        .set('Cookie', authCookie)
        .send({ productId: activeProductId, variantId });
      expect(res.status).toBe(201);
      expect(res.body.variantId).toBe(variantId);
    });
  });
});
