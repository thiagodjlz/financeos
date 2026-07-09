import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates the categories signal from GET /categories', async () => {
    const refreshPromise = service.refresh();

    const req = httpMock.expectOne(`${API_BASE}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: '1', parentId: null, name: 'Mercado', type: 'EXPENSE', color: '#000', icon: null, active: true },
    ]);

    await refreshPromise;
    expect(service.categories()).toHaveLength(1);
    expect(service.categories()[0].name).toBe('Mercado');
  });

  it('creates a category via POST /categories', async () => {
    const createPromise = service.create({ name: 'Salario', type: 'INCOME' });

    const req = httpMock.expectOne(`${API_BASE}/categories`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2', parentId: null, name: 'Salario', type: 'INCOME', color: null, icon: null, active: true });

    await expect(createPromise).resolves.toMatchObject({ id: '2' });
  });

  it('updates a category via PUT /categories/{id}', async () => {
    const updatePromise = service.update('2', { name: 'Salario CLT', type: 'INCOME', active: false });

    const req = httpMock.expectOne(`${API_BASE}/categories/2`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: '2', parentId: null, name: 'Salario CLT', type: 'INCOME', color: null, icon: null, active: false });

    await expect(updatePromise).resolves.toMatchObject({ id: '2', active: false });
  });
});
