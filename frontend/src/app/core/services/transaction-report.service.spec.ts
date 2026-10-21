import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE, ReportCriteria, ReportPreferencePayload } from '../models';
import { TransactionReportService } from './transaction-report.service';

const EMPTY_CRITERIA: ReportCriteria = {
  period: 'CURRENT_MONTH',
  startDate: '',
  endDate: '',
  categoryIds: [],
  type: '',
  status: '',
  source: '',
  minAmount: '',
  maxAmount: '',
  installments: 'ALL',
  groupBy: [],
};

describe('TransactionReportService', () => {
  let service: TransactionReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gera o relatório só com o período quando não há filtro', () => {
    void service.generate({ ...EMPTY_CRITERIA, startDate: '2026-01-01', endDate: '2026-01-31' });

    const req = httpMock.expectOne((request) => request.url === `${API_BASE}/transaction-reports`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual(['period']);
    expect(req.request.params.get('period')).toBe('CURRENT_MONTH');
    req.flush({});
  });

  it('repete categorias e agrupamentos na ordem e manda as datas só no Personalizado', () => {
    void service.generate({
      ...EMPTY_CRITERIA,
      period: 'CUSTOM',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      categoryIds: ['c1', 'c2'],
      type: 'EXPENSE',
      status: 'PAID',
      source: 'MANUAL',
      minAmount: ' 100,00 ',
      maxAmount: '200',
      installments: 'INSTALLMENT',
      groupBy: ['MONTH', 'CATEGORY'],
    });

    const req = httpMock.expectOne((request) => request.url === `${API_BASE}/transaction-reports`);
    expect(req.request.params.get('startDate')).toBe('2026-01-01');
    expect(req.request.params.get('endDate')).toBe('2026-06-30');
    expect(req.request.params.getAll('categoryId')).toEqual(['c1', 'c2']);
    expect(req.request.params.getAll('groupBy')).toEqual(['MONTH', 'CATEGORY']);
    expect(req.request.params.get('type')).toBe('EXPENSE');
    expect(req.request.params.get('status')).toBe('PAID');
    expect(req.request.params.get('source')).toBe('MANUAL');
    expect(req.request.params.get('minAmount')).toBe('100,00');
    expect(req.request.params.get('maxAmount')).toBe('200');
    expect(req.request.params.get('installments')).toBe('INSTALLMENT');
    req.flush({});
  });

  it('lista, cria, altera e exclui preferências', async () => {
    const payload: ReportPreferencePayload = {
      name: 'Mensal',
      defaultPreference: true,
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
      columns: ['DATE'],
    };
    const url = `${API_BASE}/transaction-reports/preferences`;

    const list = service.preferences();
    httpMock.expectOne(url).flush([]);
    await expect(list).resolves.toEqual([]);

    void service.createPreference(payload);
    const create = httpMock.expectOne(url);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush({ id: 'p1' });

    void service.updatePreference('p1', payload);
    const update = httpMock.expectOne(`${url}/p1`);
    expect(update.request.method).toBe('PUT');
    update.flush({ id: 'p1' });

    const removal = service.removePreference('p1');
    const remove = httpMock.expectOne(`${url}/p1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
    await removal;
  });
});
