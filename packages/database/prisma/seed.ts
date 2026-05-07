import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { UserRole, StockMovementType } from '../src/generated/prisma';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

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
  console.log(`✅ Admin criado: ${admin.email} / senha: admin123`);

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
    // Prisma não suporta upsert com chave composta contendo null;
    // usamos findFirst + create como alternativa segura.
    const existing = await prisma.category.findFirst({
      where: { slug: cat.slug, parentId: null },
    });
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

  const produtos = [
    {
      slug: 'vestido-midi-floral-marrom',
      name: 'Vestido Midi Floral Marrom',
      description:
        'Vestido midi com estampa floral em tons terrosos. Tecido leve e fluido, perfeito para o verão.',
      basePrice: 289.9,
      categoryId: vestidos!.id,
      variants: [
        { size: 'P', color: 'Marrom', colorHex: '#8B6841', stock: 5 },
        { size: 'M', color: 'Marrom', colorHex: '#8B6841', stock: 8 },
        { size: 'G', color: 'Marrom', colorHex: '#8B6841', stock: 4 },
      ],
    },
    {
      slug: 'vestido-longo-bege',
      name: 'Vestido Longo Bege',
      description: 'Vestido longo em tom bege com detalhes em renda. Elegante e atemporal.',
      basePrice: 349.9,
      categoryId: vestidos!.id,
      variants: [
        { size: 'P', color: 'Bege', colorHex: '#E5CFAA', stock: 3 },
        { size: 'M', color: 'Bege', colorHex: '#E5CFAA', stock: 6 },
        { size: 'G', color: 'Bege', colorHex: '#E5CFAA', stock: 5 },
      ],
    },
    {
      slug: 'blusa-renda-marfim',
      name: 'Blusa de Renda Marfim',
      description: 'Blusa em renda delicada cor marfim. Combina com qualquer ocasião.',
      basePrice: 159.9,
      categoryId: blusas!.id,
      variants: [
        { size: 'P', color: 'Marfim', colorHex: '#FDFBF7', stock: 7 },
        { size: 'M', color: 'Marfim', colorHex: '#FDFBF7', stock: 10 },
        { size: 'G', color: 'Marfim', colorHex: '#FDFBF7', stock: 4 },
      ],
    },
    {
      slug: 'blusa-cropped-camel',
      name: 'Blusa Cropped Camel',
      description: 'Cropped em algodão na cor camel, modelagem moderna.',
      basePrice: 119.9,
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
      categoryId: bolsas!.id,
      variants: [{ size: null, color: 'Caramelo', colorHex: '#A8825A', stock: 5 }],
    },
  ];

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
        weight: 300,
        width: 20,
        height: 5,
        length: 30,
      },
    });

    for (const v of p.variants) {
      const sku = `${p.slug.toUpperCase().slice(0, 6)}-${(v.size ?? 'UN').toUpperCase()}-${v.color.toUpperCase().slice(0, 3)}`;
      const existing = await prisma.productVariant.findUnique({ where: { sku } });
      if (existing) continue;

      const variant = await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
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
          quantity: v.stock,
          reason: 'Estoque inicial (seed)',
          previousStock: 0,
          newStock: v.stock,
        },
      });
    }
  }
  console.log(`✅ ${produtos.length} produtos com variações criados`);

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
      create: {
        id: createId(),
        ...pg,
      },
    });
  }
  console.log(`✅ ${paginas.length} páginas institucionais criadas`);

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
