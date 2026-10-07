import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { AuditService, browserTimeZone } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista uma página via GET /audit com os filtros preenchidos e o fuso do navegador', async () => {
    const listPromise = service.list(
      { startDate: '2026-09-06', endDate: '2026-10-06', user: 'ana', type: '', action: 'CREATE', screen: '' },
      2,
    );

    const req = httpMock.expectOne((request) => request.url === `${API_BASE}/audit`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('startDate')).toBe('2026-09-06');
    expect(req.request.params.get('endDate')).toBe('2026-10-06');
    expect(req.request.params.get('user')).toBe('ana');
    expect(req.request.params.get('action')).toBe('CREATE');
    expect(req.request.params.has('type')).toBe(false);
    expect(req.request.params.has('screen')).toBe(false);
    expect(req.request.params.get('timeZone')).toBe(browserTimeZone());
    req.flush({ items: [], totalItems: 0, totalPages: 0, page: 2, size: 10 });

    await expect(listPromise).resolves.toMatchObject({ page: 2 });
  });

  it('busca as opções dos filtros via GET /audit/options', async () => {
    const optionsPromise = service.options();

    httpMock
      .expectOne(`${API_BASE}/audit/options`)
      .flush({ types: [{ code: 'PRINT', label: 'Impressão' }], actions: [], screens: [] });

    await expect(optionsPromise).resolves.toMatchObject({ types: [{ code: 'PRINT', label: 'Impressão' }] });
  });

  it('registra o acesso a uma tela via POST /audit/screen-access', async () => {
    const accessPromise = service.screenAccess('TRANSACTIONS');

    const req = httpMock.expectOne(`${API_BASE}/audit/screen-access`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ screen: 'TRANSACTIONS' });
    req.flush(null, { status: 204, statusText: 'No Content' });

    await expect(accessPromise).resolves.toBeUndefined();
  });
});
