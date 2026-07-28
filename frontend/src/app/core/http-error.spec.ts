import { HttpErrorResponse } from '@angular/common/http';
import {
  NETWORK_ERROR_MESSAGE,
  UNEXPECTED_ERROR_MESSAGE,
  classifyHttpError,
} from './http-error';

const FALLBACK = 'Não foi possível salvar a categoria.';

function response(status: number, error: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, statusText: 'Test', error });
}

describe('classifyHttpError', () => {
  it('trata 400 com mensagem agregada do backend como alerta', () => {
    const result = classifyHttpError(
      response(400, { message: 'Informe os campos obrigatórios: Descrição, Valor.' }),
      FALLBACK,
    );

    expect(result).toEqual({
      kind: 'warning',
      message: 'Informe os campos obrigatórios: Descrição, Valor.',
    });
  });

  it('trata 409 com mensagem no corpo como alerta', () => {
    const result = classifyHttpError(
      response(409, { message: 'Já existe uma categoria com esse nome e tipo.' }),
      FALLBACK,
    );

    expect(result).toEqual({
      kind: 'warning',
      message: 'Já existe uma categoria com esse nome e tipo.',
    });
  });

  it('trata 403 sem corpo como alerta com o texto fixo recebido', () => {
    expect(classifyHttpError(response(403), FALLBACK)).toEqual({
      kind: 'warning',
      message: FALLBACK,
    });
  });

  it('aceita corpo de erro em texto puro', () => {
    expect(classifyHttpError(response(409, 'E-mail já cadastrado.'), FALLBACK)).toEqual({
      kind: 'warning',
      message: 'E-mail já cadastrado.',
    });
  });

  it('cai no fallback quando o corpo do 400 vem malformado', () => {
    expect(classifyHttpError(response(400, { message: '   ' }), FALLBACK)).toEqual({
      kind: 'warning',
      message: FALLBACK,
    });
  });

  it('trata 500 como falha com texto fixo, ignorando o corpo', () => {
    expect(classifyHttpError(response(500, { message: 'stack trace' }), FALLBACK)).toEqual({
      kind: 'error',
      message: UNEXPECTED_ERROR_MESSAGE,
    });
  });

  it('trata 503 como falha', () => {
    expect(classifyHttpError(response(503), FALLBACK)).toEqual({
      kind: 'error',
      message: UNEXPECTED_ERROR_MESSAGE,
    });
  });

  it('trata rede/timeout (status 0) como falha', () => {
    expect(classifyHttpError(response(0), FALLBACK)).toEqual({
      kind: 'error',
      message: NETWORK_ERROR_MESSAGE,
    });
  });

  it('trata 404 como falha', () => {
    expect(classifyHttpError(response(404), FALLBACK)).toEqual({
      kind: 'error',
      message: UNEXPECTED_ERROR_MESSAGE,
    });
  });

  it('não classifica 401: o aviso é do interceptor ou da tela de login', () => {
    expect(classifyHttpError(response(401), FALLBACK)).toBeNull();
  });

  it('trata erro que não é HttpErrorResponse como falha', () => {
    expect(classifyHttpError(new Error('boom'), FALLBACK)).toEqual({
      kind: 'error',
      message: UNEXPECTED_ERROR_MESSAGE,
    });
  });
});
