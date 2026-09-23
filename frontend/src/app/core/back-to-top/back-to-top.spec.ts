import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BACK_TO_TOP_THRESHOLD, BackToTop } from './back-to-top';

@Component({
  imports: [BackToTop],
  template: `
    <section class="workspace" #workspace tabindex="-1"></section>
    <app-back-to-top [focusTarget]="workspace" />
  `,
})
class HostPage {}

function setScrollY(value: number): void {
  Object.defineProperty(window, 'scrollY', { configurable: true, value });
}

function scrollTo(fixture: ComponentFixture<HostPage>, value: number): void {
  setScrollY(value);
  window.dispatchEvent(new Event('scroll'));
  fixture.detectChanges();
}

function button(fixture: ComponentFixture<HostPage>): HTMLButtonElement {
  return (fixture.nativeElement as HTMLElement).querySelector('.back-to-top') as HTMLButtonElement;
}

function expectHidden(fixture: ComponentFixture<HostPage>): void {
  expect(button(fixture).classList.contains('visible')).toBe(false);
  expect(button(fixture).getAttribute('aria-hidden')).toBe('true');
  expect(button(fixture).getAttribute('tabindex')).toBe('-1');
}

function expectVisible(fixture: ComponentFixture<HostPage>): void {
  expect(button(fixture).classList.contains('visible')).toBe(true);
  expect(button(fixture).hasAttribute('aria-hidden')).toBe(false);
  expect(button(fixture).hasAttribute('tabindex')).toBe(false);
}

describe('BackToTop', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(async () => {
    setScrollY(0);
    await TestBed.configureTestingModule({ imports: [HostPage] }).compileComponents();
  });

  afterEach(() => {
    delete (window as { scrollY?: number }).scrollY;
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  function createFixture(): ComponentFixture<HostPage> {
    const fixture = TestBed.createComponent(HostPage);
    fixture.detectChanges();
    return fixture;
  }

  it('fica oculto e fora da ordem de Tab no topo da página', () => {
    const fixture = createFixture();

    expectHidden(fixture);
  });

  it('usa 300px como limite: oculto em 300 e visível em 301', () => {
    const fixture = createFixture();
    expect(BACK_TO_TOP_THRESHOLD).toBe(300);

    scrollTo(fixture, 300);
    expectHidden(fixture);

    scrollTo(fixture, 301);
    expectVisible(fixture);

    scrollTo(fixture, 300);
    expectHidden(fixture);
  });

  it('já aparece visível se a página abrir rolada além do limite', () => {
    setScrollY(800);
    const fixture = createFixture();

    expectVisible(fixture);
  });

  it('é um botão acessível com rótulo e dica "Voltar ao topo"', () => {
    const fixture = createFixture();
    const element = button(fixture);

    expect(element.tagName).toBe('BUTTON');
    expect(element.getAttribute('type')).toBe('button');
    expect(element.getAttribute('aria-label')).toBe('Voltar ao topo');
    expect(element.getAttribute('title')).toBe('Voltar ao topo');
    const svg = element.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('rola suavemente até o topo ao clicar e volta a ocultar ao chegar lá', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const fixture = createFixture();
    scrollTo(fixture, 1200);

    button(fixture).click();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    scrollTo(fixture, 0);
    expectHidden(fixture);
  });

  it('rola sem animação quando o usuário prefere movimento reduzido', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
    })) as unknown as typeof window.matchMedia;
    const fixture = createFixture();
    scrollTo(fixture, 1200);

    button(fixture).click();

    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('move o foco para a área de conteúdo depois do clique', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const fixture = createFixture();
    const workspace = (fixture.nativeElement as HTMLElement).querySelector('.workspace') as HTMLElement;
    const focusSpy = vi.spyOn(workspace, 'focus');
    scrollTo(fixture, 1200);

    button(fixture).focus();
    button(fixture).click();

    expect(document.activeElement).toBe(workspace);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('registra um único listener de scroll passivo e o remove ao ser destruído', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const fixture = createFixture();

    const scrollAdds = addSpy.mock.calls.filter(([type]) => type === 'scroll');
    expect(scrollAdds).toHaveLength(1);
    expect(scrollAdds[0][2]).toEqual({ passive: true });

    fixture.destroy();

    const scrollRemoves = removeSpy.mock.calls.filter(([type]) => type === 'scroll');
    expect(scrollRemoves).toHaveLength(1);
    expect(scrollRemoves[0][1]).toBe(scrollAdds[0][1]);
  });
});
