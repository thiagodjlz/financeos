import { NO_ACCESS_ROUTE, resolveEntryRoute, screenForUrl } from './entry-route';
import { Action, PermissionEntry, Screen } from './models';
import { AuthService } from './services/auth.service';

function entry(screen: Screen): PermissionEntry {
  return { screen, canView: true, canCreate: false, canEdit: false, canDelete: false };
}

function authWith(permissions: PermissionEntry[], superAdmin = false): Pick<AuthService, 'can'> {
  return {
    can(screen: Screen, action: Action): boolean {
      if (superAdmin) {
        return true;
      }

      const found = permissions.find((permission) => permission.screen === screen);
      return action === 'VIEW' && !!found && found.canView;
    },
  };
}

describe('resolveEntryRoute', () => {
  it('leva ao Resumo quando todas as telas são permitidas', () => {
    const auth = authWith([
      entry('DASHBOARD'),
      entry('TRANSACTIONS'),
      entry('CATEGORIES'),
      entry('USERS'),
      entry('PROFILES'),
      entry('DOCUMENTATION'),
    ]);

    expect(resolveEntryRoute(auth)).toBe('/dashboard');
  });

  it('leva a Lançamentos quando só há permissão de Lançamentos', () => {
    expect(resolveEntryRoute(authWith([entry('TRANSACTIONS')]))).toBe('/transactions');
  });

  it('leva a Usuários quando só há permissão de Usuários', () => {
    expect(resolveEntryRoute(authWith([entry('USERS')]))).toBe('/users');
  });

  it('leva à Central quando só há permissão de Documentação', () => {
    expect(resolveEntryRoute(authWith([entry('DOCUMENTATION')]))).toBe('/documentation');
  });

  it('leva às Novidades por versão quando só há essa permissão', () => {
    expect(resolveEntryRoute(authWith([entry('RELEASE_NOTES')]))).toBe('/release-notes');
  });

  it('leva à Auditoria quando só há essa permissão', () => {
    expect(resolveEntryRoute(authWith([entry('AUDIT')]))).toBe('/audit');
  });

  it('põe a Auditoria depois de Perfis e antes da Documentação na ordem do menu', () => {
    expect(resolveEntryRoute(authWith([entry('DOCUMENTATION'), entry('AUDIT')]))).toBe('/audit');
    expect(resolveEntryRoute(authWith([entry('AUDIT'), entry('PROFILES')]))).toBe('/profiles');
  });

  it('respeita a ordem do menu quando há mais de uma tela permitida', () => {
    expect(resolveEntryRoute(authWith([entry('DOCUMENTATION'), entry('CATEGORIES')]))).toBe('/categories');
  });

  it('leva à rota neutra quando nenhuma tela é permitida', () => {
    expect(resolveEntryRoute(authWith([]))).toBe(NO_ACCESS_ROUTE);
    expect(NO_ACCESS_ROUTE).toBe('/no-access');
  });

  it('leva ao Resumo para o super administrador', () => {
    expect(resolveEntryRoute(authWith([], true))).toBe('/dashboard');
  });
});

describe('screenForUrl', () => {
  it.each([
    ['/dashboard', 'DASHBOARD'],
    ['/transactions', 'TRANSACTIONS'],
    ['/transactions/7/edit', 'TRANSACTIONS'],
    ['/categories/new', 'CATEGORIES'],
    ['/audit?page=2', 'AUDIT'],
    ['/documentation#area', 'DOCUMENTATION'],
    ['/release-notes', 'RELEASE_NOTES'],
  ])('reconhece %s como a tela %s', (url, screen) => {
    expect(screenForUrl(url)).toBe(screen);
  });

  it.each(['/', '/login', '/no-access', '/desconhecida'])('não reconhece %s como tela do menu', (url) => {
    expect(screenForUrl(url)).toBeNull();
  });
});
