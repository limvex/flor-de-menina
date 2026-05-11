/** Erro HTTP da API com mensagem adequada para exibição à usuária. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }

  static isApiError(value: unknown): value is ApiError {
    return value instanceof ApiError;
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const fromBody = extractMessageFromBody(body);
    const useBody =
      fromBody &&
      fromBody.length > 0 &&
      fromBody.length <= 400 &&
      !looksLikeSerializedStructure(fromBody);
    const message = useBody ? fromBody : messageForHttpStatus(status);
    return new ApiError(message, status);
  }
}

export function messageForHttpStatus(status: number): string {
  switch (status) {
    case 0:
      return 'Não foi possível conectar. Verifique sua internet e tente novamente.';
    case 400:
      return 'Não foi possível processar sua solicitação. Confira os dados e tente de novo.';
    case 401:
      return 'Sua sessão expirou ou os dados de acesso não conferem. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para esta ação.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'Esta ação conflita com o estado atual. Atualize a página e tente novamente.';
    case 422:
      return 'Alguns dados estão inválidos. Revise o formulário e tente de novo.';
    case 429:
      return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.';
    case 502:
    case 503:
    case 504:
      return 'Serviço temporariamente indisponível. Tente de novo em alguns minutos.';
    default:
      if (status >= 500) {
        return 'Estamos com uma instabilidade. Tente novamente em instantes.';
      }
      return 'Não foi possível concluir a operação. Tente novamente.';
  }
}

function looksLikeSerializedStructure(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try {
      JSON.parse(t);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function extractMessageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as { message?: unknown; error?: unknown };
  if (typeof b.message === 'string' && b.message.trim()) return b.message.trim();
  if (Array.isArray(b.message)) {
    const parts = b.message.filter((x): x is string => typeof x === 'string');
    if (parts.length) return parts.join(' ');
  }
  if (typeof b.error === 'string' && b.error.trim()) return b.error.trim();
  return null;
}

/** Lê o corpo JSON de uma resposta não OK e lança {@link ApiError}. */
export async function readErrorFromResponse(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw ApiError.fromResponse(res.status, body);
}
