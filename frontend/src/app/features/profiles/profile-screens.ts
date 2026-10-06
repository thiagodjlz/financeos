import { PermissionEntry, Screen } from '../../core/models';

// Telas da matriz de Perfis, na ordem do menu. Compartilhada pelo cadastro e pelo Detalhe da listagem.
export const PROFILE_SCREENS: { code: Screen; label: string; viewOnly?: boolean }[] = [
  { code: 'DASHBOARD', label: 'Resumo' },
  { code: 'TRANSACTIONS', label: 'Lançamentos' },
  { code: 'CATEGORIES', label: 'Categorias' },
  { code: 'USERS', label: 'Usuários' },
  { code: 'PROFILES', label: 'Perfis' },
  { code: 'DOCUMENTATION', label: 'Documentação', viewOnly: true },
  { code: 'RELEASE_NOTES', label: 'Novidades por versão', viewOnly: true },
];

export interface PermissionSummary {
  screen: string;
  actions: string;
}

// Uma linha por tela, com as ações liberadas ("Ver, Incluir, Alterar, Excluir") ou "Sem acesso".
export function permissionSummary(permissions: PermissionEntry[]): PermissionSummary[] {
  return PROFILE_SCREENS.map(({ code, label }) => {
    const entry = permissions.find((permission) => permission.screen === code);
    const actions = [
      entry?.canView ? 'Ver' : '',
      entry?.canCreate ? 'Incluir' : '',
      entry?.canEdit ? 'Alterar' : '',
      entry?.canDelete ? 'Excluir' : '',
    ].filter(Boolean);
    return { screen: label, actions: actions.length ? actions.join(', ') : 'Sem acesso' };
  });
}
