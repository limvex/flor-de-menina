import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { prisma, createId, UserRole } from '@flor/database';

const PREFIX = '[E2E-CART]';

async function cleanup() {
  await prisma.cartItem.deleteMany({
    where: { product: { name: { startsWith: PREFIX } } },
  });
  await prisma.cart.deleteMany({
    where: { user: { email: { startsWith: 'e2e-cart' } } },
  });
  await prisma.product.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.category.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'e2e-cart' } },
  });
}

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let user1Cookie: string;
  let user2Cookie: string;
  let variantId: string;
  let variantId2: string;

  beforeAll(async () => {
    await cleanup();

    // Criar categoria e produto de teste
    const category = await prisma.category.create({
      data: {
        id: createId(),
        slug: `${PREFIX.toLowerCase()}-cat`,
        name: `${PREFIX} Cat`,
      },
    });

    const product = await prisma.product.create({
      data: {
        id: createId(),
        slug: `${PREFIX.toLowerCase()}-prod`.replace(/[\[\]]/g, ''),
        name: `${PREFIX} Produto`,
        description: 'Teste',
        basePrice: 150,
        categoryId: category.id,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        id: createId(),
        productId: product.id,
        sku: `${PREFIX}-SKU-1`,
        size: 'M',
        color: 'Azul',
        stock: 2, // apenas 2 unidades para teste de race condition
      },
    });
    variantId = variant.id;

    const variant2 = await prisma.productVariant.create({
      data: {
        id: createId(),
        productId: product.id,
        sku: `${PREFIX}-SKU-2`,
        size: 'G',
        color: 'Vermelho',
        stock: 5,
      },
    });
    variantId2 = variant2.id;

    // Criar dois usuários de teste
    const hash = await bcrypt.hash('Cart@Teste123', 10);

    await prisma.user.createMany({
      data: [
        {
          id: createId(),
          email: 'e2e-cart-user1@test.local',
          passwordHash: hash,
          name: 'E2E Cart User 1',
          role: UserRole.CUSTOMER,
          emailVerified: true,
        },
        {
          id: createId(),
          email: 'e2e-cart-user2@test.local',
          passwordHash: hash,
          name: 'E2E Cart User 2',
          role: UserRole.CUSTOMER,
          emailVerified: true,
        },
      ],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Login user1
    const r1 = await request(app.getHttpServer())
      .post('/auth/customer/login')
      .send({ email: 'e2e-cart-user1@test.local', password: 'Cart@Teste123' });
    user1Cookie = r1.headers['set-cookie']?.[0] ?? '';

    // Login user2
    const r2 = await request(app.getHttpServer())
      .post('/auth/customer/login')
      .send({ email: 'e2e-cart-user2@test.local', password: 'Cart@Teste123' });
    user2Cookie = r2.headers['set-cookie']?.[0] ?? '';
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  afterEach(async () => {
    // Limpa carrinhos após cada teste para estado limpo
    await prisma.cartItem.deleteMany({
      where: { product: { name: { startsWith: PREFIX } } },
    });
  });

  it('GET /cart retorna carrinho vazio para usuário sem itens', async () => {
    const res = await request(app.getHttpServer())
      .get('/cart')
      .set('Cookie', user1Cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      items: [],
      itemCount: 0,
      subtotal: 0,
    });
  });

  it('POST /cart/items adiciona item e cria reserva', async () => {
    const res = await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user1Cookie)
      .send({ variantId, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].variantId).toBe(variantId);
    expect(res.body.items[0].reservedUntil).toBeTruthy();
    expect(res.body.itemCount).toBe(1);
  });

  it('PATCH /cart/items/:variantId atualiza quantidade e renova reserva', async () => {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user1Cookie)
      .send({ variantId: variantId2, quantity: 1 });

    const before = Date.now();
    const res = await request(app.getHttpServer())
      .patch(`/cart/items/${variantId2}`)
      .set('Cookie', user1Cookie)
      .send({ quantity: 2 });

    expect(res.status).toBe(200);
    const item = res.body.items.find(
      (i: { variantId: string }) => i.variantId === variantId2,
    );
    expect(item.quantity).toBe(2);
    expect(new Date(item.reservedUntil).getTime()).toBeGreaterThan(
      before + 14 * 60 * 1000,
    );
  });

  it('PATCH retorna 409 quando quantidade solicitada excede estoque disponível', async () => {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user1Cookie)
      .send({ variantId: variantId2, quantity: 1 });

    const res = await request(app.getHttpServer())
      .patch(`/cart/items/${variantId2}`)
      .set('Cookie', user1Cookie)
      .send({ quantity: 99 });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('available');
  });

  it('DELETE /cart/items/:variantId remove item do carrinho', async () => {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user1Cookie)
      .send({ variantId, quantity: 1 });

    const res = await request(app.getHttpServer())
      .delete(`/cart/items/${variantId}`)
      .set('Cookie', user1Cookie);

    expect(res.status).toBe(200);
    expect(
      res.body.items.find(
        (i: { variantId: string }) => i.variantId === variantId,
      ),
    ).toBeUndefined();
  });

  it('Race condition: dois usuários adicionando a última unidade → apenas um sucede', async () => {
    // Reset: garante que stock=1 para essa variante
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: 1 },
    });

    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/cart/items')
        .set('Cookie', user1Cookie)
        .send({ variantId, quantity: 1 }),
      request(app.getHttpServer())
        .post('/cart/items')
        .set('Cookie', user2Cookie)
        .send({ variantId, quantity: 1 }),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201); // pelo menos um sucede
    expect(statuses).toContain(409); // o outro recebe conflito

    // Restaura stock
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: 2 },
    });
  });

  it('POST /cart/merge mescla itens do localStorage ao carrinho logado', async () => {
    const res = await request(app.getHttpServer())
      .post('/cart/merge')
      .set('Cookie', user1Cookie)
      .send({
        items: [
          { variantId, quantity: 1 },
          { variantId: variantId2, quantity: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.cart.items).toHaveLength(2);
    expect(res.body.discarded).toHaveLength(0);
  });

  it('POST /cart/merge descarta item sem estoque com reason out_of_stock', async () => {
    // Zera estoque da variante
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: 0 },
    });

    const res = await request(app.getHttpServer())
      .post('/cart/merge')
      .set('Cookie', user1Cookie)
      .send({ items: [{ variantId, quantity: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.discarded).toEqual(
      expect.arrayContaining([{ variantId, reason: 'out_of_stock' }]),
    );

    // Restaura
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: 2 },
    });
  });

  it('POST /cart/merge com mesmo item: soma quantidades corretamente', async () => {
    // Usuário já tem 1 no carrinho
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user1Cookie)
      .send({ variantId: variantId2, quantity: 1 });

    // Merge com mais 1
    const res = await request(app.getHttpServer())
      .post('/cart/merge')
      .set('Cookie', user1Cookie)
      .send({ items: [{ variantId: variantId2, quantity: 2 }] });

    expect(res.status).toBe(201);
    const item = res.body.cart.items.find(
      (i: { variantId: string }) => i.variantId === variantId2,
    );
    // 1 existente + 2 do merge = 3 (stock=5, ok)
    expect(item.quantity).toBe(3);
  });

  it('DELETE /cart limpa o carrinho inteiro', async () => {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user1Cookie)
      .send({ variantId: variantId2, quantity: 1 });

    const res = await request(app.getHttpServer())
      .delete('/cart')
      .set('Cookie', user1Cookie);

    expect(res.status).toBe(204);

    const cart = await request(app.getHttpServer())
      .get('/cart')
      .set('Cookie', user1Cookie);
    expect(cart.body.items).toHaveLength(0);
  });

  it('Reserva de outro usuário reduz estoque disponível', async () => {
    // User2 reserva 1 unidade (stock=2)
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user2Cookie)
      .send({ variantId, quantity: 1 });

    // User1 tenta pegar as 2 → deve falhar (apenas 1 disponível)
    const res = await request(app.getHttpServer())
      .post('/cart/items')
      .set('Cookie', user1Cookie)
      .send({ variantId, quantity: 2 });

    expect(res.status).toBe(409);
    expect(res.body.available).toBe(1);
  });
});
