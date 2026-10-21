import { provideHttpClient } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { money } from '../../core/formatters';
import { API_BASE, Category, ReportPreference, ReportRow, TransactionReport } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionReports } from './transaction-reports';

const CATEGORIES_URL = `${API_BASE}/categories/options`;
const PREFERENCES_URL = `${API_BASE}/transaction-reports/preferences`;
const PRINT_URL = `${API_BASE}/audit/print`;

const CATEGORIES: Category[] = [
  { id: 'c2', parentId: null, name: 'Salário', type: 'INCOME', color: null, active: true },
  { id: 'c1', parentId: null, name: 'Alimentação', type: 'EXPENSE', color: null, active: false },
];

const ROW: ReportRow = {
  id: 't1',
  transactionDate: '2026-10-05',
  description: 'Mercado',
  categoryId: 'c1',
  categoryName: 'Alimentação',
  type: 'EXPENSE',
  status: 'PAID',
  source: 'EXCEL_IMPORT',
  installmentNumber: 2,
  installmentTotal: 3,
  amount: 50,
  notes: null,
};

const INCOME_ROW: ReportRow = {
  ...ROW,
  id: 't2',
  transactionDate: '2026-10-10',
  description: 'Salário',
  categoryId: 'c2',
  categoryName: 'Salário',
  type: 'INCOME',
  status: null,
  source: 'MANUAL',
  installmentNumber: null,
  installmentTotal: null,
  amount: 450,
};

function report(overrides: Partial<TransactionReport> = {}): TransactionReport {
  return {
    period: { code: 'CURRENT_MONTH', label: 'Mês atual', startDate: '2026-10-01', endDate: '2026-10-31' },
    generatedOn: '2026-10-20',
    currentBalance: 600,
    totals: { income: 450, paidExpense: 50, balance: 400 },
    transactionCount: 2,
    groups: [],
    rows: [ROW, INCOME_ROW],
    ...overrides,
  };
}

const GROUPED = report({
  groups: [
    {
      field: 'CATEGORY',
      fieldLabel: 'Categoria',
      key: 'c1',
      label: 'Alimentação',
      totals: { income: 0, paidExpense: 50, balance: -50 },
      transactionCount: 1,
      groups: [],
      rows: [ROW],
    },
    {
      field: 'CATEGORY',
      fieldLabel: 'Categoria',
      key: 'c2',
      label: 'Salário',
      totals: { income: 450, paidExpense: 0, balance: 450 },
      transactionCount: 1,
      groups: [],
      rows: [INCOME_ROW],
    },
  ],
  rows: [],
});

function preference(overrides: Partial<ReportPreference> = {}): ReportPreference {
  return {
    id: 'p1',
    name: 'Mensal',
    defaultPreference: false,
    period: 'CURRENT_MONTH',
    startDate: null,
    endDate: null,
    categoryIds: [],
    type: null,
    status: null,
    source: null,
    minAmount: null,
    maxAmount: null,
    installments: 'ALL',
    groupBy: [],
    columns: ['DATE', 'DESCRIPTION', 'CATEGORY', 'TYPE', 'STATUS', 'AMOUNT'],
    ...overrides,
  };
}

describe('TransactionReports', () => {
  let fixture: ComponentFixture<TransactionReports>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionReports],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  function isReport(request: HttpRequest<unknown>): boolean {
    return request.url === `${API_BASE}/transaction-reports`;
  }

  function create(superAdmin = true): void {
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture = TestBed.createComponent(TransactionReports);
    fixture.detectChanges();
  }

  // Zoneless: o ngOnInit pede o catálogo (se o perfil vê Categorias) e as preferências; o relatório
  // só sai depois que as preferências respondem.
  async function render(
    result: TransactionReport = report(),
    preferences: ReportPreference[] = [],
    superAdmin = true,
  ): Promise<HttpRequest<unknown>> {
    create(superAdmin);
    if (TestBed.inject(AuthService).can('CATEGORIES', 'VIEW')) {
      httpMock.expectOne(CATEGORIES_URL).flush(CATEGORIES);
    }
    httpMock.expectOne(PREFERENCES_URL).flush(preferences);
    await settle();
    const request = httpMock.expectOne(isReport);
    request.flush(result);
    await settle();
    return request.request;
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

  function texts(selector: string): string[] {
    return queryAll(selector).map((element) => element.textContent?.trim() ?? '');
  }

  function buttonByText(text: string): HTMLButtonElement {
    return queryAll<HTMLButtonElement>('button').find((button) => button.textContent?.trim() === text)!;
  }

  function columnBox(label: string): HTMLInputElement {
    const option = queryAll<HTMLLabelElement>('.report-columns .check-option').find(
      (item) => item.textContent?.trim() === label,
    );
    return option!.querySelector('input') as HTMLInputElement;
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  function toasts(): [string, string][] {
    return toastService.toasts().map((toast) => [toast.title, toast.message]);
  }

  it('mostra Saldo e Saldo atual em dois quadros fixos, sem controle para ocultá-los', async () => {
    await render();

    expect(texts('.report-balance-label')).toEqual(['Saldo', 'Saldo atual']);
    expect(query('[data-balance="period"]').textContent?.trim()).toBe(money(400));
    expect(query('[data-balance="current"]').textContent?.trim()).toBe(money(600));
    expect(query('.report-balances').querySelectorAll('button, input, select')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).not.toMatch(/Ocultar|Mostrar saldo/);
  });

  it('sem preferência padrão, abre no Mês atual, sem filtros e com as colunas padrão', async () => {
    const request = await render();

    expect(request.params.keys()).toEqual(['period']);
    expect(request.params.get('period')).toBe('CURRENT_MONTH');
    expect(texts('.report-table thead th')).toEqual(['Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Valor']);
    expect(query<HTMLSelectElement>('select[name="period"]').value).toBe('CURRENT_MONTH');
    expect(query<HTMLSelectElement>('select[name="preference"]').value).toBe('');
    expect(texts('.report-table tbody tr.report-row td[data-label="Data"]')).toEqual(['05/10/2026', '10/10/2026']);
    expect(query('.report-count').textContent).toContain('2 lançamentos');
  });

  it('rotula Tipo, Status e Origem como em Lançamentos, nunca o código', async () => {
    await render();
    await click(columnBox('Origem'));
    await click(columnBox('Parcela'));

    expect(texts('td[data-label="Tipo"]')).toEqual(['Despesa', 'Receita']);
    expect(texts('td[data-label="Status"]')).toEqual(['Pago', '-']);
    expect(texts('td[data-label="Origem"]')).toEqual(['Importação de planilha', 'Manual']);
    expect(texts('td[data-label="Parcela"]')).toEqual(['2/3', '-']);
    expect(texts('td[data-label="Valor"]')).toEqual([money(50), money(450)]);
    expect(query('.report-table').textContent).not.toMatch(/EXPENSE|INCOME|PAID|EXCEL_IMPORT|MANUAL/);
  });

  it('desmarcar Categoria tira a coluna do cabeçalho e das linhas, sem nova requisição', async () => {
    await render();

    await click(columnBox('Categoria'));

    expect(texts('.report-table thead th')).not.toContain('Categoria');
    expect(queryAll('td[data-label="Categoria"]')).toHaveLength(0);
    expect(texts('.report-table thead th')).toEqual(['Data', 'Descrição', 'Tipo', 'Status', 'Valor']);
  });

  it('sem nenhuma coluna, avisa e não gera o relatório', async () => {
    await render();

    for (const label of ['Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Valor']) {
      await click(columnBox(label));
    }
    expect(query('.report-columns .field-error').textContent?.trim()).toBe('Escolha ao menos uma coluna.');

    await click(buttonByText('Gerar relatório'));

    httpMock.expectNone(isReport);
    expect(query('.report-table')).toBeNull();
  });

  it('abre aplicando a preferência padrão e gera o relatório com ela', async () => {
    const preferred = preference({
      id: 'p2',
      name: 'Despesas do mês anterior',
      defaultPreference: true,
      period: 'PREVIOUS_MONTH',
      type: 'EXPENSE',
      categoryIds: ['c1'],
      minAmount: 10.5,
      groupBy: ['CATEGORY', 'MONTH'],
      columns: ['AMOUNT', 'DATE'],
    });

    const request = await render(GROUPED, [preference(), preferred]);

    expect(request.params.get('period')).toBe('PREVIOUS_MONTH');
    expect(request.params.get('type')).toBe('EXPENSE');
    expect(request.params.getAll('categoryId')).toEqual(['c1']);
    expect(request.params.get('minAmount')).toBe('10,50');
    expect(request.params.getAll('groupBy')).toEqual(['CATEGORY', 'MONTH']);
    expect(query<HTMLSelectElement>('select[name="preference"]').value).toBe('p2');
    expect(query<HTMLInputElement>('input[name="preferenceName"]').value).toBe('Despesas do mês anterior');
    expect(texts('.report-table thead th')).toEqual(['Data', 'Valor']);
    expect(texts('.grouping-name')).toEqual(['1. Categoria', '2. Mês']);
  });

  it('mostra o título e o subtotal de cada grupo como chegam da API', async () => {
    await render(GROUPED);

    expect(texts('.group-row th')).toEqual(['Categoria: Alimentação', 'Categoria: Salário']);
    const subtotals = texts('.subtotal-row td');
    expect(subtotals[0]).toContain('Subtotal de Alimentação');
    expect(subtotals[0]).toContain(`Saldo ${money(-50)}`);
    expect(subtotals[1]).toContain(`Saldo ${money(450)}`);
    expect(query('.total-row td').textContent).toContain(`Saldo ${money(400)}`);
  });

  it('sem lançamentos, mostra o vazio com Saldo zerado e o Saldo atual preenchido', async () => {
    await render(report({ transactionCount: 0, rows: [], totals: { income: 0, paidExpense: 0, balance: 0 }, currentBalance: 150 }));

    expect(query('.empty-state')).not.toBeNull();
    expect(query('.report-table')).toBeNull();
    expect(query('[data-balance="period"]').textContent?.trim()).toBe(money(0));
    expect(query('[data-balance="current"]').textContent?.trim()).toBe(money(150));
  });

  it('falha da API vira aviso de Falha e a mensagem no lugar do relatório', async () => {
    create();
    httpMock.expectOne(CATEGORIES_URL).flush(CATEGORIES);
    httpMock.expectOne(PREFERENCES_URL).flush([]);
    await settle();
    httpMock.expectOne(isReport).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts().map(([title]) => title)).toEqual(['Falha']);
    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível gerar o relatório.');
    expect(texts('.report-balance-label')).toEqual(['Saldo', 'Saldo atual']);
    expect(query('.empty-state')).toBeNull();
  });

  it('filtro recusado vira Alerta com a mensagem do back-end e mantém o relatório anterior', async () => {
    await render();
    query<HTMLSelectElement>('select[name="period"]').value = 'CUSTOM';
    query<HTMLSelectElement>('select[name="period"]').dispatchEvent(new Event('change'));
    await settle();

    await click(buttonByText('Gerar relatório'));
    httpMock
      .expectOne(isReport)
      .flush({ message: 'Informe a data inicial e a data final do período personalizado.' }, { status: 400, statusText: 'Bad Request' });
    await settle();

    expect(toasts()).toEqual([['Alerta', 'Informe a data inicial e a data final do período personalizado.']]);
    expect(queryAll('.report-row')).toHaveLength(2);
  });

  it('Imprimir registra a Impressão da tela e abre a impressão do navegador', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    await render();

    await click(buttonByText('Imprimir'));
    const request = httpMock.expectOne(PRINT_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ screen: 'TRANSACTION_REPORTS' });
    expect(printSpy).not.toHaveBeenCalled();
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('Imprimir abre a impressão mesmo se o registro falhar', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    await render();

    await click(buttonByText('Imprimir'));
    httpMock.expectOne(PRINT_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('marca o que some na impressão e o resumo que só aparece nela', async () => {
    await render(report(), [], true);
    query<HTMLSelectElement>('select[name="type"]').value = 'EXPENSE';
    query<HTMLSelectElement>('select[name="type"]').dispatchEvent(new Event('change'));
    await settle();
    await click(buttonByText('Gerar relatório'));
    httpMock.expectOne(isReport).flush(report());
    await settle();

    expect(query('.report-filters').classList).toContain('no-print');
    expect(query('.report-preferences').classList).toContain('no-print');
    expect(query('.page-actions').classList).toContain('no-print');
    expect(query('.report-balances').classList).not.toContain('no-print');
    expect(query('.report-table').closest('.no-print')).toBeNull();
    const summary = query('.print-only.report-print-summary').textContent ?? '';
    expect(summary).toContain('Mês atual: 01/10/2026 a 31/10/2026');
    expect(summary).toContain('Tipo: Despesa');
  });

  it('a tabela rola na horizontal dentro do próprio contêiner', async () => {
    await render();

    expect(query('.report-table').parentElement?.classList).toContain('scroll-table');
    expect(query('.report-table').parentElement?.classList).toContain('table-wrap');
  });

  it('com o catálogo respondendo depois do relatório, as linhas já aparecem e o filtro chega depois', async () => {
    create();
    const categories = httpMock.expectOne(CATEGORIES_URL);
    httpMock.expectOne(PREFERENCES_URL).flush([]);
    await settle();
    httpMock.expectOne(isReport).flush(report());
    await settle();

    expect(queryAll('.report-row')).toHaveLength(2);
    expect(queryAll('.report-categories .check-option')).toHaveLength(0);

    categories.flush(CATEGORIES);
    await settle();

    expect(texts('.report-categories .check-option')).toEqual(['Alimentação (inativa)', 'Salário']);
  });

  it('sem ver Categorias, não pede o catálogo nem mostra o filtro de categoria', async () => {
    TestBed.inject(AuthService).permissions.set([
      { screen: 'TRANSACTION_REPORTS', canView: true, canCreate: false, canEdit: false, canDelete: false },
    ]);
    await render(report(), [], false);

    httpMock.expectNone(CATEGORIES_URL);
    expect(query('.report-categories')).toBeNull();
    expect(buttonByText('Salvar como nova')).toBeUndefined();
    expect(query('input[name="preferenceName"]')).toBeNull();
  });

  it('salva a montagem como nova preferência e a marca como padrão', async () => {
    await render(report(), [preference({ id: 'p1', name: 'Antiga', defaultPreference: true })]);
    // A padrão "Antiga" já foi aplicada; sai dela e monta outra.
    query<HTMLSelectElement>('select[name="preference"]').value = '';
    query<HTMLSelectElement>('select[name="preference"]').dispatchEvent(new Event('change'));
    await settle();

    const name = query<HTMLInputElement>('input[name="preferenceName"]');
    name.value = 'Nova';
    name.dispatchEvent(new Event('input'));
    await click(query<HTMLInputElement>('input[name="preferenceDefault"]'));
    await click(columnBox('Categoria'));

    await click(buttonByText('Salvar como nova'));
    const request = httpMock.expectOne(PREFERENCES_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({
      name: 'Nova',
      defaultPreference: true,
      period: 'CURRENT_MONTH',
      startDate: null,
      columns: ['DATE', 'DESCRIPTION', 'TYPE', 'STATUS', 'AMOUNT'],
    });
    request.flush(preference({ id: 'p9', name: 'Nova', defaultPreference: true }));
    await settle();

    expect(toasts()).toEqual([['Sucesso', 'Preferência salva com sucesso.']]);
    expect(texts('select[name="preference"] option')).toEqual(['Nenhuma', 'Antiga', 'Nova (padrão)']);
    expect(query<HTMLSelectElement>('select[name="preference"]').value).toBe('p9');
  });

  it('exclui a preferência escolhida depois da confirmação', async () => {
    await render(report(), [preference({ id: 'p1', name: 'Mensal', defaultPreference: true })]);

    await click(buttonByText('Excluir preferência'));
    const dialog = query('.modal-card');
    expect(dialog.textContent).toContain('Deseja excluir a preferência "Mensal"?');

    await click(dialog.querySelector('.danger-button') as HTMLButtonElement);
    const request = httpMock.expectOne(`${PREFERENCES_URL}/p1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();

    expect(toasts()).toEqual([['Sucesso', 'Preferência excluída com sucesso.']]);
    expect(texts('select[name="preference"] option')).toEqual(['Nenhuma']);
  });
});
