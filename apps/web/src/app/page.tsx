import type { Metadata } from 'next';
import { LojaShell } from '@/components/loja/loja-shell';
import { HomePage } from '@/components/loja/home-page';

export const metadata: Metadata = {
  title: 'Flor de Menina — Moda Feminina em Maceió',
};

/** Rota `/` explícita — evita 404 no `next dev` (Turbopack) quando a home só existia em `(loja)/page.tsx`. */
export default function RootHomePage() {
  return (
    <LojaShell>
      <HomePage />
    </LojaShell>
  );
}
