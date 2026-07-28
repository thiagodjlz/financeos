import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE } from '../models';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let toastService: ToastService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    toastService = TestBed.inject(ToastService);

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  function request(url: string): Promise<unknown> {
    return new Promise((resolve) => {
      http.get(url).subscribe({ next: resolve, error: resolve });
    });
  }

  it('desloga, redireciona e alerta no 401 fora do login', async () => {
    authService.token.set('token-de-teste');

    const done = request(`${API_BASE}/transactions`);
    httpMock
      .expectOne(`${API_BASE}/transactions`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await done;

    expect(authService.token()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(toastService.toasts()).toHaveLength(1);
    expect(toastService.toasts()[0].title).toBe('Alerta');
    expect(toastService.toasts()[0].message).toBe('Sua sessão expirou. Entre novamente.');
  });

  it('não alerta no 401 do próprio login, mas continua deslogando e redirecionando', async () => {
    const done = request(`${API_BASE}/auth/login`);
    httpMock
      .expectOne(`${API_BASE}/auth/login`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await done;

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(toastService.toasts()).toEqual([]);
  });

  it('não mexe em respostas com outros status de erro', async () => {
    authService.token.set('token-de-teste');

    const done = request(`${API_BASE}/categories`);
    httpMock.expectOne(`${API_BASE}/categories`).flush(null, { status: 409, statusText: 'Conflict' });
    await done;

    expect(authService.token()).toBe('token-de-teste');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toastService.toasts()).toEqual([]);
  });

  it('re-lança o erro 401 para a tela tratar', async () => {
    authService.token.set('token-de-teste');

    const captured = new Promise<unknown>((resolve) => {
      http.get(`${API_BASE}/users`).subscribe({ error: resolve });
    });
    httpMock.expectOne(`${API_BASE}/users`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await captured).toMatchObject({ status: 401 });
  });
});
