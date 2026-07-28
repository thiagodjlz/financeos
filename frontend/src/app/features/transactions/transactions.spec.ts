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
    icon: null,
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
    icon: null,
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

  function expectInitialForm(): void {
    expect(value('form input[name="transactionDate"]')).toBe(TODAY);
    expect(value('form input[name="description"]')).toBe('');
    expect(value('form input[name="amount"]')).toBe('0');
    expect(value('form select[name="type"]')).toBe('EXPENSE');
    expect(value('form select[name="status"]')).toBe('PENDING');
    expect(value('form select[name="categoryId"]')).toBe('');
    expect(categoryOptions()).toEqual(['Sem categoria', 'Mercado']);
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
          { field: 'create.request.amount', message: 'O valor deve ser maior ou igual a 0,01.' },
        ],
        message: 'O valor deve ser maior ou igual a 0,01.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('O valor deve ser maior ou igual a 0,01.');
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
