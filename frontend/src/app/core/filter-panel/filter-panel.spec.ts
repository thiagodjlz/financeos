import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterChip } from '../paged-list';
import { FilterPanel } from './filter-panel';

@Component({
  imports: [FilterPanel],
  template: `
    <app-filter-panel
      [activeCount]="count()"
      [chips]="chips()"
      [canClear]="canClear()"
      (remove)="removed.push($event)"
      (clear)="cleared = cleared + 1"
    >
      <button toolbarAction type="button" class="primary-button">Incluir</button>
      <label>Nome <input name="name" /></label>
    </app-filter-panel>
  `,
})
class Host {
  readonly count = signal(0);
  readonly chips = signal<FilterChip[]>([]);
  readonly canClear = signal(false);
  readonly removed: string[] = [];
  cleared = 0;
}

describe('FilterPanel', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  function toggle(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.filter-toggle');
  }

  it('abre e fecha os campos pelo botão "Filtros", com o "Incluir" na mesma barra', () => {
    expect(toggle().textContent?.trim()).toBe('Filtros');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.list-toolbar .primary-button').textContent.trim()).toBe('Incluir');
    expect(fixture.nativeElement.querySelector('input[name="name"]')).toBeNull();

    toggle().click();
    fixture.detectChanges();

    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.filter-panel input[name="name"]')).not.toBeNull();
  });

  it('vira "Filtros (N)" e mostra um rótulo removível por filtro aplicado', () => {
    fixture.componentInstance.count.set(2);
    fixture.componentInstance.chips.set([
      { key: 'type', label: 'Tipo: Despesa' },
      { key: 'active', label: 'Situação: Ativos' },
    ]);
    fixture.detectChanges();

    expect(toggle().textContent?.trim()).toBe('Filtros (2)');
    const chips = Array.from(fixture.nativeElement.querySelectorAll('.filter-chip span')).map((chip) =>
      (chip as HTMLElement).textContent?.trim(),
    );
    expect(chips).toEqual(['Tipo: Despesa', 'Situação: Ativos']);

    const remove = fixture.nativeElement.querySelectorAll('.filter-chip-remove')[1] as HTMLButtonElement;
    expect(remove.getAttribute('aria-label')).toBe('Remover filtro Situação: Ativos');
    remove.click();

    expect(fixture.componentInstance.removed).toEqual(['active']);
  });

  it('só habilita "Limpar filtros" quando há o que limpar', () => {
    toggle().click();
    fixture.detectChanges();
    const clear = () => fixture.nativeElement.querySelector('.filter-actions button') as HTMLButtonElement;

    expect(clear().textContent?.trim()).toBe('Limpar filtros');
    expect(clear().disabled).toBe(true);

    fixture.componentInstance.canClear.set(true);
    fixture.detectChanges();
    clear().click();

    expect(fixture.componentInstance.cleared).toBe(1);
  });
});
