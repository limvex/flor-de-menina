import { ShieldCheck } from 'lucide-react';
import { FooterCnpjCopy } from '@/components/loja/footer-cnpj-copy';

export function FooterBottom() {
  return (
    <div className="bg-flor-800 py-4">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="font-sans text-xs text-flor-300 leading-relaxed">
            <FooterCnpjCopy />
            <span className="mx-2 hidden sm:inline">·</span>
            <br className="sm:hidden" />
            contato@flordemenina.store
            <span className="mx-2 hidden sm:inline">·</span>
            <br className="sm:hidden" />
            <span className="text-flor-400">Desenvolvido por Limvex</span>
          </div>
          <div className="flex items-center gap-1.5 text-flor-300">
            <ShieldCheck className="h-4 w-4 text-flor-400" aria-hidden="true" />
            <span className="font-sans text-xs">Site Seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
