import { TestBed } from '@angular/core/testing';
import { ListStateService } from './list-state.service';

describe('ListStateService', () => {
  let service: ListStateService;

  beforeEach(() => {
    service = TestBed.inject(ListStateService);
  });

  it('guarda filtros e página por listagem, sem compartilhar a referência', () => {
    const filters = { type: 'EXPENSE' };
    service.set('transactions', { filters, page: 2 });
    filters.type = 'INCOME';

    expect(service.get('transactions')).toEqual({ filters: { type: 'EXPENSE' }, page: 2 });
    expect(service.get('categories')).toBeUndefined();
  });

  it('esquece tudo no clear', () => {
    service.set('users', { filters: { active: 'true' }, page: 3 });

    service.clear();

    expect(service.get('users')).toBeUndefined();
  });
});
