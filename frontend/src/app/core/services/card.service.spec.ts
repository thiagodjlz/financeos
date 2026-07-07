import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { CardService } from './card.service';

describe('CardService', () => {
  let service: CardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates the cards signal from GET /cards', async () => {
    const refreshPromise = service.refresh();

    const req = httpMock.expectOne(`${API_BASE}/cards`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: '1', accountId: null, name: 'Nubank', brand: 'Mastercard', creditLimit: 1000, closingDay: 10, dueDay: 20, active: true },
    ]);

    await refreshPromise;
    expect(service.cards()).toHaveLength(1);
    expect(service.cards()[0].name).toBe('Nubank');
  });

  it('creates a card via POST /cards', async () => {
    const createPromise = service.create({ name: 'Novo cartao', creditLimit: 500 });

    const req = httpMock.expectOne(`${API_BASE}/cards`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2', accountId: null, name: 'Novo cartao', brand: null, creditLimit: 500, closingDay: null, dueDay: null, active: true });

    await expect(createPromise).resolves.toMatchObject({ id: '2' });
  });
});
