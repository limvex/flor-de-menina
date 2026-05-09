import { Toaster } from 'sonner';
import { CartProvider } from '@/contexts/cart-context';
import { CheckoutProvider } from '@/contexts/checkout-context';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CheckoutProvider>
        <div className="min-h-screen flex flex-col bg-white">{children}</div>
        <Toaster position="top-right" richColors />
      </CheckoutProvider>
    </CartProvider>
  );
}
