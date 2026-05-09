import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { UserRole, StockMovementType, StockMovementSource } from '../src/generated/prisma';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  // =========================================================
  // ADMIN
  // =========================================================
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flordemenina.site' },
    update: {},
    create: {
      id: createId(),
      email: 'admin@flordemenina.site',
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
  const cliente1 = await prisma.user.upsert({
    where: { email: 'cliente@flordemenina.site' },
    update: {},
    create: {
      id: createId(),
      email: 'cliente@flordemenina.site',
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
    where: { email: 'novo@flordemenina.site' },
    update: {},
    create: {
      id: createId(),
      email: 'novo@flordemenina.site',
      passwordHash: clientePassword,
      name: 'Bruna Souza',
      role: UserRole.CUSTOMER,
      emailVerified: true,
    },
  });
  console.log(`✅ Cliente sem CPF: ${cliente2.email} / cliente123`);

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

  // =========================================================
  // PÁGINAS INSTITUCIONAIS
  // =========================================================
  const paginas = [
    {
      slug: 'sobre',
      title: 'Sobre a Flor de Menina',
      content:
        'A Flor de Menina é uma marca de moda feminina nascida em Maceió-AL, com 13 anos de história vestindo mulheres que valorizam o essencial e o atemporal. Clássica, chic e cool — para quem quer se sentir bonita todos os dias.',
    },
    {
      slug: 'trocas-e-devolucoes',
      title: 'Trocas e Devoluções',
      content:
        'Você tem 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor. O produto deve estar sem uso, com etiqueta e embalagem original. Entre em contato pelo nosso WhatsApp para iniciar o processo.',
    },
    {
      slug: 'faq',
      title: 'Perguntas Frequentes',
      content:
        '## Como faço para comprar?\n\nNavegue pelo catálogo, escolha seus produtos, adicione ao carrinho e finalize a compra. Você precisa criar uma conta para acompanhar seus pedidos.\n\n## Quais formas de pagamento aceitam?\n\nAceitamos PIX e cartão de crédito (parcelado em até 12x).\n\n## Qual o prazo de entrega?\n\nVaria conforme sua região. O cálculo do frete e prazo é feito no checkout com base no seu CEP.',
    },
    {
      slug: 'politica-de-privacidade',
      title: 'Política de Privacidade',
      content:
        'A Flor de Menina respeita sua privacidade e está comprometida com a Lei Geral de Proteção de Dados (LGPD). Coletamos apenas os dados necessários para processar seu pedido e oferecer uma experiência personalizada. Seus dados nunca são vendidos ou compartilhados com terceiros sem sua autorização.',
    },
    {
      slug: 'termos-de-uso',
      title: 'Termos de Uso',
      content:
        'Ao utilizar este site, você concorda com nossos termos de uso. As informações contidas no site são meramente informativas. Reservamo-nos o direito de alterar preços e disponibilidade sem aviso prévio.',
    },
  ];

  for (const pg of paginas) {
    await prisma.institutionalPage.upsert({
      where: { slug: pg.slug },
      update: {},
      create: { id: createId(), ...pg },
    });
  }
  console.log(`✅ ${paginas.length} páginas institucionais criadas`);

  // =========================================================
  // RESUMO PARA TESTES
  // =========================================================
  console.log('\n🎉 Seed concluído! Contas para teste:');
  console.log('');
  console.log('  👑 ADMIN');
  console.log('     admin@flordemenina.site / admin123');
  console.log('');
  console.log(
    '  👤 CLIENTE COM CPF (CPF pré-preenchido no checkout, 2 endereços, carrinho montado)',
  );
  console.log('     cliente@flordemenina.site / cliente123');
  console.log('     CPF salvo: 529.982.247-25');
  console.log(
    '     Carrinho: Blusa Cropped P + Vestido Midi M (subtotal ~R$409,80 → frete grátis)',
  );
  console.log('');
  console.log('  👤 CLIENTE SEM CPF (CPF obrigatório no checkout, sem endereço)');
  console.log('     novo@flordemenina.site / cliente123');
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
