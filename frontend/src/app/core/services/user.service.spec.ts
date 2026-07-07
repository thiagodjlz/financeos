import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates the users signal from GET /users', async () => {
    const refreshPromise = service.refresh();

    const req = httpMock.expectOne(`${API_BASE}/users`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1', name: 'Ana', email: 'ana@financeos.local', active: true, profileId: 'p1' }]);

    await refreshPromise;
    expect(service.users()).toHaveLength(1);
    expect(service.users()[0].name).toBe('Ana');
  });

  it('creates a user via POST /users', async () => {
    const createPromise = service.create({ name: 'Ana', email: 'ana@financeos.local', password: 'senha12345', profileId: 'p1' });

    const req = httpMock.expectOne(`${API_BASE}/users`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2', name: 'Ana', email: 'ana@financeos.local', active: true, profileId: 'p1' });

    await expect(createPromise).resolves.toMatchObject({ id: '2' });
  });

  it('updates a user via PUT /users/{id}', async () => {
    const updatePromise = service.update('1', { name: 'Ana Paula', email: 'ana@financeos.local', profileId: 'p1', active: true });

    const req = httpMock.expectOne(`${API_BASE}/users/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: '1', name: 'Ana Paula', email: 'ana@financeos.local', active: true, profileId: 'p1' });

    await expect(updatePromise).resolves.toMatchObject({ name: 'Ana Paula' });
  });

  it('deactivates a user via DELETE /users/{id}', async () => {
    const deactivatePromise = service.deactivate('1');

    const req = httpMock.expectOne(`${API_BASE}/users/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await deactivatePromise;
  });
});
