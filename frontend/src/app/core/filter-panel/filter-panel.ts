import { Component, computed, input, output, signal } from '@angular/core';
import { FilterChip } from '../paged-list';

let panelSequence = 0;

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.html',
})
export class FilterPanel {
  readonly activeCount = input.required<number>();
  readonly chips = input<FilterChip[]>([]);
  readonly canClear = input(false);

  readonly remove = output<string>();
  readonly clear = output<void>();

  protected readonly open = signal(false);
  protected readonly panelId = `filter-panel-${++panelSequence}`;

  protected readonly toggleLabel = computed(() =>
    this.activeCount() > 0 ? `Filtros (${this.activeCount()})` : 'Filtros',
  );

  protected toggle(): void {
    this.open.update((open) => !open);
  }
}
