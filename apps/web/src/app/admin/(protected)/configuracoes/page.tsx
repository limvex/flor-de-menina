import Link from 'next/link';
import { Truck, Palette, Settings } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

const CONFIG_ITEMS = [
  {
    href: '/admin/configuracoes/frete',
    icon: Truck,
    title: 'Frete',
    description: 'Provedor de cotação, endereço de origem e regras de frete grátis.',
  },
  {
    href: '/admin/configuracoes/aparencia',
    icon: Palette,
    title: 'Aparência',
    description: 'Banner, textos da home, WhatsApp e Instagram do footer.',
  },
];

export const metadata = { title: 'Configurações | Admin' };

export default function ConfiguracoesPage() {
  return (
    <>
      <AdminPageHeader
        title="Configurações"
        description="Ajuste as configurações gerais da loja."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONFIG_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-start gap-4 rounded-xl border border-flor-100 bg-white p-5 transition-colors hover:border-flor-300"
          >
            <span className="rounded-lg bg-flor-50 p-2">
              <item.icon className="h-5 w-5 text-flor-700" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium text-flor-800">{item.title}</p>
              <p className="mt-0.5 text-sm text-flor-500">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm text-flor-400">
        <Settings className="h-4 w-4" aria-hidden="true" />
        <span>Mais configurações estarão disponíveis nas próximas tasks.</span>
      </div>
    </>
  );
}
