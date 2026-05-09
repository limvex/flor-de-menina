import { Shield, CreditCard, Lock } from 'lucide-react';

export function CheckoutFooter() {
  return (
    <footer className="border-t border-flor-100 bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 lg:px-8">
        <div className="flex flex-wrap justify-center gap-6 text-xs text-flor-400">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>Site seguro SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>Dados protegidos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            <span>Pagamento seguro</span>
          </div>
        </div>
        <p className="text-xs text-flor-300">
          © {new Date().getFullYear()} Flor de Menina. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
