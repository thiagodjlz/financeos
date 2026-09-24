import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista uma página via GET /transactions com page, size e só os filtros preenchidos', async () => {
    const listPromise = service.list(
      { description: ' feira ', categoryId: '', type: 'EXPENSE', status: '', startDate: '2026-03-01', endDate: '' },
      2,
    );

    const req = httpMock.expectOne(
      `${API_BASE}/transactions?page=2&size=10&description=feira&type=EXPENSE&startDate=2026-03-01`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalItems: 11, totalPages: 2, page: 2, size: 10 });

    await expect(listPromise).resolves.toMatchObject({ totalItems: 11, totalPages: 2 });
  });

  it('busca um lançamento via GET /transactions/{id}', async () => {
    const getPromise = service.get('1');

    const req = httpMock.expectOne(`${API_BASE}/transactions/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: '1' });

    await expect(getPromise).resolves.toMatchObject({ id: '1' });
  });

  it('creates a transaction via POST /transactions', async () => {
    const createPromise = service.create({ description: 'Novo lancamento', amount: 50 });

    const req = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: '2',
      categoryId: null,
      transactionDate: '2026-06-02',
      description: 'Novo lancamento',
      amount: 50,
      type: 'EXPENSE',
      status: 'PENDING',
      source: 'MANUAL',
    });

    await expect(createPromise).resolves.toMatchObject({ id: '2' });
  });

  it('cancels a transaction via DELETE /transactions/{id}', async () => {
    const cancelPromise = service.cancel('1');

    const req = httpMock.expectOne(`${API_BASE}/transactions/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await cancelPromise;
  });
});
