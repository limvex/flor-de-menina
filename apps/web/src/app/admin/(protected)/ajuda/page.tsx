'use client';

import { useState } from 'react';
import {
  Package,
  Tag,
  BarChart2,
  ShoppingBag,
  Ticket,
  Paintbrush,
  Truck,
  Users,
  FileText,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

// ─── Types ───────────────────────────────────────────────────────────────────

type Badge = 'Fácil' | 'Médio';

interface StepsBlock {
  type: 'steps';
  title: string;
  items: string[];
}

interface StatusListBlock {
  type: 'status-list';
  title: string;
  items: string[];
}

interface TipBlock {
  type: 'tip';
  text: string;
}

interface WarningBlock {
  type: 'warning';
  text: string;
}

type ContentBlock = StepsBlock | StatusListBlock | TipBlock | WarningBlock;

interface Section {
  id: string;
  icon: LucideIcon;
  title: string;
  badge: Badge;
  description: string;
  content: ContentBlock[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: 'produtos',
    icon: Package,
    title: 'Produtos',
    badge: 'Médio',
    description: 'Cadastre, edite e organize os produtos da loja',
    content: [
      {
        type: 'steps',
        title: 'Como cadastrar um produto',
        items: [
          'Clique em Produtos no menu lateral',
          'Clique no botão Novo produto (canto superior direito)',
          'Preencha nome, descrição e preço',
          'Adicione as fotos (arraste ou clique para selecionar)',
          'Escolha a categoria',
          'Adicione variações (tamanhos e cores disponíveis)',
          'Clique em Salvar produto',
        ],
      },
      {
        type: 'steps',
        title: 'Como editar um produto',
        items: [
          'Clique em Produtos no menu',
          'Encontre o produto na lista e clique nele',
          'Altere o que precisar e clique em Salvar',
        ],
      },
      {
        type: 'steps',
        title: 'Como tirar um produto da loja sem apagar',
        items: [
          'Abra o produto',
          'Mude o status para Inativo',
          'Salve — o produto some da loja mas fica salvo no sistema',
        ],
      },
    ],
  },
  {
    id: 'categorias',
    icon: Tag,
    title: 'Categorias',
    badge: 'Fácil',
    description: 'Organize os produtos em grupos para facilitar a navegação',
    content: [
      {
        type: 'steps',
        title: 'Como criar uma categoria',
        items: [
          'Clique em Categorias no menu',
          'Clique em Nova categoria',
          'Digite o nome (ex: Vestidos, Blusas, Calças)',
          'Salve',
        ],
      },
      {
        type: 'steps',
        title: 'Como editar ou excluir',
        items: [
          'Clique em Categorias',
          'Clique na categoria desejada',
          'Edite o nome ou clique em Excluir',
        ],
      },
      {
        type: 'warning',
        text: 'Não exclua uma categoria que ainda tem produtos — mova os produtos primeiro.',
      },
    ],
  },
  {
    id: 'estoque',
    icon: BarChart2,
    title: 'Estoque',
    badge: 'Fácil',
    description: 'Controle quantas peças de cada tamanho e cor estão disponíveis',
    content: [
      {
        type: 'steps',
        title: 'Como ver o estoque atual',
        items: [
          'Clique em Estoque no menu',
          'Você verá todos os produtos com quantidade disponível por tamanho e cor',
        ],
      },
      {
        type: 'steps',
        title: 'Como ajustar o estoque',
        items: [
          'Clique em Estoque',
          'Encontre a variação (ex: Vestido Floral — P — Rosa)',
          'Clique no item',
          'Altere a quantidade e salve',
        ],
      },
      {
        type: 'tip',
        text: 'Quando o estoque de uma variação chega a zero, ela aparece como Esgotado automaticamente na loja.',
      },
    ],
  },
  {
    id: 'pedidos',
    icon: ShoppingBag,
    title: 'Pedidos',
    badge: 'Fácil',
    description: 'Acompanhe e atualize todos os pedidos feitos na loja',
    content: [
      {
        type: 'steps',
        title: 'Como ver os pedidos',
        items: ['Clique em Pedidos no menu', 'Você verá todos os pedidos com status, valor e data'],
      },
      {
        type: 'status-list',
        title: 'O que significa cada status',
        items: [
          'Aguardando pagamento — cliente fez o pedido mas ainda não pagou',
          'Pago — pagamento confirmado, separe para envio',
          'Enviado — produto saiu para entrega',
          'Entregue — cliente recebeu',
          'Cancelado — pedido cancelado',
        ],
      },
      {
        type: 'steps',
        title: 'Como atualizar o status de um pedido',
        items: [
          'Clique no pedido',
          'Altere o status no campo correspondente',
          'Salve — o cliente recebe e-mail automático com a atualização',
        ],
      },
      {
        type: 'tip',
        text: 'Os dados de entrega do cliente aparecem dentro de cada pedido.',
      },
    ],
  },
  {
    id: 'cupons',
    icon: Ticket,
    title: 'Cupons',
    badge: 'Fácil',
    description: 'Crie códigos de desconto para promoções e campanhas',
    content: [
      {
        type: 'steps',
        title: 'Como criar um cupom',
        items: [
          'Clique em Cupons no menu',
          'Clique em Novo cupom',
          'Defina o código (ex: BEMVINDA10), tipo (porcentagem ou valor fixo) e valor',
          'Defina a data de validade se quiser',
          'Salve',
        ],
      },
      {
        type: 'steps',
        title: 'Como desativar um cupom',
        items: [
          'Clique no cupom',
          'Mude o status para Inativo',
          'Salve — o cupom para de funcionar imediatamente',
        ],
      },
    ],
  },
  {
    id: 'aparencia',
    icon: Paintbrush,
    title: 'Aparência',
    badge: 'Fácil',
    description: 'Troque o banner da página inicial e personalize a loja',
    content: [
      {
        type: 'steps',
        title: 'Como trocar o banner da home',
        items: [
          'Clique em Configurações no menu',
          'Clique em Aparência',
          'Na seção de banners, clique em Adicionar banner ou substitua a imagem existente',
          'Faça o upload da nova imagem',
          'Preencha o título e texto do botão se quiser',
          'Clique em Salvar banners',
        ],
      },
      {
        type: 'tip',
        text: 'Use imagens horizontais e de boa qualidade. O banner aparece na página inicial da loja.',
      },
    ],
  },
  {
    id: 'frete',
    icon: Truck,
    title: 'Frete',
    badge: 'Médio',
    description: 'Configure as opções de entrega disponíveis para os clientes',
    content: [
      {
        type: 'steps',
        title: 'Como configurar o frete',
        items: [
          'Clique em Configurações',
          'Clique em Frete',
          'Configure as opções de entrega disponíveis',
          'Salve',
        ],
      },
    ],
  },
  {
    id: 'usuarios',
    icon: Users,
    title: 'Usuários',
    badge: 'Médio',
    description: 'Gerencie quem tem acesso ao painel administrativo',
    content: [
      {
        type: 'steps',
        title: 'Como adicionar um novo administrador',
        items: [
          'Clique em Configurações',
          'Clique em Usuários',
          'Clique em Novo usuário',
          'Preencha nome, e-mail e defina a função (Admin ou Operador)',
          'Salve — a pessoa receberá e-mail para criar a senha',
        ],
      },
      {
        type: 'warning',
        text: 'Só crie usuários admin para pessoas de confiança. Eles terão acesso total ao sistema.',
      },
    ],
  },
  {
    id: 'paginas',
    icon: FileText,
    title: 'Páginas',
    badge: 'Fácil',
    description: 'Edite textos institucionais como Sobre nós e Política de trocas',
    content: [
      {
        type: 'steps',
        title: 'Como editar uma página',
        items: [
          'Clique em Páginas no menu',
          'Clique na página que deseja editar',
          'Edite o conteúdo no editor',
          'Salve — a página é atualizada automaticamente no site',
        ],
      },
    ],
  },
  {
    id: 'duvidas',
    icon: HelpCircle,
    title: 'Dúvidas frequentes',
    badge: 'Fácil',
    description: 'Respostas para as perguntas mais comuns',
    content: [
      {
        type: 'steps',
        title: 'O produto não aparece na loja — o que fazer?',
        items: [
          'Verifique se o status do produto está como Ativo',
          'Confira se ele tem pelo menos uma variação com estoque maior que zero',
        ],
      },
      {
        type: 'steps',
        title: 'O cliente não recebeu o e-mail de confirmação',
        items: [
          'Peça para verificar a pasta de spam',
          'Se não estiver lá, abra o pedido e confirme se o e-mail do cliente está correto',
        ],
      },
      {
        type: 'steps',
        title: 'Como cancelar um pedido',
        items: [
          'Abra o pedido e mude o status para Cancelado',
          'Se o pagamento já foi feito, entre em contato com o cliente para combinar o reembolso',
        ],
      },
      {
        type: 'steps',
        title: 'Esqueci a senha do admin',
        items: ['Na tela de login, clique em Esqueci minha senha', 'Siga as instruções no e-mail'],
      },
    ],
  },
];

// ─── Status dot colors ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<number, string> = {
  0: 'bg-amber-400',
  1: 'bg-green-500',
  2: 'bg-blue-500',
  3: 'bg-green-700',
  4: 'bg-red-500',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepsBlock({ block }: { block: StepsBlock }) {
  return (
    <div className="space-y-3">
      {block.title && <p className="text-sm font-semibold text-stone-700">{block.title}</p>}
      <ol className="space-y-0">
        {block.items.map((item, i) => {
          const isLast = i === block.items.length - 1;
          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-white text-xs font-semibold shrink-0">
                  {i + 1}
                </span>
                {!isLast && <div className="w-0.5 flex-1 bg-stone-200 my-1" />}
              </div>
              <p className="text-sm text-stone-600 leading-relaxed pb-3">{item}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StatusListBlock({ block }: { block: StatusListBlock }) {
  return (
    <div className="space-y-3">
      {block.title && <p className="text-sm font-semibold text-stone-700">{block.title}</p>}
      <ul className="space-y-2">
        {block.items.map((item, i) => {
          const [label, ...rest] = item.split(' — ');
          const desc = rest.join(' — ');
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${STATUS_COLORS[i] ?? 'bg-stone-400'}`}
              />
              <span className="text-sm text-stone-600 leading-relaxed">
                <strong className="font-semibold text-stone-800">{label}</strong>
                {desc ? ` — ${desc}` : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TipBlock({ block }: { block: TipBlock }) {
  return (
    <div className="flex gap-3 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 p-4">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p className="text-sm text-amber-800 leading-relaxed">{block.text}</p>
    </div>
  );
}

function WarningBlock({ block }: { block: WarningBlock }) {
  return (
    <div className="flex gap-3 rounded-r-lg border-l-4 border-red-400 bg-red-50 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <p className="text-sm text-red-800 leading-relaxed">{block.text}</p>
    </div>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'steps') return <StepsBlock block={block} />;
  if (block.type === 'status-list') return <StatusListBlock block={block} />;
  if (block.type === 'tip') return <TipBlock block={block} />;
  if (block.type === 'warning') return <WarningBlock block={block} />;
  return null;
}

function BadgeChip({ badge }: { badge: Badge }) {
  if (badge === 'Fácil') {
    return (
      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        Fácil
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      Médio
    </span>
  );
}

function SectionCard({
  section,
  isOpen,
  onToggle,
}: {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  return (
    <div id={section.id} className="rounded-lg border border-stone-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left transition-colors hover:bg-stone-50"
        aria-expanded={isOpen}
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100">
          <Icon className="h-5 w-5 text-stone-700" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-stone-900">{section.title}</span>
            <BadgeChip badge={section.badge} />
          </div>
          <p className="mt-0.5 text-sm text-stone-500 leading-snug">{section.description}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-stone-400" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-stone-400" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="border-t border-stone-100 px-5 pb-5 pt-4 space-y-5">
          {section.content.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AjudaPage() {
  const [search, setSearch] = useState('');
  const [openSections, setOpenSections] = useState<string[]>([]);

  const filtered = SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
  );

  const visibleSections = search.trim() ? filtered : SECTIONS;
  const effectiveOpen = search.trim() ? filtered.map((s) => s.id) : openSections;

  function toggle(id: string) {
    if (search.trim()) return;
    setOpenSections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div>
      <AdminPageHeader
        title="Central de Ajuda"
        description="Tudo que você precisa saber para usar o painel."
      />

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar na ajuda... (ex: produto, pedido, estoque)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-shadow"
        />
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar sticky — desktop only */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Nesta página
          </p>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const isVisible = visibleSections.some((v) => v.id === s.id);
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    isVisible && search.trim()
                      ? 'bg-stone-100 font-semibold text-stone-900'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {s.title}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {visibleSections.length === 0 && (
            <div className="rounded-lg border border-stone-200 bg-white p-10 text-center">
              <HelpCircle className="mx-auto mb-3 h-8 w-8 text-stone-300" />
              <p className="text-sm text-stone-500">
                Nenhuma seção encontrada para{' '}
                <strong className="text-stone-700">&ldquo;{search}&rdquo;</strong>.
              </p>
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-xs text-stone-400 underline hover:text-stone-600"
              >
                Limpar busca
              </button>
            </div>
          )}

          {visibleSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              isOpen={effectiveOpen.includes(section.id)}
              onToggle={() => toggle(section.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
