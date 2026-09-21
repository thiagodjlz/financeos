import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { API_BASE, PermissionEntry } from '../models';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { permissionGuard } from './permission.guard';

const DASHBOARD_ONLY: PermissionEntry[] = [
  { screen: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false },
];

function viewOnly(screen: PermissionEntry['screen']): PermissionEntry {
  return { screen, canView: true, canCreate: false, canEdit: false, canDelete: false };
}

describe('permissionGuard', () => {
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let toastService: ToastService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    toastService = TestBed.inject(ToastService);

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  function run(): Promise<boolean> {
    const guard = permissionGuard('USERS', 'VIEW');

    return TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Promise<boolean>,
    );
  }

  function flushMe(superAdmin: boolean, permissions: PermissionEntry[]): void {
    httpMock.expectOne(`${API_BASE}/auth/me`).flush({
      name: 'Dev',
      email: 'dev@financeos.local',
      superAdmin,
      permissions,
    });
  }

  it('libera a rota quando o usuário tem a permissão', async () => {
    authService.token.set('token-de-teste');

    const result = run();
    flushMe(true, []);

    expect(await result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(toastService.toasts()).toEqual([]);
  });

  it('redireciona para o Resumo e alerta a falta de permissão', async () => {
    authService.token.set('token-de-teste');

    const result = run();
    flushMe(false, DASHBOARD_ONLY);

    expect(await result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(toastService.toasts()).toHaveLength(1);
    expect(toastService.toasts()[0].title).toBe('Alerta');
    expect(toastService.toasts()[0].message).toBe('Você não tem permissão para acessar esta tela.');
  });

  it('manda para o login sem alerta quando não há sessão', async () => {
    expect(await run()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(toastService.toasts()).toEqual([]);
  });

  it('leva para a primeira tela permitida quando não há Resumo', async () => {
    authService.token.set('token-de-teste');

    const guard = permissionGuard('PROFILES', 'VIEW');
    const result = TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Promise<boolean>,
    );
    flushMe(false, [viewOnly('USERS')]);

    expect(await result).toBe(false);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
    expect(toastService.toasts()).toHaveLength(1);
    expect(toastService.toasts()[0].title).toBe('Alerta');
  });

  it('volta para a Central quando só há permissão de Documentação', async () => {
    authService.token.set('token-de-teste');

    const result = run();
    flushMe(false, [viewOnly('DOCUMENTATION')]);

    expect(await result).toBe(false);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/documentation']);
  });

  it('manda para /no-access quando nenhuma tela é permitida', async () => {
    authService.token.set('token-de-teste');

    const result = run();
    flushMe(false, []);

    expect(await result).toBe(false);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/no-access']);
  });

  it('não busca a documentação ao negar a rota da Central', async () => {
    authService.token.set('token-de-teste');

    const guard = permissionGuard('DOCUMENTATION', 'VIEW');
    const result = TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Promise<boolean>,
    );
    flushMe(false, DASHBOARD_ONLY);

    expect(await result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    httpMock.expectNone(`${API_BASE}/documentation`);
  });
});
