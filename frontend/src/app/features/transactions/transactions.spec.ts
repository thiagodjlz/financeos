import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE, Category, Page, Transaction } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';
import { Transactions } from './transactions';

const LIST_URL = `${API_BASE}/transactions`;
const OPTIONS_URL = `${API_BASE}/categories/options`;

const CATEGORIES: Category[] = [
  { id: 'cat-expense', parentId: null, name: 'Mercado', type: 'EXPENSE', color: null, active: true },
  { id: 'cat-income', parentId: null, name: 'Salário', type: 'INCOME', color: null, active: true },
  { id: 'cat-old', parentId: null, name: 'Antiga', type: 'EXPENSE', color: null, active: false },
];

const TRANSACTION: Transaction = {
  id: 'transaction-1',
  categoryId: 'cat-expense',
  transactionDate: '2026-07-01',
  description: 'Feira',
  amount: 120,
  type: 'EXPENSE',
  status: 'PENDING',
  source: 'MANUAL',
};

function page(items: Transaction[], totalItems = items.length, totalPages = items.length ? 1 : 0, current = 1): Page<Transaction> {
  return { items, totalItems, totalPages, page: current, size: 10 };
}

describe('Transactions', () => {
  let fixture: ComponentFixture<Transactions>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  function create(superAdmin = true): void {
    fixture = TestBed.createComponent(Transactions);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
  }

  async function render(
    result: Page<Transaction> = page([TRANSACTION]),
    superAdmin = true,
    listUrl = `${LIST_URL}?page=1&size=10`,
    categories: Category[] = CATEGORIES,
  ): Promise<void> {
    create(superAdmin);
    httpMock.expectOne(listUrl).flush(result);
    httpMock.expectOne(OPTIONS_URL).flush(categories);
    await settle();
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];
  }

  function buttonByText(text: string, scope = ''): HTMLButtonElement | undefined {
    return queryAll<HTMLButtonElement>(`${scope} button`).find((button) => button.textContent?.trim() === text);
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  async function openFilters(): Promise<void> {
    await click(query('.filter-toggle'));
  }

  async function selectValue(selector: string, value: string): Promise<void> {
    const select = query<HTMLSelectElement>(selector);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  function chipTexts(): string[] {
    return queryAll('.filter-chip span').map((chip) => chip.textContent?.trim() ?? '');
  }

  it('lista a primeira página em tabela, sem formulário nem campo na linha', async () => {
    await render();

    expect(query('form')).toBeNull();
    expect(queryAll('tbody input, tbody select')).toHaveLength(0);
    const cells = queryAll('tbody tr td');
    expect(cells.map((cell) => cell.getAttribute('data-label'))).toEqual([
      'Data',
      'Descrição',
      'Categoria',
      'Status',
      'Valor',
      null,
    ]);
    expect(cells[2].textContent?.trim()).toBe('Mercado');
    expect(query('.panel-heading span').textContent?.trim()).toBe('1');
  });

  it('mostra "Incluir" com CREATE e "Editar" com EDIT, navegando para o cadastro', async () => {
    await render();

    const include = buttonByText('Incluir', '.list-toolbar') as HTMLButtonElement;
    expect(include.classList.contains('primary-button')).toBe(true);
    await click(include);
    expect(router.navigate).toHaveBeenCalledWith(['/transactions/new']);

    await click(buttonByText('Editar', 'tbody') as HTMLButtonElement);
    expect(router.navigate).toHaveBeenCalledWith(['/transactions', 'transaction-1', 'edit']);
  });

  it('esconde "Incluir", "Editar" e "Cancelar" sem as permissões', async () => {
    TestBed.inject(AuthService).permissions.set([
      { screen: 'TRANSACTIONS', canView: true, canCreate: false, canEdit: false, canDelete: false },
    ]);
    await render(page([TRANSACTION]), false);

    expect(buttonByText('Incluir')).toBeUndefined();
    expect(buttonByText('Editar')).toBeUndefined();
    expect(buttonByText('Cancelar')).toBeUndefined();
  });

  it('mantém o "Cancelar" da linha cancelando o lançamento e recarregando a página', async () => {
    await render();

    await click(buttonByText('Cancelar', 'tbody') as HTMLButtonElement);

    const request = httpMock.expectOne(`${LIST_URL}/transaction-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([{ ...TRANSACTION, status: 'CANCELED' }]));
    await settle();

    expect(toastService.toasts().map((toast) => [toast.title, toast.message])).toEqual([
      ['Sucesso', 'Lançamento cancelado com sucesso.'],
    ]);
    expect(queryAll('tbody tr td')[3].textContent?.trim()).toBe('Cancelado');
  });

  it('pagina mantendo os filtros e desabilita os botões nas pontas', async () => {
    await render(page([TRANSACTION], 11, 2));
    await openFilters();
    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE`).flush(page([TRANSACTION], 11, 2));
    await settle();

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 1 de 2');
    expect((buttonByText('Anterior') as HTMLButtonElement).disabled).toBe(true);

    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}?page=2&size=10&type=EXPENSE`).flush(page([TRANSACTION], 11, 2, 2));
    await settle();

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 2 de 2');
    expect((buttonByText('Próxima') as HTMLButtonElement).disabled).toBe(true);
  });

  it('aplica filtros em E, mostra "Filtros (N)" com rótulos e remove um rótulo reaplicando os demais', async () => {
    await render(page([TRANSACTION], 11, 2));
    await openFilters();

    const description = query<HTMLInputElement>('input[name="filterDescription"]');
    description.value = 'feira';
    description.dispatchEvent(new Event('input'));
    description.dispatchEvent(new Event('change'));
    await settle();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&description=feira`).flush(page([TRANSACTION]));
    await settle();

    await selectValue('select[name="filterStatus"]', 'PENDING');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&description=feira&status=PENDING`).flush(page([TRANSACTION]));
    await settle();

    await selectValue('select[name="filterCategoryId"]', 'cat-expense');
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&description=feira&categoryId=cat-expense&status=PENDING`)
      .flush(page([TRANSACTION]));
    await settle();

    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros (3)');
    expect(chipTexts()).toEqual(['Descrição: feira', 'Categoria: Mercado', 'Status: Pendente']);

    await click(queryAll('.filter-chip-remove')[0]);
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&categoryId=cat-expense&status=PENDING`)
      .flush(page([TRANSACTION]));
    await settle();

    expect(chipTexts()).toEqual(['Categoria: Mercado', 'Status: Pendente']);
    expect(query<HTMLInputElement>('input[name="filterDescription"]').value).toBe('');
  });

  it('filtra Status por Pendente, Pago e Cancelado, sem padrão', async () => {
    await render();
    await openFilters();

    const options = queryAll<HTMLOptionElement>('select[name="filterStatus"] option').map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toEqual(['Todos', 'Pendente', 'Pago', 'Cancelado']);
    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros');
  });

  it('restaura filtros e página ao voltar do cadastro', async () => {
    await render(page([TRANSACTION], 11, 2));
    await openFilters();
    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE`).flush(page([TRANSACTION], 11, 2));
    await settle();
    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}?page=2&size=10&type=EXPENSE`).flush(page([TRANSACTION], 11, 2, 2));
    await settle();
    fixture.destroy();

    await render(page([TRANSACTION], 11, 2, 2), true, `${LIST_URL}?page=2&size=10&type=EXPENSE`);

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 2 de 2');
    expect(chipTexts()).toEqual(['Tipo: Despesa']);
  });

  it('mostra o .loading-state durante a carga, sem .empty-state', async () => {
    create();

    expect(query('.loading-state')).not.toBeNull();
    expect(query('.table-wrap').getAttribute('aria-busy')).toBe('true');
    expect(query('.empty-state')).toBeNull();

    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([]));
    httpMock.expectOne(OPTIONS_URL).flush(CATEGORIES);
    await settle();

    expect(query('.loading-state')).toBeNull();
    expect(query('.empty-state').textContent?.trim()).toBe('Sem lançamentos cadastrados');
  });

  it('com filtro sem resultado mostra "Nenhum registro encontrado." e "Limpar filtros" volta ao padrão', async () => {
    await render();
    await openFilters();
    await selectValue('select[name="filterType"]', 'INCOME');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=INCOME`).flush(page([]));
    await settle();

    expect(query('.filtered-empty p').textContent?.trim()).toBe('Nenhum registro encontrado.');

    await click(buttonByText('Limpar filtros', '.filtered-empty') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([TRANSACTION]));
    await settle();

    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros');
    expect(queryAll('tbody tr')).toHaveLength(1);
  });

  it('na falha de carga mostra a mensagem na área, no lugar do vazio, além do toast', async () => {
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(null, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(OPTIONS_URL).flush(CATEGORIES);
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar os lançamentos.');
    expect(query('.empty-state')).toBeNull();
    expect(query('.pagination')).toBeNull();
    expect(toastService.toasts()[0].title).toBe('Falha');
  });

  it('resolve o nome da categoria com mais de 10 categorias e mantém "Sem categoria" nos legados', async () => {
    const many: Category[] = Array.from({ length: 12 }, (_, index) => ({
      id: `cat-${index + 1}`,
      parentId: null,
      name: `Categoria ${index + 1}`,
      type: 'EXPENSE',
      color: null,
      active: true,
    }));

    await render(
      page([{ ...TRANSACTION, categoryId: 'cat-12' }, { ...TRANSACTION, id: 'legacy', categoryId: null }]),
      true,
      `${LIST_URL}?page=1&size=10`,
      many,
    );

    const categoryCells = queryAll('tbody td[data-label="Categoria"]').map((cell) => cell.textContent?.trim());
    expect(categoryCells).toEqual(['Categoria 12', 'Sem categoria']);
  });

  it('oferece no filtro todas as categorias do tipo, marcando as inativas', async () => {
    await render();
    await openFilters();
    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE`).flush(page([TRANSACTION]));
    await settle();

    const options = queryAll<HTMLOptionElement>('select[name="filterCategoryId"] option').map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toEqual(['Todas', 'Mercado', 'Antiga (Inativo)']);
  });

  it('com a listagem respondendo antes do catálogo, segura as linhas e o rótulo até ele chegar', async () => {
    TestBed.inject(ListStateService).set('transactions', {
      filters: { description: '', categoryId: 'cat-expense', type: '', status: '', startDate: '', endDate: '' },
      page: 1,
    });
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&categoryId=cat-expense`).flush(page([TRANSACTION]));
    await settle();

    expect(query('.loading-state')).not.toBeNull();
    expect(queryAll('tbody tr')).toHaveLength(0);
    expect(chipTexts()).toEqual(['Categoria: …']);
    expect(fixture.nativeElement.textContent).not.toContain('Sem categoria');

    httpMock.expectOne(OPTIONS_URL).flush(CATEGORIES);
    await settle();

    expect(query('.loading-state')).toBeNull();
    expect(query('tbody td[data-label="Categoria"]').textContent?.trim()).toBe('Mercado');
    expect(chipTexts()).toEqual(['Categoria: Mercado']);
  });

  it('na falha do catálogo mostra o erro de carga no lugar das linhas e tenta de novo na próxima carga', async () => {
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([TRANSACTION]));
    httpMock.expectOne(OPTIONS_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar os lançamentos.');
    expect(queryAll('tbody tr')).toHaveLength(0);
    expect(toastService.toasts()).toHaveLength(1);

    await openFilters();
    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE`).flush(page([TRANSACTION]));
    httpMock.expectOne(OPTIONS_URL).flush(CATEGORIES);
    await settle();

    expect(query('.load-error')).toBeNull();
    expect(query('tbody td[data-label="Categoria"]').textContent?.trim()).toBe('Mercado');
  });
});
