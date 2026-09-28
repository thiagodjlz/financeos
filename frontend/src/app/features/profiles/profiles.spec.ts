import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE, Page, Profile } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Profiles } from './profiles';

const DEFAULT_URL = `${API_BASE}/profiles?page=1&size=10`;

const PROFILE: Profile = { id: 'profile-1', name: 'Administrador', active: true, permissions: [] };

function page(items: Profile[], totalItems = items.length, totalPages = items.length ? 1 : 0, current = 1): Page<Profile> {
  return { items, totalItems, totalPages, page: current, size: 10 };
}

describe('Profiles', () => {
  let fixture: ComponentFixture<Profiles>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profiles],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  async function render(result: Page<Profile> = page([PROFILE]), superAdmin = true, url = DEFAULT_URL): Promise<void> {
    fixture = TestBed.createComponent(Profiles);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(url).flush(result);
    await settle();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector)) as T[];
  }

  function buttonByText(text: string, scope = ''): HTMLButtonElement | undefined {
    return queryAll<HTMLButtonElement>(`${scope} button`).find(
      (button) => (button.getAttribute('aria-label') ?? button.textContent?.trim()) === text,
    );
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  it('lista em table.fixed-layout com Nome e ações, sem formulário e sem filtro de Situação', async () => {
    await render();

    expect(query('table.fixed-layout')).not.toBeNull();
    expect(query('form')).toBeNull();
    expect(queryAll('thead th').map((th) => th.textContent?.trim())).toEqual(['Nome', 'Ações']);
    expect(query('h1.page-title').textContent?.trim()).toBe('Perfis');
    expect(query('tbody td').getAttribute('data-label')).toBe('Nome');
    expect(query('.filter-toggle')).toBeNull();

    expect(queryAll('.list-toolbar input, .list-toolbar select').map((field) => field.getAttribute('name'))).toEqual([
      'filterName',
    ]);
  });

  it('navega para inclusão e edição com as permissões', async () => {
    await render();

    await click(buttonByText('Novo perfil', '.page-header') as HTMLButtonElement);
    expect(router.navigate).toHaveBeenCalledWith(['/profiles/new']);
    await click(buttonByText('Editar perfil', 'tbody') as HTMLButtonElement);
    expect(router.navigate).toHaveBeenCalledWith(['/profiles', 'profile-1', 'edit']);
  });

  it('esconde Novo perfil, Editar perfil e Excluir perfil sem permissão', async () => {
    await render(page([PROFILE]), false);

    expect(buttonByText('Novo perfil')).toBeUndefined();
    expect(buttonByText('Editar perfil')).toBeUndefined();
    expect(buttonByText('Excluir perfil')).toBeUndefined();
  });

  it('filtra por Nome e mostra "Nenhum registro encontrado." com "Limpar filtros"', async () => {
    await render();

    const input = query<HTMLInputElement>('input[name="filterName"]');
    input.value = 'gestao';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    await settle();
    httpMock.expectOne(`${DEFAULT_URL}&name=gestao`).flush(page([]));
    await settle();

    expect(query('.filter-chip').textContent?.trim()).toBe('Nome: gestao');
    expect(query('.filtered-empty p').textContent?.trim()).toBe('Nenhum registro encontrado.');

    await click(buttonByText('Limpar filtros', '.filtered-empty') as HTMLButtonElement);
    httpMock.expectOne(DEFAULT_URL).flush(page([PROFILE]));
    await settle();

    expect(queryAll('tbody tr')).toHaveLength(1);
  });

  it('exclui com DELETE, recarrega e avisa', async () => {
    await render();

    await click(buttonByText('Excluir perfil', 'tbody') as HTMLButtonElement);
    const request = httpMock.expectOne(`${API_BASE}/profiles/profile-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(DEFAULT_URL).flush(page([]));
    await settle();

    expect(toastService.toasts()[0].message).toBe('Perfil excluído com sucesso.');
    expect(query('.list-state strong').textContent?.trim()).toBe('Nenhum perfil cadastrado');
  });

  it('exibe alerta com a mensagem do corpo no 409 de perfil em uso', async () => {
    await render();

    await click(buttonByText('Excluir perfil', 'tbody') as HTMLButtonElement);
    httpMock
      .expectOne(`${API_BASE}/profiles/profile-1`)
      .flush({ message: 'Perfil em uso por usuários.' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(toastService.toasts()[0].title).toBe('Alerta');
    expect(toastService.toasts()[0].message).toBe('Perfil em uso por usuários.');
  });

  it('pagina e restaura a página ao voltar do cadastro', async () => {
    await render(page([PROFILE], 12, 2));
    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${API_BASE}/profiles?page=2&size=10`).flush(page([PROFILE], 12, 2, 2));
    await settle();
    fixture.destroy();

    await render(page([PROFILE], 12, 2, 2), true, `${API_BASE}/profiles?page=2&size=10`);

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 2 de 2');
  });

  it('na falha de carga mostra a mensagem na área', async () => {
    fixture = TestBed.createComponent(Profiles);
    fixture.detectChanges();
    httpMock.expectOne(DEFAULT_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar os perfis.');
    expect(query('.empty-state')).toBeNull();
  });
});
