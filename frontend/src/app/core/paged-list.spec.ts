import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Page } from './models';
import { PagedList } from './paged-list';
import { ListStateService } from './services/list-state.service';
import { ToastService } from './services/toast.service';

type Filters = { name: string; active: string };

const DEFAULTS: Filters = { name: '', active: 'true' };

function page(items: string[], totalItems: number, totalPages: number, current = 1): Page<string> {
  return { items, totalItems, totalPages, page: current, size: 10 };
}

describe('PagedList', () => {
  let state: ListStateService;
  let toast: ToastService;
  let calls: { filters: Filters; page: number }[];
  let responses: (Page<string> | Error)[];

  beforeEach(() => {
    state = TestBed.inject(ListStateService);
    toast = TestBed.inject(ToastService);
    calls = [];
    responses = [];
  });

  function create(): PagedList<Filters, string> {
    return new PagedList<Filters, string>({
      key: 'teste',
      defaults: DEFAULTS,
      loadErrorMessage: 'Não foi possível carregar a lista.',
      state,
      toast,
      fetch: async (filters, current) => {
        calls.push({ filters: { ...filters }, page: current });
        const next = responses.shift() ?? page([], 0, 0);
        if (next instanceof Error) {
          throw next;
        }
        return next;
      },
    });
  }

  it('começa no padrão, conta o filtro padrão e não tem o que limpar', async () => {
    const list = create();
    responses.push(page(['a'], 1, 1));

    await list.load();

    expect(calls).toEqual([{ filters: DEFAULTS, page: 1 }]);
    expect(list.activeCount()).toBe(1);
    expect(list.differsFromDefault()).toBe(false);
    expect(list.items()).toEqual(['a']);
    expect(list.loading()).toBe(false);
  });

  it('aplicar filtro volta à página 1 e ignora aplicação repetida', async () => {
    const list = create();
    await list.load();
    list.goTo(2);
    await Promise.resolve();

    list.filters.name = 'mer';
    list.apply();
    list.apply();

    expect(calls.map((call) => call.page)).toEqual([1, 2, 1]);
    expect(calls[2].filters).toEqual({ name: 'mer', active: 'true' });
    expect(list.activeCount()).toBe(2);
    expect(list.differsFromDefault()).toBe(true);
  });

  it('remover um rótulo reaplica os demais e limpar volta ao padrão', () => {
    const list = create();
    list.filters = { name: 'mer', active: 'false' };
    list.apply();

    list.remove('active');
    expect(calls.at(-1)?.filters).toEqual({ name: 'mer', active: '' });

    list.clear();
    expect(calls.at(-1)?.filters).toEqual(DEFAULTS);
  });

  it('restaura filtros e página de uma instância anterior', () => {
    const first = create();
    first.filters.name = 'mer';
    first.apply();
    first.goTo(2);

    const second = create();

    expect(second.applied()).toEqual({ name: 'mer', active: 'true' });
    expect(second.filters).toEqual({ name: 'mer', active: 'true' });
    expect(second.page()).toBe(2);
  });

  it('volta para a última página existente quando a atual esvaziou', async () => {
    const list = create();
    list.goTo(3);
    await Promise.resolve();
    calls = [];
    responses.push(page([], 11, 2, 3), page(['k'], 11, 2, 2));

    await list.load();

    expect(calls.map((call) => call.page)).toEqual([3, 2]);
    expect(list.page()).toBe(2);
    expect(list.items()).toEqual(['k']);
  });

  it('na falha de carga guarda a mensagem da tela e avisa pelo toast', async () => {
    const list = create();
    responses.push(new HttpErrorResponse({ status: 500 }) as unknown as Error);

    await list.load();

    expect(list.loadError()).toBe('Não foi possível carregar a lista.');
    expect(list.items()).toEqual([]);
    expect(toast.toasts()[0].title).toBe('Falha');
  });

  it('depois de uma escrita, a falha de recarga fala da lista', async () => {
    const list = create();
    responses.push(new HttpErrorResponse({ status: 500 }) as unknown as Error);

    await list.load(true);

    expect(toast.toasts()[0].message).toBe('Não foi possível carregar a lista.');
  });
});
