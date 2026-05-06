'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { customerAuthApi } from '@/lib/auth/api';
import { useAuth } from '@/lib/auth/use-auth';

const isMockMode = process.env.NEXT_PUBLIC_MOCK_GOOGLE_OAUTH === 'true';

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackContent />
    </Suspense>
  );
}

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [showMockButton, setShowMockButton] = useState(false);
  const ran = useRef(false);

  const code = searchParams.get('code');
  const redirect = searchParams.get('state') || '/';

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (isMockMode && !code) {
      setShowMockButton(true);
      return;
    }

    if (!code) {
      setError('Código de autorização não encontrado.');
      return;
    }

    customerAuthApi
      .googleCallback(code)
      .then(async () => {
        await refreshUser();
        router.replace(redirect);
      })
      .catch((err: unknown) => {
        const e = err as { message?: string };
        setError(e.message || 'Erro ao autenticar com Google.');
      });
  }, [code, redirect, refreshUser, router]);

  async function handleMockLogin() {
    try {
      await customerAuthApi.googleCallback('mock-code-' + Date.now());
      await refreshUser();
      router.replace(redirect);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Erro ao simular login Google.');
    }
  }

  return (
    <div className="min-h-screen bg-flor-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8 text-center max-w-sm w-full">
        {error ? (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-flor-800 mb-2">Erro na autenticação</h2>
            <p className="text-sm text-flor-500 mb-6">{error}</p>
            <a href="/login" className="text-sm text-flor-700 hover:text-flor-900 font-medium">
              Voltar para o login
            </a>
          </>
        ) : showMockButton ? (
          <>
            <h2 className="text-lg font-medium text-flor-800 mb-2">Modo de desenvolvimento</h2>
            <p className="text-sm text-flor-500 mb-6">
              Google OAuth em modo mock. Clique para simular o login.
            </p>
            <button
              onClick={handleMockLogin}
              className="w-full py-2.5 rounded-lg bg-flor-700 hover:bg-flor-800 text-white text-sm font-medium transition"
            >
              Simular login Google
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-2 border-flor-300 border-t-flor-700 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-flor-500">Autenticando com Google…</p>
          </>
        )}
      </div>
    </div>
  );
}
