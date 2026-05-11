'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerAuthApi } from '@/lib/auth/api';
import { ApiError, getUserFacingErrorMessage } from '@/lib/errors';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Senha deve ter pelo menos 1 letra e 1 número'),
    confirm: z.string(),
  })
  .refine((data) => data.newPassword === data.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  );
}

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (!token) {
      setError('root', { message: 'Token inválido. Solicite um novo link.' });
      return;
    }

    try {
      await customerAuthApi.resetPassword(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const status = ApiError.isApiError(err) ? err.status : (err as { status?: number }).status;
      if (status === 400) {
        setError('root', { message: getUserFacingErrorMessage(err) });
      } else {
        setError('root', { message: getUserFacingErrorMessage(err) });
      }
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8 text-center">
          <p className="text-sm text-red-600 mb-4">Link inválido ou expirado.</p>
          <Link
            href="/recuperar-senha"
            className="text-sm text-flor-700 hover:text-flor-900 font-medium"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 13l4 4L19 7"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-flor-800 mb-2">Senha redefinida!</h2>
          <p className="text-sm text-flor-500">Redirecionando para o login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-flor-800 tracking-wide">Flor de Menina</h1>
        <p className="mt-1 text-sm text-flor-500">Criar nova senha</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8">
        <h2 className="text-lg font-medium text-flor-800 mb-6">Nova senha</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-flor-700 mb-1.5">
              Nova senha
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register('newPassword')}
              className="w-full px-3 py-2.5 rounded-lg border border-flor-200 bg-flor-50 text-flor-900 placeholder-flor-300 text-sm focus:outline-none focus:ring-2 focus:ring-flor-400 focus:border-transparent disabled:opacity-50 transition"
              placeholder="Mín. 8 chars, 1 letra e 1 número"
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-flor-700 mb-1.5">
              Confirmar senha
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register('confirm')}
              className="w-full px-3 py-2.5 rounded-lg border border-flor-200 bg-flor-50 text-flor-900 placeholder-flor-300 text-sm focus:outline-none focus:ring-2 focus:ring-flor-400 focus:border-transparent disabled:opacity-50 transition"
              placeholder="Repita a senha"
            />
            {errors.confirm && (
              <p className="mt-1 text-xs text-red-600">{errors.confirm.message}</p>
            )}
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
            {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
