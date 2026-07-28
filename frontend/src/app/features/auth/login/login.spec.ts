import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE } from '../../../core/models';
import { UNEXPECTED_ERROR_MESSAGE } from '../../../core/http-error';
import { ToastService } from '../../../core/services/toast.service';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function query<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function toasts() {
    return toastService.toasts();
  }

  async function submit(): Promise<void> {
    query<HTMLButtonElement>('button[type="submit"]')?.click();
    await settle();
  }

  // A faixa de erro do card era a unica classe de feedback do template comecada por "status";
  // o seletor por atributo evita reintroduzir o nome dela no codigo (criterio 42).
  function feedbackBanner(): HTMLElement | null {
    return query<HTMLElement>('form [class*="status"]');
  }

  it('não tem mais a faixa vermelha no card de login', () => {
    expect(feedbackBanner()).toBeNull();
  });

  it('exibe Alerta com auto-fechamento quando as credenciais são inválidas', async () => {
    await submit();

    httpMock
      .expectOne(`${API_BASE}/auth/login`)
      .flush(
        { message: 'Credenciais inválidas.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].type).toBe('warning');
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Credenciais inválidas. Tente novamente.');
    expect(toasts()[0].duration).toBe(5200);
    expect(feedbackBanner()).toBeNull();
  });

  it('exibe Falha genérica quando a API responde 500', async () => {
    await submit();

    httpMock
      .expectOne(`${API_BASE}/auth/login`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
    expect(toasts()[0].message).toBe(UNEXPECTED_ERROR_MESSAGE);
  });
});
