import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('should render the FinanceOS shell with the nav items the user has access to', () => {
    const fixture = TestBed.createComponent(MainLayout);
    const authService = TestBed.inject(AuthService);
    authService.superAdmin.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('FinanceOS');
    expect(compiled.querySelectorAll('.nav-list button')).toHaveLength(5);
  });

  it('hides nav items the user has no view permission for', () => {
    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.nav-list button')).toHaveLength(0);
  });
});
