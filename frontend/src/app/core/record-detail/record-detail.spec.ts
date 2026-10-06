import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordDetail } from './record-detail';

@Component({
  imports: [RecordDetail],
  template: `
    <button type="button" class="opener">Abrir</button>
    @if (open()) {
      <app-record-detail
        [heading]="heading()"
        [amount]="amount()"
        editLabel="Editar categoria"
        removeLabel="Excluir categoria"
        [canEdit]="canEdit()"
        [canRemove]="canRemove()"
        [busy]="busy()"
        [suspended]="suspended()"
        (close)="events.push('close'); open.set(false)"
        (edit)="events.push('edit')"
        (remove)="events.push('remove')"
      >
        <span detailIcon class="detail-icon projected-icon" aria-hidden="true"></span>
        <div>
          <dt>Tipo</dt>
          <dd>Despesa</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>Ativo</dd>
        </div>
      </app-record-detail>
    }
  `,
})
class Host {
  readonly open = signal(false);
  readonly heading = signal('Mercado');
  readonly amount = signal('');
  readonly canEdit = signal(true);
  readonly canRemove = signal(true);
  readonly busy = signal(false);
  readonly suspended = signal(false);
  readonly events: string[] = [];
}

describe('RecordDetail', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => document.body.classList.remove('overlay-open'));

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function query<T extends HTMLElement>(selector: string): T | null {
    return element().querySelector<T>(selector);
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from(element().querySelectorAll<HTMLButtonElement>('.detail-panel button')).find(
      (item) => (item.getAttribute('aria-label') ?? item.textContent?.trim()) === label,
    );
  }

  function rows(): string[][] {
    return Array.from(element().querySelectorAll('.detail-list > div')).map((row) => [
      (row.querySelector('dt')?.textContent ?? '').trim(),
      (row.querySelector('dd')?.textContent ?? '').trim(),
    ]);
  }

  async function openFrom(opener: HTMLElement): Promise<void> {
    opener.focus();
    host.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('mostra o título, o ícone e as linhas projetadas pela tela, como diálogo modal', async () => {
    await openFrom(query<HTMLButtonElement>('.opener')!);

    const panel = query('.detail-panel')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(query(`#${panel.getAttribute('aria-labelledby')}`)?.textContent?.trim()).toBe('Mercado');
    expect(query('.detail-head .projected-icon')).not.toBeNull();
    expect(rows()).toEqual([
      ['Tipo', 'Despesa'],
      ['Situação', 'Ativo'],
    ]);
    expect(query('.detail-amount')).toBeNull();
    expect(document.body.classList.contains('overlay-open')).toBe(true);
    expect(document.activeElement).toBe(button('Fechar'));
  });

  it('mostra o valor em destaque só quando a tela o informa', async () => {
    host.amount.set('− R$ 119,90');
    await openFrom(query<HTMLButtonElement>('.opener')!);

    expect(query('.detail-amount')?.textContent?.trim()).toBe('− R$ 119,90');
  });

  it('mostra Editar e Excluir só com as permissões, e só avisa a tela', async () => {
    await openFrom(query<HTMLButtonElement>('.opener')!);

    button('Editar categoria')!.click();
    button('Excluir categoria')!.click();
    expect(host.events).toEqual(['edit', 'remove']);

    host.canEdit.set(false);
    fixture.detectChanges();
    expect(button('Editar categoria')).toBeUndefined();

    host.busy.set(true);
    fixture.detectChanges();
    expect(button('Excluir categoria')!.disabled).toBe(true);

    host.canRemove.set(false);
    fixture.detectChanges();
    expect(button('Excluir categoria')).toBeUndefined();
    expect(query('.detail-actions')).toBeNull();
  });

  it('fecha pelo X, pelo scrim e pelo Esc, devolvendo o foco a quem abriu', async () => {
    const opener = query<HTMLButtonElement>('.opener')!;

    await openFrom(opener);
    button('Fechar')!.click();
    fixture.detectChanges();
    expect(query('.detail-panel')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.classList.contains('overlay-open')).toBe(false);

    await openFrom(opener);
    query<HTMLElement>('.detail-scrim')!.click();
    fixture.detectChanges();

    await openFrom(opener);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.events).toEqual(['close', 'close', 'close']);
    expect(query('.detail-panel')).toBeNull();
  });

  it('retém o Tab dentro do painel', async () => {
    await openFrom(query<HTMLButtonElement>('.opener')!);

    button('Excluir categoria')!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(button('Fechar'));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(button('Excluir categoria'));
  });

  it('com a confirmação aberta por cima (`suspended`), Esc e Tab ficam com ela', async () => {
    await openFrom(query<HTMLButtonElement>('.opener')!);
    host.suspended.set(true);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.events).toEqual([]);
    expect(query('.detail-panel')).not.toBeNull();
  });
});
