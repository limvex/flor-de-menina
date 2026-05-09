'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { createOrder } from '@/lib/api/orders';
import { formatPrice } from '@/lib/format';
import type { CheckoutStep } from '@flor/types';

interface InsufficientItem {
  productName: string;
  variantLabel: string;
  requested: number;
  available: number;
}

function EditButton({
  step,
  label,
  onEdit,
}: {
  step: CheckoutStep;
  label: string;
  onEdit: (step: CheckoutStep) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEdit(step)}
      className="flex items-center gap-1 text-xs text-flor-600 hover:text-flor-800 transition-colors"
      aria-label={`Editar ${label}`}
    >
      <Pencil className="h-3 w-3" />
      Editar
    </button>
  );
}

export function StepReview() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { state, goToStep, clearCheckout } = useCheckout();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stockErrors, setStockErrors] = useState<InsufficientItem[]>([]);

  const { identification, address, shipping, payment } = state;

  const shippingCost = shipping?.cost ?? 0;
  const total = (cart?.subtotal ?? 0) + shippingCost;

  const handleFinalize = async () => {
    if (!agreed || !identification || !address || !shipping || !payment) return;
    setStockErrors([]);
    setLoading(true);

    try {
      const order = await createOrder({
        addressId: address.addressId,
        shippingOption: {
          carrier: shipping.carrier,
          service: shipping.service,
          cost: shipping.cost,
          estimatedDays: shipping.estimatedDays,
        },
        paymentMethod: payment.method,
        cpf: identification.cpf,
        notes: undefined,
      });

      clearCart();
      clearCheckout();
      router.push(`/pedido/confirmacao/${order.id}`);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);

      // Try to parse INSUFFICIENT_STOCK structured error
      try {
        const parsed = JSON.parse(raw) as {
          error?: string;
          items?: InsufficientItem[];
        };
        if (parsed.error === 'INSUFFICIENT_STOCK' && parsed.items) {
          setStockErrors(parsed.items);
          toast.error(`Estoque insuficiente para ${parsed.items.length} item(s)`);
          return;
        }
      } catch {
        // not JSON — fall through to generic error
      }

      toast.error(raw || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  const maskCpf = (cpf: string) => cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.$2.$3-**');

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl font-normal text-flor-800">Revisão do pedido</h2>

      {/* Identificação */}
      <section className="rounded-lg border border-flor-100 p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-flor-500">
            Identificação
          </h3>
          <EditButton step={1} label="identificação" onEdit={goToStep} />
        </div>
        {identification && (
          <div className="text-sm text-flor-700 space-y-0.5">
            <p>{identification.name}</p>
            <p>{maskCpf(identification.cpf)}</p>
            <p>{identification.phone}</p>
          </div>
        )}
      </section>

      {/* Endereço */}
      <section className="rounded-lg border border-flor-100 p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-flor-500">
            Endereço de entrega
          </h3>
          <EditButton step={2} label="endereço" onEdit={goToStep} />
        </div>
        {address && (
          <div className="text-sm text-flor-700 space-y-0.5">
            <p>{address.snapshot.recipientName}</p>
            <p>
              {address.snapshot.street}, {address.snapshot.number}
              {address.snapshot.complement ? `, ${address.snapshot.complement}` : ''}
            </p>
            <p>
              {address.snapshot.neighborhood} — {address.snapshot.city}/{address.snapshot.state}
            </p>
            <p>CEP {address.snapshot.zipCode}</p>
          </div>
        )}
      </section>

      {/* Entrega */}
      <section className="rounded-lg border border-flor-100 p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-flor-500">Entrega</h3>
          <EditButton step={3} label="entrega" onEdit={goToStep} />
        </div>
        {shipping && (
          <div className="text-sm text-flor-700 space-y-0.5">
            <p>{shipping.label}</p>
            <p className="font-medium">
              {shipping.cost === 0 ? 'Grátis' : formatPrice(shipping.cost)}
            </p>
          </div>
        )}
      </section>

      {/* Pagamento */}
      <section className="rounded-lg border border-flor-100 p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-flor-500">
            Pagamento
          </h3>
          <EditButton step={4} label="pagamento" onEdit={goToStep} />
        </div>
        {payment && (
          <p className="text-sm text-flor-700">
            {payment.method === 'PIX' ? 'PIX — aprovação imediata' : 'Cartão de crédito'}
          </p>
        )}
      </section>

      {/* Itens */}
      <section className="rounded-lg border border-flor-100 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-flor-500">
          Itens ({cart?.itemCount ?? 0})
        </h3>
        <ul className="space-y-2">
          {cart?.items.map((item) => {
            const hasStockError = stockErrors.some(
              (e) => e.productName === item.product.name && e.variantLabel === item.variant.label,
            );
            return (
              <li
                key={item.id}
                className={`flex items-center gap-3 ${hasStockError ? 'rounded-lg border border-red-200 bg-red-50 p-2' : ''}`}
              >
                <div className="relative h-12 w-9 flex-shrink-0 overflow-hidden rounded bg-flor-100">
                  {item.product.image && (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-flor-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-flor-500">
                    {item.variant.label} · Qtd: {item.quantity}
                  </p>
                  {hasStockError && (
                    <p role="alert" className="text-xs text-red-600">
                      {stockErrors.find((e) => e.productName === item.product.name)?.available}{' '}
                      disponível
                    </p>
                  )}
                </div>
                <span className="text-xs font-medium text-flor-800">
                  {formatPrice(item.variant.price * item.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <Separator />

      {/* Total */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-flor-500">
          <span>Subtotal</span>
          <span>{formatPrice(cart?.subtotal ?? 0)}</span>
        </div>
        <div className="flex justify-between text-flor-500">
          <span>Frete</span>
          <span>{shippingCost === 0 ? 'Grátis' : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-flor-800">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Termos */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="terms" className="text-sm text-flor-600 cursor-pointer">
          Li e aceito os{' '}
          <a
            href="/termos-de-uso"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-flor-800"
          >
            Termos de uso
          </a>{' '}
          e a{' '}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-flor-800"
          >
            Política de privacidade
          </a>
        </Label>
      </div>

      <Button
        type="button"
        className="w-full bg-flor-800 hover:bg-flor-700 text-white py-6 text-base"
        disabled={!agreed || loading}
        onClick={handleFinalize}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          'Finalizar pedido'
        )}
      </Button>
    </div>
  );
}
