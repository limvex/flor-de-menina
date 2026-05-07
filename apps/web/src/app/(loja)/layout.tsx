import { Toaster } from 'sonner';
import { TopBar } from '@/components/loja/top-bar';
import { Header } from '@/components/loja/header';
import { Footer } from '@/components/loja/footer';

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster position="top-right" richColors />
    </>
  );
}
