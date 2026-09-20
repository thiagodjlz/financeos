import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  imports: [ConfirmDialog],
  template: `
    <button type="button" class="opener" (click)="open.set(true)">Abrir</button>
    @if (open()) {
      <app-confirm-dialog
        message="Deseja sair sem salvar?"
        cancelLabel="Continuar editando"
        confirmLabel="Sair sem salvar"
        (cancel)="onCancel()"
        (confirm)="onConfirm()"
      />
    }
  `,
})
class HostPage {
  readonly open = signal(false);
  confirmed = 0;
  canceled = 0;

  onConfirm(): void {
    this.confirmed++;
    this.open.set(false);
  }

  onCancel(): void {
    this.canceled++;
    this.open.set(false);
  }
}

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<HostPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HostPage);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function opener(): HTMLButtonElement {
    return host().querySelector('.opener') as HTMLButtonElement;
  }

  function card(): HTMLElement | null {
    return host().querySelector('.modal-card');
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(host().querySelectorAll<HTMLButtonElement>('.modal-actions button'));
  }

  function openDialog(): void {
    opener().focus();
    opener().click();
    fixture.detectChanges();
  }

  function pressKey(key: string, shiftKey = false): void {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
    );
  }

  it('anuncia o papel de diálogo e rotula pela própria pergunta', () => {
    openDialog();

    const dialog = card() as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(host().querySelector(`#${labelledBy}`)?.textContent?.trim()).toBe(
      'Deseja sair sem salvar?',
    );
  });

  it('usa os rótulos que nomeiam a ação, em vez de Não e Sim', () => {
    openDialog();

    expect(buttons().map((button) => button.textContent?.trim())).toEqual([
      'Continuar editando',
      'Sair sem salvar',
    ]);
    expect(buttons()[0].classList.contains('ghost-button')).toBe(true);
    expect(buttons()[1].classList.contains('primary-button')).toBe(true);
  });

  it('move o foco para o primeiro botão ao abrir e devolve ao elemento que abriu ao fechar', () => {
    openDialog();

    expect(document.activeElement).toBe(buttons()[0]);

    buttons()[1].click();
    fixture.detectChanges();

    expect(card()).toBeNull();
    expect(document.activeElement).toBe(opener());
  });

  it('trata Esc como continuar editando', () => {
    openDialog();

    pressKey('Escape');
    fixture.detectChanges();

    expect(fixture.componentInstance.canceled).toBe(1);
    expect(fixture.componentInstance.confirmed).toBe(0);
    expect(card()).toBeNull();
  });

  it('retém o Tab dentro do diálogo enquanto ele está aberto', () => {
    openDialog();

    const [cancelButton, confirmButton] = buttons();

    confirmButton.focus();
    pressKey('Tab');
    expect(document.activeElement).toBe(cancelButton);

    cancelButton.focus();
    pressKey('Tab', true);
    expect(document.activeElement).toBe(confirmButton);

    opener().focus();
    pressKey('Tab');
    expect(document.activeElement).toBe(cancelButton);
  });

  it('fecha no clique do backdrop sem disparar nenhuma requisição HTTP', () => {
    openDialog();

    (host().querySelector('.modal-backdrop') as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.canceled).toBe(1);
    expect(fixture.componentInstance.confirmed).toBe(0);
    expect(card()).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('não fecha ao clicar dentro do cartão', () => {
    openDialog();

    (card() as HTMLElement).click();
    fixture.detectChanges();

    expect(card()).not.toBeNull();
    expect(fixture.componentInstance.canceled).toBe(0);
    httpMock.expectNone(() => true);
  });
});
