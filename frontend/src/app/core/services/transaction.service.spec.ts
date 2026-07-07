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

  it('populates the transactions signal from GET /transactions', async () => {
    const refreshPromise = service.refresh();

    const req = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: '1',
        categoryId: null,
        accountId: null,
        cardId: null,
        transactionDate: '2026-06-01',
        description: 'Mercado',
        amount: 100,
        type: 'EXPENSE',
        status: 'PAID',
        source: 'MANUAL',
      },
    ]);

    await refreshPromise;
    expect(service.transactions()).toHaveLength(1);
    expect(service.transactions()[0].description).toBe('Mercado');
  });

  it('creates a transaction via POST /transactions', async () => {
    const createPromise = service.create({ description: 'Novo lancamento', amount: 50 });

    const req = httpMock.expectOne(`${API_BASE}/transactions`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: '2',
      categoryId: null,
      accountId: null,
      cardId: null,
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
