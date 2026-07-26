import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, Category, Transaction } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
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

  function categoryOptions(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('form select[name="categoryId"] option'),
    ).map((option) => (option as HTMLOptionElement).textContent?.trim() ?? '');
  }

  function cancelButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('form button.danger-button');
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

  function expectInitialForm(): void {
    expect(value('form input[name="transactionDate"]')).toBe(TODAY);
    expect(value('form input[name="description"]')).toBe('');
    expect(value('form input[name="amount"]')).toBe('0');
    expect(value('form select[name="type"]')).toBe('EXPENSE');
    expect(value('form select[name="status"]')).toBe('PENDING');
    expect(value('form select[name="categoryId"]')).toBe('');
    expect(categoryOptions()).toEqual(['Sem categoria', 'Mercado']);
  }

  it('exibe o botao Cancelar ao lado de Salvar no formulario de novo lancamento', async () => {
    await render();

    const button = cancelButton();
    expect(query('form .panel-heading h3').textContent?.trim()).toBe('Novo lancamento');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('nao renderiza o formulario nem o botao Cancelar sem permissao', async () => {
    await render(false);

    expect(query('form')).toBeNull();
  });

  it('limpa o formulario e repoe o dropdown de Despesa sem nova requisicao', async () => {
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
    expectInitialForm();
  });

  it('nao dispara requisicao ao cancelar e mantem o estagio unico', async () => {
    await render();
    await fillText('form input[name="description"]', 'Feira');

    await click(cancelButton());
    await click(cancelButton());

    httpMock.expectNone(() => true);
    expect(query('form .panel-heading h3').textContent?.trim()).toBe('Novo lancamento');
    expectInitialForm();
  });

  it('mantem o botao Cancelar da tabela cancelando o lancamento', async () => {
    await render();

    const rowButtons = Array.from(
      fixture.nativeElement.querySelectorAll('tbody .row-actions button'),
    ) as HTMLButtonElement[];
    const cancelTransaction = rowButtons.find(
      (button) => button.textContent?.trim() === 'Cancelar',
    );
    await click(cancelTransaction as HTMLButtonElement);

    const request = httpMock.expectOne(`${API_BASE}/transactions/transaction-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(`${API_BASE}/transactions`).flush([TRANSACTION]);
    await settle();
  });
});
