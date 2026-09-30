import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YearMonth } from '../formatters';
import { MonthPicker } from './month-picker';

@Component({
  imports: [MonthPicker],
  template: `
    <button type="button" class="outside">Fora</button>
    <app-month-picker label="Data" [value]="value()" (valueChange)="onChange($event)" />
  `,
})
class HostPage {
  readonly value = signal<YearMonth | null>({ year: 2026, month: 3 });
  readonly received: YearMonth[] = [];

  onChange(value: YearMonth): void {
    this.received.push(value);
    this.value.set(value);
  }
}

describe('MonthPicker', () => {
  let fixture: ComponentFixture<HostPage>;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 30, 10, 0, 0));

    await TestBed.configureTestingModule({ imports: [HostPage] }).compileComponents();
    fixture = TestBed.createComponent(HostPage);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function trigger(): HTMLButtonElement {
    return host().querySelector('.month-picker-trigger') as HTMLButtonElement;
  }

  function panel(): HTMLElement | null {
    return host().querySelector('.month-picker-panel');
  }

  function year(): string {
    return (host().querySelector('.month-picker-year') as HTMLElement).textContent!.trim();
  }

  function months(): HTMLButtonElement[] {
    return Array.from(host().querySelectorAll<HTMLButtonElement>('.month-picker-month'));
  }

  function button(label: string): HTMLButtonElement {
    return host().querySelector(`[aria-label="${label}"]`) as HTMLButtonElement;
  }

  function openPanel(): void {
    trigger().click();
    fixture.detectChanges();
  }

  it('mostra o mês escolhido por extenso e fica vazio sem mês', () => {
    expect(trigger().textContent!.trim()).toBe('Março de 2026');
    expect(trigger().getAttribute('aria-label')).toBe('Data: Março de 2026');

    fixture.componentInstance.value.set(null);
    fixture.detectChanges();

    expect(trigger().textContent!.trim()).toBe('');
    expect(trigger().getAttribute('aria-label')).toBe('Data: nenhum mês selecionado');
  });

  it('abre com o ano no cabeçalho e os 12 meses, sem dias', () => {
    expect(panel()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    openPanel();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(year()).toBe('2026');
    expect(months().map((item) => item.textContent!.trim())).toEqual([
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ]);
    expect(months()[2].getAttribute('aria-label')).toBe('Março de 2026');
    expect(months()[2].getAttribute('aria-pressed')).toBe('true');
    expect(months().filter((item) => item.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    expect(panel()!.querySelector('input')).toBeNull();
    expect(document.activeElement).toBe(months()[2]);
  });

  it('abre no ano atual quando não há mês escolhido', () => {
    fixture.componentInstance.value.set(null);
    fixture.detectChanges();

    openPanel();

    expect(year()).toBe('2026');
    expect(months().some((item) => item.getAttribute('aria-pressed') === 'true')).toBe(false);
  });

  it('anda pelos anos sem limite para os dois lados', () => {
    openPanel();

    for (let index = 0; index < 40; index++) {
      button('Ano anterior').click();
    }
    fixture.detectChanges();
    expect(year()).toBe('1986');
    expect(months().some((item) => item.getAttribute('aria-pressed') === 'true')).toBe(false);

    for (let index = 0; index < 80; index++) {
      button('Próximo ano').click();
    }
    fixture.detectChanges();
    expect(year()).toBe('2066');
    expect(button('Ano anterior').disabled).toBe(false);
    expect(button('Próximo ano').disabled).toBe(false);
  });

  it('escolher um mês emite uma vez, fecha e devolve o foco ao campo', () => {
    openPanel();
    button('Ano anterior').click();
    fixture.detectChanges();

    button('Dezembro de 2025').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.received).toEqual([{ year: 2025, month: 12 }]);
    expect(panel()).toBeNull();
    expect(trigger().textContent!.trim()).toBe('Dezembro de 2025');
    expect(document.activeElement).toBe(trigger());
  });

  it('Esc fecha só o seletor, sem chegar ao document', () => {
    const onDocumentEscape = vi.fn();
    document.addEventListener('keydown', onDocumentEscape);
    openPanel();

    months()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(onDocumentEscape).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
    expect(fixture.componentInstance.received).toEqual([]);

    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onDocumentEscape).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', onDocumentEscape);
  });

  it('clique fora fecha sem emitir', () => {
    openPanel();

    (host().querySelector('.outside') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(fixture.componentInstance.received).toEqual([]);
  });

  it('clicar de novo no campo fecha o painel', () => {
    openPanel();
    openPanel();

    expect(panel()).toBeNull();
  });
});
