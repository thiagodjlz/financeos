import { HttpErrorResponse } from '@angular/common/http';

export const UNEXPECTED_ERROR_MESSAGE = 'Erro inesperado do sistema. Tente novamente em instantes.';
export const NETWORK_ERROR_MESSAGE =
  'Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.';

export type HttpErrorKind = 'warning' | 'error';

export interface ClassifiedHttpError {
  kind: HttpErrorKind;
  message: string;
}

const CORRECTABLE_STATUSES = [400, 403, 409, 422];

export function classifyHttpError(err: unknown, fallback: string): ClassifiedHttpError | null {
  if (!(err instanceof HttpErrorResponse)) {
    return { kind: 'error', message: UNEXPECTED_ERROR_MESSAGE };
  }

  // 401 tem dono próprio: o interceptor avisa da sessão expirada e a tela de login avisa das
  // credenciais inválidas. Classificar aqui produziria um segundo toast na mesma resposta.
  if (err.status === 401) {
    return null;
  }

  if (err.status === 0) {
    return { kind: 'error', message: NETWORK_ERROR_MESSAGE };
  }

  if (CORRECTABLE_STATUSES.includes(err.status)) {
    return { kind: 'warning', message: bodyMessage(err) ?? fallback };
  }

  return { kind: 'error', message: UNEXPECTED_ERROR_MESSAGE };
}

function bodyMessage(err: HttpErrorResponse): string | null {
  const body: unknown = err.error;

  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }

  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  return null;
}
