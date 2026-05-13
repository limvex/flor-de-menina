import { config as loadRootEnv } from 'dotenv';
import { resolve } from 'path';

// Monorepo: `.env` fica na raiz (mesmo arquivo que API / Next).
loadRootEnv({ path: resolve(__dirname, '../../../.env') });
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  UserRole,
  StockMovementType,
  StockMovementSource,
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  PaymentMethod,
  ShippingProvider,
} from '../src/generated/prisma';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcrypt';
import { INSTITUTIONAL_PAGES_SEED } from './institutional-pages-seed';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SEED_TEST_ORDER_PREFIX = 'FDM-2026-T69-';

async function removeSeedTestOrders() {
  const existing = await prisma.order.findMany({
    where: { number: { startsWith: SEED_TEST_ORDER_PREFIX } },
    select: { id: true },
  });
  const eids = existing.map((o) => o.id);
  if (eids.length === 0) return;

  const outs = await prisma.stockMovement.findMany({
    where: {
      orderId: { in: eids },
      type: StockMovementType.OUT,
      source: StockMovementSource.ONLINE_ORDER,
    },
  });
  for (const m of outs) {
    await prisma.productVariant.update({
      where: { id: m.variantId },
      data: { stock: { increment: m.quantity } },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderStatusHistory.deleteMany({ where: { orderId: { in: eids } } });
    await tx.stockMovement.deleteMany({ where: { orderId: { in: eids } } });
    await tx.payment.deleteMany({ where: { orderId: { in: eids } } });
    await tx.shipping.deleteMany({ where: { orderId: { in: eids } } });
    await tx.orderItem.deleteMany({ where: { orderId: { in: eids } } });
    await tx.couponUsage.deleteMany({ where: { orderId: { in: eids } } });
    await tx.emailLog.deleteMany({ where: { orderId: { in: eids } } });
    await tx.order.deleteMany({ where: { id: { in: eids } } });
  });
}

async function seedTestOrders(cliente: { id: string }, adminUserId: string) {
  await removeSeedTestOrders();

  const shipAddr = {
    recipientName: 'Ana Lima',
    zipCode: '57035-270',
    street: 'Rua João Pessoa',
    number: '123',
    complement: 'Apto 4',
    neighborhood: 'Centro',
    city: 'Maceió',
    state: 'AL',
    country: 'BR',
  };

  const blusaP = await prisma.productVariant.findFirst({
    where: { product: { slug: 'blusa-cropped-camel' }, size: 'P' },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });
  const vestidoMidiM = await prisma.productVariant.findFirst({
    where: { product: { slug: 'vestido-midi-floral-marrom' }, size: 'M' },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });
  const vestidoLongoP = await prisma.productVariant.findFirst({
    where: { product: { slug: 'vestido-longo-bege' }, size: 'P' },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });
  const bolsa = await prisma.productVariant.findFirst({
    where: { product: { slug: 'bolsa-couro-caramelo' } },
    include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });

  if (!blusaP || !vestidoMidiM || !vestidoLongoP || !bolsa) {
    console.log('⚠️ seedTestOrders: variantes esperadas não encontradas — pulando pedidos #69');
    return;
  }

  async function createPaidOrder(params: {
    number: string;
    variant: typeof blusaP;
    quantity: number;
    shippingCost: number;
  }) {
    const { number, variant, quantity, shippingCost } = params;
    const unit = Number(variant.product.basePrice);
    const subtotal = unit * quantity;
    const total = subtotal + shippingCost;
    const img = variant.product.images[0]?.cardUrl ?? variant.product.images[0]?.url ?? null;
    const stockBefore = variant.stock;
    const stockAfter = stockBefore - quantity;

    const orderId = createId();
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: orderId,
          userId: cliente.id,
          number,
          status: OrderStatus.PAID,
          cpf: '52998224725',
          subtotal,
          shippingCost,
          discount: 0,
          total,
          shippingAddress: shipAddr,
          items: {
            create: [
              {
                id: createId(),
                productId: variant.productId,
                variantId: variant.id,
                productName: variant.product.name,
                variantSize: variant.size,
                variantColor: variant.color,
                productImageUrl: img,
                unitPrice: unit,
                quantity,
                subtotal,
              },
            ],
          },
        },
      });
      await tx.shipping.create({
        data: {
          id: createId(),
          orderId,
          provider: ShippingProvider.MOCK,
          serviceName: 'PAC',
          estimatedDays: 5,
          cost: shippingCost,
        },
      });
      await tx.payment.create({
        data: {
          id: createId(),
          orderId,
          provider: PaymentProvider.MOCK,
          method: PaymentMethod.PIX,
          status: PaymentStatus.APPROVED,
          amount: total,
          paidAt: new Date(),
          externalId: `seed_ext_${orderId.slice(0, 12)}`,
        },
      });
      await tx.stockMovement.create({
        data: {
          id: createId(),
          variantId: variant.id,
          type: StockMovementType.OUT,
          source: StockMovementSource.ONLINE_ORDER,
          quantity,
          stockBefore,
          stockAfter,
          reason: 'Pedido pago (seed #69)',
          orderId,
          userId: null,
        },
      });
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });
    });
  }

  await createPaidOrder({
    number: `${SEED_TEST_ORDER_PREFIX}PAID-01`,
    variant: blusaP,
    quantity: 1,
    shippingCost: 19.9,
  });

  await createPaidOrder({
    number: `${SEED_TEST_ORDER_PREFIX}PAID-02`,
    variant: vestidoMidiM,
    quantity: 1,
    shippingCost: 0,
  });

  // PROCESSING: pago + separação + histórico PAID → PROCESSING
  {
    const variant = vestidoLongoP;
    const unit = Number(variant.product.basePrice);
    const shippingCost = 15.9;
    const qty = 1;
    const subtotal = unit * qty;
    const total = subtotal + shippingCost;
    const img = variant.product.images[0]?.cardUrl ?? variant.product.images[0]?.url ?? null;
    const stockBefore = variant.stock;
    const stockAfter = stockBefore - qty;
    const orderId = createId();
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: orderId,
          userId: cliente.id,
          number: `${SEED_TEST_ORDER_PREFIX}PROC-01`,
          status: OrderStatus.PROCESSING,
          cpf: '52998224725',
          subtotal,
          shippingCost,
          discount: 0,
          total,
          shippingAddress: shipAddr,
          items: {
            create: [
              {
                id: createId(),
                productId: variant.productId,
                variantId: variant.id,
                productName: variant.product.name,
                variantSize: variant.size,
                variantColor: variant.color,
                productImageUrl: img,
                unitPrice: unit,
                quantity: qty,
                subtotal,
              },
            ],
          },
        },
      });
      await tx.shipping.create({
        data: {
          id: createId(),
          orderId,
          provider: ShippingProvider.MOCK,
          serviceName: 'Sedex',
          estimatedDays: 3,
          cost: shippingCost,
        },
      });
      await tx.payment.create({
        data: {
          id: createId(),
          orderId,
          provider: PaymentProvider.MOCK,
          method: PaymentMethod.PIX,
          status: PaymentStatus.APPROVED,
          amount: total,
          paidAt: new Date(),
          externalId: `seed_ext_${orderId.slice(0, 12)}_p`,
        },
      });
      await tx.stockMovement.create({
        data: {
          id: createId(),
          variantId: variant.id,
          type: StockMovementType.OUT,
          source: StockMovementSource.ONLINE_ORDER,
          quantity: qty,
          stockBefore,
          stockAfter,
          reason: 'Pedido pago (seed #69)',
          orderId,
          userId: null,
        },
      });
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });
      await tx.orderStatusHistory.create({
        data: {
          id: createId(),
          orderId,
          fromStatus: OrderStatus.PAID,
          toStatus: OrderStatus.PROCESSING,
          notes: 'Seed #69 — preparando envio',
          changedByUserId: adminUserId,
        },
      });
    });
  }

  // PENDING: aguardando pagamento, estoque já baixado (fluxo igual checkout)
  {
    const variant = bolsa;
    const unit = Number(variant.product.basePrice);
    const shippingCost = 12.9;
    const qty = 1;
    const subtotal = unit * qty;
    const total = subtotal + shippingCost;
    const img = variant.product.images[0]?.cardUrl ?? variant.product.images[0]?.url ?? null;
    const stockBefore = variant.stock;
    const stockAfter = stockBefore - qty;
    const orderId = createId();
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: orderId,
          userId: cliente.id,
          number: `${SEED_TEST_ORDER_PREFIX}PEND-01`,
          status: OrderStatus.PENDING,
          cpf: '52998224725',
          subtotal,
          shippingCost,
          discount: 0,
          total,
          shippingAddress: shipAddr,
          items: {
            create: [
              {
                id: createId(),
                productId: variant.productId,
                variantId: variant.id,
                productName: variant.product.name,
                variantSize: variant.size,
                variantColor: variant.color,
                productImageUrl: img,
                unitPrice: unit,
                quantity: qty,
                subtotal,
              },
            ],
          },
        },
      });
      await tx.shipping.create({
        data: {
          id: createId(),
          orderId,
          provider: ShippingProvider.MOCK,
          serviceName: 'PAC',
          estimatedDays: 7,
          cost: shippingCost,
        },
      });
      await tx.payment.create({
        data: {
          id: createId(),
          orderId,
          provider: PaymentProvider.MOCK,
          method: PaymentMethod.PIX,
          status: PaymentStatus.PENDING,
          amount: total,
          externalId: `seed_ext_${orderId.slice(0, 12)}_w`,
        },
      });
      await tx.stockMovement.create({
        data: {
          id: createId(),
          variantId: variant.id,
          type: StockMovementType.OUT,
          source: StockMovementSource.ONLINE_ORDER,
          quantity: qty,
          stockBefore,
          stockAfter,
          reason: 'Pedido criado (seed #69)',
          orderId,
          userId: null,
        },
      });
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });
    });
  }

  console.log(
    `✅ Pedidos de teste #69: 2× PAID, 1× PROCESSING, 1× PENDING (prefixo ${SEED_TEST_ORDER_PREFIX})`,
  );
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // =========================================================
  // STORE SETTINGS (singleton)
  // =========================================================
  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      originZipCode: '57000000',
      freeShippingGlobalThreshold: 299,
      shippingProvider: 'mock',
    },
  });
  console.log('✅ StoreSettings singleton criado');

  // =========================================================
  // ADMIN
  // =========================================================
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flordemenina.store' },
    update: {},
    create: {
      id: createId(),
      email: 'admin@flordemenina.store',
      passwordHash: adminPassword,
      name: 'Daniela Costa',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin: ${admin.email} / admin123`);

  // =========================================================
  // CLIENTE 1 — com CPF e telefone já salvos + endereço
  // Útil para: testar pré-preenchimento do CPF na etapa 1
  //            + seleção de endereço na etapa 2
  // =========================================================
  const clientePassword = await bcrypt.hash('cliente123', 12);
  // CPF é único: libera o CPF demo se estiver em outro usuário (re-seed / banco sujo em dev).
  await prisma.user.updateMany({
    where: {
      cpf: '52998224725',
      email: { not: 'cliente@flordemenina.store' },
    },
    data: { cpf: null },
  });
  const cliente1 = await prisma.user.upsert({
    where: { email: 'cliente@flordemenina.store' },
    update: {
      passwordHash: clientePassword,
      name: 'Ana Lima',
      cpf: '52998224725',
      phone: '82999990001',
      emailVerified: true,
      role: UserRole.CUSTOMER,
    },
    create: {
      id: createId(),
      email: 'cliente@flordemenina.store',
      passwordHash: clientePassword,
      name: 'Ana Lima',
      cpf: '52998224725', // CPF válido (dígitos apenas — formato salvo no banco)
      phone: '82999990001',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });
  console.log(`✅ Cliente com CPF: ${cliente1.email} / cliente123`);

  // Endereço padrão do cliente1
  const endExistente = await prisma.address.findFirst({ where: { userId: cliente1.id } });
  if (!endExistente) {
    await prisma.address.create({
      data: {
        id: createId(),
        userId: cliente1.id,
        label: 'Casa',
        recipientName: 'Ana Lima',
        zipCode: '57035-270',
        street: 'Rua João Pessoa',
        number: '123',
        complement: 'Apto 4',
        neighborhood: 'Centro',
        city: 'Maceió',
        state: 'AL',
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
    });

    // Segundo endereço (para testar a lista de seleção)
    await prisma.address.create({
      data: {
        id: createId(),
        userId: cliente1.id,
        label: 'Trabalho',
        recipientName: 'Ana Lima',
        zipCode: '57020-050',
        street: 'Av. Fernandes Lima',
        number: '1000',
        complement: null,
        neighborhood: 'Farol',
        city: 'Maceió',
        state: 'AL',
        isDefaultShipping: false,
        isDefaultBilling: false,
      },
    });
    console.log(`✅ 2 endereços criados para ${cliente1.email}`);
  }

  // =========================================================
  // CLIENTE 2 — sem CPF, sem endereço, sem telefone
  // Útil para: testar CPF obrigatório na etapa 1
  //            + fluxo de cadastrar endereço no checkout
  // =========================================================
  const cliente2 = await prisma.user.upsert({
    where: { email: 'novo@flordemenina.store' },
    update: {},
    create: {
      id: createId(),
      email: 'novo@flordemenina.store',
      passwordHash: clientePassword,
      name: 'Bruna Souza',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });
  console.log(`✅ Cliente sem CPF: ${cliente2.email} / cliente123`);

  // =========================================================
  // CLIENTE CHECKOUT MERCADO PAGO (Task #18 — PIX / cartão TEST)
  // CPF exclusivo da conta de testes de checkout (válido; não reutilizar o CPF do cliente demo).
  // =========================================================
  const pagamentoPassword = await bcrypt.hash('pagamento123', 12);
  await prisma.user.updateMany({
    where: {
      cpf: '39053344705',
      email: { not: 'pagamento@flordemenina.store' },
    },
    data: { cpf: null },
  });
  const checkoutMp = await prisma.user.upsert({
    where: { email: 'pagamento@flordemenina.store' },
    update: {
      passwordHash: pagamentoPassword,
      name: 'Cliente Pagamento MP',
      cpf: '39053344705',
      phone: '82999990003',
      emailVerified: true,
      role: UserRole.CUSTOMER,
    },
    create: {
      id: createId(),
      email: 'pagamento@flordemenina.store',
      passwordHash: pagamentoPassword,
      name: 'Cliente Pagamento MP',
      cpf: '39053344705',
      phone: '82999990003',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });
  console.log(`✅ Cliente checkout MP: ${checkoutMp.email} / pagamento123`);

  const endMp = await prisma.address.findFirst({ where: { userId: checkoutMp.id } });
  if (!endMp) {
    await prisma.address.create({
      data: {
        id: createId(),
        userId: checkoutMp.id,
        label: 'Casa',
        recipientName: 'Cliente Pagamento MP',
        zipCode: '57035-270',
        street: 'Rua do Ouro',
        number: '200',
        complement: null,
        neighborhood: 'Ponta Verde',
        city: 'Maceió',
        state: 'AL',
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
    });
    console.log(`✅ Endereço criado para ${checkoutMp.email}`);
  }

  // =========================================================
  // CATEGORIAS
  // =========================================================
  const categorias = [
    {
      slug: 'vestidos',
      name: 'Vestidos',
      description: 'Vestidos para todas as ocasiões',
      sizeChart: {
        title: 'Guia de Medidas',
        columnHeader: 'TAMANHO',
        columns: ['P', 'M', 'G', 'GG'],
        rows: [
          { label: 'Busto (cm)', values: ['84-88', '88-92', '92-96', '96-100'] },
          { label: 'Cintura (cm)', values: ['64-68', '68-72', '72-76', '76-80'] },
          { label: 'Quadril (cm)', values: ['90-94', '94-98', '98-102', '102-106'] },
        ],
      },
    },
    {
      slug: 'blusas',
      name: 'Blusas',
      description: 'Blusas e camisas',
      sizeChart: {
        title: 'Guia de Medidas',
        columnHeader: 'TAMANHO',
        columns: ['P', 'M', 'G', 'GG'],
        rows: [
          { label: 'Busto (cm)', values: ['84-88', '88-92', '92-96', '96-100'] },
          { label: 'Cintura (cm)', values: ['64-68', '68-72', '72-76', '76-80'] },
        ],
      },
    },
    {
      slug: 'calcas',
      name: 'Calças',
      description: 'Calças, jeans e leggings',
      sizeChart: {
        title: 'Guia de Medidas',
        columnHeader: 'NUMERAÇÃO',
        columns: ['36', '38', '40', '42', '44'],
        rows: [
          { label: 'Cintura (cm)', values: ['64', '68', '72', '76', '80'] },
          { label: 'Quadril (cm)', values: ['90', '94', '98', '102', '106'] },
          { label: 'Comprimento (cm)', values: ['100', '101', '102', '103', '104'] },
        ],
      },
    },
    {
      slug: 'bolsas',
      name: 'Bolsas',
      description: 'Bolsas, clutches e mochilas',
      sizeChart: null,
    },
    {
      slug: 'acessorios',
      name: 'Acessórios',
      description: 'Cintos, lenços, colares e brincos',
      sizeChart: null,
    },
  ];

  for (const [i, cat] of categorias.entries()) {
    const existing = await prisma.category.findFirst({ where: { slug: cat.slug, parentId: null } });
    if (!existing) {
      await prisma.category.create({
        data: {
          id: createId(),
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          sizeChart: cat.sizeChart ?? undefined,
          sortOrder: i,
        },
      });
    }
  }
  console.log(`✅ ${categorias.length} categorias criadas`);

  const vestidos = await prisma.category.findFirst({ where: { slug: 'vestidos', parentId: null } });
  const blusas = await prisma.category.findFirst({ where: { slug: 'blusas', parentId: null } });
  const bolsas = await prisma.category.findFirst({ where: { slug: 'bolsas', parentId: null } });

  // =========================================================
  // PRODUTOS
  // Inclui:
  //  - Produto caro (R$319,90) → sozinho já atinge frete grátis (≥R$299)
  //  - Produto com 1 unidade → para testar erro de estoque insuficiente
  //  - Produto normal com estoque farto
  // =========================================================
  const produtos = [
    {
      slug: 'vestido-midi-floral-marrom',
      name: 'Vestido Midi Floral Marrom',
      description:
        'Vestido midi com estampa floral em tons terrosos. Tecido leve e fluido, perfeito para o verão.',
      basePrice: 289.9,
      isFeatured: true,
      categoryId: vestidos!.id,
      variants: [
        { size: 'P', color: 'Marrom', colorHex: '#8B6841', stock: 5 },
        { size: 'M', color: 'Marrom', colorHex: '#8B6841', stock: 8 },
        { size: 'G', color: 'Marrom', colorHex: '#8B6841', stock: 4 },
      ],
    },
    {
      // R$319,90 → 1 unidade no carrinho já dá frete grátis
      slug: 'vestido-longo-bege',
      name: 'Vestido Longo Bege',
      description: 'Vestido longo em tom bege com detalhes em renda. Elegante e atemporal.',
      basePrice: 319.9,
      isFeatured: true,
      categoryId: vestidos!.id,
      variants: [
        { size: 'P', color: 'Bege', colorHex: '#E5CFAA', stock: 10 },
        { size: 'M', color: 'Bege', colorHex: '#E5CFAA', stock: 10 },
        { size: 'G', color: 'Bege', colorHex: '#E5CFAA', stock: 10 },
      ],
    },
    {
      // Estoque baixo → 1 unidade → simular erro 409 colocando 2 no carrinho
      slug: 'blusa-renda-marfim',
      name: 'Blusa de Renda Marfim',
      description: 'Blusa em renda delicada cor marfim. Combina com qualquer ocasião.',
      basePrice: 159.9,
      isFeatured: false,
      categoryId: blusas!.id,
      variants: [
        { size: 'P', color: 'Marfim', colorHex: '#FDFBF7', stock: 1 }, // ← ESTOQUE BAIXO INTENCIONAL
        { size: 'M', color: 'Marfim', colorHex: '#FDFBF7', stock: 10 },
        { size: 'G', color: 'Marfim', colorHex: '#FDFBF7', stock: 4 },
      ],
    },
    {
      slug: 'blusa-cropped-camel',
      name: 'Blusa Cropped Camel',
      description: 'Cropped em algodão na cor camel, modelagem moderna.',
      basePrice: 119.9,
      isFeatured: false,
      categoryId: blusas!.id,
      variants: [
        { size: 'P', color: 'Camel', colorHex: '#C4A47C', stock: 6 },
        { size: 'M', color: 'Camel', colorHex: '#C4A47C', stock: 8 },
      ],
    },
    {
      slug: 'bolsa-couro-caramelo',
      name: 'Bolsa de Couro Caramelo',
      description: 'Bolsa em couro legítimo cor caramelo, alça transversal regulável.',
      basePrice: 459.9,
      isFeatured: true,
      categoryId: bolsas!.id,
      variants: [{ size: null, color: 'Caramelo', colorHex: '#A8825A', stock: 5 }],
    },
  ];

  const variantsBySlug: Record<
    string,
    { id: string; size: string | null; color: string; stock: number }[]
  > = {};

  for (const p of produtos) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        id: createId(),
        slug: p.slug,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured,
        weight: 300,
        width: 20,
        height: 5,
        length: 30,
      },
    });

    variantsBySlug[p.slug] = [];

    for (const v of p.variants) {
      const sku = `${p.slug.toUpperCase().slice(0, 6)}-${(v.size ?? 'UN').toUpperCase()}-${v.color.toUpperCase().slice(0, 3)}`;
      const existing = await prisma.productVariant.findUnique({ where: { sku } });
      if (existing) {
        variantsBySlug[p.slug].push({
          id: existing.id,
          size: existing.size,
          color: v.color,
          stock: v.stock,
        });
        continue;
      }

      const variant = await prisma.productVariant.create({
        data: {
          id: createId(),
          productId: product.id,
          sku,
          size: v.size ?? null,
          color: v.color,
          colorHex: v.colorHex,
          stock: v.stock,
        },
      });

      await prisma.stockMovement.create({
        data: {
          id: createId(),
          variantId: variant.id,
          userId: admin.id,
          type: StockMovementType.IN,
          source: StockMovementSource.MANUAL_IN,
          quantity: v.stock,
          stockBefore: 0,
          stockAfter: v.stock,
          reason: 'Estoque inicial (seed)',
        },
      });

      variantsBySlug[p.slug].push({
        id: variant.id,
        size: variant.size,
        color: v.color,
        stock: v.stock,
      });
    }
  }
  console.log(`✅ ${produtos.length} produtos com variações criados`);

  // =========================================================
  // CARRINHOS PRÉ-MONTADOS PARA TESTES
  // =========================================================

  // Carrinho 1: cliente1 — 2 itens normais (subtotal ~R$449,80)
  // → Frete não grátis (< 299 por item isolado? não — 289+159 = 449 → frete grátis)
  // → Para testar SEM frete grátis: usar só blusa-cropped P (R$119,90)
  // → Para testar COM frete grátis: usar vestido-longo-bege (R$319,90 ≥ 299)
  const cart1Exists = await prisma.cart.findFirst({ where: { userId: cliente1.id } });
  if (!cart1Exists) {
    const cart1 = await prisma.cart.create({
      data: {
        id: createId(),
        userId: cliente1.id,
      },
    });

    // Item 1: Blusa Cropped P-Camel (R$119,90) — subtotal não atinge frete grátis sozinho
    const blusaCroppedP = variantsBySlug['blusa-cropped-camel']?.find((v) => v.size === 'P');
    // Item 2: Vestido Midi M-Marrom (R$289,90) — junto atingem 409,80 → frete grátis
    const vestidoMidiM = variantsBySlug['vestido-midi-floral-marrom']?.find((v) => v.size === 'M');

    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000);

    if (blusaCroppedP) {
      const blusaProd = await prisma.product.findFirst({
        where: { variants: { some: { id: blusaCroppedP.id } } },
        select: { id: true },
      });
      if (blusaProd) {
        await prisma.cartItem.create({
          data: {
            id: createId(),
            cartId: cart1.id,
            productId: blusaProd.id,
            variantId: blusaCroppedP.id,
            quantity: 1,
            reservedUntil,
          },
        });
      }
    }

    if (vestidoMidiM) {
      const vestProd = await prisma.product.findFirst({
        where: { variants: { some: { id: vestidoMidiM.id } } },
        select: { id: true },
      });
      if (vestProd) {
        await prisma.cartItem.create({
          data: {
            id: createId(),
            cartId: cart1.id,
            productId: vestProd.id,
            variantId: vestidoMidiM.id,
            quantity: 1,
            reservedUntil,
          },
        });
      }
    }

    console.log(
      `✅ Carrinho pré-montado para ${cliente1.email} (2 itens, subtotal ~R$409,80 → frete grátis disponível)`,
    );
  }

  // Carrinho dedicado Task #18 (Mercado Pago): 1 item leve para ir direto ao pagamento
  const cartMpExists = await prisma.cart.findFirst({ where: { userId: checkoutMp.id } });
  if (!cartMpExists) {
    const blusaP = variantsBySlug['blusa-cropped-camel']?.find((v) => v.size === 'P');
    if (blusaP) {
      const cartMp = await prisma.cart.create({
        data: { id: createId(), userId: checkoutMp.id },
      });
      const prodBlusa = await prisma.product.findFirst({
        where: { variants: { some: { id: blusaP.id } } },
        select: { id: true },
      });
      if (prodBlusa) {
        const reservedUntilMp = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.cartItem.create({
          data: {
            id: createId(),
            cartId: cartMp.id,
            productId: prodBlusa.id,
            variantId: blusaP.id,
            quantity: 1,
            reservedUntil: reservedUntilMp,
          },
        });
        console.log(
          `✅ Carrinho pré-montado para ${checkoutMp.email} (Blusa Cropped P — ~R$119,90)`,
        );
      }
    }
  }

  // =========================================================
  // PÁGINAS INSTITUCIONAIS (HTML TipTap — Task #24)
  // =========================================================
  for (const pg of INSTITUTIONAL_PAGES_SEED) {
    await prisma.institutionalPage.upsert({
      where: { slug: pg.slug },
      create: {
        id: createId(),
        slug: pg.slug,
        title: pg.title,
        content: pg.content,
        sortOrder: pg.sortOrder,
        isActive: true,
      },
      update: {
        title: pg.title,
        content: pg.content,
        sortOrder: pg.sortOrder,
      },
    });
  }
  console.log(`✅ ${INSTITUTIONAL_PAGES_SEED.length} páginas institucionais (seed HTML)`);

  // =========================================================
  // PEDIDOS DE TESTE — Task #69 (admin operacional / smoke / E2E)
  // =========================================================
  await seedTestOrders(cliente1, admin.id);

  // =========================================================
  // RESUMO PARA TESTES
  // =========================================================
  console.log('\n🎉 Seed concluído! Contas para teste:');
  console.log('');
  console.log('  👑 ADMIN');
  console.log('     admin@flordemenina.store / admin123');
  console.log('');
  console.log('  💳 CHECKOUT MERCADO PAGO (Task #18 — PIX / cartão TEST)');
  console.log('     pagamento@flordemenina.store / pagamento123');
  console.log('     CPF (conta teste checkout): 390.533.447-05');
  console.log('     Carrinho: 1× Blusa Cropped P (~R$119,90) + endereço em Maceió');
  console.log('');
  console.log(
    '  👤 CLIENTE COM CPF (CPF pré-preenchido no checkout, 2 endereços, carrinho montado)',
  );
  console.log('     cliente@flordemenina.store / cliente123');
  console.log('     CPF salvo: 529.982.247-25');
  console.log(
    '     Carrinho: Blusa Cropped P + Vestido Midi M (subtotal ~R$409,80 → frete grátis)',
  );
  console.log('');
  console.log('  👤 CLIENTE SEM CPF (CPF obrigatório no checkout, sem endereço)');
  console.log('     novo@flordemenina.store / cliente123');
  console.log('');
  console.log('  🧪 PRODUTO COM ESTOQUE 1: "Blusa de Renda Marfim" tamanho P');
  console.log('     → Adicione 2 ao carrinho para forçar erro 409 no checkout');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
