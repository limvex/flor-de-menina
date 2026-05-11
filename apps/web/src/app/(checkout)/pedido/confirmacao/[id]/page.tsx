import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Circle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckoutHeader } from '@/components/loja/checkout/checkout-header';
import { CheckoutFooter } from '@/components/loja/checkout/checkout-footer';
import { ConfirmacaoPixSection } from '@/components/loja/checkout/confirmacao-pix-section';
import { CheckoutConfetti } from '@/components/loja/checkout/checkout-confetti';
import { formatPrice } from '@/lib/format';
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

export default async function ConfirmacaoPage({ params }: PageProps) {
  const { id } = await params;
  const order = await fetchOrder(id);

  if (!order) notFound();

  const isPix = order.payment?.method === 'PIX';
  const addr = order.shippingAddress;
  const paymentPoll = !isPix && order.payment ? await fetchPaymentStatus(order.payment.id) : null;

  const paymentMethodLabel = isPix
    ? 'PIX'
    : paymentPoll?.card?.brand
      ? `Cartão (${paymentPoll.card.brand} •••${paymentPoll.card.last4 ?? '—'})`
      : 'Cartão';

  const shareText = `Pedido ${order.number} confirmado! ✅`;
  const whatsappUrl = `https://wa.me/5582991955562?text=${encodeURIComponent(shareText)}`;

  const timeline: Array<{ key: string; label: string }> = [
    { key: 'PAID', label: 'Pago' },
    { key: 'PROCESSING', label: 'Em preparo' },
    { key: 'SHIPPED', label: 'Enviado' },
    { key: 'DELIVERED', label: 'Entregue' },
  ];
  const currentIdx = timeline.findIndex((s) => s.key === order.status);

  return (
    <div className="flex min-h-screen flex-col">
      <CheckoutConfetti />
      <CheckoutHeader />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-2xl px-4 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" aria-hidden="true" />
            <h1 className="font-serif text-3xl font-normal text-flor-800">Pedido realizado!</h1>
            <p className="text-flor-500">
              Pedido <span className="font-semibold text-flor-800">{order.number}</span>
            </p>
          </div>

          {isPix && order.payment && (
            <ConfirmacaoPixSection
              number={order.number}
              pixCopyPaste={order.payment.pixCopyPaste}
              qrCodeBase64={order.payment.qrCodeBase64}
              pixExpiresAt={order.payment.pixExpiresAt}
            />
          )}

          {!isPix && (
            <section className="rounded-xl border border-flor-200 p-6 space-y-2">
              <h2 className="font-semibold text-flor-800">Pagamento com cartão</h2>
              <p className="text-sm text-flor-600">
                {order.status === 'PAID'
                  ? 'Pagamento aprovado. Você receberá um e-mail com a confirmação.'
                  : 'Seu pagamento está sendo processado. Você receberá uma confirmação por e-mail em breve.'}
              </p>
            </section>
          )}

          <section className="rounded-xl border border-flor-100 p-6 space-y-4">
            <h2 className="font-semibold text-flor-800">Resumo do pedido</h2>

            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-flor-100">
                    {item.productImageUrl ? (
                      <Image
                        src={item.productImageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-4 w-4 text-flor-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-flor-800">{item.productName}</p>
                    <p className="text-xs text-flor-500">
                      {[item.variantSize, item.variantColor].filter(Boolean).join(' - ') ||
                        'Padrão'}{' '}
                      · Qtd: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-flor-800">
                    {formatPrice(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-flor-500">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-flor-500">
                <span>Frete</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-semibold text-flor-800">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-flor-100 p-6 space-y-3">
            <h2 className="font-semibold text-flor-800">Status do pedido</h2>

            <div className="space-y-3">
              {timeline.map((step, idx) => {
                const done = currentIdx >= idx && currentIdx !== -1;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-flor-300" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-flor-800">{step.label}</p>
                      {done && <p className="text-xs text-flor-500">Concluído</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-flor-500">
              Forma de pagamento:{' '}
              <span className="font-medium text-flor-800">{paymentMethodLabel}</span>
            </p>
          </section>

          <section className="rounded-xl border border-flor-100 p-6 space-y-2">
            <h2 className="font-semibold text-flor-800">Endereço de entrega</h2>
            <p className="text-sm text-flor-700">{addr.recipientName}</p>
            <p className="text-sm text-flor-600">
              {addr.street}, {addr.number}
              {addr.complement ? `, ${addr.complement}` : ''} — {addr.neighborhood}
            </p>
            <p className="text-sm text-flor-600">
              {addr.city}/{addr.state} — CEP {addr.zipCode}
            </p>
            {order.shipping?.estimatedDays != null && (
              <p className="text-sm text-flor-500">
                Entrega estimada: {order.shipping.estimatedDays} dias úteis
              </p>
            )}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link href={`/conta/pedidos/${order.id}`} />}
              variant="outline"
              className="flex-1 border-flor-300 text-flor-700"
              nativeButton={false}
            >
              Acompanhar pedido
            </Button>
            <Button
              render={<Link href="/" />}
              className="flex-1 bg-flor-800 hover:bg-flor-700 text-white"
              nativeButton={false}
            >
              Continuar comprando
            </Button>
          </div>

          <div>
            <Button
              render={<Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}
              variant="outline"
              className="w-full border-flor-300 text-flor-700"
              nativeButton={false}
            >
              Compartilhar no WhatsApp
            </Button>
          </div>
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}
