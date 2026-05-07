'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function FooterNewsletter() {
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success('Em breve!', {
      description: 'Newsletter em construção. Obrigada pelo interesse!',
    });
    setEmail('');
  }

  return (
    <div className="bg-flor-100 py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="lg:max-w-sm">
            <h2 className="font-serif text-2xl font-medium text-flor-800 mb-2">
              Assine nossa newsletter
            </h2>
            <p className="font-sans text-sm leading-relaxed text-flor-600">
              Inscreva-se e descubra novidades, promoções, atualizações de estoque e muito mais…
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="flex w-full items-center overflow-hidden rounded-full border border-flor-200 bg-white">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                required
                className="flex-1 bg-transparent px-5 py-3 font-sans text-sm text-flor-800 placeholder:text-flor-400 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-flor-600 px-6 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-white transition-colors hover:bg-flor-700"
              >
                ENVIAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
