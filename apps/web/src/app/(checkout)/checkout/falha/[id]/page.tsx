import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckoutHeader } from '@/components/loja/checkout/checkout-header';
import { CheckoutFooter } from '@/components/loja/checkout/checkout-footer';
import { translatePaymentError } from '@/lib/payment/error-messages';
import type { OrderResponse, PaymentPollStatusResponse } from '@flor/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function fetchOrder(id: string): Promise<OrderResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('flor_customer_token')?.value;

    const res = await fetch(`${API_URL}/orders/${id}`, {
      cache: 'no-store',
      headers: token ? { Cookie: `flor_customer_token=${token}` } : {},
    });

    if (!res.ok) return null;
    return res.json() as Promise<OrderResponse>;
  } catch {
    return null;
  }
}

async function fetchPaymentStatus(paymentId: string): Promise<PaymentPollStatusResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('flor_customer_token')?.value;
    const res = await fetch(`${API_URL}/payments/${paymentId}/status`, {
      cache: 'no-store',
      headers: token ? { Cookie: `flor_customer_token=${token}` } : {},
    });

    if (!res.ok) return null;
    return res.json() as Promise<PaymentPollStatusResponse>;
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FalhaPagamentoPage({ params }: PageProps) {
  const { id } = await params;
  const order = await fetchOrder(id);

  if (!order) notFound();

  const paymentId = order.payment?.id;
  const paymentPoll = paymentId ? await fetchPaymentStatus(paymentId) : null;

  const reasonCode = paymentPoll?.failureReason ?? null;
  const reasonText = translatePaymentError(reasonCode);
  const method = paymentPoll?.method ?? order.payment?.method ?? 'PIX';
  const methodLabel = method === 'CREDIT_CARD' ? 'Cartão' : 'PIX';

  const whatsappText = `Olá! Preciso de ajuda com o pedido ${order.number} (${methodLabel}). Motivo: ${reasonText}`;
  const whatsappUrl = `https://wa.me/5582991955562?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <CheckoutHeader />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-2xl px-4 lg:px-8 space-y-6">
          <div className="rounded-xl border border-flor-200 bg-white p-6 space-y-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <span className="text-lg font-semibold">!</span>
              </div>
              <div className="space-y-1">
                <h1 className="font-serif text-3xl font-normal text-flor-800">
                  Pagamento não autorizado
                </h1>
                <p className="text-sm text-flor-500">
                  Pedido <span className="font-semibold text-flor-800">{order.number}</span>
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-flor-600">
                Motivo: <span className="font-medium text-flor-800">{reasonText}</span>
              </p>
              <p className="text-xs text-flor-500">Método usado: {methodLabel}</p>
            </div>
          </div>

          <div className="rounded-xl border border-flor-100 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-flor-800">Possíveis causas</h2>

            <ul className="list-disc pl-5 text-sm text-flor-600 space-y-1">
              <li>Saldo insuficiente no cartão ou limite excedido</li>
              <li>Análise de risco / dados inconsistentes</li>
              <li>Cartão não autorizado pelo banco</li>
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              nativeButton={false}
              render={
                <Link href="/checkout" className="inline-flex items-center justify-center gap-2" />
              }
              variant="outline"
              className="border-flor-300 text-flor-700"
            >
              Tentar de novo
            </Button>

            <Button
              nativeButton={false}
              render={
                <Link
                  href="/checkout?pref=pix"
                  className="inline-flex items-center justify-center gap-2"
                />
              }
              className="bg-flor-800 hover:bg-flor-700 text-white"
            >
              Tentar com PIX
            </Button>

            <Button
              nativeButton={false}
              render={
                <Link
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2"
                />
              }
              variant="outline"
              className="border-flor-300 text-flor-700 sm:col-span-2"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com atendimento
            </Button>
          </div>
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}
