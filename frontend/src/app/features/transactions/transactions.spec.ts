import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { dayHeading, isoDate } from '../../core/formatters';
import { API_BASE, Category, Page, Transaction } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';
import { Transactions } from './transactions';

const LIST_URL = `${API_BASE}/transactions`;
const OPTIONS_URL = `${API_BASE}/categories/options`;
// Relógio fixo em 15/09/2026: a tela abre no mês atual.
const MONTH = 'startDate=2026-09-01&endDate=2026-09-30';

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
  categoryName: 'Mercado',
};

const LEGACY: Transaction = { ...TRANSACTION, id: 'legacy', categoryId: null, categoryName: null };

function page(items: Transaction[], totalItems = items.length, totalPages = items.length ? 1 : 0, current = 1): Page<Transaction> {
  return { items, totalItems, totalPages, page: current, size: 10 };
}

describe('Transactions', () => {
  let fixture: ComponentFixture<Transactions>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  beforeEach(async () => {
    // Só 'Date' no toFake: falsificar setTimeout trava o settle() e o whenStable().
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 15, 10, 0, 0));

    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  // Zoneless: o createComponent já roda o ngOnInit, que decide pela permissão se pede o catálogo.
  function create(superAdmin = true): void {
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture = TestBed.createComponent(Transactions);
    fixture.detectChanges();
  }

  function withoutCategoriesView(): void {
    TestBed.inject(AuthService).permissions.set([
      { screen: 'TRANSACTIONS', canView: true, canCreate: true, canEdit: true, canDelete: true },
    ]);
  }

  async function render(
    result: Page<Transaction> = page([TRANSACTION]),
    superAdmin = true,
    listUrl = `${LIST_URL}?page=1&size=10&${MONTH}`,
    categories: Category[] = CATEGORIES,
  ): Promise<void> {
    create(superAdmin);
    httpMock.expectOne(listUrl).flush(result);
    if (TestBed.inject(AuthService).can('CATEGORIES', 'VIEW')) {
      httpMock.expectOne(OPTIONS_URL).flush(categories);
    }
    await settle();
  }

  function categoryCells(): (string | undefined)[] {
    return queryAll('tbody td[data-label="Categoria"]').map((cell) => cell.textContent?.trim());
  }

  function optionTexts(selector: string): (string | undefined)[] {
    return queryAll<HTMLOptionElement>(`${selector} option`).map((option) => option.textContent?.trim());
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

  function buttonByLabel(label: string, scope = ''): HTMLButtonElement | undefined {
    return queryAll<HTMLButtonElement>(`${scope} button`).find(
      (button) => (button.getAttribute('aria-label') ?? button.textContent?.trim()) === label,
    );
  }

  function rowCells(): HTMLElement[] {
    return queryAll('tbody tr.transaction-row td');
  }

  function summaryText(): string {
    return (query('.pagination-summary').textContent ?? '').replace(/\s+/g, ' ').trim();
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

  function monthField(): HTMLButtonElement {
    return query<HTMLButtonElement>('.filter-field .month-picker-trigger');
  }

  function monthFieldText(): string {
    return (monthField().textContent ?? '').trim();
  }

  async function chooseMonth(label: string, yearSteps = 0): Promise<void> {
    await click(monthField());
    const direction = yearSteps < 0 ? 'Ano anterior' : 'Próximo ano';
    for (let index = 0; index < Math.abs(yearSteps); index++) {
      (buttonByLabel(direction, '.month-picker-panel') as HTMLButtonElement).click();
    }
    await settle();
    await click(buttonByLabel(label, '.month-picker-panel') as HTMLButtonElement);
  }

  function chipByText(text: string): HTMLElement {
    return queryAll('.filter-chip').find((chip) => chip.textContent?.trim() === text) as HTMLElement;
  }

  it('lista a primeira página em tabela, sem formulário nem campo na linha', async () => {
    await render();

    expect(query('form')).toBeNull();
    expect(queryAll('tbody input, tbody select')).toHaveLength(0);
    const cells = rowCells();
    expect(cells.map((cell) => cell.getAttribute('data-label'))).toEqual([
      'Data',
      'Descrição',
      'Categoria',
      'Status',
      'Valor',
      null,
    ]);
    expect(cells[2].textContent?.trim()).toBe('Mercado');
    expect(summaryText()).toBe('Mostrando 1–1 de 1');
  });

  it('mostra "Novo lançamento" com CREATE e "Editar lançamento" com EDIT, navegando para o cadastro', async () => {
    await render();

    expect(query('h1.page-title').textContent?.trim()).toBe('Lançamentos');
    expect(query('.page-subtitle').textContent?.trim()).toBe('Acompanhe suas receitas e despesas');
    const include = buttonByText('Novo lançamento', '.page-header') as HTMLButtonElement;
    expect(include.classList.contains('primary-button')).toBe(true);
    await click(include);
    expect(router.navigate).toHaveBeenCalledWith(['/transactions/new']);

    const edit = buttonByLabel('Editar lançamento', 'tbody') as HTMLButtonElement;
    expect(edit.classList.contains('icon-button')).toBe(true);
    expect(edit.getAttribute('title')).toBe('Editar lançamento');
    await click(edit);
    expect(router.navigate).toHaveBeenCalledWith(['/transactions', 'transaction-1', 'edit']);
  });

  it('esconde "Novo lançamento", "Editar lançamento" e "Excluir lançamento" sem as permissões', async () => {
    TestBed.inject(AuthService).permissions.set([
      { screen: 'TRANSACTIONS', canView: true, canCreate: false, canEdit: false, canDelete: false },
    ]);
    await render(page([TRANSACTION]), false);

    expect(buttonByText('Novo lançamento')).toBeUndefined();
    expect(buttonByLabel('Editar lançamento')).toBeUndefined();
    expect(buttonByLabel('Excluir lançamento')).toBeUndefined();
  });

  it('"Excluir lançamento" pede confirmação; recusar não chama a API', async () => {
    await render();

    const remove = buttonByLabel('Excluir lançamento', 'tbody') as HTMLButtonElement;
    expect(remove.getAttribute('title')).toBe('Excluir lançamento');
    expect(buttonByLabel('Cancelar lançamento')).toBeUndefined();
    await click(remove);

    expect(query('.modal-card p').textContent?.trim()).toBe(
      'Deseja excluir o lançamento "Feira"? A exclusão não pode ser desfeita.',
    );
    await click(buttonByText('Cancelar', '.modal-card') as HTMLButtonElement);

    httpMock.expectNone(`${LIST_URL}/transaction-1`);
    expect(query('.modal-card')).toBeNull();
    expect(toastService.toasts()).toHaveLength(0);
  });

  it('confirmar a exclusão apaga o lançamento, avisa e recarrega a página sem a linha', async () => {
    await render();

    await click(buttonByLabel('Excluir lançamento', 'tbody') as HTMLButtonElement);
    await click(buttonByText('Excluir lançamento', '.modal-card') as HTMLButtonElement);

    const request = httpMock.expectOne(`${LIST_URL}/transaction-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&${MONTH}`).flush(page([]));
    await settle();

    expect(toastService.toasts().map((toast) => [toast.title, toast.message])).toEqual([
      ['Sucesso', 'Lançamento excluído com sucesso.'],
    ]);
    expect(queryAll('tbody tr.transaction-row')).toHaveLength(0);
    expect(query('.modal-card')).toBeNull();
  });

  it('na falha da exclusão avisa com a mensagem do servidor e mantém a linha', async () => {
    await render();

    await click(buttonByLabel('Excluir lançamento', 'tbody') as HTMLButtonElement);
    await click(buttonByText('Excluir lançamento', '.modal-card') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}/transaction-1`).flush(null, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(toastService.toasts()).toHaveLength(1);
    expect(queryAll('tbody tr.transaction-row')).toHaveLength(1);
  });

  it('abre no mês atual: a primeira carga sai com o mês e o campo "Data" o exibe', async () => {
    await render();

    expect(monthFieldText()).toBe('Setembro de 2026');
    expect(query('.filter-field[role="group"] > span').textContent?.trim()).toBe('Data');
    expect(queryAll('input[type="date"]')).toHaveLength(0);
    expect(chipTexts()).toEqual(['Data: Setembro de 2026']);
    expect(query('.filter-toggle').getAttribute('aria-label')).toBe('Filtros, 1 ativo');
  });

  it('escolher um mês envia do dia 1 ao último dia, inclusive fevereiro bissexto', async () => {
    await render();

    await chooseMonth('Fevereiro de 2028', 2);
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&startDate=2028-02-01&endDate=2028-02-29`)
      .flush(page([TRANSACTION]));
    await settle();

    expect(monthFieldText()).toBe('Fevereiro de 2028');
    expect(query('.month-picker-panel')).toBeNull();
    expect(chipTexts()).toEqual(['Data: Fevereiro de 2028']);

    await chooseMonth('Dezembro de 2026', -2);
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&startDate=2026-12-01&endDate=2026-12-31`)
      .flush(page([TRANSACTION]));
    await settle();

    expect(monthFieldText()).toBe('Dezembro de 2026');
  });

  it('remover o rótulo "Data" lista sem período e deixa o campo vazio, mesmo ao voltar do cadastro', async () => {
    await render();

    await click(chipByText('Data: Setembro de 2026'));
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([TRANSACTION]));
    await settle();

    expect(monthFieldText()).toBe('');
    expect(chipTexts()).toEqual([]);
    expect(query('.filter-toggle').getAttribute('aria-label')).toBe('Filtros');
    fixture.destroy();

    await render(page([TRANSACTION]), true, `${LIST_URL}?page=1&size=10`);

    expect(monthFieldText()).toBe('');
    expect(chipTexts()).toEqual([]);
  });

  it('no painel do celular o mês escolhido só vale em "Aplicar"', async () => {
    await render();

    await click(query('.filter-toggle'));
    await chooseMonth('Agosto de 2026');
    httpMock.expectNone((request) => request.url === LIST_URL);
    expect(monthFieldText()).toBe('Agosto de 2026');

    await click(buttonByText('Aplicar', '.filter-sheet') as HTMLButtonElement);
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&startDate=2026-08-01&endDate=2026-08-31`)
      .flush(page([TRANSACTION]));
    await settle();

    expect(chipTexts()).toEqual(['Data: Agosto de 2026']);
  });

  it('"Limpar filtros" do painel do celular esvazia o período antes de aplicar', async () => {
    await render();

    await click(query('.filter-toggle'));
    await click(buttonByText('Limpar filtros', '.filter-sheet') as HTMLButtonElement);
    expect(monthFieldText()).toBe('');

    await click(buttonByText('Aplicar', '.filter-sheet') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([TRANSACTION]));
    await settle();

    expect(chipTexts()).toEqual([]);
  });

  it('pagina mantendo os filtros e desabilita os botões nas pontas', async () => {
    await render(page([TRANSACTION], 11, 2));
    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION], 11, 2));
    await settle();

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 1 de 2');
    expect((buttonByText('Anterior') as HTMLButtonElement).disabled).toBe(true);

    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}?page=2&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION], 11, 2, 2));
    await settle();

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 2 de 2');
    expect((buttonByText('Próxima') as HTMLButtonElement).disabled).toBe(true);
  });

  it('aplica filtros em E pelos campos visíveis, conta no botão Filtros e remove um rótulo reaplicando os demais', async () => {
    await render(page([TRANSACTION], 11, 2));

    const description = query<HTMLInputElement>('input[name="filterDescription"]');
    description.value = 'feira';
    description.dispatchEvent(new Event('input'));
    description.dispatchEvent(new Event('change'));
    await settle();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&description=feira&${MONTH}`).flush(page([TRANSACTION]));
    await settle();

    await selectValue('select[name="filterStatus"]', 'PENDING');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&description=feira&status=PENDING&${MONTH}`).flush(page([TRANSACTION]));
    await settle();

    await selectValue('select[name="filterCategoryId"]', 'cat-expense');
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&description=feira&categoryId=cat-expense&status=PENDING&${MONTH}`)
      .flush(page([TRANSACTION]));
    await settle();

    expect(query('.filter-toggle').getAttribute('aria-label')).toBe('Filtros, 4 ativos');
    expect(chipTexts()).toEqual(['Descrição: feira', 'Categoria: Mercado', 'Status: Pendente', 'Data: Setembro de 2026']);

    await click(queryAll('.filter-chip')[0]);
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&categoryId=cat-expense&status=PENDING&${MONTH}`)
      .flush(page([TRANSACTION]));
    await settle();

    expect(chipTexts()).toEqual(['Categoria: Mercado', 'Status: Pendente', 'Data: Setembro de 2026']);
    expect(query<HTMLInputElement>('input[name="filterDescription"]').value).toBe('');
  });

  it('filtra Status por Pendente e Pago, sem padrão', async () => {
    await render();

    const options = queryAll<HTMLOptionElement>('select[name="filterStatus"] option').map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toEqual(['Todos', 'Pendente', 'Pago']);
    expect(query('select[name="filterStatus"]').textContent).not.toContain('Cancelado');
  });

  it('restaura filtros e página ao voltar do cadastro', async () => {
    await render(page([TRANSACTION], 11, 2));
    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION], 11, 2));
    await settle();
    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}?page=2&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION], 11, 2, 2));
    await settle();
    fixture.destroy();

    await render(page([TRANSACTION], 11, 2, 2), true, `${LIST_URL}?page=2&size=10&type=EXPENSE&${MONTH}`);

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 2 de 2');
    expect(chipTexts()).toEqual(['Tipo: Despesa', 'Data: Setembro de 2026']);
    expect(monthFieldText()).toBe('Setembro de 2026');
  });

  it('mostra o .loading-state durante a carga, sem .empty-state', async () => {
    create();

    expect(query('.loading-state')).not.toBeNull();
    expect(query('.table-wrap').getAttribute('aria-busy')).toBe('true');
    expect(query('.empty-state')).toBeNull();

    httpMock.expectOne(`${LIST_URL}?page=1&size=10&${MONTH}`).flush(page([]));
    httpMock.expectOne(OPTIONS_URL).flush(CATEGORIES);
    await settle();

    expect(query('.loading-state')).toBeNull();
    expect(query('.filtered-empty p').textContent?.trim()).toBe('Nenhum registro encontrado.');

    await click(chipByText('Data: Setembro de 2026'));
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([]));
    await settle();

    expect(query('.list-state strong').textContent?.trim()).toBe('Sem lançamentos cadastrados');
  });

  it('com filtro sem resultado mostra "Nenhum registro encontrado." e "Limpar filtros" volta ao padrão', async () => {
    await render();
    await selectValue('select[name="filterType"]', 'INCOME');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=INCOME&${MONTH}`).flush(page([]));
    await settle();

    expect(query('.filtered-empty p').textContent?.trim()).toBe('Nenhum registro encontrado.');

    await click(buttonByText('Limpar filtros', '.filtered-empty') as HTMLButtonElement);
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([TRANSACTION]));
    await settle();

    expect(query('.filter-toggle').getAttribute('aria-label')).toBe('Filtros');
    expect(monthFieldText()).toBe('');
    expect(chipTexts()).toEqual([]);
    expect(queryAll('tbody tr.transaction-row')).toHaveLength(1);
  });

  it('na falha de carga mostra a mensagem na área, no lugar do vazio, além do toast', async () => {
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&${MONTH}`).flush(null, { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(OPTIONS_URL).flush(CATEGORIES);
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar os lançamentos.');
    expect(query('.empty-state')).toBeNull();
    expect(query('.pagination')).toBeNull();
    expect(toastService.toasts()[0].title).toBe('Falha');
  });

  it('oferece no filtro todas as categorias do tipo, marcando as inativas', async () => {
    await render();
    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION]));
    await settle();

    const options = queryAll<HTMLOptionElement>('select[name="filterCategoryId"] option').map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toEqual(['Todas', 'Mercado', 'Antiga (Inativo)']);
  });

  it('sem permissão de ver Categorias lista as linhas e a paginação, sem erro de carga nem catálogo', async () => {
    withoutCategoriesView();
    create(false);
    httpMock
      .expectOne(`${LIST_URL}?page=1&size=10&${MONTH}`)
      .flush(page([TRANSACTION, { ...TRANSACTION, id: 'transaction-2' }, LEGACY], 23, 3));
    httpMock.expectNone(OPTIONS_URL);
    await settle();

    expect(queryAll('tbody tr.transaction-row')).toHaveLength(3);
    expect(summaryText()).toBe('Mostrando 1–10 de 23');
    expect(query('.pagination-status').textContent?.trim()).toBe('Página 1 de 3');
    expect(query('.load-error')).toBeNull();
    expect(toastService.toasts()).toHaveLength(0);
    expect(categoryCells()).toEqual(['Mercado', 'Mercado', 'Sem categoria']);

    expect(query('select[name="filterCategoryId"]')).toBeNull();

    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION]));
    httpMock.expectNone(OPTIONS_URL);
    await settle();

    expect(chipTexts()).toEqual(['Tipo: Despesa', 'Data: Setembro de 2026']);
    expect(queryAll('tbody tr.transaction-row')).toHaveLength(1);
  });

  it('mostra na coluna o nome vindo da linha, com ou sem o catálogo, e "Sem categoria" só no legado', async () => {
    const rows = page([{ ...TRANSACTION, categoryId: 'cat-12', categoryName: 'Categoria 12' }, LEGACY]);

    await render(rows);
    expect(categoryCells()).toEqual(['Categoria 12', 'Sem categoria']);
    fixture.destroy();

    withoutCategoriesView();
    await render(rows, false);
    expect(categoryCells()).toEqual(['Categoria 12', 'Sem categoria']);
  });

  it('com o catálogo pendente, as linhas já saem com o nome certo e o rótulo espera por ele', async () => {
    TestBed.inject(ListStateService).set('transactions', {
      filters: { description: '', categoryId: 'cat-expense', type: '', status: '', month: '' },
      page: 1,
    });
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&categoryId=cat-expense`).flush(page([TRANSACTION, LEGACY]));
    const options = httpMock.expectOne(OPTIONS_URL);
    await settle();

    expect(query('.loading-state')).toBeNull();
    expect(categoryCells()).toEqual(['Mercado', 'Sem categoria']);
    expect(chipTexts()).toEqual(['Categoria: …']);

    options.flush(CATEGORIES);
    await settle();

    expect(chipTexts()).toEqual(['Categoria: Mercado']);
    expect(categoryCells()).toEqual(['Mercado', 'Sem categoria']);
  });

  it('sem permissão de ver Categorias, o filtro de Categoria restaurado aparece como indisponível', async () => {
    TestBed.inject(ListStateService).set('transactions', {
      filters: { description: '', categoryId: 'cat-expense', type: '', status: '', month: '' },
      page: 1,
    });
    withoutCategoriesView();
    create(false);
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&categoryId=cat-expense`).flush(page([TRANSACTION]));
    httpMock.expectNone(OPTIONS_URL);
    await settle();

    expect(chipTexts()).toEqual(['Categoria: indisponível']);

    await click(queryAll('.filter-chip')[0]);
    httpMock.expectOne(`${LIST_URL}?page=1&size=10`).flush(page([TRANSACTION]));
    await settle();

    expect(chipTexts()).toEqual([]);
  });

  it('na falha do catálogo mantém as linhas, avisa uma vez, deixa o filtro sem opções e tenta de novo', async () => {
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&${MONTH}`).flush(page([TRANSACTION]));
    httpMock.expectOne(OPTIONS_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(query('.load-error')).toBeNull();
    expect(categoryCells()).toEqual(['Mercado']);
    expect(toastService.toasts().map((toast) => toast.title)).toEqual(['Falha']);

    expect(optionTexts('select[name="filterCategoryId"]')).toEqual(['Todas']);

    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION]));
    httpMock.expectOne(OPTIONS_URL).flush(CATEGORIES);
    await settle();

    expect(optionTexts('select[name="filterCategoryId"]')).toEqual(['Todas', 'Mercado', 'Antiga (Inativo)']);
    expect(toastService.toasts()).toHaveLength(1);
  });

  it('com a API fora, a listagem e o catálogo falhando juntos geram um único aviso', async () => {
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&${MONTH}`).error(new ProgressEvent('error'));
    httpMock.expectOne(OPTIONS_URL).error(new ProgressEvent('error'));
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar os lançamentos.');
    expect(toastService.toasts()).toHaveLength(1);
  });

  it('com o catálogo negado pelo servidor, esconde o filtro de Categoria sem aviso e não insiste', async () => {
    create();
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&${MONTH}`).flush(page([TRANSACTION]));
    httpMock
      .expectOne(OPTIONS_URL)
      .flush({ message: 'Você não tem permissão para realizar esta ação.' }, { status: 403, statusText: 'Forbidden' });
    await settle();

    expect(categoryCells()).toEqual(['Mercado']);
    expect(toastService.toasts()).toHaveLength(0);

    expect(query('select[name="filterCategoryId"]')).toBeNull();

    await selectValue('select[name="filterType"]', 'EXPENSE');
    httpMock.expectOne(`${LIST_URL}?page=1&size=10&type=EXPENSE&${MONTH}`).flush(page([TRANSACTION]));
    httpMock.expectNone(OPTIONS_URL);
    await settle();

    expect(queryAll('tbody tr.transaction-row')).toHaveLength(1);
  });

  it('mostra a data em dd/mm/aaaa e o valor com sinal, receita em verde', async () => {
    const income: Transaction = {
      ...TRANSACTION,
      id: 'income-1',
      type: 'INCOME',
      status: null,
      amount: 8450,
      categoryId: 'cat-income',
      categoryName: 'Salário',
    };
    await render(page([TRANSACTION, income]));

    const dates = queryAll('tbody td[data-label="Data"]').map((cell) => cell.textContent?.trim());
    expect(dates).toEqual(['01/07/2026', '01/07/2026']);
    const amounts = queryAll('tbody td[data-label="Valor"]');
    expect(amounts[0].textContent?.replace(/\s+/g, ' ').trim()).toBe('− R$ 120,00');
    expect(amounts[1].textContent?.replace(/\s+/g, ' ').trim()).toBe('+ R$ 8.450,00');
    expect(amounts[1].classList.contains('income')).toBe(true);
  });

  it('mostra "—" com rótulo acessível na receita sem status e a etiqueta nas despesas', async () => {
    const income: Transaction = { ...TRANSACTION, id: 'income-1', type: 'INCOME', status: null };
    await render(page([TRANSACTION, income]));

    const statusCells = queryAll('tbody td[data-label="Status"]');
    const pill = statusCells[0].querySelector('.status-pill') as HTMLElement;
    expect(pill.textContent?.trim()).toBe('Pendente');
    expect(pill.classList.contains('pill-pending')).toBe(true);
    const none = statusCells[1].querySelector('.no-status') as HTMLElement;
    expect(none.textContent?.trim()).toBe('—');
    expect(none.getAttribute('aria-label')).toBe('Sem status');
    expect(statusCells[1].querySelector('.status-pill')).toBeNull();
  });

  it('pinta a bolinha da categoria com a categoryColor e a omite quando ela é nula', async () => {
    await render(
      page([{ ...TRANSACTION, categoryColor: '#E07A3F' }, { ...TRANSACTION, id: 't2', categoryColor: null }, LEGACY]),
    );

    const dots = queryAll('tbody td[data-label="Categoria"]').map(
      (cell) => cell.querySelector<HTMLElement>('.category-dot')?.style.background ?? null,
    );
    expect(dots).toEqual(['rgb(224, 122, 63)', null, null]);
  });

  it('agrupa as linhas por dia com um cabeçalho de data para os cartões do celular', async () => {
    const other: Transaction = { ...TRANSACTION, id: 't2', transactionDate: '2026-06-30' };
    await render(page([TRANSACTION, { ...TRANSACTION, id: 't3' }, other]));

    const headings = queryAll('tbody tr.day-row th').map((cell) => cell.textContent?.trim());
    const today = isoDate(new Date());
    expect(headings).toEqual([dayHeading('2026-07-01', today), dayHeading('2026-06-30', today)]);
    expect(query('tbody tr.day-row th').getAttribute('colspan')).toBe('6');
    expect(queryAll('tbody tr.transaction-row')).toHaveLength(3);
  });
});
