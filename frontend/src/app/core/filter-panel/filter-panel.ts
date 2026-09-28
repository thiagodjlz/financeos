import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FilterChip, FilterControls } from '../paged-list';

const OVERLAY_OPEN_CLASS = 'overlay-open';
const FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])';

let panelSequence = 0;

// Acima de 680px os campos ficam sempre visíveis e aplicam no `change`; até 680px o botão
// "Filtros" (só visível ali, pelo CSS) abre os mesmos campos num painel inferior com "Aplicar".
@Component({
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.html',
})
export class FilterPanel implements OnDestroy {
  readonly list = input.required<FilterControls>();
  readonly chips = input<FilterChip[]>([]);
  // Tela só com a busca (Perfis): no celular não há o que abrir no painel, então o botão some.
  readonly hasFields = input(true);

  protected readonly open = signal(false);
  protected readonly panelId = `filter-panel-${++panelSequence}`;
  protected readonly titleId = `${this.panelId}-title`;

  protected readonly toggleLabel = computed(() => {
    const count = this.list().activeCount();
    if (!count) {
      return 'Filtros';
    }
    return `Filtros, ${count} ${count === 1 ? 'ativo' : 'ativos'}`;
  });

  private readonly injector = inject(Injector);

  @ViewChild('sheet') private sheet?: ElementRef<HTMLElement>;
  @ViewChild('toggleButton') private toggleButton?: ElementRef<HTMLButtonElement>;

  ngOnDestroy(): void {
    if (this.open()) {
      this.list().discardDraft();
    }
    document.body.classList.remove(OVERLAY_OPEN_CLASS);
  }

  protected openSheet(): void {
    this.list().beginDraft();
    this.open.set(true);
    document.body.classList.add(OVERLAY_OPEN_CLASS);
    afterNextRender(() => this.focusables()[0]?.focus(), { injector: this.injector });
  }

  protected applySheet(): void {
    this.close();
    this.list().applyDraft();
  }

  protected dismiss(): void {
    this.close();
    this.list().discardDraft();
  }

  private close(): void {
    this.open.set(false);
    document.body.classList.remove(OVERLAY_OPEN_CLASS);
    this.toggleButton?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.dismiss();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  protected onTab(event: Event): void {
    if (!this.open()) {
      return;
    }

    const focusables = this.focusables();
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = !!active && !!this.sheet?.nativeElement.contains(active);

    if ((event as KeyboardEvent).shiftKey) {
      if (!inside || active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (!inside || active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    const host = this.sheet?.nativeElement;
    return host ? Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
  }
}
