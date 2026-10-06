import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';

const OVERLAY_OPEN_CLASS = 'overlay-open';
const FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])';

let detailSequence = 0;

// Detalhe de um registro das listagens (Lançamentos, Categorias, Usuários, Perfis — issue #109):
// painel inferior até 680px e janela centralizada acima (o CSS global decide). A tela projeta o
// ícone (`[detailIcon]`) e as linhas `<div><dt/><dd/></div>` da lista; o componente só mostra e
// avisa. Quem edita, exclui e confirma é a listagem. Enquanto uma confirmação está aberta por cima
// (`suspended`), Esc e Tab ficam com ela.
@Component({
  selector: 'app-record-detail',
  templateUrl: './record-detail.html',
})
export class RecordDetail implements OnInit, OnDestroy {
  readonly heading = input.required<string>();
  // Valor em destaque abaixo do título (Lançamentos: o valor com sinal).
  readonly amount = input('');
  readonly amountIncome = input(false);
  readonly editLabel = input('');
  readonly removeLabel = input('');
  readonly removeIcon = input<'trash' | 'block'>('trash');
  readonly canEdit = input(false);
  readonly canRemove = input(false);
  readonly busy = input(false);
  readonly suspended = input(false);

  readonly close = output<void>();
  readonly edit = output<void>();
  readonly remove = output<void>();

  protected readonly titleId = `record-detail-title-${++detailSequence}`;

  private readonly injector = inject(Injector);
  private readonly opener = document.activeElement as HTMLElement | null;

  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    document.body.classList.add(OVERLAY_OPEN_CLASS);
    afterNextRender(() => this.focusables()[0]?.focus(), { injector: this.injector });
  }

  ngOnDestroy(): void {
    document.body.classList.remove(OVERLAY_OPEN_CLASS);
    if (this.opener?.isConnected) {
      this.opener.focus();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.suspended()) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  protected onTab(event: Event): void {
    if (this.suspended()) {
      return;
    }

    const focusables = this.focusables();
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = !!active && !!this.panel?.nativeElement.contains(active);

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
    const host = this.panel?.nativeElement;
    return host ? Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
  }
}
