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

  it('populates the profiles signal from GET /profiles', async () => {
    const refreshPromise = service.refresh();

    const req = httpMock.expectOne(`${API_BASE}/profiles`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'p1', name: 'Administrador', active: true, permissions: [] }]);

    await refreshPromise;
    expect(service.profiles()).toHaveLength(1);
    expect(service.profiles()[0].name).toBe('Administrador');
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
