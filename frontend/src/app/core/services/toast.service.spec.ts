import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '../http-error';
import { TOAST_LEAVE_MS, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function live() {
    return service.toasts().filter((toast) => !toast.leaving);
  }

  it('empilha sucesso com titulo Sucesso e fecha sozinho em 3800 ms', () => {
    service.success('Lançamento salvo com sucesso.');

    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].title).toBe('Sucesso');
    expect(service.toasts()[0].duration).toBe(3800);

    vi.advanceTimersByTime(3799);
    expect(live()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(live()).toHaveLength(0);

    vi.advanceTimersByTime(TOAST_LEAVE_MS);
    expect(service.toasts()).toHaveLength(0);
  });

  it('empilha alerta com titulo Alerta e fecha sozinho em 5200 ms', () => {
    service.warning('Informe os campos obrigatórios: Nome.');

    expect(service.toasts()[0].title).toBe('Alerta');
    expect(service.toasts()[0].duration).toBe(5200);

    vi.advanceTimersByTime(5199);
    expect(live()).toHaveLength(1);

    vi.advanceTimersByTime(1 + TOAST_LEAVE_MS);
    expect(service.toasts()).toHaveLength(0);
  });

  it('mantém a falha na tela indefinidamente, sem timer', () => {
    service.error(UNEXPECTED_ERROR_MESSAGE);

    expect(service.toasts()[0].title).toBe('Falha');
    expect(service.toasts()[0].duration).toBeNull();

    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].leaving).toBe(false);
  });

  it('remove do DOM 260 ms depois do fechamento manual e cancela o timer', () => {
    service.success('Categoria salva com sucesso.');
    const id = service.toasts()[0].id;

    service.dismiss(id);

    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].leaving).toBe(true);

    vi.advanceTimersByTime(TOAST_LEAVE_MS);
    expect(service.toasts()).toHaveLength(0);

    vi.advanceTimersByTime(10_000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('reinicia o toast vivo em vez de duplicar quando o texto e o tipo se repetem', () => {
    service.error(NETWORK_ERROR_MESSAGE);
    service.error(NETWORK_ERROR_MESSAGE);
    service.error(NETWORK_ERROR_MESSAGE);

    expect(service.toasts()).toHaveLength(1);
  });

  it('reinicia a contagem do auto-fechamento na de-duplicação', () => {
    service.success('Perfil salvo com sucesso.');
    vi.advanceTimersByTime(3000);

    service.success('Perfil salvo com sucesso.');
    vi.advanceTimersByTime(3000);

    expect(live()).toHaveLength(1);

    vi.advanceTimersByTime(800 + TOAST_LEAVE_MS);
    expect(service.toasts()).toHaveLength(0);
  });

  it('empilha três toasts distintos simultaneamente', () => {
    service.success('Primeiro');
    service.warning('Segundo');
    service.error('Terceiro');

    expect(service.toasts().map((toast) => toast.message)).toEqual([
      'Primeiro',
      'Segundo',
      'Terceiro',
    ]);
  });

  it('deixa exatamente três toasts ao receber o quarto, expulsando o mais antigo mesmo sendo falha', () => {
    service.error('Primeiro');
    service.warning('Segundo');
    service.success('Terceiro');

    service.success('Quarto');

    expect(live().map((toast) => toast.message)).toEqual(['Segundo', 'Terceiro', 'Quarto']);
    expect(service.toasts().find((toast) => toast.message === 'Primeiro')?.leaving).toBe(true);

    vi.advanceTimersByTime(TOAST_LEAVE_MS);
    expect(service.toasts().map((toast) => toast.message)).toEqual([
      'Segundo',
      'Terceiro',
      'Quarto',
    ]);
  });

  it('classifica 409 do backend como alerta com o texto do corpo', () => {
    service.fromHttpError(
      new HttpErrorResponse({
        status: 409,
        statusText: 'Conflict',
        error: { message: 'E-mail já cadastrado.' },
      }),
      'Não foi possível salvar o usuário.',
    );

    expect(service.toasts()[0].title).toBe('Alerta');
    expect(service.toasts()[0].message).toBe('E-mail já cadastrado.');
  });

  it('classifica 500 como falha', () => {
    service.fromHttpError(
      new HttpErrorResponse({ status: 500, statusText: 'Server Error' }),
      'Não foi possível salvar o usuário.',
    );

    expect(service.toasts()[0].title).toBe('Falha');
    expect(service.toasts()[0].message).toBe(UNEXPECTED_ERROR_MESSAGE);
  });

  it('não toasta 401: quem avisa é o interceptor', () => {
    service.fromHttpError(
      new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }),
      'Não foi possível carregar.',
    );

    expect(service.toasts()).toEqual([]);
  });
});
