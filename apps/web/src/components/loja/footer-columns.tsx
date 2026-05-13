import Link from 'next/link';
import { Clock, MapPin, MessageCircle } from 'lucide-react';
import { EloIcon, MastercardIcon, PixIcon, VisaIcon } from '@/components/loja/payment-brand-icons';
import { fetchHomeContent } from '@/lib/api/home-content';

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

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-4 first:mt-0 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-flor-700">
      {children}
    </p>
  );
}

export async function FooterColumns() {
  const content = await fetchHomeContent();

  const instagramUrl = content.instagramUrl || 'https://www.instagram.com/lojaflordemenina';
  const whatsappNumber = content.whatsappNumber || '5582991955562';

  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Institucional */}
          <div>
            <ColumnTitle>Institucional</ColumnTitle>
            <ul className="space-y-2.5">
              <ColumnLink href="/p/sobre">Sobre</ColumnLink>
              <ColumnLink href="/p/trocas-e-devolucoes">Trocas e Devoluções</ColumnLink>
              <ColumnLink href="/p/faq">FAQ</ColumnLink>
              <ColumnLink href="/p/politica-de-privacidade">Política de Privacidade</ColumnLink>
              <ColumnLink href="/p/termos-de-uso">Termos de Uso</ColumnLink>
            </ul>
          </div>

          {/* Siga-nos */}
          <div>
            <ColumnTitle>Siga-nos</ColumnTitle>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md p-1 text-flor-500 transition-colors hover:bg-flor-100 hover:text-flor-800"
              aria-label="Instagram @lojaflordemenina"
            >
              <InstagramIcon className="h-7 w-7" />
            </a>
          </div>

          {/* Formas de pagamento */}
          <div>
            <ColumnTitle>Formas de pagamento</ColumnTitle>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex h-7 w-[2.75rem] items-center justify-center"
                title="Visa"
                aria-label="Visa"
              >
                <VisaIcon className="h-5 w-full max-w-[2.75rem]" />
              </span>
              <span
                className="inline-flex h-7 w-9 items-center justify-center"
                title="Mastercard"
                aria-label="Mastercard"
              >
                <MastercardIcon className="h-6 w-9" />
              </span>
              <span
                className="inline-flex h-7 w-[2.75rem] items-center justify-center"
                title="Elo"
                aria-label="Elo"
              >
                <EloIcon className="h-5 w-full max-w-[2.75rem]" />
              </span>
              <span
                className="inline-flex h-7 w-7 items-center justify-center"
                title="PIX"
                aria-label="PIX"
              >
                <PixIcon className="h-6 w-6" />
              </span>
            </div>
          </div>

          {/* Loja */}
          <div>
            <ColumnTitle>Flor de Menina Store</ColumnTitle>
            <p className="font-sans text-sm leading-relaxed text-flor-600">
              Loja de moda feminina em Maceió — roupas, fitness e pijamas. Atendimento humanizado,
              entregas e retirada na loja.
            </p>

            <Subheading>Endereço</Subheading>
            <div className="flex items-start gap-2 text-flor-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-flor-400" aria-hidden />
              <p className="font-sans text-sm leading-relaxed">
                R. Eng. Mario de Gusmão, 513 — Ponta Verde
                <br />
                Maceió – AL, CEP 57035-000, Brasil
              </p>
            </div>

            <Subheading>Horário</Subheading>
            <div className="flex items-start gap-2 text-flor-600">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-flor-400" aria-hidden />
              <ul className="font-sans text-sm leading-relaxed">
                <li>Segunda a sexta: 09:00 às 19:00</li>
                <li>Sábado: 09:00 às 17:00</li>
              </ul>
            </div>

            <Subheading>WhatsApp</Subheading>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-sm font-medium text-flor-700 underline-offset-2 transition-colors hover:text-flor-900 hover:underline"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-flor-500" aria-hidden />+
              {whatsappNumber.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '$1 $2 $3-$4')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
