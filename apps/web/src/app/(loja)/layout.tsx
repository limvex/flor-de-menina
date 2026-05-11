import { LojaShell } from '@/components/loja/loja-shell';

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <LojaShell>{children}</LojaShell>;
}
