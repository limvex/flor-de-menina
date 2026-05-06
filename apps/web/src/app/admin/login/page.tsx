'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-screen bg-flor-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl text-flor-800 tracking-wide">Flor de Menina</h1>
          <p className="mt-1 text-sm text-flor-500">Painel Administrativo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8">
          <h2 className="text-lg font-medium text-flor-800 mb-6">Entrar</h2>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-flor-700 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                className="w-full px-3 py-2.5 rounded-lg border border-flor-200 bg-flor-50 text-flor-900 placeholder-flor-300 text-sm focus:outline-none focus:ring-2 focus:ring-flor-400 focus:border-transparent disabled:opacity-50 transition"
                placeholder="admin@flordemenina.site"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-flor-700 mb-1.5">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
                className="w-full px-3 py-2.5 rounded-lg border border-flor-200 bg-flor-50 text-flor-900 placeholder-flor-300 text-sm focus:outline-none focus:ring-2 focus:ring-flor-400 focus:border-transparent disabled:opacity-50 transition"
                placeholder="••••••••"
              />
            </div>

            {state.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-lg bg-flor-700 hover:bg-flor-800 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isPending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
