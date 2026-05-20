'use client';

import { useState } from 'react';
import {
  Package,
  Tag,
  BarChart2,
  ShoppingBag,
  Ticket,
  Paintbrush,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

// ─── Types ───────────────────────────────────────────────────────────────────

type Badge =
  | 'Primeiro passo'
  | 'Obrigatório primeiro'
  | 'Depois das categorias'
  | 'Rotina diária'
  | 'Opcional'
  | 'Ajuda';

interface StepsBlock {
  type: 'steps';
  title?: string;
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

interface FaqBlock {
  type: 'faq';
  items: { question: string; answer: string }[];
}

type ContentBlock = StepsBlock | StatusListBlock | TipBlock | WarningBlock | FaqBlock;

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
    id: 'config-loja',
    icon: Settings,
    title: 'Antes de tudo: configure a loja',
    badge: 'Primeiro passo',
    description: 'Faça isso antes de cadastrar qualquer produto',
    content: [
      {
        type: 'steps',
        items: [
          'Acesse Configurações → Aparência e suba o banner da home (imagem horizontal, boa qualidade)',
          'Acesse Configurações → Frete e configure as opções de entrega',
          'Acesse Configurações → Usuários se quiser adicionar mais pessoas com acesso ao admin',
        ],
      },
      {
        type: 'tip',
        text: 'Essas configurações só precisam ser feitas uma vez.',
      },
    ],
  },
  {
    id: 'categorias',
    icon: Tag,
    title: 'Passo 1: Crie as categorias',
    badge: 'Obrigatório primeiro',
    description: 'Você precisa ter categorias antes de cadastrar produtos',
    content: [
      {
        type: 'steps',
        items: [
          'Clique em Categorias no menu',
          'Clique em Nova categoria',
          'Digite o nome (exemplos: Vestidos, Blusas, Calças, Acessórios)',
          'Salve',
          'Repita para cada categoria que precisar',
        ],
      },
      {
        type: 'tip',
        text: 'Crie todas as categorias antes de começar a cadastrar produtos. Você pode criar quantas quiser.',
      },
      {
        type: 'warning',
        text: 'Sem categoria criada, não é possível cadastrar produto.',
      },
    ],
  },
  {
    id: 'produtos',
    icon: Package,
    title: 'Passo 2: Cadastre os produtos',
    badge: 'Depois das categorias',
    description: 'Com as categorias prontas, agora cadastre cada produto',
    content: [
      {
        type: 'steps',
        items: [
          'Clique em Produtos no menu',
          'Clique em Novo produto (canto superior direito)',
          'Preencha o nome do produto',
          'Adicione a descrição (conte o tecido, caimento, dicas de uso)',
          'Coloque o preço',
          'Escolha a categoria (que você criou no passo anterior)',
          'Adicione as fotos: clique em upload ou arraste as imagens. Coloque a foto principal primeiro',
          'Adicione as variações: para cada combinação de tamanho e cor, clique em Adicionar variação',
          'Em cada variação informe: tamanho (P, M, G...), cor e quantidade em estoque',
          'Mude o status para Ativo',
          'Clique em Salvar produto',
        ],
      },
      {
        type: 'tip',
        text: 'Adicione sempre pelo menos uma foto de boa qualidade. Produtos sem foto vendem muito menos.',
      },
      {
        type: 'warning',
        text: 'O produto só aparece na loja se o status estiver como Ativo E tiver pelo menos uma variação com estoque maior que zero.',
      },
    ],
  },
  {
    id: 'estoque',
    icon: BarChart2,
    title: 'Passo 3: Acompanhe o estoque',
    badge: 'Rotina diária',
    description: 'Mantenha o estoque atualizado para não vender o que não tem',
    content: [
      {
        type: 'steps',
        items: [
          'Clique em Estoque no menu',
          'Você verá todas as variações com a quantidade atual',
          'Quando chegar mercadoria nova, clique na variação e atualize a quantidade',
          'Quando uma peça for vendida fora da loja (ex: loja física), subtraia do estoque manualmente',
        ],
      },
      {
        type: 'tip',
        text: 'Quando o estoque de uma variação chega a zero, ela some automaticamente da loja. Você não precisa fazer nada.',
      },
    ],
  },
  {
    id: 'pedidos',
    icon: ShoppingBag,
    title: 'Passo 4: Gerencie os pedidos',
    badge: 'Rotina diária',
    description: 'Toda vez que alguém comprar, o pedido aparece aqui',
    content: [
      {
        type: 'steps',
        items: [
          'Clique em Pedidos no menu',
          'Pedidos novos aparecem com status Pago (pagamento já confirmado pelo sistema)',
          'Separe o produto para envio',
          'Quando postar, abra o pedido e mude o status para Enviado — o cliente recebe e-mail automático',
          'Quando o cliente confirmar recebimento, mude para Entregue',
        ],
      },
      {
        type: 'status-list',
        title: 'O que significa cada status',
        items: [
          'Aguardando pagamento — cliente não pagou ainda, não separe nada',
          'Pago — pagamento confirmado, separe e envie',
          'Enviado — produto postado, aguardando entrega',
          'Entregue — concluído',
          'Cancelado — não enviar',
        ],
      },
      {
        type: 'warning',
        text: 'Nunca envie um pedido com status Aguardando pagamento. Só envie após confirmar o status Pago.',
      },
    ],
  },
  {
    id: 'cupons',
    icon: Ticket,
    title: 'Cupons de desconto',
    badge: 'Opcional',
    description: 'Crie códigos promocionais para divulgar nas redes sociais',
    content: [
      {
        type: 'steps',
        title: 'Como criar um cupom',
        items: [
          'Clique em Cupons no menu',
          'Clique em Novo cupom',
          'Defina o código (ex: BEMVINDA10 — use letras maiúsculas sem espaço)',
          'Escolha o tipo: Porcentagem (ex: 10%) ou Valor fixo (ex: R$ 20,00)',
          'Defina a validade se quiser',
          'Salve e divulgue o código para suas clientes',
        ],
      },
      {
        type: 'steps',
        title: 'Como desativar um cupom',
        items: [
          'Clique no cupom',
          'Mude o status para Inativo',
          'Salve — para de funcionar na hora',
        ],
      },
    ],
  },
  {
    id: 'aparencia',
    icon: Paintbrush,
    title: 'Aparência da loja',
    badge: 'Opcional',
    description: 'Troque o banner da home quando quiser divulgar novidades',
    content: [
      {
        type: 'steps',
        items: [
          'Clique em Configurações → Aparência',
          'Clique em Adicionar banner ou substitua o existente',
          'Faça upload da imagem (use foto horizontal, mínimo 1200px de largura)',
          'Preencha título e texto do botão se quiser',
          'Salve banners',
        ],
      },
      {
        type: 'tip',
        text: 'Troque o banner em datas especiais: Dia das Mães, Black Friday, lançamento de coleção.',
      },
    ],
  },
  {
    id: 'problemas',
    icon: HelpCircle,
    title: 'Problemas comuns',
    badge: 'Ajuda',
    description: 'O que fazer quando algo não funcionar como esperado',
    content: [
      {
        type: 'faq',
        items: [
          {
            question: 'O produto não aparece na loja',
            answer: 'Verifique: status está como Ativo? Tem variação com estoque maior que zero?',
          },
          {
            question: 'O cliente não recebeu e-mail de confirmação',
            answer:
              'Peça para verificar spam. Confira se o e-mail do cliente está correto no pedido.',
          },
          {
            question: 'Preciso cancelar um pedido',
            answer:
              'Abra o pedido, mude para Cancelado. Se já foi pago, combine o reembolso com a cliente diretamente.',
          },
          {
            question: 'Esqueci a senha',
            answer: 'Na tela de login clique em Esqueci minha senha e siga o e-mail.',
          },
          {
            question: 'Quero tirar um produto da loja sem apagar',
            answer: 'Abra o produto e mude o status para Inativo.',
          },
        ],
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

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<Badge, string> = {
  'Primeiro passo': 'border-blue-200 bg-blue-50 text-blue-700',
  'Obrigatório primeiro': 'border-red-200 bg-red-50 text-red-700',
  'Depois das categorias': 'border-amber-200 bg-amber-50 text-amber-700',
  'Rotina diária': 'border-green-200 bg-green-50 text-green-700',
  Opcional: 'border-stone-200 bg-stone-50 text-stone-600',
  Ajuda: 'border-sky-200 bg-sky-50 text-sky-700',
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

function FaqBlock({ block }: { block: FaqBlock }) {
  return (
    <ul className="space-y-4">
      {block.items.map((item, i) => (
        <li key={i} className="space-y-1">
          <p className="text-sm font-semibold text-stone-800">{item.question}</p>
          <p className="text-sm text-stone-600 leading-relaxed">{item.answer}</p>
        </li>
      ))}
    </ul>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'steps') return <StepsBlock block={block} />;
  if (block.type === 'status-list') return <StatusListBlock block={block} />;
  if (block.type === 'tip') return <TipBlock block={block} />;
  if (block.type === 'warning') return <WarningBlock block={block} />;
  if (block.type === 'faq') return <FaqBlock block={block} />;
  return null;
}

function BadgeChip({ badge }: { badge: Badge }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[badge]}`}
    >
      {badge}
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
        title="Guia de primeiros passos"
        description="Siga essa ordem para colocar a loja no ar do zero."
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
