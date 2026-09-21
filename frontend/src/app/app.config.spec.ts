import { ViewportScroller } from '@angular/common';
import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet } from '@angular/router';
import { appConfig } from './app.config';

@Component({ selector: 'app-page-a', template: '<p>A</p>' })
class PageA {}

@Component({ selector: 'app-page-b', template: '<p>B</p>' })
class PageB {}

@Component({ selector: 'app-config-host', imports: [RouterOutlet], template: '<router-outlet />' })
class ConfigHost {}

function fakeViewportScroller() {
  return {
    scrollToPosition: vi.fn(),
    scrollToAnchor: vi.fn(),
    setHistoryScrollRestoration: vi.fn(),
    setOffset: vi.fn(),
    getScrollPosition: vi.fn(() => [0, 640] as [number, number]),
  };
}

describe('appConfig', () => {
  let host: HTMLElement;

  afterEach(() => host?.remove());

  async function bootstrapWithRoutes(): Promise<{
    router: Router;
    scroller: ReturnType<typeof fakeViewportScroller>;
  }> {
    const scroller = fakeViewportScroller();

    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: ViewportScroller, useValue: scroller }],
    });

    const router = TestBed.inject(Router);
    router.resetConfig([
      { path: '', redirectTo: 'pagina-a', pathMatch: 'full' },
      { path: 'pagina-a', component: PageA },
      { path: 'pagina-b', component: PageB },
      { path: '**', redirectTo: 'pagina-a' },
    ]);

    host = document.createElement('div');
    document.body.appendChild(host);
    TestBed.inject(ApplicationRef).bootstrap(ConfigHost, host);

    await settleScroll();
    scroller.scrollToPosition.mockClear();

    return { router, scroller };
  }

  async function settleScroll(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('leva a rolagem de volta ao topo ao trocar de tela', async () => {
    const { router, scroller } = await bootstrapWithRoutes();

    await router.navigate(['/pagina-b']);
    await settleScroll();

    expect(scroller.scrollToPosition).toHaveBeenCalledWith([0, 0]);
  });

  it('mantém a rolagem no topo também ao voltar para a tela anterior', async () => {
    const { router, scroller } = await bootstrapWithRoutes();

    await router.navigate(['/pagina-b']);
    await settleScroll();
    scroller.scrollToPosition.mockClear();

    await router.navigate(['/pagina-a']);
    await settleScroll();

    expect(scroller.scrollToPosition).toHaveBeenCalledWith([0, 0]);
  });
});
