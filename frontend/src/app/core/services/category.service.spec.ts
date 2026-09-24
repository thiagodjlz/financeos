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

  it('lista uma página via GET /categories com os filtros', async () => {
    const listPromise = service.list({ name: 'mer', type: '', active: 'true' }, 1);

    const req = httpMock.expectOne(`${API_BASE}/categories?page=1&size=10&name=mer&active=true`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalItems: 0, totalPages: 0, page: 1, size: 10 });

    await expect(listPromise).resolves.toMatchObject({ totalItems: 0 });
  });

  it('busca o catálogo completo e o dropdown por tipo em /categories/options', async () => {
    const optionsPromise = service.options();
    httpMock.expectOne(`${API_BASE}/categories/options`).flush([
      { id: '1', parentId: null, name: 'Mercado', type: 'EXPENSE', color: '#000', active: false },
    ]);
    await expect(optionsPromise).resolves.toHaveLength(1);

    const byTypePromise = service.listByType('INCOME');
    httpMock.expectOne(`${API_BASE}/categories/options?type=INCOME`).flush([]);
    await expect(byTypePromise).resolves.toEqual([]);
  });

  it('busca uma categoria via GET /categories/{id}', async () => {
    const getPromise = service.get('1');

    httpMock.expectOne(`${API_BASE}/categories/1`).flush({ id: '1', active: false });

    await expect(getPromise).resolves.toMatchObject({ id: '1', active: false });
  });

  it('creates a category via POST /categories', async () => {
    const createPromise = service.create({ name: 'Salario', type: 'INCOME' });

    const req = httpMock.expectOne(`${API_BASE}/categories`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2', parentId: null, name: 'Salario', type: 'INCOME', color: null, active: true });

    await expect(createPromise).resolves.toMatchObject({ id: '2' });
  });

  it('updates a category via PUT /categories/{id}', async () => {
    const updatePromise = service.update('2', { name: 'Salario CLT', type: 'INCOME', active: false });

    const req = httpMock.expectOne(`${API_BASE}/categories/2`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: '2', parentId: null, name: 'Salario CLT', type: 'INCOME', color: null, active: false });

    await expect(updatePromise).resolves.toMatchObject({ id: '2', active: false });
  });
});
