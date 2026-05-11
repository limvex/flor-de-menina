'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';

const CNPJ_FORMATTED = '31.721.577/0001-16';
const CNPJ_DIGITS = '31721577000116';

export function FooterCnpjCopy() {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>Flor de Menina LTDA — CNPJ {CNPJ_FORMATTED}</span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(CNPJ_DIGITS).then(
            () => toast.success('CNPJ copiado'),
            () => toast.error('Não foi possível copiar'),
          );
        }}
        className="inline-flex items-center gap-1 rounded border border-flor-500/40 px-1.5 py-0.5 font-sans text-[11px] text-flor-200 transition hover:bg-flor-700/50 hover:text-white"
        aria-label={`Copiar CNPJ ${CNPJ_DIGITS}`}
      >
        <Copy className="h-3 w-3 shrink-0" aria-hidden />
        Copiar
      </button>
    </span>
  );
}
