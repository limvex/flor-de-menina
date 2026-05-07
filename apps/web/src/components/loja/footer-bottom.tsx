import { ShieldCheck } from 'lucide-react';

export function FooterBottom() {
  return (
    <div className="bg-flor-800 py-4">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-sans text-xs text-flor-300 leading-relaxed">
            Flor de Menina LTDA — CNPJ XX.XXX.XXX/0001-XX
            <span className="mx-2 hidden sm:inline">·</span>
            <br className="sm:hidden" />
            contato@flordemenina.com.br
            <span className="mx-2 hidden sm:inline">·</span>
            <br className="sm:hidden" />
            <span className="text-flor-400">Desenvolvido por Limvex</span>
          </p>
          <div className="flex items-center gap-1.5 text-flor-300">
            <ShieldCheck className="h-4 w-4 text-flor-400" aria-hidden="true" />
            <span className="font-sans text-xs">Site Seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
