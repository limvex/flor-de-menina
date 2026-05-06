'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { customerAuthApi } from '@/lib/auth/api';

type Status = 'loading' | 'success' | 'error';

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerificarEmailContent />
    </Suspense>
  );
}

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Token não encontrado.');
      return;
    }

    customerAuthApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const error = err as { message?: string };
        setStatus('error');
        setErrorMsg(error.message || 'Token inválido ou expirado.');
      });
  }, [token]);

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-sm border border-flor-100 p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-flor-300 border-t-flor-700 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-flor-500">Verificando seu e-mail…</p>
          </>
        )}

        {status === 'success' && (
          <>
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
            <h2 className="text-lg font-medium text-flor-800 mb-2">E-mail verificado!</h2>
            <p className="text-sm text-flor-500 mb-6">
              Sua conta está ativa. Agora você pode fazer login.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 rounded-lg bg-flor-700 hover:bg-flor-800 text-white text-sm font-medium transition"
            >
              Entrar
            </Link>
          </>
        )}

        {status === 'error' && (
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
            <h2 className="text-lg font-medium text-flor-800 mb-2">Link inválido</h2>
            <p className="text-sm text-flor-500 mb-6">{errorMsg}</p>
            <Link href="/login" className="text-sm text-flor-700 hover:text-flor-900 font-medium">
              Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
