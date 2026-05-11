'use client';

import { PixDisplay } from '@/components/loja/checkout/pix-display';

interface Props {
  number: string;
  pixCopyPaste: string | null;
  qrCodeBase64: string | null;
  pixExpiresAt: string | null;
}

export function ConfirmacaoPixSection({ number, pixCopyPaste, qrCodeBase64, pixExpiresAt }: Props) {
  if (!qrCodeBase64 || !pixCopyPaste || !pixExpiresAt) {
    return (
      <section className="rounded-xl border border-flor-200 p-6 space-y-4">
        <h2 className="font-semibold text-flor-800">Pague com PIX</h2>
        <p className="text-sm text-flor-500">
          Os dados do PIX não estão disponíveis neste pedido. Acesse &quot;Acompanhar pedido&quot;
          ou entre em contato com o suporte informando o número {number}.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-flor-200 p-6 space-y-4">
      <h2 className="font-semibold text-flor-800">Pague com PIX</h2>
      <PixDisplay
        qrCodeBase64={qrCodeBase64}
        copyPaste={pixCopyPaste}
        expiresAtIso={pixExpiresAt}
      />
      <p className="text-sm text-flor-500">
        Após o pagamento confirmado, você receberá um e-mail com os detalhes do pedido.
      </p>
    </section>
  );
}
