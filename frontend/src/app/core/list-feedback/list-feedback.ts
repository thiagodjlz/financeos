import { Component, input, output } from '@angular/core';

const SKELETON_ROWS = [0, 1, 2];

// Um único estado por vez, depois da resposta: carga (esqueleto), erro de carga, "nada encontrado"
// com filtro ou o vazio da tela (projetado). O .empty-state nunca aparece durante a carga nem no
// lugar do erro. "Tentar novamente" só aparece onde a tela pede (`retryable`).
@Component({
  selector: 'app-list-feedback',
  templateUrl: './list-feedback.html',
})
export class ListFeedback {
  readonly loading = input.required<boolean>();
  readonly error = input<string | null>(null);
  readonly empty = input.required<boolean>();
  readonly filtered = input(false);
  readonly canClear = input(false);
  readonly retryable = input(false);

  readonly clear = output<void>();
  readonly retry = output<void>();

  protected readonly skeletonRows = SKELETON_ROWS;
}
