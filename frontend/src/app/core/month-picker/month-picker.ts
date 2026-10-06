import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { YearMonth, currentMonth, monthLabel, monthName } from '../formatters';

const VIEWPORT_MARGIN = 8;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

let pickerSequence = 0;

// Seletor de mês e ano, sem dias: o ano fica no cabeçalho e anda sem limite para os dois lados.
// Escolher um mês emite uma única vez e fecha; a tela decide o que fazer com ele.
@Component({
  selector: 'app-month-picker',
  templateUrl: './month-picker.html',
  host: { class: 'month-picker' },
})
export class MonthPicker {
  readonly value = input<YearMonth | null>(null);
  readonly label = input.required<string>();
  // Texto do campo sem mês escolhido (Lançamentos: "Todo o período").
  readonly placeholder = input('');

  readonly valueChange = output<YearMonth>();

  protected readonly months = MONTHS;
  protected readonly open = signal(false);
  protected readonly viewYear = signal(currentMonth().year);
  protected readonly offset = signal(0);
  protected readonly panelId = `month-picker-${++pickerSequence}`;

  protected readonly text = computed(() => {
    const value = this.value();
    return value ? monthLabel(value.year, value.month) : '';
  });

  protected readonly triggerLabel = computed(
    () => `${this.label()}: ${this.text() || this.placeholder() || 'nenhum mês selecionado'}`,
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }

    this.viewYear.set((this.value() ?? currentMonth()).year);
    this.offset.set(0);
    this.open.set(true);
    afterNextRender(
      () => {
        this.keepInsideViewport();
        const panel = this.panel?.nativeElement;
        const target =
          panel?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
          panel?.querySelector<HTMLElement>('.month-picker-month');
        target?.focus();
      },
      { injector: this.injector },
    );
  }

  protected shiftYear(delta: number): void {
    this.viewYear.update((year) => year + delta);
  }

  protected choose(month: number): void {
    this.open.set(false);
    this.trigger?.nativeElement.focus();
    this.valueChange.emit({ year: this.viewYear(), month });
  }

  protected isSelected(month: number): boolean {
    const value = this.value();
    return !!value && value.year === this.viewYear() && value.month === month;
  }

  protected shortName(month: number): string {
    const label = monthName(month).replace('.', '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  protected fullName(month: number): string {
    return monthLabel(this.viewYear(), month);
  }

  // O painel de filtros do celular também fecha com Esc (escuta no document): aqui o Esc fecha só o
  // seletor e para de propagar, para não descartar junto o rascunho dos filtros.
  @HostListener('keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    if (!this.open()) {
      return;
    }

    event.stopPropagation();
    this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  private close(): void {
    this.open.set(false);
    this.trigger?.nativeElement.focus();
  }

  // Aberto como sobreposição, o painel parte da borda esquerda do campo; se isso o levaria para fora
  // da tela (campo perto da borda direita), ele é puxado para dentro. No painel de filtros do celular
  // ele fica no fluxo, com a largura do campo, e o deslocamento é zero.
  private keepInsideViewport(): void {
    const panel = this.panel?.nativeElement;
    const width = document.documentElement.clientWidth;
    if (!panel || !width) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const limit = width - VIEWPORT_MARGIN;
    let shift = 0;

    if (rect.right > limit) {
      shift = limit - rect.right;
    }
    if (rect.left + shift < VIEWPORT_MARGIN) {
      shift = VIEWPORT_MARGIN - rect.left;
    }

    this.offset.set(Math.round(shift));
  }
}
