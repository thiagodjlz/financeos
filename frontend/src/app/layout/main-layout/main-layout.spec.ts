import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PermissionEntry, Screen } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { MainLayout } from './main-layout';

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

describe('MainLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
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
    expect(findButton(fixture, 'Configuracoes')).toBeDefined();
    expect(findButton(fixture, 'Usuarios')).toBeUndefined();
    expect(findButton(fixture, 'Perfis')).toBeUndefined();
  });

  it('hides nav items the user has no view permission for', () => {
    const fixture = createFixture();

    expect(navButtons(fixture)).toHaveLength(0);
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

  it('renders an identifier on every nav button when the sidebar is collapsed', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.collapse-toggle')?.click();
    fixture.detectChanges();

    const buttons = navButtons(fixture);
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button.textContent?.trim()).not.toBe('');
    }
    expect(buttons.map((button) => button.textContent?.trim())).toContain('R');
    expect(buttons.map((button) => button.textContent?.trim())).toContain('L');
  });

  it('expands the sidebar and opens the group when a collapsed group is clicked, without navigating', () => {
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    const fixture = createFixture();
    const router = TestBed.inject(Router);
    const initialUrl = router.url;

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.collapse-toggle')?.click();
    fixture.detectChanges();

    const settingsParent = navButtons(fixture).find(
      (button) => button.getAttribute('aria-label') === 'Configuracoes',
    );
    settingsParent?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.sidebar.collapsed')).toBeNull();
    expect(findButton(fixture, 'Usuarios')).toBeDefined();
    expect(findButton(fixture, 'Perfis')).toBeDefined();
    expect(router.url).toBe(initialUrl);
  });
});
