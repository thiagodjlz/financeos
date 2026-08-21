import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, Category, Transaction } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Transactions } from './transactions';

const EXPENSE_CATEGORIES: Category[] = [
  {
    id: 'cat-expense',
    parentId: null,
    name: 'Mercado',
    type: 'EXPENSE',
    color: null,
    active: true,
  },
];

const INCOME_CATEGORIES: Category[] = [
  {
    id: 'cat-income',
    parentId: null,
    name: 'Salario',
    type: 'INCOME',
    color: null,
    active: true,
  },
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

const TODAY = new Date().toISOString().slice(0, 10);

describe('Transactions', () => {
  let fixture: ComponentFixture<Transactions>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => httpMock.verify());

  async function render(superAdmin = true): Promise<void> {
    fixture = TestBed.createComponent(Transactions);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE}/transactions`).flush([TRANSACTION]);
    httpMock
      .expectOne(`${API_BASE}/categories`)
      .flush([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]);
    httpMock.expectOne(`${API_BASE}/categories?type=EXPENSE`).flush(EXPENSE_CATEGORIES);
    await settle();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function value(selector: string): string {
    return query<HTMLInputElement>(selector).value;
  }

  function toasts() {
    return toastService.toasts();
  }

  function rowButtonByText(text: string): HTMLButtonElement | undefined {
    return (
      Array.from(fixture.nativeElement.querySelectorAll('tbody .row-actions button')) as HTMLButtonElement[]
    ).find((button) => button.textContent?.trim() === text);
  }

  function categoryOptions(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('form select[name="categoryId"] option'),
    ).map((option) => (option as HTMLOptionElement).textContent?.trim() ?? '');
  }

  function cancelButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('form button.ghost-button');
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

  async function submitForm(): Promise<void> {
    await click(query<HTMLButtonElement>('form button[type="submit"]'));
  }

  async function startEditing(): Promise<void> {
    await click(rowButtonByText('Editar') as HTMLButtonElement);
    httpMock.expectOne(`${API_BASE}/categories?type=EXPENSE`).flush(EXPENSE_CATEGORIES);
    await settle();
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];
  }

  function fieldErrorTexts(scope: string): string[] {
    return queryAll(`${scope} .field-error`).map((element) => element.textContent?.trim() ?? '');
  }

  async function flushCreateValidationError(): Promise<void> {
    httpMock.expectOne(`${API_BASE}/transactions`).flush(
      {
        violations: [
          { field: 'create.request.description', message: 'A descrição é obrigatória.' },
          { field: 'create.request.amount', message: 'O valor deve ser maior que zero.' },
          { field: 'create.request.categoryId', message: 'A categoria é obrigatória.' },
        ],
        message: 'Informe os campos obrigatórios: Descrição, Categoria. O valor deve ser maior que zero.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
  }

  function expectInitialForm(): void {
    expect(value('form input[name="transactionDate"]')).toBe(TODAY);
    expect(value('form input[name="description"]')).toBe('');
    expect(value('form input[name="amount"]')).toBe('0');
    expect(value('form select[name="type"]')).toBe('EXPENSE');
    expect(value('form select[name="status"]')).toBe('PENDING');
    expect(value('form select[name="categoryId"]')).toBe('');
    expect(categoryOptions()).toEqual(['Selecione', 'Mercado']);
  }

  it('exibe o botão Cancelar ao lado de Salvar no formulário de novo lançamento', async () => {
    await render();

    const button = cancelButton();
    expect(query('form .panel-heading h3').textContent?.trim()).toBe('Novo lançamento');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('não renderiza o formulário nem o botão Cancelar sem permissão', async () => {
    await render(false);

    expect(query('form')).toBeNull();
  });

  it('limpa o formulário e repõe o dropdown de Despesa sem nova requisição', async () => {
    await render();
    await selectValue('form select[name="type"]', 'INCOME');
    httpMock.expectOne(`${API_BASE}/categories?type=INCOME`).flush(INCOME_CATEGORIES);
    await settle();
    await fillText('form input[name="transactionDate"]', '2026-01-15');
    await fillText('form input[name="description"]', 'Bonus');
    await fillText('form input[name="amount"]', '250');
    await selectValue('form select[name="categoryId"]', 'cat-income');

    await click(cancelButton());

    httpMock.expectNone(() => true);
    expect(toasts()).toEqual([]);
    expectInitialForm();
  });

  it('não dispara requisição ao cancelar e mantém o estágio único', async () => {
    await render();
    await fillText('form input[name="description"]', 'Feira');

    await click(cancelButton());
    await click(cancelButton());

    httpMock.expectNone(() => true);
    expect(toasts()).toEqual([]);
    expect(query('form .panel-heading h3').textContent?.trim()).toBe('Novo lançamento');
    expectInitialForm();
  });

  it('mantém o botão Cancelar da tabela cancelando o lançamento', async () => {
    await render();

    await click(rowButtonByText('Cancelar') as HTMLButtonElement);

    const request = httpMock.expectOne(`${API_BASE}/transactions/transaction-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(`${API_BASE}/transactions`).flush([TRANSACTION]);
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Lançamento cancelado com sucesso.');
  });

  it('exibe toast de sucesso ao criar o lançamento', async () => {
    await render();
    await fillText('form input[name="description"]', 'Feira');
    await fillText('form input[name="amount"]', '120');

    await submitForm();

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.method).toBe('POST');
    request.flush(TRANSACTION);
    await settle();
    httpMock.expectOne(`${API_BASE}/transactions`).flush([TRANSACTION]);
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Lançamento salvo com sucesso.');
  });

  it('exibe toast de sucesso ao salvar a edição inline', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editDescription"]', 'Feira grande');

    await click(query<HTMLButtonElement>('tbody .row-actions button.primary-button'));

    const request = httpMock.expectOne(`${API_BASE}/transactions/transaction-1`);
    expect(request.request.method).toBe('PUT');
    request.flush({ ...TRANSACTION, description: 'Feira grande' });
    await settle();
    httpMock
      .expectOne(`${API_BASE}/transactions`)
      .flush([{ ...TRANSACTION, description: 'Feira grande' }]);
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Lançamento atualizado com sucesso.');
  });

  it('exibe o 400 agregado do backend como alerta, com o texto recebido', async () => {
    await render();

    await submitForm();

    httpMock.expectOne(`${API_BASE}/transactions`).flush(
      {
        violations: [
          { field: 'create.request.description', message: 'A descrição é obrigatória.' },
          { field: 'create.request.amount', message: 'O valor é obrigatório.' },
        ],
        message: 'Informe os campos obrigatórios: Descrição, Valor.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Informe os campos obrigatórios: Descrição, Valor.');
  });

  it('exibe o limite de valor como alerta quando o backend recusa amount zero', async () => {
    await render();
    await fillText('form input[name="description"]', 'Feira');

    await submitForm();

    httpMock.expectOne(`${API_BASE}/transactions`).flush(
      {
        violations: [
          { field: 'create.request.amount', message: 'O valor deve ser maior que zero.' },
        ],
        message: 'O valor deve ser maior que zero.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('O valor deve ser maior que zero.');
  });

  it('exibe o 400 de regra de negócio como alerta com a mensagem do corpo', async () => {
    await render();
    await fillText('form input[name="description"]', 'Feira');
    await fillText('form input[name="amount"]', '120');

    await submitForm();

    httpMock
      .expectOne(`${API_BASE}/transactions`)
      .flush({ message: 'Categoria informada não existe.' }, { status: 400, statusText: 'Bad Request' });
    await settle();

    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Categoria informada não existe.');
  });

  it('exibe falha no 500 e na queda de rede', async () => {
    await render();
    await fillText('form input[name="description"]', 'Feira');
    await fillText('form input[name="amount"]', '120');

    await submitForm();
    httpMock
      .expectOne(`${API_BASE}/transactions`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()[0].title).toBe('Falha');

    await submitForm();
    httpMock
      .expectOne(`${API_BASE}/transactions`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await settle();

    expect(toasts().map((toast) => toast.title)).toEqual(['Falha', 'Falha']);
  });

  it('oferece o placeholder Selecione no lugar de "Sem categoria" nos dois dropdowns', async () => {
    await render();
    await settle();

    expect(categoryOptions()).toEqual(['Selecione', 'Mercado']);

    await startEditing();
    await settle();

    expect(
      queryAll<HTMLOptionElement>('tbody select[name="editCategoryId"] option').map(
        (option) => option.textContent?.trim() ?? '',
      ),
    ).toEqual(['Selecione', 'Mercado']);
  });

  it('dispara o POST com o placeholder selecionado e destaca o campo Categoria no 400', async () => {
    await render();
    await fillText('form input[name="description"]', 'Feira');
    await fillText('form input[name="amount"]', '120');

    await submitForm();

    const request = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.categoryId).toBeNull();
    request.flush(
      {
        violations: [{ field: 'create.request.categoryId', message: 'A categoria é obrigatória.' }],
        message: 'Informe os campos obrigatórios: Categoria.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('form select[name="categoryId"]').classList.contains('invalid')).toBe(true);
    expect(fieldErrorTexts('form')).toEqual(['A categoria é obrigatória.']);
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Informe os campos obrigatórios: Categoria.');
  });

  it('destaca cada campo do 400 com legenda e limpa apenas o campo editado', async () => {
    await render();

    await submitForm();
    await flushCreateValidationError();

    expect(query('form input[name="description"]').classList.contains('invalid')).toBe(true);
    expect(query('form input[name="amount"]').classList.contains('invalid')).toBe(true);
    expect(query('form select[name="categoryId"]').classList.contains('invalid')).toBe(true);
    expect(query('form input[name="transactionDate"]').classList.contains('invalid')).toBe(false);
    expect(fieldErrorTexts('form')).toEqual([
      'A descrição é obrigatória.',
      'O valor deve ser maior que zero.',
      'A categoria é obrigatória.',
    ]);

    await fillText('form input[name="amount"]', '120');

    expect(query('form input[name="amount"]').classList.contains('invalid')).toBe(false);
    expect(fieldErrorTexts('form')).toEqual(['A descrição é obrigatória.', 'A categoria é obrigatória.']);
  });

  it('foca o primeiro campo inválido na ordem visual do formulário', async () => {
    await render();

    await submitForm();

    httpMock.expectOne(`${API_BASE}/transactions`).flush(
      {
        violations: [
          { field: 'create.request.categoryId', message: 'A categoria é obrigatória.' },
          { field: 'create.request.description', message: 'A descrição é obrigatória.' },
          { field: 'create.request.transactionDate', message: 'A data é obrigatória.' },
        ],
        message: 'Informe os campos obrigatórios: Descrição, Data, Categoria.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect((document.activeElement as HTMLElement).getAttribute('name')).toBe('transactionDate');
  });

  it('destaca os campos da linha em edição sem tocar o formulário lateral', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editDescription"]', '');

    await click(query<HTMLButtonElement>('tbody .row-actions button.primary-button'));

    httpMock.expectOne(`${API_BASE}/transactions/transaction-1`).flush(
      {
        violations: [{ field: 'update.request.description', message: 'A descrição é obrigatória.' }],
        message: 'Informe os campos obrigatórios: Descrição.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('tbody input[name="editDescription"]').classList.contains('invalid')).toBe(true);
    expect(fieldErrorTexts('tbody')).toEqual(['A descrição é obrigatória.']);
    expect(fieldErrorTexts('form')).toEqual([]);
  });

  it('limpa os destaques ao cancelar o formulário, sem HTTP e sem toast novo', async () => {
    await render();
    await submitForm();
    await flushCreateValidationError();
    const toastsAfterError = toasts().length;

    await click(cancelButton());

    expect(queryAll('.field-error')).toHaveLength(0);
    expect(queryAll('.invalid')).toHaveLength(0);
    expect(toasts()).toHaveLength(toastsAfterError);
    httpMock.expectNone(() => true);
  });

  it('mantém "Sem categoria" na tabela para lançamentos legados sem categoria', async () => {
    fixture = TestBed.createComponent(Transactions);
    TestBed.inject(AuthService).superAdmin.set(true);
    fixture.detectChanges();
    httpMock
      .expectOne(`${API_BASE}/transactions`)
      .flush([{ ...TRANSACTION, categoryId: null }]);
    httpMock.expectOne(`${API_BASE}/categories`).flush([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]);
    httpMock.expectOne(`${API_BASE}/categories?type=EXPENSE`).flush(EXPENSE_CATEGORIES);
    await settle();

    const cells = queryAll('tbody tr td');
    expect(cells[2].textContent?.trim()).toBe('Sem categoria');
  });

  it('abre o modal ao sair da edição com alteração pendente, sem HTTP e sem toast', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editDescription"]', 'Alterado');

    await click(query<HTMLButtonElement>('tbody .row-actions button.danger-button'));

    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });
});
