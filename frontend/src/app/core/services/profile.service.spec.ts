import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista uma página via GET /profiles e todos os perfis via /profiles/options', async () => {
    const listPromise = service.list({ name: 'adm' }, 1);
    httpMock.expectOne(`${API_BASE}/profiles?page=1&size=10&name=adm`).flush({ items: [], totalItems: 0, totalPages: 0, page: 1, size: 10 });
    await expect(listPromise).resolves.toMatchObject({ totalPages: 0 });

    const optionsPromise = service.options();
    httpMock
      .expectOne(`${API_BASE}/profiles/options`)
      .flush([{ id: 'p1', name: 'Administrador', active: true, permissions: [] }]);
    await expect(optionsPromise).resolves.toHaveLength(1);
  });

  it('busca um perfil via GET /profiles/{id}', async () => {
    const getPromise = service.get('p1');

    httpMock.expectOne(`${API_BASE}/profiles/p1`).flush({ id: 'p1', name: 'Administrador' });

    await expect(getPromise).resolves.toMatchObject({ id: 'p1' });
  });

  it('creates a profile via POST /profiles', async () => {
    const createPromise = service.create({
      name: 'Somente leitura',
      permissions: [{ screen: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false }],
    });

    const req = httpMock.expectOne(`${API_BASE}/profiles`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'p2', name: 'Somente leitura', active: true, permissions: [] });

    await expect(createPromise).resolves.toMatchObject({ id: 'p2' });
  });

  it('updates a profile via PUT /profiles/{id}', async () => {
    const updatePromise = service.update('p1', { name: 'Administrador', permissions: [] });

    const req = httpMock.expectOne(`${API_BASE}/profiles/p1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'p1', name: 'Administrador', active: true, permissions: [] });

    await expect(updatePromise).resolves.toMatchObject({ id: 'p1' });
  });

  it('deletes a profile via DELETE /profiles/{id}', async () => {
    const deletePromise = service.delete('p1');

    const req = httpMock.expectOne(`${API_BASE}/profiles/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await deletePromise;
  });
});
