import { ApiError } from './api-error';

const NETWORK_HINTS =
  /failed to fetch|networkerror|load failed|network request failed|aborted|timeout/i;

/** Mensagem única para toasts, formulários e boundaries a partir de qualquer valor lançado. */
export function getUserFacingErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    if (NETWORK_HINTS.test(error.message)) {
      return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    }
    if (error.message.trim()) {
      return error.message;
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string' && m.trim()) {
      if (NETWORK_HINTS.test(m)) {
        return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
      }
      return m.trim();
    }
  }

  return 'Ocorreu um erro inesperado. Tente novamente em instantes.';
}
