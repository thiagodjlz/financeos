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
    expect(navButtons(fixture)).toHaveLength(4);
    expect(findButton(fixture, 'Cadastros')).toBeDefined();
    expect(findButton(fixture, 'Configuracoes')).toBeDefined();
    expect(findButton(fixture, 'Categorias')).toBeUndefined();
    expect(findButton(fixture, 'Usuarios')).toBeUndefined();
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

  it('shows the Configuracoes group when the user can view only users', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('USERS')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Configuracoes')).toBeDefined();
  });

  it('shows the Configuracoes group when the user can view only profiles', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('PROFILES')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Configuracoes')).toBeDefined();
  });

  it('hides the Configuracoes group when the user can view neither users nor profiles', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('DASHBOARD')]);
    const fixture = createFixture();

    expect(findButton(fixture, 'Configuracoes')).toBeUndefined();
  });

  it('renders only the permitted children after expanding the Configuracoes group', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('USERS')]);
    const fixture = createFixture();

    findButton(fixture, 'Configuracoes')?.click();
    fixture.detectChanges();

    expect(findButton(fixture, 'Usuarios')).toBeDefined();
    expect(findButton(fixture, 'Perfis')).toBeUndefined();
  });

  it('renders both children after expanding the Configuracoes group with both permissions', () => {
    const authService = TestBed.inject(AuthService);
    authService.permissions.set([viewPermission('USERS'), viewPermission('PROFILES')]);
    const fixture = createFixture();

    findButton(fixture, 'Configuracoes')?.click();
    fixture.detectChanges();

    expect(findButton(fixture, 'Usuarios')).toBeDefined();
    expect(findButton(fixture, 'Perfis')).toBeDefined();
  });

  it('renders an svg icon and an accessible label on every nav button when the sidebar is collapsed', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.collapse-toggle')).toBeNull();

    const buttons = navButtons(fixture);
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.querySelector('svg')).not.toBeNull();
      expect(button.getAttribute('title')).toBe(button.textContent?.trim());
      expect(button.getAttribute('aria-label')).toBe(button.textContent?.trim());
    }
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Resumo',
      'Lancamentos',
      'Cadastros',
      'Configuracoes',
    ]);
  });

  it('expands the sidebar and opens the group when the collapsed Configuracoes parent is clicked, without navigating', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();
    const router = TestBed.inject(Router);
    const initialUrl = router.url;

    const compiled = fixture.nativeElement as HTMLElement;
    findButton(fixture, 'Configuracoes')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.sidebar.expanded')).not.toBeNull();
    expect(findButton(fixture, 'Usuarios')).toBeDefined();
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

    findButton(fixture, 'Configuracoes')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Usuarios')).toBeDefined();

    findButton(fixture, 'Cadastros')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Categorias')).toBeDefined();
    expect(findButton(fixture, 'Usuarios')).toBeUndefined();
    expect(findButton(fixture, 'Perfis')).toBeUndefined();

    findButton(fixture, 'Configuracoes')?.click();
    fixture.detectChanges();
    expect(findButton(fixture, 'Usuarios')).toBeDefined();
    expect(findButton(fixture, 'Categorias')).toBeUndefined();
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
});
