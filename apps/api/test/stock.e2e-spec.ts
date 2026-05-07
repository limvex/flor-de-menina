import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { prisma, createId } from '@flor/database';
import { UserRole } from '@flor/database';

const TEST_ADMIN_EMAIL = 'e2e-stock-admin@test.local';
const TEST_ADMIN_PASSWORD = 'E2eStock@123';

const PREFIX = '[E2E-STOCK]';

async function cleanup() {
  const variants = await prisma.productVariant.findMany({
    where: { product: { name: { startsWith: PREFIX } } },
    select: { id: true },
  });
  const ids = variants.map((v) => v.id);
  if (ids.length) {
    await prisma.stockMovement.deleteMany({
      where: { variantId: { in: ids } },
    });
  }
  await prisma.product.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: PREFIX } } });
}

describe('Stock (e2e)', () => {
  let app: INestApplication;
  let authCookie: string;
  let variantId: string;
  let testAdminId: string;

  beforeAll(async () => {
    // Criar admin de teste
    const hash = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10);
    const admin = await prisma.user.upsert({
      where: { email: TEST_ADMIN_EMAIL },
      update: { passwordHash: hash, emailVerified: true },
      create: {
        id: createId(),
        email: TEST_ADMIN_EMAIL,
        passwordHash: hash,
        name: 'E2E Stock Admin',
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });
    testAdminId = admin.id;

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
      .post('/auth/admin/login')
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });
    expect(loginRes.status).toBe(200);
    authCookie = loginRes.headers['set-cookie'] as unknown as string;

    await cleanup();

    // Criar categoria + produto + variante de teste
    const cat = await prisma.category.create({
      data: {
        id: createId(),
        name: `${PREFIX} Cat`,
        slug: `e2e-stock-cat-${Date.now()}`,
        isActive: true,
      },
    });

    const product = await prisma.product.create({
      data: {
        id: createId(),
        name: `${PREFIX} Vestido`,
        slug: `e2e-stock-produto-${Date.now()}`,
        description: 'Produto de teste de estoque',
        basePrice: 100,
        categoryId: cat.id,
        isActive: true,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        id: createId(),
        productId: product.id,
        sku: `E2E-STOCK-${Date.now()}`,
        size: 'M',
        stock: 0,
        isActive: true,
      },
    });

    variantId = variant.id;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.session.deleteMany({ where: { userId: testAdminId } });
    await prisma.user.delete({ where: { id: testAdminId } });
    await app.close();
  });

  // T1 — GET /admin/stock exige autenticação
  it('GET /admin/stock — exige autenticação', async () => {
    const res = await request(app.getHttpServer()).get('/admin/stock');
    expect(res.status).toBe(401);
  });

  // T2 — GET /admin/stock retorna lista paginada
  it('GET /admin/stock — retorna lista com produtos', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/stock')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  // T3 — Cenário completo: entrada 10 → venda balcão 3 → ajuste para 8
  it('cenário: IN 10 → counter-sale 3 → ADJUST 8, final = 8', async () => {
    // IN 10
    const in10 = await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({ variantId, type: 'IN', source: 'MANUAL_IN', quantity: 10 });
    expect(in10.status).toBe(201);
    expect(in10.body.stockBefore).toBe(0);
    expect(in10.body.stockAfter).toBe(10);

    // counter-sale 3
    const sale = await request(app.getHttpServer())
      .post('/admin/stock/counter-sale')
      .set('Cookie', authCookie)
      .send({ variantId, quantity: 3 });
    expect(sale.status).toBe(201);
    expect(sale.body.stockBefore).toBe(10);
    expect(sale.body.stockAfter).toBe(7);

    // ADJUST para 8
    const adj = await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({
        variantId,
        type: 'ADJUST',
        source: 'MANUAL_ADJUST',
        quantity: 8,
      });
    expect(adj.status).toBe(201);
    expect(adj.body.stockBefore).toBe(7);
    expect(adj.body.stockAfter).toBe(8);

    const updated = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    expect(updated?.stock).toBe(8);
  });

  // T4 — Histórico tem 3 movimentações após cenário acima
  it('GET /admin/stock/variants/:id/movements — retorna 3 movimentos ordenados desc', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/stock/variants/${variantId}/movements`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    // primeiro item é o mais recente (ADJUST)
    expect(res.body.items[0].type).toBe('ADJUST');
  });

  // T5 — OUT bloqueia estoque negativo (409)
  it('POST /admin/stock/movements OUT sem allowNegative → 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({ variantId, type: 'OUT', source: 'LOSS', quantity: 100 });
    expect(res.status).toBe(409);
  });

  // T6 — OUT com allowNegative permite
  it('POST /admin/stock/movements OUT com allowNegative=true → 201, estoque negativo', async () => {
    const before = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    const res = await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({
        variantId,
        type: 'OUT',
        source: 'LOSS',
        quantity: 100,
        allowNegative: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.stockAfter).toBe((before?.stock ?? 0) - 100);

    // Restaurar para não quebrar outros testes
    await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({
        variantId,
        type: 'ADJUST',
        source: 'MANUAL_ADJUST',
        quantity: 8,
      });
  });

  // T7 — ADJUST quantity é estoque-alvo, delta é calculado
  it('POST ADJUST quantity=20 quando estoque=8 → delta = 12', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({
        variantId,
        type: 'ADJUST',
        source: 'MANUAL_ADJUST',
        quantity: 20,
      });
    expect(res.status).toBe(201);
    expect(res.body.stockBefore).toBe(8);
    expect(res.body.stockAfter).toBe(20);
    expect(res.body.quantity).toBe(12); // |delta|

    // Resetar para 8
    await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({
        variantId,
        type: 'ADJUST',
        source: 'MANUAL_ADJUST',
        quantity: 8,
      });
  });

  // T8 — counter-sale cria movimento com source=COUNTER_SALE
  it('POST /admin/stock/counter-sale → source=COUNTER_SALE, type=OUT', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/stock/counter-sale')
      .set('Cookie', authCookie)
      .send({ variantId, quantity: 1 });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe('COUNTER_SALE');
    expect(res.body.type).toBe('OUT');

    // Restaurar
    await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({
        variantId,
        type: 'ADJUST',
        source: 'MANUAL_ADJUST',
        quantity: 8,
      });
  });

  // T9 — status filter low/out/ok
  it('GET /admin/stock?status=low — filtra variantes com estoque baixo', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/stock?status=low')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    // estoque=8 >= LOW_STOCK_THRESHOLD(5), portanto produto de teste NÃO está em low
    const found = res.body.items.find((p: { variants: { id: string }[] }) =>
      p.variants.some((v) => v.id === variantId),
    );
    expect(found).toBeUndefined();
  });

  it('GET /admin/stock?status=ok — produto com estoque=8 aparece', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/stock?status=ok')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    const found = res.body.items.find((p: { variants: { id: string }[] }) =>
      p.variants.some((v) => v.id === variantId),
    );
    expect(found).toBeDefined();
  });

  // T10 — userId registrado no movimento
  it('POST movement registra userId do admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/stock/counter-sale')
      .set('Cookie', authCookie)
      .send({ variantId, quantity: 1 });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBeTruthy();
  });

  // T11 — race condition: duas movimentações simultâneas
  it('race condition: duas movimentações simultâneas não dessincronizam estoque', async () => {
    // Reset estoque para 10
    await request(app.getHttpServer())
      .post('/admin/stock/movements')
      .set('Cookie', authCookie)
      .send({
        variantId,
        type: 'ADJUST',
        source: 'MANUAL_ADJUST',
        quantity: 10,
      });

    // Disparar 2 vendas de 3 simultaneamente
    const [a, b] = await Promise.all([
      request(app.getHttpServer())
        .post('/admin/stock/counter-sale')
        .set('Cookie', authCookie)
        .send({ variantId, quantity: 3 }),
      request(app.getHttpServer())
        .post('/admin/stock/counter-sale')
        .set('Cookie', authCookie)
        .send({ variantId, quantity: 3 }),
    ]);

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    const updated = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    // 10 - 3 - 3 = 4
    expect(updated?.stock).toBe(4);
  });

  // T12 — GET histórico filtrado por tipo
  it('GET histórico filtrado por type=IN', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/stock/variants/${variantId}/movements?type=IN`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.items.every((m: { type: string }) => m.type === 'IN')).toBe(
      true,
    );
  });

  // T13 — GET detalhe da variante
  it('GET /admin/stock/variants/:id — retorna detalhe', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/stock/variants/${variantId}`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(variantId);
    expect(typeof res.body.stock).toBe('number');
    expect(Array.isArray(res.body.recentMovements)).toBe(true);
  });
});
