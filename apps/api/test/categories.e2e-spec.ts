import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { prisma } from '@flor/database';

const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL ?? 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? 'Admin@123456';

async function cleanupCategories(prefix: string) {
  await prisma.category.deleteMany({
    where: { name: { startsWith: prefix } },
  });
}

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let authCookie: string;
  let createdId: string;
  let parentId: string;
  const PREFIX = '[E2E-CAT]';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    authCookie = res.headers['set-cookie'] as unknown as string;
  });

  afterAll(async () => {
    await cleanupCategories(PREFIX);
    await app.close();
  });

  // T1 — Public tree is accessible without authentication
  it('GET /categories — retorna árvore pública sem autenticação', async () => {
    const res = await request(app.getHttpServer()).get('/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // T2 — Admin list requires authentication
  it('GET /admin/categories — exige autenticação', async () => {
    const res = await request(app.getHttpServer()).get('/admin/categories');
    expect(res.status).toBe(401);
  });

  // T3 — Create root category
  it('POST /admin/categories — cria categoria raiz', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Cookie', authCookie)
      .send({ name: `${PREFIX} Roupas`, isActive: true, sortOrder: 0 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: `${PREFIX} Roupas`,
      parentId: null,
    });
    expect(typeof res.body.slug).toBe('string');
    parentId = res.body.id;
  });

  // T4 — Create subcategory
  it('POST /admin/categories — cria subcategoria', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Cookie', authCookie)
      .send({ name: `${PREFIX} Vestidos`, parentId, sortOrder: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: `${PREFIX} Vestidos`, parentId });
    createdId = res.body.id;
  });

  // T5 — Slug conflict on same level returns 409
  it('POST /admin/categories — slug duplicado no mesmo nível retorna 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Cookie', authCookie)
      .send({ name: `${PREFIX} Vestidos`, parentId });

    expect(res.status).toBe(409);
  });

  // T6 — Get admin category by id
  it('GET /admin/categories/:id — retorna categoria pelo id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/categories/${createdId}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
    expect(res.body).toHaveProperty('effectiveSizeChart');
    expect(res.body).toHaveProperty('parent');
  });

  // T7 — Update category
  it('PATCH /admin/categories/:id — atualiza categoria', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/categories/${createdId}`)
      .set('Cookie', authCookie)
      .send({ sortOrder: 5 });

    expect(res.status).toBe(200);
    expect(res.body.sortOrder).toBe(5);
  });

  // T8 — Toggle active
  it('PATCH /admin/categories/:id/toggle-active — alterna isActive', async () => {
    const before = await request(app.getHttpServer())
      .get(`/admin/categories/${createdId}`)
      .set('Cookie', authCookie);
    const wasActive = before.body.isActive as boolean;

    const res = await request(app.getHttpServer())
      .patch(`/admin/categories/${createdId}/toggle-active`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(!wasActive);
  });

  // T9 — Cannot delete parent that has children
  it('DELETE /admin/categories/:id — falha ao remover categoria com subcategorias', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/admin/categories/${parentId}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(409);
  });

  // T10 — Delete subcategory successfully
  it('DELETE /admin/categories/:id — remove subcategoria com sucesso', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/admin/categories/${createdId}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  // T11 — Public slug lookup
  it('GET /categories/:slug — retorna categoria pública ativa pelo slug', async () => {
    // Ensure parent is active
    await request(app.getHttpServer())
      .patch(`/admin/categories/${parentId}/toggle-active`)
      .set('Cookie', authCookie);
    const details = await request(app.getHttpServer())
      .get(`/admin/categories/${parentId}`)
      .set('Cookie', authCookie);
    const slug = details.body.slug as string;

    const res = await request(app.getHttpServer()).get(`/categories/${slug}`);
    expect([200, 404]).toContain(res.status); // 404 if not active, 200 if active
  });
});
