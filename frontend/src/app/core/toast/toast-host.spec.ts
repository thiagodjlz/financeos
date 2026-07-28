import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TOAST_LEAVE_MS, ToastService } from '../services/toast.service';
import { ToastHost } from './toast-host';

describe('ToastHost', () => {
  let fixture: ComponentFixture<ToastHost>;
  let toastService: ToastService;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({ imports: [ToastHost] }).compileComponents();

    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function render(): void {
    fixture.detectChanges();
  }

  function advance(ms: number): void {
    vi.advanceTimersByTime(ms);
    render();
  }

  function query<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];
  }

  function cards(): HTMLElement[] {
    return queryAll<HTMLElement>('.toast-card');
  }

  function titles(): string[] {
    return queryAll<HTMLElement>('.toast-title').map((el) => el.textContent?.trim() ?? '');
  }

  it('não renderiza nenhum card com a pilha vazia', () => {
    expect(cards()).toHaveLength(0);
    expect(query('.toast-stack')).toBeTruthy();
  });

  it('renderiza o toast de sucesso com título, ícone próprio e barra de progresso', () => {
    toastService.success('Lançamento salvo com sucesso.');
    render();

    expect(titles()).toEqual(['Sucesso']);
    expect(query('.toast-message')?.textContent?.trim()).toBe('Lançamento salvo com sucesso.');
    expect(query('.toast-card')?.classList.contains('toast-success')).toBe(true);
    expect(query('.toast-icon svg')?.getAttribute('width')).toBe('20');
    expect(query('.toast-icon path')?.getAttribute('d')).toBe('M8 12.5l2.5 2.5L16 9.5');
    expect(query('.toast-progress')).toBeTruthy();
    expect(query<HTMLElement>('.toast-progress')?.style.animationDuration).toBe('3800ms');
  });

  it('renderiza o toast de alerta com o triângulo e a paleta de pendência', () => {
    toastService.warning('Informe os campos obrigatórios: Nome.');
    render();

    expect(titles()).toEqual(['Alerta']);
    expect(query('.toast-card')?.classList.contains('toast-warning')).toBe(true);
    expect(query('.toast-icon path')?.getAttribute('d')).toBe('M12 3.5l9.5 16.5H2.5L12 3.5z');
    expect(query<HTMLElement>('.toast-progress')?.style.animationDuration).toBe('5200ms');
  });

  it('renderiza o toast de falha sem barra de progresso e sem auto-fechamento', () => {
    toastService.error('Erro inesperado do sistema. Tente novamente em instantes.');
    render();

    expect(titles()).toEqual(['Falha']);
    expect(query('.toast-card')?.classList.contains('toast-error')).toBe(true);
    expect(query('.toast-progress')).toBeNull();

    advance(30_000);

    expect(cards()).toHaveLength(1);
  });

  it('fecha o sucesso sozinho em 3800 ms', () => {
    toastService.success('Categoria salva com sucesso.');
    render();

    advance(3799);
    expect(cards()).toHaveLength(1);

    advance(1 + TOAST_LEAVE_MS);
    expect(cards()).toHaveLength(0);
  });

  it('fecha o alerta sozinho em 5200 ms', () => {
    toastService.warning('Já existe uma categoria com esse nome e tipo.');
    render();

    advance(5199);
    expect(cards()).toHaveLength(1);

    advance(1 + TOAST_LEAVE_MS);
    expect(cards()).toHaveLength(0);
  });

  it('fecha pelo botão Fechar antes do timer, sem erro no console', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    toastService.success('Usuário salvo com sucesso.');
    render();

    const close = query<HTMLButtonElement>('.toast-close');
    expect(close?.getAttribute('aria-label')).toBe('Fechar');

    close?.click();
    render();

    expect(query('.toast-wrap')?.classList.contains('leaving')).toBe(true);

    advance(TOAST_LEAVE_MS);
    expect(cards()).toHaveLength(0);

    advance(10_000);
    expect(cards()).toHaveLength(0);
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('empilha três toasts distintos, do mais antigo para o mais novo', () => {
    toastService.success('Primeiro');
    toastService.warning('Segundo');
    toastService.error('Terceiro');
    render();

    expect(cards()).toHaveLength(3);
    expect(queryAll<HTMLElement>('.toast-message').map((el) => el.textContent?.trim())).toEqual([
      'Primeiro',
      'Segundo',
      'Terceiro',
    ]);
  });

  it('deixa exatamente três cards no DOM ao disparar o quarto toast, expulsando a falha mais antiga', () => {
    toastService.error('Primeiro');
    toastService.warning('Segundo');
    toastService.success('Terceiro');
    render();

    toastService.success('Quarto');
    render();

    expect(queryAll<HTMLElement>('.toast-wrap.leaving')).toHaveLength(1);

    advance(TOAST_LEAVE_MS);

    expect(cards()).toHaveLength(3);
    expect(queryAll<HTMLElement>('.toast-message').map((el) => el.textContent?.trim())).toEqual([
      'Segundo',
      'Terceiro',
      'Quarto',
    ]);
  });
});
