import { Injectable } from '@angular/core';
import { ListFilters } from '../models';

export interface ListState<F extends ListFilters = ListFilters> {
  filters: F;
  page: number;
}

// Filtros e página de cada listagem, em memória: ao voltar do cadastro (Salvar ou Cancelar) a
// listagem reabre como estava. Some ao recarregar a página e no logout.
@Injectable({ providedIn: 'root' })
export class ListStateService {
  private readonly states = new Map<string, ListState>();

  get<F extends ListFilters>(key: string): ListState<F> | undefined {
    const state = this.states.get(key);
    return state ? { filters: { ...state.filters } as F, page: state.page } : undefined;
  }

  set<F extends ListFilters>(key: string, state: ListState<F>): void {
    this.states.set(key, { filters: { ...state.filters }, page: state.page });
  }

  clear(): void {
    this.states.clear();
  }
}
