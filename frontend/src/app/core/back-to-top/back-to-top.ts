import { Component, OnDestroy, OnInit, input, signal } from '@angular/core';

export const BACK_TO_TOP_THRESHOLD = 300;

@Component({
  selector: 'app-back-to-top',
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.scss',
})
export class BackToTop implements OnInit, OnDestroy {
  readonly focusTarget = input<HTMLElement | null>(null);

  protected readonly visible = signal(false);

  private readonly onScroll = (): void => {
    this.visible.set(window.scrollY > BACK_TO_TOP_THRESHOLD);
  };

  ngOnInit(): void {
    this.onScroll();
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    // preventScroll: focar sem ele faz o navegador rolar até o alvo e interrompe a rolagem suave.
    this.focusTarget()?.focus({ preventScroll: true });
  }
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
