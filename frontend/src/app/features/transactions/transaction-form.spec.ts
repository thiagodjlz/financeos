import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { isoDate } from '../../core/formatters';
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

// Dia local, como o cadastro: `toISOString()` daria o dia seguinte à noite no fuso do Brasil.
const TODAY = isoDate(new Date());
const YESTERDAY = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1));

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

  function checked(name: string): string | null {
    return query<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? null;
  }

  async function choose(name: string, radioValue: string): Promise<void> {
    query<HTMLInputElement>(`input[name="${name}"][value="${radioValue}"]`).click();
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
    expect(value('input[name="amount"]')).toBe('');
    expect(checked('type')).toBe('EXPENSE');
    expect(checked('status')).toBe('PENDING');
    expect(value('select[name="categoryId"]')).toBe('');
    expect(categoryOptions()).toEqual(['Selecione', 'Mercado']);
    expect(button('Salvar lançamento').getAttribute('type')).toBe('submit');
    expect(query('form').classList.contains('form-card')).toBe(true);
    expect(button('Cancelar').getAttribute('type')).toBe('button');
  });

  it('filtra a Categoria pelo Tipo e esconde o Status em Receita', async () => {
    await renderNew();
    await selectValue('select[name="categoryId"]', 'cat-expense');

    await choose('type', 'INCOME');
    httpMock.expectOne(`${API_BASE}/categories/options?type=INCOME`).flush(INCOME_CATEGORIES);
    await settle();

    expect(categoryOptions()).toEqual(['Selecione', 'Salário']);
    expect(value('select[name="categoryId"]')).toBe('');
    expect(query('input[name="status"]')).toBeNull();
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

    await click(button('Salvar lançamento'));

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
    await choose('type', 'INCOME');
    httpMock.expectOne(`${API_BASE}/categories/options?type=INCOME`).flush(INCOME_CATEGORIES);
    await settle();

    await click(button('Salvar lançamento'));

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body.status).toBeNull();
    expect(request.request.body.categoryId).toBeNull();
    request.flush(TRANSACTION);
    await settle();
  });

  it('no 400 permanece no cadastro com destaque, legenda, foco e toast', async () => {
    await renderNew();

    await click(button('Salvar lançamento'));

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

    await click(button('Salvar lançamento'));
    httpMock.expectOne(`${API_BASE}/transactions`).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
    await click(button('Salvar lançamento'));
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
    expect(value('input[name="amount"]')).toBe('120,00');
    expect(value('select[name="categoryId"]')).toBe('cat-expense');

    await fillText('input[name="description"]', 'Feira grande');
    await click(button('Salvar lançamento'));

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
    await click(button('Salvar lançamento'));

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
    await click(button('Salvar lançamento'));

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

    await click(button('Salvar lançamento'));

    const request = httpMock.expectOne(`${API_BASE}/transactions/transaction-1`);
    expect(request.request.body.categoryId).toBe('cat-old');
    request.flush({ ...TRANSACTION, categoryId: 'cat-old' });
    await settle();
  });

  it('Tipo e Status são radios nativos; Status some em Receita e volta em Despesa', async () => {
    await renderNew();

    const typeRadios = queryAll<HTMLInputElement>('input[name="type"]');
    expect(typeRadios.map((radio) => [radio.type, radio.value])).toEqual([
      ['radio', 'EXPENSE'],
      ['radio', 'INCOME'],
    ]);
    expect(queryAll<HTMLInputElement>('input[name="status"]').map((radio) => [radio.type, radio.value])).toEqual([
      ['radio', 'PENDING'],
      ['radio', 'PAID'],
    ]);

    await choose('status', 'PAID');
    expect(checked('status')).toBe('PAID');

    await choose('type', 'INCOME');
    httpMock.expectOne(`${API_BASE}/categories/options?type=INCOME`).flush(INCOME_CATEGORIES);
    await settle();
    expect(query('input[name="status"]')).toBeNull();

    await choose('type', 'EXPENSE');
    httpMock.expectOne(`${API_BASE}/categories/options?type=EXPENSE`).flush(EXPENSE_CATEGORIES);
    await settle();
    expect(queryAll('input[name="status"]')).toHaveLength(2);
  });

  it('manda o payload de sempre com o Status escolhido no radio', async () => {
    await renderNew();
    await fillText('input[name="description"]', 'Feira');
    await fillText('input[name="amount"]', '120');
    await choose('status', 'PAID');
    await selectValue('select[name="categoryId"]', 'cat-expense');

    await click(button('Salvar lançamento'));

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body).toEqual({
      transactionDate: TODAY,
      description: 'Feira',
      amount: 120,
      type: 'EXPENSE',
      status: 'PAID',
      categoryId: 'cat-expense',
    });
    request.flush(TRANSACTION);
    await settle();
  });

  it('segue a ordem Tipo, Valor, Descrição, Categoria, Data e Status num só formulário', async () => {
    await renderNew();

    const names = queryAll('form [name]').map((control) => control.getAttribute('name'));
    expect(names.filter((name, index) => names.indexOf(name) === index)).toEqual([
      'type',
      'amount',
      'description',
      'categoryId',
      'transactionDate',
      'status',
    ]);
  });

  it('o Valor é texto com vírgula decimal: "184,90" sai como 184.9', async () => {
    await renderNew();

    const amount = query<HTMLInputElement>('input[name="amount"]');
    expect(amount.type).toBe('text');
    expect(amount.getAttribute('inputmode')).toBe('decimal');
    expect(amount.getAttribute('placeholder')).toBe('0,00');

    await fillText('input[name="description"]', 'Feira da semana');
    await fillText('input[name="amount"]', '184,90');
    await selectValue('select[name="categoryId"]', 'cat-expense');
    await click(button('Salvar lançamento'));

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body.amount).toBe(184.9);
    request.flush(TRANSACTION);
    await settle();
  });

  it('com o Valor vazio envia nulo e mostra na legenda o "O valor é obrigatório." do back-end', async () => {
    await renderNew();
    await fillText('input[name="description"]', 'Feira');
    await selectValue('select[name="categoryId"]', 'cat-expense');

    await click(button('Salvar lançamento'));

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body.amount).toBeNull();
    request.flush(
      {
        violations: [{ field: 'create.request.amount', message: 'O valor é obrigatório.' }],
        message: 'Informe os campos obrigatórios: Valor.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('input[name="amount"]').classList.contains('invalid')).toBe(true);
    expect(queryAll('.field-error').map((error) => error.textContent?.trim())).toEqual(['O valor é obrigatório.']);
    expect((document.activeElement as HTMLElement).getAttribute('name')).toBe('amount');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('não corrige o Valor digitado: negativo vai com sinal e texto vai como texto, e a recusa do back-end aparece na legenda', async () => {
    await renderNew();
    await fillText('input[name="description"]', 'Feira');
    await selectValue('select[name="categoryId"]', 'cat-expense');

    await fillText('input[name="amount"]', '-50,00');
    await click(button('Salvar lançamento'));
    let request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body.amount).toBe(-50);
    request.flush(
      {
        violations: [{ field: 'create.request.amount', message: 'O valor deve ser maior que zero.' }],
        message: 'O valor deve ser maior que zero.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
    expect(queryAll('.field-error').map((error) => error.textContent?.trim())).toEqual([
      'O valor deve ser maior que zero.',
    ]);
    expect(value('input[name="amount"]')).toBe('-50,00');

    await fillText('input[name="amount"]', '12abc');
    await click(button('Salvar lançamento'));
    request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.body.amount).toBe('12abc');
    request.flush(
      {
        violations: [{ field: 'amount', message: 'O valor informado é inválido.' }],
        message: 'O valor informado é inválido.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('input[name="amount"]').classList.contains('invalid')).toBe(true);
    expect(queryAll('.field-error').map((error) => error.textContent?.trim())).toEqual([
      'O valor informado é inválido.',
    ]);
    expect(value('input[name="amount"]')).toBe('12abc');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('"Hoje" e "Ontem" preenchem a Data e marcam o atalho escolhido', async () => {
    await renderNew();

    const today = button('Hoje');
    const yesterday = button('Ontem');
    expect(today.getAttribute('aria-pressed')).toBe('true');
    expect(yesterday.getAttribute('aria-pressed')).toBe('false');

    await click(yesterday);
    expect(value('input[name="transactionDate"]')).toBe(YESTERDAY);
    expect(yesterday.getAttribute('aria-pressed')).toBe('true');
    expect(today.getAttribute('aria-pressed')).toBe('false');

    await click(today);
    expect(value('input[name="transactionDate"]')).toBe(TODAY);
    httpMock.expectNone(() => true);
  });

  it('mostra "Salvando…" com o botão desabilitado durante o envio', async () => {
    await renderNew();
    await fillText('input[name="description"]', 'Feira');
    await fillText('input[name="amount"]', '120');
    await selectValue('select[name="categoryId"]', 'cat-expense');

    await click(button('Salvar lançamento'));

    const submit = query<HTMLButtonElement>('button[type="submit"]');
    expect(submit.textContent?.trim()).toBe('Salvando…');
    expect(submit.disabled).toBe(true);

    httpMock.expectOne(`${API_BASE}/transactions`).flush(TRANSACTION);
    await settle();

    expect(submit.textContent?.trim()).toBe('Salvar lançamento');
  });

  it('mostra o Valor com "R$" e o contador N/255 da descrição', async () => {
    await renderNew();

    expect(query('.amount-field .affix-text').textContent?.trim()).toBe('R$');
    expect(query('.field-counter').textContent?.trim()).toBe('0/255');

    await fillText('input[name="description"]', 'Feira');

    expect(query('.field-counter').textContent?.trim()).toBe('5/255');
  });

  it('mostra ao lado do select a bolinha na cor da categoria escolhida, e nada sem cor', async () => {
    await renderNew([
      { ...EXPENSE_CATEGORIES[0], color: '#E07A3F' },
      { id: 'cat-plain', parentId: null, name: 'Sem cor', type: 'EXPENSE', color: null, active: true },
    ]);

    expect(query('.category-select .category-dot')).toBeNull();

    await selectValue('select[name="categoryId"]', 'cat-expense');
    expect(query<HTMLElement>('.category-select .category-dot').style.background).toBe('rgb(224, 122, 63)');

    await selectValue('select[name="categoryId"]', 'cat-plain');
    expect(query('.category-select .category-dot')).toBeNull();
  });

  it('o voltar do cabeçalho age como o Cancelar: sem alteração sai sem HTTP nem toast', async () => {
    await renderNew();
    const back = query<HTMLButtonElement>('button.back-link');

    expect(back.getAttribute('aria-label')).toBe('Voltar para Lançamentos');
    await click(back);

    expect(query('.modal-card')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/transactions']);
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });

  it('o voltar do cabeçalho com alteração pergunta antes de sair', async () => {
    await renderNew();
    await fillText('input[name="description"]', 'Alterado');

    await click(query<HTMLButtonElement>('button.back-link'));

    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');
    expect(router.navigate).not.toHaveBeenCalled();
    httpMock.expectNone(() => true);
  });
});
