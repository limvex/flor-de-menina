'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerAuthApi } from '@/lib/auth/api';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
});

type FormData = z.infer<typeof schema>;

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await customerAuthApi.forgotPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error.status === 429) {
        setError('root', { message: 'Muitas tentativas. Aguarde alguns minutos.' });
      } else {
        // Sempre mostra sucesso para não vazar se o e-mail existe
        setSent(true);
      }
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8 text-center">
          <div className="w-12 h-12 bg-flor-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M3 8l9 6 9-6" stroke="#553D26" strokeWidth="1.5" />
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="#553D26" strokeWidth="1.5" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-flor-800 mb-2">E-mail enviado</h2>
          <p className="text-sm text-flor-500 mb-6">
            Se este e-mail estiver cadastrado, você receberá as instruções em breve. Verifique
            também sua caixa de spam.
          </p>
          <Link href="/login" className="text-sm text-flor-700 hover:text-flor-900 font-medium">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-flor-800 tracking-wide">Flor de Menina</h1>
        <p className="mt-1 text-sm text-flor-500">Recuperar senha</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8">
        <h2 className="text-lg font-medium text-flor-800 mb-2">Esqueceu a senha?</h2>
        <p className="text-sm text-flor-500 mb-6">
          Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-flor-700 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email')}
              className="w-full px-3 py-2.5 rounded-lg border border-flor-200 bg-flor-50 text-flor-900 placeholder-flor-300 text-sm focus:outline-none focus:ring-2 focus:ring-flor-400 focus:border-transparent disabled:opacity-50 transition"
              placeholder="seu@email.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {errors.root && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-flor-700 hover:bg-flor-800 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enviando…' : 'Enviar instruções'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-flor-500">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-flor-700 hover:text-flor-900 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
