import type { Metadata } from 'next';

export const revalidate = 60;
import { LojaShell } from '@/components/loja/loja-shell';
import { HomePage } from '@/components/loja/home-page';

export const metadata: Metadata = {
  title: { absolute: 'Flor de Menina — Moda Feminina em Maceió-AL' },
  description:
    'Vestidos, blusas, fitness e pijamas selecionados. Loja em Maceió com entrega para todo o Brasil.',
  openGraph: {
    title: 'Flor de Menina — Moda Feminina em Maceió-AL',
    description: 'Peças clássicas e atemporais. Compre online com segurança.',
    type: 'website',
    url: 'https://flordemenina.store',
  },
  alternates: { canonical: '/' },
};

/** Rota `/` explícita — evita 404 no `next dev` (Turbopack) quando a home só existia em `(loja)/page.tsx`. */
export default function RootHomePage() {
  return (
    <LojaShell>
      <HomePage />
    </LojaShell>
  );
}
