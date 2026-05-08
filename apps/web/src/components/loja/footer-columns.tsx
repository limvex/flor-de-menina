import Link from 'next/link';
import { MapPin } from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-sans text-xs font-semibold tracking-[0.15em] uppercase text-flor-800">
      {children}
    </p>
  );
}

function ColumnLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="font-sans text-sm text-flor-500 transition-colors hover:text-flor-800"
      >
        {children}
      </Link>
    </li>
  );
}

function PaymentPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded border border-flor-200 px-2 py-1 font-sans text-[10px] font-medium text-flor-600">
      {label}
    </span>
  );
}

export function FooterColumns() {
  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Institucional */}
          <div>
            <ColumnTitle>Institucional</ColumnTitle>
            <ul className="space-y-2.5">
              <ColumnLink href="/quem-somos">Quem Somos</ColumnLink>
              <ColumnLink href="/trocas-e-devolucoes">Trocas e Devoluções</ColumnLink>
              <ColumnLink href="/faq">FAQ</ColumnLink>
              <ColumnLink href="/politica-de-privacidade">Política de Privacidade</ColumnLink>
            </ul>
          </div>

          {/* Siga-nos */}
          <div>
            <ColumnTitle>Siga-nos</ColumnTitle>
            <a
              href="https://instagram.com/lojaflordemenina"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-sm text-flor-500 transition-colors hover:text-flor-800"
              aria-label="Instagram da Flor de Menina"
            >
              <InstagramIcon className="h-5 w-5" />
              @lojaflordemenina
            </a>
          </div>

          {/* Formas de pagamento */}
          <div>
            <ColumnTitle>Formas de pagamento</ColumnTitle>
            <div className="flex flex-wrap gap-2">
              <PaymentPill label="Visa" />
              <PaymentPill label="Mastercard" />
              <PaymentPill label="Elo" />
              <PaymentPill label="PIX" />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <ColumnTitle>Visite nossa loja</ColumnTitle>
            <div className="flex items-start gap-2 text-flor-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-flor-400" aria-hidden="true" />
              <p className="font-sans text-sm leading-relaxed">
                Maceió – AL
                <br />
                <span className="text-flor-400">Endereço completo em breve</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
