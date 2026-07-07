import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { AuthService } from './auth.service';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('logs in, stores the token and loads effective permissions via /auth/me', async () => {
    const loginPromise = service.login('dev@financeos.local', 'financeos_dev_2026');

    const loginReq = httpMock.expectOne(`${API_BASE}/auth/login`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ token: 'fake-token', expiresIn: 43200 });
    await flushMicrotasks();

    const meReq = httpMock.expectOne(`${API_BASE}/auth/me`);
    expect(meReq.request.method).toBe('GET');
    meReq.flush({
      name: 'Dev',
      email: 'dev@financeos.local',
      superAdmin: false,
      permissions: [{ screen: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false }],
    });

    await loginPromise;

    expect(service.token()).toBe('fake-token');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.can('DASHBOARD', 'VIEW')).toBe(true);
    expect(service.can('DASHBOARD', 'CREATE')).toBe(false);
    expect(service.can('TRANSACTIONS', 'VIEW')).toBe(false);
    expect(service.me()?.name).toBe('Dev');
  });

  it('grants every permission when the user is a super admin', async () => {
    const loginPromise = service.login('owner@financeos.internal', 'secret');

    httpMock.expectOne(`${API_BASE}/auth/login`).flush({ token: 'fake-token', expiresIn: 43200 });
    await flushMicrotasks();

    httpMock.expectOne(`${API_BASE}/auth/me`).flush({
      name: 'System Owner',
      email: 'owner@financeos.internal',
      superAdmin: true,
      permissions: [],
    });

    await loginPromise;

    expect(service.can('USERS', 'DELETE')).toBe(true);
    expect(service.can('PROFILES', 'CREATE')).toBe(true);
  });

  it('clears token and permissions on logout', async () => {
    const loginPromise = service.login('dev@financeos.local', 'financeos_dev_2026');
    httpMock.expectOne(`${API_BASE}/auth/login`).flush({ token: 'fake-token', expiresIn: 43200 });
    await flushMicrotasks();
    httpMock
      .expectOne(`${API_BASE}/auth/me`)
      .flush({ name: 'Dev', email: 'dev@financeos.local', superAdmin: true, permissions: [] });
    await loginPromise;

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.me()).toBeNull();
    expect(service.can('DASHBOARD', 'VIEW')).toBe(false);
  });
});
