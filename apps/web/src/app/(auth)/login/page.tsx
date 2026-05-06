'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/use-auth';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await login(data.email, data.password);
      router.push(redirect);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 429) {
        setError('root', { message: 'Muitas tentativas. Aguarde alguns minutos.' });
      } else if (error.status === 403) {
        setError('root', { message: 'Verifique seu e-mail antes de entrar.' });
      } else {
        setError('root', { message: 'E-mail ou senha incorretos.' });
      }
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-flor-800 tracking-wide">Flor de Menina</h1>
        <p className="mt-1 text-sm text-flor-500">Bem-vinda de volta</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8">
        <h2 className="text-lg font-medium text-flor-800 mb-6">Entrar</h2>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-flor-700 mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register('password')}
              className="w-full px-3 py-2.5 rounded-lg border border-flor-200 bg-flor-50 text-flor-900 placeholder-flor-300 text-sm focus:outline-none focus:ring-2 focus:ring-flor-400 focus:border-transparent disabled:opacity-50 transition"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="text-right">
            <Link
              href={`/recuperar-senha`}
              className="text-xs text-flor-500 hover:text-flor-700 transition"
            >
              Esqueceu a senha?
            </Link>
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
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-flor-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-flor-400">ou</span>
          </div>
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-flor-200 bg-white hover:bg-flor-50 text-flor-800 text-sm font-medium transition"
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <p className="mt-6 text-center text-sm text-flor-500">
          Não tem conta?{' '}
          <Link
            href={`/cadastro${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
            className="text-flor-700 hover:text-flor-900 font-medium"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
