import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  input,
  output,
} from '@angular/core';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])';

let dialogSequence = 0;

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog implements AfterViewInit, OnDestroy {
  readonly message = input.required<string>();
  readonly confirmLabel = input('Sair sem salvar');
  readonly cancelLabel = input('Continuar editando');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  protected readonly messageId = `confirm-dialog-message-${++dialogSequence}`;

  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  private readonly opener = document.activeElement as HTMLElement | null;

  ngAfterViewInit(): void {
    this.focusables()[0]?.focus();
  }

  ngOnDestroy(): void {
    this.opener?.focus();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancel.emit();
  }

  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  protected onTab(event: Event): void {
    const focusables = this.focusables();
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = !!active && !!this.dialog?.nativeElement.contains(active);

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

  protected onBackdrop(): void {
    this.cancel.emit();
  }

  protected onConfirm(): void {
    this.confirm.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }

  private focusables(): HTMLElement[] {
    const host = this.dialog?.nativeElement;
    if (!host) {
      return [];
    }

    return Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }
}
