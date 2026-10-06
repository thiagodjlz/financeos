import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListFeedback } from './list-feedback';

@Component({
  imports: [ListFeedback],
  template: `
    <app-list-feedback
      [loading]="loading()"
      [error]="error()"
      [empty]="empty()"
      [filtered]="filtered()"
      [canClear]="canClear()"
      [retryable]="retryable()"
      (clear)="cleared = cleared + 1"
      (retry)="retried = retried + 1"
    >
      <p class="empty-state">Nenhuma categoria cadastrada</p>
    </app-list-feedback>
  `,
})
class Host {
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly empty = signal(true);
  readonly filtered = signal(false);
  readonly canClear = signal(false);
  readonly retryable = signal(false);
  cleared = 0;
  retried = 0;
}

describe('ListFeedback', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function query(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  it('durante a carga mostra só o esqueleto, com o aviso para leitor de tela', () => {
    expect(query('.loading-state')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.loading-state .skeleton-row')).toHaveLength(3);
    expect(query('.loading-state .skeleton-row')?.getAttribute('aria-hidden')).toBe('true');
    expect(query('.loading-state .sr-only')?.textContent?.trim()).toBe('Carregando...');
    expect(query('.empty-state')).toBeNull();
    expect(query('.load-error')).toBeNull();
  });

  it('na falha de carga mostra a mensagem no lugar do vazio', () => {
    host.loading.set(false);
    host.error.set('Não foi possível carregar as categorias.');
    fixture.detectChanges();

    expect(query('.load-error')?.textContent?.trim()).toBe('Não foi possível carregar as categorias.');
    expect(query('.load-error')?.getAttribute('role')).toBe('alert');
    expect(query('.empty-state')).toBeNull();
    expect(query('.retry-button')).toBeNull();
  });

  it('com `retryable`, a falha oferece "Tentar novamente", que só avisa a tela', () => {
    host.loading.set(false);
    host.error.set('Não foi possível carregar os lançamentos.');
    host.retryable.set(true);
    fixture.detectChanges();

    const retry = query('.retry-button') as HTMLButtonElement;
    expect(retry.textContent?.trim()).toBe('Tentar novamente');
    expect(query('.load-error')?.textContent?.trim()).toBe('Não foi possível carregar os lançamentos.');

    retry.click();
    expect(host.retried).toBe(1);
  });

  it('sem registros e sem filtro mostra o vazio da tela', () => {
    host.loading.set(false);
    fixture.detectChanges();

    expect(query('.empty-state')?.textContent?.trim()).toBe('Nenhuma categoria cadastrada');
  });

  it('com filtro sem resultado mostra "Nenhum registro encontrado." e "Limpar filtros" só se há o que limpar', () => {
    host.loading.set(false);
    host.filtered.set(true);
    fixture.detectChanges();

    expect(query('.filtered-empty p')?.textContent?.trim()).toBe('Nenhum registro encontrado.');
    expect(query('.filtered-empty button')).toBeNull();

    host.canClear.set(true);
    fixture.detectChanges();
    (query('.filtered-empty button') as HTMLButtonElement).click();

    expect(query('.filtered-empty button')?.textContent?.trim()).toBe('Limpar filtros');
    expect(host.cleared).toBe(1);
  });

  it('com registros não mostra estado nenhum', () => {
    host.loading.set(false);
    host.empty.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
