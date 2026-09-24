import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_BASE, Category, Transaction } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionForm } from './transaction-form';

const EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat-expense', parentId: null, name: 'Mercado', type: 'EXPENSE', color: null, active: true },
];

const INCOME_CATEGORIES: Category[] = [
  { id: 'cat-income', parentId: null, name: 'Salário', type: 'INCOME', color: null, active: true },
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

const NO_PERMISSION_NOTICE =
  'Seu perfil não tem permissão para ver Categorias, por isso não é possível escolher a categoria.';

const TODAY = new Date().toISOString().slice(0, 10);

describe('TransactionForm', () => {
  let fixture: ComponentFixture<TransactionForm>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  // Zoneless: o createComponent já roda o ngOnInit, então a permissão precisa estar posta antes dele.
  async function setup(id: string | null, canViewCategories = true): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TransactionForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);
    auth.superAdmin.set(canViewCategories);
    auth.permissions.set([
      { screen: 'TRANSACTIONS', canView: true, canCreate: true, canEdit: true, canDelete: true },
    ]);
    fixture = TestBed.createComponent(TransactionForm);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  async function renderNew(categories: Category[] = EXPENSE_CATEGORIES): Promise<void> {
    await setup(null);
    httpMock.expectOne(`${API_BASE}/categories/options?type=EXPENSE`).flush(categories);
    await settle();
  }

  async function renderEdit(transaction: Transaction = TRANSACTION): Promise<void> {
    await setup(transaction.id);
    httpMock.expectOne(`${API_BASE}/transactions/${transaction.id}`).flush(transaction);
    await settle();
    httpMock.expectOne(`${API_BASE}/categories/options?type=${transaction.type}`).flush(EXPENSE_CATEGORIES);
    await settle();
  }

  async function settle(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await fixture.whenStable();
      fixture.detectChanges();
    }
  }

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];
  }

  function value(selector: string): string {
    return query<HTMLInputElement>(selector).value;
  }

  function categoryOptions(): string[] {
    return queryAll<HTMLOptionElement>('select[name="categoryId"] option').map((option) => option.textContent?.trim() ?? '');
  }

  async function fillText(selector: string, text: string): Promise<void> {
    const input = query<HTMLInputElement>(selector);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function selectValue(selector: string, optionValue: string): Promise<void> {
    const select = query<HTMLSelectElement>(selector);
    select.value = optionValue;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  function button(text: string): HTMLButtonElement {
    return queryAll<HTMLButtonElement>('button').find((item) => item.textContent?.trim() === text) as HTMLButtonElement;
  }

  function toasts() {
    return toastService.toasts();
  }

  it('abre a inclusão com o título, os campos e os valores iniciais de hoje', async () => {
    await renderNew();

    expect(query('.page-title').textContent?.trim()).toBe('Novo lançamento');
    expect(value('input[name="transactionDate"]')).toBe(TODAY);
    expect(value('input[name="description"]')).toBe('');
    expect(value('input[name="amount"]')).toBe('0');
    expect(value('select[name="type"]')).toBe('EXPENSE');
    expect(value('select[name="status"]')).toBe('PENDING');
    expect(value('select[name="categoryId"]')).toBe('');
    expect(categoryOptions()).toEqual(['Selecione', 'Mercado']);
    expect(button('Salvar').getAttribute('type')).toBe('submit');
    expect(button('Cancelar').getAttribute('type')).toBe('button');
  });

  it('filtra a Categoria pelo Tipo e esconde o Status em Receita', async () => {
    await renderNew();
    await selectValue('select[name="categoryId"]', 'cat-expense');

    await selectValue('select[name="type"]', 'INCOME');
    httpMock.expectOne(`${API_BASE}/categories/options?type=INCOME`).flush(INCOME_CATEGORIES);
    await settle();

    expect(categoryOptions()).toEqual(['Selecione', 'Salário']);
    expect(value('select[name="categoryId"]')).toBe('');
    expect(query('select[name="status"]')).toBeNull();
  });

  it('oferece todas as categorias ativas do tipo mesmo com mais de 10', async () => {
    const many: Category[] = Array.from({ length: 12 }, (_, index) => ({
      id: `cat-${index + 1}`,
      parentId: null,
      name: `Categoria ${index + 1}`,
      type: 'EXPENSE',
      color: null,
      active: true,
    }));

    await renderNew(many);

    expect(categoryOptions()).toHaveLength(13);
    expect(categoryOptions().at(-1)).toBe('Categoria 12');
  });

  it('salva a inclusão com o payload de hoje, avisa e volta à listagem', async () => {
    await renderNew();
    await fillText('input[name="description"]', 'Feira');
    await fillText('input[name="amount"]', '120');
    await selectValue('select[name="categoryId"]', 'cat-expense');

    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      transactionDate: TODAY,
      description: 'Feira',
      amount: 120,
      type: 'EXPENSE',
      status: 'PENDING',
      categoryId: 'cat-expense',
    });
    request.flush(TRANSACTION);
    await settle();

    expect(toasts().map((toast) => [toast.title, toast.message])).toEqual([
      ['Sucesso', 'Lançamento salvo com sucesso.'],
    ]);
    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
  });

  it('manda status nulo para Receita', async () => {
    await renderNew();
    await selectValue('select[name="type"]', 'INCOME');
    httpMock.expectOne(`${API_BASE}/categories/options?type=INCOME`).flush(INCOME_CATEGORIES);
    await settle();

    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body.status).toBeNull();
    expect(request.request.body.categoryId).toBeNull();
    request.flush(TRANSACTION);
    await settle();
  });

  it('no 400 permanece no cadastro com destaque, legenda, foco e toast', async () => {
    await renderNew();

    await click(button('Salvar'));

    httpMock.expectOne(`${API_BASE}/transactions`).flush(
      {
        violations: [
          { field: 'create.request.categoryId', message: 'A categoria é obrigatória.' },
          { field: 'create.request.description', message: 'A descrição é obrigatória.' },
        ],
        message: 'Informe os campos obrigatórios: Descrição, Categoria.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('input[name="description"]').classList.contains('invalid')).toBe(true);
    expect(query('select[name="categoryId"]').classList.contains('invalid')).toBe(true);
    expect(queryAll('.field-error').map((error) => error.textContent?.trim())).toEqual([
      'A descrição é obrigatória.',
      'A categoria é obrigatória.',
    ]);
    expect((document.activeElement as HTMLElement).getAttribute('name')).toBe('description');
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Informe os campos obrigatórios: Descrição, Categoria.');
    expect(router.navigate).not.toHaveBeenCalled();

    await fillText('input[name="description"]', 'Feira');
    expect(query('input[name="description"]').classList.contains('invalid')).toBe(false);
  });

  it('mostra falha no 500 e na queda de rede sem sair do cadastro', async () => {
    await renderNew();

    await click(button('Salvar'));
    httpMock.expectOne(`${API_BASE}/transactions`).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
    await click(button('Salvar'));
    httpMock
      .expectOne(`${API_BASE}/transactions`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await settle();

    expect(toasts().map((toast) => toast.title)).toEqual(['Falha', 'Falha']);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('Cancelar sem alteração volta direto, sem modal e sem HTTP', async () => {
    await renderNew();

    await click(button('Cancelar'));

    expect(query('.modal-card')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
    httpMock.expectNone(() => true);
  });

  it('Cancelar com alteração pergunta; recusar mantém o digitado e confirmar volta sem HTTP', async () => {
    await renderNew();
    await fillText('input[name="description"]', 'Alterado');

    await click(button('Cancelar'));

    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');
    await click(button('Continuar editando'));
    expect(query('.modal-card')).toBeNull();
    expect(value('input[name="description"]')).toBe('Alterado');
    expect(router.navigate).not.toHaveBeenCalled();

    await click(button('Cancelar'));
    await click(button('Sair sem salvar'));

    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });

  it('abre a edição carregando o registro e salva com PUT', async () => {
    await renderEdit();

    expect(query('.page-title').textContent?.trim()).toBe('Editar lançamento');
    expect(value('input[name="description"]')).toBe('Feira');
    expect(value('input[name="amount"]')).toBe('120');
    expect(value('select[name="categoryId"]')).toBe('cat-expense');

    await fillText('input[name="description"]', 'Feira grande');
    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/transactions/transaction-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      transactionDate: '2026-07-01',
      description: 'Feira grande',
      amount: 120,
      type: 'EXPENSE',
      status: 'PENDING',
      categoryId: 'cat-expense',
    });
    request.flush({ ...TRANSACTION, description: 'Feira grande' });
    await settle();

    expect(toasts()[0].message).toBe('Lançamento atualizado com sucesso.');
    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
  });

  it('mantém a categoria inativa já gravada como opção "(Inativo)" até trocar', async () => {
    await setup('transaction-1');
    httpMock.expectOne(`${API_BASE}/transactions/transaction-1`).flush({ ...TRANSACTION, categoryId: 'cat-old' });
    await settle();
    httpMock.expectOne(`${API_BASE}/categories/options?type=EXPENSE`).flush(EXPENSE_CATEGORIES);
    await settle();
    httpMock
      .expectOne(`${API_BASE}/categories/cat-old`)
      .flush({ id: 'cat-old', parentId: null, name: 'Antiga', type: 'EXPENSE', color: null, active: false });
    await settle();

    expect(categoryOptions()).toEqual(['Selecione', 'Antiga (Inativo)', 'Mercado']);
    expect(value('select[name="categoryId"]')).toBe('cat-old');

    await selectValue('select[name="categoryId"]', 'cat-expense');

    expect(categoryOptions()).toEqual(['Selecione', 'Mercado']);
  });

  it('com id inexistente volta à listagem com alerta em português', async () => {
    await setup('inexistente');
    httpMock.expectOne(`${API_BASE}/transactions/inexistente`).flush(null, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(toasts().map((toast) => [toast.title, toast.message])).toEqual([['Alerta', 'Lançamento não encontrado.']]);
    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
  });

  it('na falha de carga da edição mostra a mensagem na área, sem o formulário', async () => {
    await setup('transaction-1');
    httpMock.expectOne(`${API_BASE}/transactions/transaction-1`).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar o lançamento.');
    expect(query('form')).toBeNull();
  });

  function noCategoryRequests(): void {
    httpMock.expectNone((request) => request.url.startsWith(`${API_BASE}/categories`));
  }

  it('sem permissão de ver Categorias, a inclusão mostra o aviso no lugar da Categoria, sem pedir o catálogo nem avisar', async () => {
    await setup(null, false);
    await settle();
    noCategoryRequests();

    expect(query('select[name="categoryId"]')).toBeNull();
    expect(query('.field-notice').textContent?.trim()).toBe(NO_PERMISSION_NOTICE);
    expect(toasts()).toEqual([]);

    await fillText('input[name="description"]', 'Feira');
    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body.categoryId).toBeNull();
    request.flush(
      {
        violations: [{ field: 'create.request.categoryId', message: 'A categoria é obrigatória.' }],
        message: 'Informe os campos obrigatórios: Categoria.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(queryAll('.field-error').map((error) => error.textContent?.trim())).toEqual(['A categoria é obrigatória.']);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('sem permissão de ver Categorias, a edição mantém a categoria gravada no PUT, sem pedir o catálogo nem avisar', async () => {
    await setup('transaction-1', false);
    httpMock.expectOne(`${API_BASE}/transactions/transaction-1`).flush({ ...TRANSACTION, categoryId: 'cat-old' });
    await settle();
    noCategoryRequests();

    expect(query('select[name="categoryId"]')).toBeNull();
    expect(query('.field-notice').textContent?.trim()).toBe(NO_PERMISSION_NOTICE);
    expect(toasts()).toEqual([]);

    await fillText('input[name="description"]', 'Feira grande');
    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/transactions/transaction-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.categoryId).toBe('cat-old');
    request.flush({ ...TRANSACTION, categoryId: 'cat-old', description: 'Feira grande' });
    await settle();

    expect(toasts().map((toast) => toast.message)).toEqual(['Lançamento atualizado com sucesso.']);
  });

  it('com o catálogo negado pelo servidor (403), a inclusão mostra o aviso no lugar da Categoria, sem toast', async () => {
    await setup(null);
    httpMock
      .expectOne(`${API_BASE}/categories/options?type=EXPENSE`)
      .flush({ message: 'Você não tem permissão para realizar esta ação.' }, { status: 403, statusText: 'Forbidden' });
    await settle();

    expect(query('select[name="categoryId"]')).toBeNull();
    expect(query('.field-notice').textContent?.trim()).toBe(NO_PERMISSION_NOTICE);
    expect(toasts()).toEqual([]);
  });

  it('com o catálogo negado pelo servidor (403), a edição não busca a categoria gravada e a mantém no PUT', async () => {
    await setup('transaction-1');
    httpMock.expectOne(`${API_BASE}/transactions/transaction-1`).flush({ ...TRANSACTION, categoryId: 'cat-old' });
    await settle();
    httpMock
      .expectOne(`${API_BASE}/categories/options?type=EXPENSE`)
      .flush({ message: 'Você não tem permissão para realizar esta ação.' }, { status: 403, statusText: 'Forbidden' });
    await settle();
    noCategoryRequests();

    expect(query('.field-notice').textContent?.trim()).toBe(NO_PERMISSION_NOTICE);
    expect(toasts()).toEqual([]);

    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/transactions/transaction-1`);
    expect(request.request.body.categoryId).toBe('cat-old');
    request.flush({ ...TRANSACTION, categoryId: 'cat-old' });
    await settle();
  });
});
