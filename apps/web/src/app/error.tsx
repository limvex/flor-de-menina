'use client';

import { useEffect } from 'react';
import { AppErrorScreen } from '@/components/errors/app-error-screen';
import { getUserFacingErrorMessage } from '@/lib/errors';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App error]', error.digest ?? error.message, error);
  }, [error]);

  return (
    <AppErrorScreen
      description={getUserFacingErrorMessage(error)}
      onReset={reset}
      lojaHref="/"
      lojaLabel="Voltar à loja"
    />
  );
}
