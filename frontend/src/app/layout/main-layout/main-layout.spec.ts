import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PermissionEntry, Screen } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { MainLayout } from './main-layout';

@Component({ template: '' })
class BlankPage {}

function viewPermission(screen: Screen): PermissionEntry {
  return { screen, canView: true, canCreate: false, canEdit: false, canDelete: false };
}

function navButtons(fixture: ComponentFixture<MainLayout>): HTMLButtonElement[] {
  return Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.nav-list button'),
  );
}

function findButton(
  fixture: ComponentFixture<MainLayout>,
  label: string,
): HTMLButtonElement | undefined {
  return navButtons(fixture).find((button) => button.textContent?.trim() === label);
}

function sidebar(fixture: ComponentFixture<MainLayout>): HTMLElement {
  return (fixture.nativeElement as HTMLElement).querySelector('aside.sidebar') as HTMLElement;
}

function menuButton(fixture: ComponentFixture<MainLayout>): HTMLButtonElement {
  return (fixture.nativeElement as HTMLElement).querySelector('.menu-button') as HTMLButtonElement;
}

function scrim(fixture: ComponentFixture<MainLayout>): HTMLElement | null {
  return (fixture.nativeElement as HTMLElement).querySelector('.drawer-scrim');
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

  function createFixture(): ComponentFixture<MainLayout> {
    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
    return fixture;
  }

  it('should render the FinanceOS shell with the nav items the user has access to', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('FinanceOS');
    expect(navButtons(fixture)).toHaveLength(5);
    expect(findButton(fixture, 'Cadastros')).toBeDefined();
    expect(findButton(fixture, 'Configurações')).toBeDefined();
    expect(findButton(fixture, 'Categorias')).toBeUndefined();
    expect(findButton(fixture, 'Usuários')).toBeUndefined();
    expect(findButton(fixture, 'Perfis')).toBeUndefined();
  });

  it('hides nav items the user has no view permission for', () => {
    const fixture = createFixture();

    expect(navButtons(fixture)).toHaveLength(0);
  });

  it('shows the Cadastros group when the user can view categories', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('CATEGORIES')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Cadastros')).toBeDefined();
  });

  it('hides the Cadastros group when the user cannot view categories', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('DASHBOARD'), viewPermission('USERS')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Cadastros')).toBeUndefined();
  });

  it('shows the Configurações group when the user can view only users', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('USERS')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Configurações')).toBeDefined();
  });

  it('shows the Configurações group when the user can view only profiles', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('PROFILES')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Configurações')).toBeDefined();
  });

  it('hides the Configurações group when the user can view neither users nor profiles', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('DASHBOARD')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Configurações')).toBeUndefined();
  });

  it('renders only the permitted children after expanding the Configurações group', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('USERS')]);
    const fixture = createFixture();

    findButton(fixture, 'Configurações')?.click();
    fixture.detectChanges();

    expect(findButton(fixture, 'Usuários')).toBeDefined();
    expect(findButton(fixture, 'Perfis')).toBeUndefined();
  });

  it('renders both children after expanding the Configurações group with both permissions', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('USERS'), viewPermission('PROFILES')]);
    const fixture = createFixture();

    findButton(fixture, 'Configurações')?.click();
    fixture.detectChanges();

    expect(findButton(fixture, 'Usuários')).toBeDefined();
    expect(findButton(fixture, 'Perfis')).toBeDefined();
  });

  it('renders an svg icon and an accessible label on every nav button when the sidebar is collapsed', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.collapse-toggle')).toBeNull();

    const buttons = navButtons(fixture);
    expect(buttons).toHaveLength(5);
    for (const button of buttons) {
      expect(button.querySelector('svg')).not.toBeNull();
      expect(button.getAttribute('title')).toBe(button.textContent?.trim());
      expect(button.getAttribute('aria-label')).toBe(button.textContent?.trim());
    }
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Resumo',
      'Lançamentos',
      'Cadastros',
      'Configurações',
      'Sobre',
    ]);
  });

  it('expands the sidebar and opens the group when the collapsed Configurações parent is clicked, without navigating', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();
    const router = TestBed.inject(Router);
    const initialUrl = router.url;

    const compiled = fixture.nativeElement as HTMLElement;
    findButton(fixture, 'Configurações')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.sidebar.expanded')).not.toBeNull();
    expect(findButton(fixture, 'Usuários')).toBeDefined();
    expect(findButton(fixture, 'Perfis')).toBeDefined();
    expect(router.url).toBe(initialUrl);
  });

  it('expands the sidebar and opens the group when the collapsed Cadastros parent is clicked, without navigating', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();
    const router = TestBed.inject(Router);
    const initialUrl = router.url;

    const compiled = fixture.nativeElement as HTMLElement;
    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.sidebar.expanded')).not.toBeNull();
    expect(findButton(fixture, 'Categorias')).toBeDefined();
    expect(router.url).toBe(initialUrl);
  });

  it('renders the Categorias child only while the group is open and the sidebar is expanded', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('CATEGORIES')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Categorias')).toBeUndefined();

    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Categorias')).toBeDefined();

    sidebar(fixture).dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(findButton(fixture, 'Categorias')).toBeUndefined();
  });

  it('toggles the group and keeps the sidebar expanded when a parent is clicked with the rail expanded', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();
    const router = TestBed.inject(Router);
    const initialUrl = router.url;
    const compiled = fixture.nativeElement as HTMLElement;

    sidebar(fixture).dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(compiled.querySelector('.sidebar.expanded')).not.toBeNull();

    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.sidebar.expanded')).not.toBeNull();
    expect(findButton(fixture, 'Categorias')).toBeDefined();
    expect(router.url).toBe(initialUrl);

    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.sidebar.expanded')).not.toBeNull();
    expect(findButton(fixture, 'Categorias')).toBeUndefined();
    expect(router.url).toBe(initialUrl);
  });

  it('closes the other group when a group is opened, behaving as an accordion', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();

    findButton(fixture, 'Configurações')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Usuários')).toBeDefined();

    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Categorias')).toBeDefined();
    expect(findButton(fixture, 'Usuários')).toBeUndefined();
    expect(findButton(fixture, 'Perfis')).toBeUndefined();

    findButton(fixture, 'Configurações')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Usuários')).toBeDefined();
    expect(findButton(fixture, 'Categorias')).toBeUndefined();
  });

  it('exibe o grupo Sobre como último item do menu', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('DOCUMENTATION')]);
    const fixture = createFixture();

    const buttons = navButtons(fixture);
    expect(buttons).toHaveLength(1);

    const sobre = buttons[buttons.length - 1];
    expect(sobre.textContent?.trim()).toBe('Sobre');
    expect(sobre.querySelector('svg')?.getAttribute('width')).toBe('20');
    expect(sobre.querySelector('.nav-label')?.textContent?.trim()).toBe('Sobre');
    expect(sobre.getAttribute('title')).toBe('Sobre');
  });

  it('esconde Sobre e Documentação sem a permissão', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('DASHBOARD')]);
    const fixture = createFixture();

    const nav = (fixture.nativeElement as HTMLElement).querySelector('.nav-list') as HTMLElement;
    expect(nav.textContent).not.toContain('Sobre');
    expect(nav.textContent).not.toContain('Documentação');
    expect(nav.textContent).not.toContain('Novidades por versão');
  });

  it('exibe o grupo Sobre só com a permissão de Novidades por versão, e o subitem some sem ela', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('RELEASE_NOTES')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Sobre')).toBeDefined();

    findButton(fixture, 'Sobre')?.click();
    fixture.detectChanges();

    expect(findButton(fixture, 'Novidades por versão')).toBeDefined();
    expect(findButton(fixture, 'Documentação')).toBeUndefined();
  });

  it('mantém um único grupo aberto entre Cadastros, Configurações e Sobre', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();

    findButton(fixture, 'Configurações')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Usuários')).toBeDefined();

    findButton(fixture, 'Sobre')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Documentação')).toBeDefined();
    expect(findButton(fixture, 'Usuários')).toBeUndefined();

    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Categorias')).toBeDefined();
    expect(findButton(fixture, 'Documentação')).toBeUndefined();
  });

  it('recolhe o trilho e move o foco ao abrir a Documentação', async () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();
    const compiled = fixture.nativeElement as HTMLElement;
    const aside = sidebar(fixture);

    aside.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    findButton(fixture, 'Sobre')?.click();
    fixture.detectChanges();

    const documentacao = findButton(fixture, 'Documentação');
    expect(documentacao).toBeDefined();

    documentacao?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelector('.sidebar.expanded')).toBeNull();
    expect(findButton(fixture, 'Documentação')).toBeUndefined();
    const workspace = compiled.querySelector('.workspace') as HTMLElement;
    expect(workspace.contains(document.activeElement)).toBe(true);
  });

  it('collapses the sidebar and moves focus to the workspace when a navigating item is activated', async () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();
    const compiled = fixture.nativeElement as HTMLElement;
    const aside = sidebar(fixture);

    aside.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();

    const categorias = findButton(fixture, 'Categorias');
    expect(categorias).toBeDefined();
    categorias?.focus();
    categorias?.dispatchEvent(new Event('focusin', { bubbles: true }));
    fixture.detectChanges();
    expect(compiled.querySelector('.sidebar.expanded')).not.toBeNull();

    categorias?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelector('.sidebar.expanded')).toBeNull();
    const workspace = compiled.querySelector('.workspace') as HTMLElement;
    expect(aside.contains(document.activeElement)).toBe(false);
    expect(workspace.contains(document.activeElement)).toBe(true);
  });

  describe('gaveta de navegação no mobile', () => {
    afterEach(() => {
      document.body.classList.remove('drawer-open');
    });

    it('abre a gaveta pelo botão Menu, reflete aria-expanded e renderiza o scrim', () => {
      const authService = TestBed.inject(AuthService);
      authService.superAdmin.set(true);
      const fixture = createFixture();

      const button = menuButton(fixture);
      expect(button.getAttribute('aria-label')).toBe('Abrir menu');
      expect(button.getAttribute('aria-controls')).toBe('app-drawer');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(scrim(fixture)).toBeNull();
      expect(sidebar(fixture).classList.contains('open')).toBe(false);

      button.click();
      fixture.detectChanges();

      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(scrim(fixture)).not.toBeNull();
      expect(sidebar(fixture).id).toBe('app-drawer');
      expect(sidebar(fixture).classList.contains('open')).toBe(true);
      expect(document.body.classList.contains('drawer-open')).toBe(true);
    });

    it('move o foco para o primeiro item so depois de a gaveta ser renderizada aberta e devolve ao botão Menu ao fechar pelo scrim', async () => {
      const authService = TestBed.inject(AuthService);
      authService.superAdmin.set(true);
      const fixture = createFixture();

      const aside = sidebar(fixture);
      const first = navButtons(fixture)[0];
      const nativeFocus = first.focus.bind(first);
      let drawerRenderedOpenWhenFocused: boolean | null = null;
      first.focus = () => {
        drawerRenderedOpenWhenFocused = aside.classList.contains('open');
        nativeFocus();
      };

      menuButton(fixture).click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(drawerRenderedOpenWhenFocused).toBe(true);
      expect(document.activeElement).toBe(navButtons(fixture)[0]);

      scrim(fixture)?.click();
      fixture.detectChanges();

      expect(scrim(fixture)).toBeNull();
      expect(document.activeElement).toBe(menuButton(fixture));
      expect(document.body.classList.contains('drawer-open')).toBe(false);
    });

    it('fecha a gaveta no Esc e devolve o foco ao botão Menu', () => {
      const authService = TestBed.inject(AuthService);
      authService.superAdmin.set(true);
      const fixture = createFixture();

      menuButton(fixture).click();
      fixture.detectChanges();
      expect(scrim(fixture)).not.toBeNull();

      pressKey('Escape');
      fixture.detectChanges();

      expect(scrim(fixture)).toBeNull();
      expect(menuButton(fixture).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(menuButton(fixture));
      expect(document.body.classList.contains('drawer-open')).toBe(false);
    });

    it('fecha a gaveta ao acionar um item de navegação e move o foco para o conteúdo', async () => {
      const authService = TestBed.inject(AuthService);
      authService.superAdmin.set(true);
      const fixture = createFixture();
      const compiled = fixture.nativeElement as HTMLElement;

      menuButton(fixture).click();
      fixture.detectChanges();
      expect(scrim(fixture)).not.toBeNull();

      findButton(fixture, 'Lançamentos')?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(scrim(fixture)).toBeNull();
      expect(document.body.classList.contains('drawer-open')).toBe(false);
      const workspace = compiled.querySelector('.workspace') as HTMLElement;
      expect(workspace.contains(document.activeElement)).toBe(true);
    });

    it('não deixa o Tab alcançar o conteúdo atrás enquanto a gaveta está aberta', () => {
      const authService = TestBed.inject(AuthService);
      authService.superAdmin.set(true);
      const fixture = createFixture();
      const compiled = fixture.nativeElement as HTMLElement;

      menuButton(fixture).click();
      fixture.detectChanges();

      const aside = sidebar(fixture);
      const focusables = Array.from(aside.querySelectorAll<HTMLElement>('button'));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      last.focus();
      pressKey('Tab');
      expect(document.activeElement).toBe(first);

      first.focus();
      pressKey('Tab', true);
      expect(document.activeElement).toBe(last);

      const workspace = compiled.querySelector('.workspace') as HTMLElement;
      workspace.focus();
      pressKey('Tab');
      expect(aside.contains(document.activeElement)).toBe(true);
    });

    it('não retém o foco nem trava a rolagem quando a gaveta está fechada', () => {
      const authService = TestBed.inject(AuthService);
      authService.superAdmin.set(true);
      const fixture = createFixture();
      const compiled = fixture.nativeElement as HTMLElement;
      const workspace = compiled.querySelector('.workspace') as HTMLElement;

      workspace.focus();
      pressKey('Tab');

      expect(document.activeElement).toBe(workspace);
      expect(document.body.classList.contains('drawer-open')).toBe(false);
    });
  });
});
