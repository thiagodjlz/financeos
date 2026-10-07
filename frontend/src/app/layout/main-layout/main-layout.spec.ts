import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE, PermissionEntry, Screen } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { MainLayout } from './main-layout';

@Component({ template: '' })
class BlankPage {}

function viewPermission(screen: Screen): PermissionEntry {
  return { screen, canView: true, canCreate: false, canEdit: false, canDelete: false };
}

function root(fixture: ComponentFixture<MainLayout>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function navButtons(fixture: ComponentFixture<MainLayout>): HTMLButtonElement[] {
  return Array.from(root(fixture).querySelectorAll<HTMLButtonElement>('.nav-list button'));
}

function navLabels(fixture: ComponentFixture<MainLayout>): string[] {
  return navButtons(fixture).map((button) => button.textContent?.trim() ?? '');
}

function sectionTitles(fixture: ComponentFixture<MainLayout>): string[] {
  return Array.from(root(fixture).querySelectorAll('.nav-section-title')).map(
    (title) => title.textContent?.trim() ?? '',
  );
}

function findNav(fixture: ComponentFixture<MainLayout>, label: string): HTMLButtonElement | undefined {
  return navButtons(fixture).find((button) => button.textContent?.trim() === label);
}

function bottomItems(fixture: ComponentFixture<MainLayout>): string[] {
  return Array.from(root(fixture).querySelectorAll<HTMLButtonElement>('.bottom-bar .bottom-item')).map(
    (button) => button.textContent?.trim() ?? '',
  );
}

function bottomItem(fixture: ComponentFixture<MainLayout>, label: string): HTMLButtonElement {
  return Array.from(root(fixture).querySelectorAll<HTMLButtonElement>('.bottom-bar .bottom-item')).find(
    (button) => button.textContent?.trim() === label,
  ) as HTMLButtonElement;
}

function fab(fixture: ComponentFixture<MainLayout>): HTMLButtonElement | null {
  return root(fixture).querySelector<HTMLButtonElement>('.bottom-fab');
}

function sheet(fixture: ComponentFixture<MainLayout>, id: 'more'): HTMLElement | null {
  return root(fixture).querySelector<HTMLElement>(`#sheet-${id}`);
}

function sheetItems(fixture: ComponentFixture<MainLayout>, id: 'more'): string[] {
  return Array.from(sheet(fixture, id)?.querySelectorAll('.sheet-item') ?? []).map(
    (item) => item.textContent?.trim() ?? '',
  );
}

function sheetSectionTitles(fixture: ComponentFixture<MainLayout>): string[] {
  return Array.from(sheet(fixture, 'more')?.querySelectorAll('.sheet-section-title') ?? []).map(
    (title) => title.textContent?.trim() ?? '',
  );
}

function scrim(fixture: ComponentFixture<MainLayout>): HTMLElement | null {
  return root(fixture).querySelector('.nav-scrim');
}

function collapseToggle(fixture: ComponentFixture<MainLayout>): HTMLButtonElement {
  return root(fixture).querySelector('.collapse-toggle') as HTMLButtonElement;
}

function pressKey(key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

describe('MainLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: BlankPage }]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.classList.remove('overlay-open');
  });

  function createFixture(): ComponentFixture<MainLayout> {
    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
    return fixture;
  }

  function withPermissions(...screens: Screen[]): void {
    TestBed.inject(AuthService).permissions.set(screens.map(viewPermission));
  }

  function asSuperAdmin(): void {
    TestBed.inject(AuthService).superAdmin.set(true);
  }

  describe('menu lateral', () => {
    it('mostra a marca e todos os itens em seções, sem acordeão, para quem pode tudo', () => {
      asSuperAdmin();
      const fixture = createFixture();

      expect(root(fixture).querySelector('.brand-text strong')?.textContent?.trim()).toBe('FinanceOS');
      expect(root(fixture).querySelector('h1')).toBeNull();
      expect(navLabels(fixture)).toEqual([
        'Resumo',
        'Lançamentos',
        'Categorias',
        'Usuários',
        'Perfis',
        'Auditoria',
        'Documentação',
        'Novidades por versão',
      ]);
      expect(sectionTitles(fixture)).toEqual(['Cadastros', 'Configurações', 'Sobre']);
      for (const button of navButtons(fixture)) {
        expect(button.querySelector('svg')).not.toBeNull();
      }
    });

    it('não mostra item nem seção sem permissão de ver', () => {
      const fixture = createFixture();

      expect(navButtons(fixture)).toHaveLength(0);
      expect(sectionTitles(fixture)).toEqual([]);
    });

    it('mostra a seção Cadastros só com permissão de ver Categorias', () => {
      withPermissions('CATEGORIES');
      const fixture = createFixture();

      expect(sectionTitles(fixture)).toEqual(['Cadastros']);
      expect(navLabels(fixture)).toEqual(['Categorias']);
    });

    it('esconde a seção Cadastros sem permissão de ver Categorias', () => {
      withPermissions('DASHBOARD', 'USERS');
      const fixture = createFixture();

      expect(sectionTitles(fixture)).toEqual(['Configurações']);
      expect(findNav(fixture, 'Categorias')).toBeUndefined();
    });

    it('mostra Configurações com só Usuários, sem o item Perfis', () => {
      withPermissions('USERS');
      const fixture = createFixture();

      expect(sectionTitles(fixture)).toEqual(['Configurações']);
      expect(navLabels(fixture)).toEqual(['Usuários']);
    });

    it('mostra Configurações com só Perfis, sem o item Usuários', () => {
      withPermissions('PROFILES');
      const fixture = createFixture();

      expect(sectionTitles(fixture)).toEqual(['Configurações']);
      expect(navLabels(fixture)).toEqual(['Perfis']);
    });

    it('mostra Configurações com só Auditoria, logo o item Auditoria e nenhum outro', () => {
      withPermissions('AUDIT');
      const fixture = createFixture();

      expect(sectionTitles(fixture)).toEqual(['Configurações']);
      expect(navLabels(fixture)).toEqual(['Auditoria']);
      expect(sheetItems(fixture, 'more')).toEqual(['Auditoria', 'Sair']);
    });

    it('esconde Auditoria no menu e no painel Mais sem permissão de ver Auditoria', () => {
      withPermissions('USERS', 'PROFILES');
      const fixture = createFixture();

      expect(navLabels(fixture)).toEqual(['Usuários', 'Perfis']);
      expect(sheetItems(fixture, 'more')).not.toContain('Auditoria');
    });

    it('sai pelo Sair do rodapé registrando o logout antes de descartar o token', async () => {
      const authService = TestBed.inject(AuthService);
      authService.token.set('token-ativo');
      const fixture = createFixture();
      const httpMock = TestBed.inject(HttpTestingController);

      (root(fixture).querySelector('.sidebar-footer button[aria-label="Sair"]') as HTMLButtonElement).click();
      const request = httpMock.expectOne(`${API_BASE}/auth/logout`);
      expect(request.request.method).toBe('POST');
      expect(authService.token()).toBe('token-ativo');

      request.flush(null, { status: 204, statusText: 'No Content' });
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();

      expect(authService.token()).toBeNull();
      expect(TestBed.inject(Router).url).toBe('/login');
    });

    it('mostra Sobre só com Novidades por versão, sem Documentação', () => {
      withPermissions('RELEASE_NOTES');
      const fixture = createFixture();

      expect(sectionTitles(fixture)).toEqual(['Sobre']);
      expect(navLabels(fixture)).toEqual(['Novidades por versão']);
    });

    it('esconde Sobre, Documentação e Novidades sem as permissões', () => {
      withPermissions('DASHBOARD');
      const fixture = createFixture();

      const nav = root(fixture).querySelector('.nav-list') as HTMLElement;
      expect(nav.textContent).not.toContain('Sobre');
      expect(nav.textContent).not.toContain('Documentação');
      expect(nav.textContent).not.toContain('Novidades por versão');
    });

    it('recolhe em trilho e expande de volta pelo botão do menu, com rótulo acessível nos itens', () => {
      asSuperAdmin();
      const fixture = createFixture();
      const toggle = collapseToggle(fixture);

      expect(toggle.getAttribute('aria-label')).toBe('Recolher menu');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(root(fixture).querySelector('.app-shell.menu-collapsed')).toBeNull();
      expect(findNav(fixture, 'Resumo')?.getAttribute('aria-label')).toBeNull();

      toggle.click();
      fixture.detectChanges();

      expect(root(fixture).querySelector('.app-shell.menu-collapsed')).not.toBeNull();
      expect(toggle.getAttribute('aria-label')).toBe('Expandir menu');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      for (const button of navButtons(fixture)) {
        expect(button.getAttribute('aria-label')).toBe(button.textContent?.trim());
        expect(button.getAttribute('title')).toBe(button.textContent?.trim());
      }

      toggle.click();
      fixture.detectChanges();

      expect(root(fixture).querySelector('.app-shell.menu-collapsed')).toBeNull();
    });

    it('mostra iniciais, nome, versão e Sair no rodapé', () => {
      const authService = TestBed.inject(AuthService);
      authService.superAdmin.set(true);
      authService.me.set({ name: 'Ana Souza', email: 'ana@financeos.local', superAdmin: true, permissions: [] });
      const fixture = createFixture();

      const footer = root(fixture).querySelector('.sidebar-footer') as HTMLElement;
      expect(footer.querySelector('.avatar')?.textContent?.trim()).toBe('AS');
      expect(footer.querySelector('.current-user')?.textContent?.trim()).toBe('Ana Souza');
      expect(footer.querySelector('.app-version')?.textContent).toContain('FinanceOS');
      expect(footer.querySelector('button[aria-label="Sair"]')).not.toBeNull();
    });

    it('move o foco para o conteúdo ao navegar por um item do menu', async () => {
      asSuperAdmin();
      const fixture = createFixture();

      findNav(fixture, 'Categorias')?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const workspace = root(fixture).querySelector('.workspace') as HTMLElement;
      expect(document.activeElement).toBe(workspace);
      expect(TestBed.inject(Router).url).toBe('/categories');
    });
  });

  describe('barra inferior no celular', () => {
    it('tem Resumo, Lançamentos, + e Mais para quem pode tudo, sem Cadastros', () => {
      asSuperAdmin();
      const fixture = createFixture();

      expect(bottomItems(fixture)).toEqual(['Resumo', 'Lançamentos', 'Mais']);
      expect(fab(fixture)?.getAttribute('aria-label')).toBe('Novo lançamento');
      expect(root(fixture).querySelector('#sheet-registers')).toBeNull();
    });

    it('mostra Categorias no painel Mais, na seção Cadastros antes das demais', () => {
      asSuperAdmin();
      const fixture = createFixture();

      expect(sheetSectionTitles(fixture)).toEqual(['Cadastros', 'Configurações', 'Sobre']);
      expect(sheetItems(fixture, 'more')).toEqual([
        'Categorias',
        'Usuários',
        'Perfis',
        'Auditoria',
        'Documentação',
        'Novidades por versão',
        'Sair',
      ]);
    });

    it('mostra Categorias no painel Mais só com permissão de ver Categorias', () => {
      withPermissions('CATEGORIES');
      const fixture = createFixture();

      expect(bottomItems(fixture)).toEqual(['Mais']);
      expect(sheetSectionTitles(fixture)).toEqual(['Cadastros']);
      expect(sheetItems(fixture, 'more')).toEqual(['Categorias', 'Sair']);
    });

    it('esconde Categorias e a seção Cadastros do painel Mais sem permissão de ver Categorias', () => {
      withPermissions('DASHBOARD', 'TRANSACTIONS', 'USERS', 'PROFILES', 'DOCUMENTATION', 'RELEASE_NOTES');
      const fixture = createFixture();

      expect(sheetSectionTitles(fixture)).toEqual(['Configurações', 'Sobre']);
      expect(sheetItems(fixture, 'more')).not.toContain('Categorias');
    });

    it('esconde o + sem permissão de incluir lançamento', () => {
      withPermissions('TRANSACTIONS');
      const fixture = createFixture();

      expect(bottomItems(fixture)).toEqual(['Lançamentos', 'Mais']);
      expect(fab(fixture)).toBeNull();
    });

    it('mostra o + com permissão de incluir lançamento e ele leva ao cadastro', async () => {
      TestBed.inject(AuthService).permissions.set([
        { screen: 'TRANSACTIONS', canView: true, canCreate: true, canEdit: false, canDelete: false },
      ]);
      const fixture = createFixture();

      fab(fixture)?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/transactions/new');
    });

    it('mantém Mais sempre visível, com Sair, mesmo sem nenhuma permissão', () => {
      const fixture = createFixture();

      expect(bottomItems(fixture)).toEqual(['Mais']);
      expect(sheetSectionTitles(fixture)).toEqual([]);
      expect(sheetItems(fixture, 'more')).toEqual(['Sair']);
    });

    it.each([
      ['/dashboard', 'Resumo'],
      ['/transactions', 'Lançamentos'],
      ['/categories', 'Mais'],
      ['/users', 'Mais'],
      ['/profiles', 'Mais'],
      ['/audit', 'Mais'],
      ['/documentation', 'Mais'],
      ['/release-notes', 'Mais'],
    ])('destaca só o item da barra do grupo de %s', async (url, active) => {
      asSuperAdmin();
      const fixture = createFixture();

      await TestBed.inject(Router).navigateByUrl(url);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const highlighted = Array.from(root(fixture).querySelectorAll('.bottom-bar .bottom-item.active')).map(
        (item) => item.textContent?.trim(),
      );
      expect(highlighted).toEqual([active]);
    });

    it.each([
      '/transactions/new',
      '/transactions/7/edit',
      '/categories/new',
      '/categories/3/edit',
      '/users/new',
      '/users/5/edit',
      '/profiles/new',
      '/profiles/2/edit',
    ])('não renderiza a barra inferior no cadastro %s, onde o Salvar fica fixo no rodapé', async (url) => {
      asSuperAdmin();
      const fixture = createFixture();

      await TestBed.inject(Router).navigateByUrl(url);
      fixture.detectChanges();

      expect(root(fixture).querySelector('.bottom-bar')).toBeNull();
      expect(fab(fixture)).toBeNull();
      expect(root(fixture).querySelector('.app-shell')?.classList.contains('form-route')).toBe(true);
    });

    it.each(['/dashboard', '/transactions', '/categories', '/users', '/profiles', '/audit', '/documentation', '/release-notes'])(
      'mantém a barra inferior em %s',
      async (url) => {
        asSuperAdmin();
        const fixture = createFixture();

        await TestBed.inject(Router).navigateByUrl(url);
        fixture.detectChanges();

        expect(root(fixture).querySelector('.bottom-bar')).not.toBeNull();
        expect(bottomItems(fixture)).toEqual(['Resumo', 'Lançamentos', 'Mais']);
        expect(root(fixture).querySelector('.app-shell')?.classList.contains('form-route')).toBe(false);
      },
    );

    it('volta a mostrar a barra inferior ao sair do cadastro para a listagem', async () => {
      asSuperAdmin();
      const fixture = createFixture();
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/transactions/new');
      fixture.detectChanges();
      expect(root(fixture).querySelector('.bottom-bar')).toBeNull();

      await router.navigateByUrl('/transactions');
      fixture.detectChanges();
      expect(root(fixture).querySelector('.bottom-bar')).not.toBeNull();
    });

    it('abre o painel Mais com os itens permitidos, trava a rolagem e foca o primeiro controle', async () => {
      withPermissions('USERS', 'DOCUMENTATION');
      const fixture = createFixture();
      const more = bottomItem(fixture, 'Mais');

      expect(sheet(fixture, 'more')?.classList.contains('open')).toBe(false);
      expect(sheet(fixture, 'more')?.getAttribute('aria-hidden')).toBe('true');

      more.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const panel = sheet(fixture, 'more') as HTMLElement;
      expect(panel.classList.contains('open')).toBe(true);
      expect(panel.getAttribute('aria-hidden')).toBeNull();
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(more.getAttribute('aria-expanded')).toBe('true');
      expect(scrim(fixture)).not.toBeNull();
      expect(document.body.classList.contains('overlay-open')).toBe(true);
      expect(sheetItems(fixture, 'more')).toEqual(['Usuários', 'Documentação', 'Sair']);
      expect(panel.contains(document.activeElement)).toBe(true);
    });

    it('abre o painel Mais e navega para Categorias por ele', async () => {
      withPermissions('CATEGORIES');
      const fixture = createFixture();

      bottomItem(fixture, 'Mais').click();
      fixture.detectChanges();
      expect(sheet(fixture, 'more')?.classList.contains('open')).toBe(true);

      (sheet(fixture, 'more')?.querySelector('.sheet-item') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/categories');
      expect(sheet(fixture, 'more')?.classList.contains('open')).toBe(false);
    });

    it('fecha no Esc e devolve o foco ao botão que abriu', () => {
      asSuperAdmin();
      const fixture = createFixture();
      const more = bottomItem(fixture, 'Mais');

      more.focus();
      more.click();
      fixture.detectChanges();

      pressKey('Escape');
      fixture.detectChanges();

      expect(sheet(fixture, 'more')?.classList.contains('open')).toBe(false);
      expect(scrim(fixture)).toBeNull();
      expect(more.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(more);
      expect(document.body.classList.contains('overlay-open')).toBe(false);
    });

    it('fecha pelo scrim', () => {
      asSuperAdmin();
      const fixture = createFixture();

      bottomItem(fixture, 'Mais').click();
      fixture.detectChanges();
      scrim(fixture)?.click();
      fixture.detectChanges();

      expect(sheet(fixture, 'more')?.classList.contains('open')).toBe(false);
      expect(document.body.classList.contains('overlay-open')).toBe(false);
    });

    it('retém o Tab dentro do painel aberto', () => {
      asSuperAdmin();
      const fixture = createFixture();

      bottomItem(fixture, 'Mais').click();
      fixture.detectChanges();

      const panel = sheet(fixture, 'more') as HTMLElement;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>('button'));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      last.focus();
      pressKey('Tab');
      expect(document.activeElement).toBe(first);

      first.focus();
      pressKey('Tab', true);
      expect(document.activeElement).toBe(last);

      (root(fixture).querySelector('.workspace') as HTMLElement).focus();
      pressKey('Tab');
      expect(panel.contains(document.activeElement)).toBe(true);
    });

    it('não retém o foco nem trava a rolagem com os painéis fechados', () => {
      asSuperAdmin();
      const fixture = createFixture();
      const workspace = root(fixture).querySelector('.workspace') as HTMLElement;

      workspace.focus();
      pressKey('Tab');

      expect(document.activeElement).toBe(workspace);
      expect(document.body.classList.contains('overlay-open')).toBe(false);
    });

    it('fecha o painel e foca o conteúdo ao navegar por um item dele', async () => {
      asSuperAdmin();
      const fixture = createFixture();

      bottomItem(fixture, 'Mais').click();
      fixture.detectChanges();
      (sheet(fixture, 'more')?.querySelector('.sheet-item') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(sheet(fixture, 'more')?.classList.contains('open')).toBe(false);
      expect(document.body.classList.contains('overlay-open')).toBe(false);
      expect(document.activeElement).toBe(root(fixture).querySelector('.workspace'));
      expect(TestBed.inject(Router).url).toBe('/categories');
    });

    it('sai pelo item Sair do painel Mais, registrando o logout antes de descartar o token', async () => {
      asSuperAdmin();
      const fixture = createFixture();
      const authService = TestBed.inject(AuthService);
      authService.token.set('token-ativo');
      const logout = vi.spyOn(authService, 'logout');
      const httpMock = TestBed.inject(HttpTestingController);

      bottomItem(fixture, 'Mais').click();
      fixture.detectChanges();
      (sheet(fixture, 'more')?.querySelector('.sheet-logout') as HTMLButtonElement).click();
      fixture.detectChanges();

      const request = httpMock.expectOne(`${API_BASE}/auth/logout`);
      expect(logout).not.toHaveBeenCalled();
      request.flush(null, { status: 204, statusText: 'No Content' });
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();

      expect(logout).toHaveBeenCalled();
      expect(TestBed.inject(Router).url).toBe('/login');
      expect(document.body.classList.contains('overlay-open')).toBe(false);
    });
  });

  it('não monta botão flutuante de rolagem nem registra listener de scroll ao navegar entre telas', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    asSuperAdmin();
    const fixture = createFixture();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/transactions');
    fixture.detectChanges();
    await router.navigateByUrl('/documentation');
    fixture.detectChanges();

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(root(fixture).querySelectorAll('button[title*="topo" i], button[aria-label*="topo" i]')).toHaveLength(0);
    expect(addSpy.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(0);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    addSpy.mockRestore();
  });

  describe('registro de acesso às telas', () => {
    function screenAccessRequests(): string[] {
      return TestBed.inject(HttpTestingController)
        .match(`${API_BASE}/audit/screen-access`)
        .map((request) => (request.request.body as { screen: string }).screen);
    }

    it('registra a tela da carga inicial e cada troca de tela do menu', async () => {
      asSuperAdmin();
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/dashboard');
      const fixture = createFixture();

      await router.navigateByUrl('/transactions');
      await router.navigateByUrl('/audit');
      fixture.detectChanges();

      expect(screenAccessRequests()).toEqual(['DASHBOARD', 'TRANSACTIONS', 'AUDIT']);
    });

    it('não registra ao abrir o cadastro da mesma tela, trocar de aba ou paginar', async () => {
      asSuperAdmin();
      const router = TestBed.inject(Router);
      createFixture();

      await router.navigateByUrl('/transactions');
      await router.navigateByUrl('/transactions/7/edit');
      await router.navigateByUrl('/transactions');
      await router.navigateByUrl('/documentation');
      await router.navigateByUrl('/documentation#perfis');
      await router.navigateByUrl('/audit');
      await router.navigateByUrl('/audit?page=2');

      expect(screenAccessRequests()).toEqual(['TRANSACTIONS', 'DOCUMENTATION', 'AUDIT']);
    });
  });
});
