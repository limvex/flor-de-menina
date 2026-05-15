import { Toaster } from 'sonner';
import { TopBar } from '@/components/loja/top-bar';
import { Header } from '@/components/loja/header';
import { Footer } from '@/components/loja/footer';
import { CartProvider } from '@/contexts/cart-context';

/** Shell da vitrine (header, footer, carrinho) — usado no layout (loja) e na rota raiz `app/page.tsx`. */
export function LojaShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TopBar />
      <Header />
      <main className="flex-1 pt-[92px] lg:pt-[104px]">{children}</main>
      <Footer />
      <Toaster position="top-right" richColors />
    </CartProvider>
  );
}
