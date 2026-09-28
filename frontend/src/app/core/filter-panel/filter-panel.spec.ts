import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterChip, FilterControls } from '../paged-list';
import { FilterPanel } from './filter-panel';

function fakeList() {
  const calls: string[] = [];
  const activeCount = signal(0);
  const differsFromDefault = signal(false);
  const list: FilterControls = {
    activeCount,
    differsFromDefault,
    remove: (key) => calls.push(`remove:${key}`),
    clear: () => calls.push('clear'),
    beginDraft: () => calls.push('beginDraft'),
    applyDraft: () => calls.push('applyDraft'),
    discardDraft: () => calls.push('discardDraft'),
    clearDraft: () => calls.push('clearDraft'),
  };
  return { list, calls, activeCount, differsFromDefault };
}

@Component({
  imports: [FilterPanel],
  template: `
    <app-filter-panel [list]="fake.list" [chips]="chips()">
      <input filterSearch name="search" aria-label="Buscar por nome" />
      <label class="filter-field"><span>Tipo</span><select name="type"></select></label>
    </app-filter-panel>
  `,
})
class Host {
  readonly fake = fakeList();
  readonly chips = signal<FilterChip[]>([]);
}

describe('FilterPanel', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => document.body.classList.remove('overlay-open'));

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function toggle(): HTMLButtonElement {
    return element().querySelector('.filter-toggle') as HTMLButtonElement;
  }

  function sheet(): HTMLElement {
    return element().querySelector('.filter-sheet') as HTMLElement;
  }

  function sheetButton(label: string): HTMLButtonElement {
    return Array.from(sheet().querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => (button.getAttribute('aria-label') ?? button.textContent?.trim()) === label,
    ) as HTMLButtonElement;
  }

  it('renderiza a busca e os campos sempre, sem depender de abrir o painel', () => {
    expect(element().querySelector('.filter-row input[name="search"]')).not.toBeNull();
    expect(element().querySelector('.filter-fields select[name="type"]')).not.toBeNull();
    expect(sheet().classList.contains('open')).toBe(false);
    expect(sheet().getAttribute('role')).toBeNull();
  });

  it('mantém alça, título e ações do painel como filhos diretos dele, de que depende o CSS que os esconde no desktop', () => {
    const children = Array.from(sheet().children).map((child) => child.className);

    expect(children).toEqual([
      'filter-sheet-handle sheet-handle',
      'filter-sheet-head sheet-head',
      'filter-fields',
      'filter-sheet-actions',
    ]);
    expect(element().querySelector('.filter-row > .sheet-head, .filter-row > .sheet-handle')).toBeNull();
    expect(sheet().getAttribute('aria-labelledby')).toBeNull();
  });

  it('o botão Filtros conta os filtros ativos no rótulo acessível e no selo', () => {
    expect(toggle().getAttribute('aria-label')).toBe('Filtros');
    expect(element().querySelector('.filter-count')).toBeNull();

    fixture.componentInstance.fake.activeCount.set(1);
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-label')).toBe('Filtros, 1 ativo');
    expect(element().querySelector('.filter-count')?.textContent?.trim()).toBe('1');

    fixture.componentInstance.fake.activeCount.set(2);
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-label')).toBe('Filtros, 2 ativos');
  });

  it('abre o painel inferior começando um rascunho e "Aplicar" aplica e fecha', async () => {
    const { calls } = fixture.componentInstance.fake;

    toggle().click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(calls).toEqual(['beginDraft']);
    expect(sheet().classList.contains('open')).toBe(true);
    expect(sheet().getAttribute('role')).toBe('dialog');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('overlay-open')).toBe(true);
    expect(sheet().contains(document.activeElement)).toBe(true);

    sheetButton('Limpar filtros').click();
    sheetButton('Aplicar').click();
    fixture.detectChanges();

    expect(calls).toEqual(['beginDraft', 'clearDraft', 'applyDraft']);
    expect(sheet().classList.contains('open')).toBe(false);
    expect(document.body.classList.contains('overlay-open')).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it('fechar pelo X, pelo scrim ou pelo Esc descarta o rascunho', () => {
    const { calls } = fixture.componentInstance.fake;

    toggle().click();
    fixture.detectChanges();
    sheetButton('Fechar filtros').click();
    fixture.detectChanges();

    toggle().click();
    fixture.detectChanges();
    (element().querySelector('.filter-scrim') as HTMLElement).click();
    fixture.detectChanges();

    toggle().click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(calls).toEqual([
      'beginDraft',
      'discardDraft',
      'beginDraft',
      'discardDraft',
      'beginDraft',
      'discardDraft',
    ]);
    expect(sheet().classList.contains('open')).toBe(false);
    expect(element().querySelector('.filter-scrim')).toBeNull();
  });

  it('mostra "Filtros ativos:" com um rótulo removível por filtro e "Limpar filtros" só quando há o que limpar', () => {
    const host = fixture.componentInstance;
    expect(element().querySelector('.active-filters')).toBeNull();

    host.chips.set([
      { key: 'type', label: 'Tipo: Despesa' },
      { key: 'active', label: 'Situação: Ativos' },
    ]);
    fixture.detectChanges();

    expect(element().querySelector('.active-filters-label')?.textContent?.trim()).toBe('Filtros ativos:');
    const chips = Array.from(element().querySelectorAll<HTMLButtonElement>('.filter-chip'));
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Tipo: Despesa', 'Situação: Ativos']);
    expect(chips[1].getAttribute('aria-label')).toBe('Remover filtro Situação: Ativos');
    expect(element().querySelector('.active-filters .link-button')).toBeNull();

    chips[1].click();
    host.fake.differsFromDefault.set(true);
    fixture.detectChanges();
    (element().querySelector('.active-filters .link-button') as HTMLButtonElement).click();

    expect(host.fake.calls).toEqual(['remove:active', 'clear']);
  });
});
