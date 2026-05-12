import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Clock, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Quem somos — Flor de Menina',
  description:
    'Flor de Menina Store — moda feminina em Maceió. Roupas, fitness e pijamas. Visite nossa loja na Ponta Verde.',
};

export default function QuemSomosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <p className="font-sans text-xs uppercase tracking-[0.2em] text-flor-500 mb-2">
        Institucional
      </p>
      <h1 className="font-serif text-3xl text-flor-900 mb-6">Flor de Menina Store</h1>

      <div className="space-y-6 font-sans text-sm leading-relaxed text-flor-700">
        <p>
          A Flor de Menina Store é uma loja de moda feminina localizada em Maceió, especializada em
          roupas, itens de fitness e pijamas.
        </p>

        <section>
          <h2 className="font-serif text-xl text-flor-900 mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-flor-600" aria-hidden />
            Endereço e localização
          </h2>
          <p>
            R. Eng. Mario de Gusmão, 513 — Ponta Verde
            <br />
            Maceió – AL, CEP 57035-000, Brasil
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-flor-900 mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-flor-600" aria-hidden />
            Horário de funcionamento
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Segunda a sexta: 09:00 às 19:00</li>
            <li>Sábado: 09:00 às 17:00</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-flor-900 mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-flor-600" aria-hidden />
            Serviços e contato
          </h2>
          <p>
            Atendimento humanizado via{' '}
            <a
              href="https://wa.me/5582991955562"
              target="_blank"
              rel="noopener noreferrer"
              className="text-flor-800 underline font-medium"
            >
              WhatsApp
            </a>{' '}
            (+55 82 99195-5562). Entregas e retirada na loja.
          </p>
          <p className="mt-2">
            E-mail:{' '}
            <a href="mailto:contato@flordemenina.store" className="text-flor-800 underline">
              contato@flordemenina.store
            </a>
          </p>
        </section>

        <p className="pt-4">
          <Link href="/" className="text-flor-800 underline">
            ← Voltar para a loja
          </Link>
        </p>
      </div>
    </div>
  );
}
