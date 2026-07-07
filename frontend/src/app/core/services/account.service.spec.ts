import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates the accounts signal from GET /accounts', async () => {
    const refreshPromise = service.refresh();

    const req = httpMock.expectOne(`${API_BASE}/accounts`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', name: 'Conta corrente', type: 'CHECKING', initialBalance: 0, active: true }]);

    await refreshPromise;
    expect(service.accounts()).toHaveLength(1);
    expect(service.accounts()[0].name).toBe('Conta corrente');
  });

  it('creates an account via POST /accounts', async () => {
    const createPromise = service.create({ name: 'Nova conta', type: 'SAVINGS', initialBalance: 100 });

    const req = httpMock.expectOne(`${API_BASE}/accounts`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2', name: 'Nova conta', type: 'SAVINGS', initialBalance: 100, active: true });

    await expect(createPromise).resolves.toMatchObject({ id: '2' });
  });
});
