import { Screen } from './models';
import { AuthService } from './services/auth.service';

export const NO_ACCESS_ROUTE = '/no-access';

const ENTRY_ROUTES: { screen: Screen; path: string }[] = [
  { screen: 'DASHBOARD', path: '/dashboard' },
  { screen: 'TRANSACTIONS', path: '/transactions' },
  { screen: 'CATEGORIES', path: '/categories' },
  { screen: 'USERS', path: '/users' },
  { screen: 'PROFILES', path: '/profiles' },
  { screen: 'DOCUMENTATION', path: '/documentation' },
  { screen: 'RELEASE_NOTES', path: '/release-notes' },
];

// Le apenas o signal de permissoes ja resolvido: quem chama (guard e login) ja passou pelo
// /auth/me, e uma requisicao a mais aqui deixaria pendente o httpMock.verify() daquelas suites.
export function resolveEntryRoute(auth: Pick<AuthService, 'can'>): string {
  return ENTRY_ROUTES.find((entry) => auth.can(entry.screen, 'VIEW'))?.path ?? NO_ACCESS_ROUTE;
}
