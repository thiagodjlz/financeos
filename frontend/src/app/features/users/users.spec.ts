import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE, AppUserSummary, Page, Profile } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';
import { Users } from './users';

const DEFAULT_URL = `${API_BASE}/users?page=1&size=10&active=true`;
const OPTIONS_URL = `${API_BASE}/profiles/options`;

const PROFILES: Profile[] = [
  { id: 'p1', name: 'Administrador', active: true, permissions: [] },
  { id: 'p2', name: 'Leitura', active: true, permissions: [] },
];

const USER: AppUserSummary = { id: 'u1', name: 'Ana', email: 'ana@financeos.local', active: true, profileId: 'p1' };

function page(items: AppUserSummary[], totalItems = items.length, totalPages = items.length ? 1 : 0, current = 1): Page<AppUserSummary> {
  return { items, totalItems, totalPages, page: current, size: 10 };
}

describe('Users', () => {
  let fixture: ComponentFixture<Users>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  async function render(
    users: Page<AppUserSummary> = page([USER]),
    superAdmin = true,
    url = DEFAULT_URL,
    profiles: Profile[] = PROFILES,
  ): Promise<void> {
    fixture = TestBed.createComponent(Users);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(url).flush(users);
    httpMock.expectOne(OPTIONS_URL).flush(profiles);
    await settle();
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
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
    return queryAll<HTMLButtonElement>(`${scope} button`).find((button) => button.textContent?.trim() === text);
  }

  function chipTexts(): string[] {
    return queryAll('.filter-chip span').map((chip) => chip.textContent?.trim() ?? '');
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  async function selectValue(selector: string, value: string): Promise<void> {
    const select = query<HTMLSelectElement>(selector);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  it('lista sem formulário nem campo na linha, com Situação = Ativos por padrão', async () => {
    await render();

    expect(query('form')).toBeNull();
    expect(queryAll('tbody input, tbody select')).toHaveLength(0);
    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros (1)');
    expect(chipTexts()).toEqual(['Situação: Ativos']);
    expect(queryAll('tbody tr td').map((cell) => cell.getAttribute('data-label'))).toEqual([
      'Nome',
      'E-mail',
      'Perfil',
      'Status',
      null,
    ]);
    expect(queryAll('tbody tr td').slice(0, 4).map((cell) => cell.textContent?.trim())).toEqual([
      'Ana',
      'ana@financeos.local',
      'Administrador',
      'Ativo',
    ]);
  });

  it('mostra "Incluir" e "Editar" com as permissões e navega para o cadastro', async () => {
    await render();

    await click(buttonByText('Incluir', '.list-toolbar') as HTMLButtonElement);
    expect(router.navigate).toHaveBeenCalledWith(['/users/new']);

    await click(buttonByText('Editar', 'tbody') as HTMLButtonElement);
    expect(router.navigate).toHaveBeenCalledWith(['/users', 'u1', 'edit']);
  });

  it('esconde as ações de escrita sem permissão', async () => {
    await render(page([USER]), false);

    expect(buttonByText('Incluir')).toBeUndefined();
    expect(buttonByText('Editar')).toBeUndefined();
    expect(buttonByText('Desativar')).toBeUndefined();
  });

  it('mantém o "Desativar" com DELETE, recarrega e avisa', async () => {
    await render();

    await click(buttonByText('Desativar', 'tbody') as HTMLButtonElement);
    const request = httpMock.expectOne(`${API_BASE}/users/u1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(DEFAULT_URL).flush(page([]));
    await settle();

    expect(toastService.toasts().map((toast) => [toast.title, toast.message])).toEqual([
      ['Sucesso', 'Usuário desativado com sucesso.'],
    ]);
  });

  it('exibe alerta com o texto do corpo no 409 de autodesativação', async () => {
    await render();

    await click(buttonByText('Desativar', 'tbody') as HTMLButtonElement);
    httpMock
      .expectOne(`${API_BASE}/users/u1`)
      .flush({ message: 'Você não pode desativar a própria conta.' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(toastService.toasts()[0].title).toBe('Alerta');
    expect(toastService.toasts()[0].message).toBe('Você não pode desativar a própria conta.');
  });

  it('filtra por Perfil com todas as opções mesmo com mais de 10 perfis e resolve o nome na linha', async () => {
    const many: Profile[] = Array.from({ length: 12 }, (_, index) => ({
      id: `p${index + 1}`,
      name: `Perfil ${index + 1}`,
      active: true,
      permissions: [],
    }));
    await render(page([{ ...USER, profileId: 'p12' }]), true, DEFAULT_URL, many);

    expect(query('tbody td[data-label="Perfil"]').textContent?.trim()).toBe('Perfil 12');

    await click(query('.filter-toggle'));
    expect(queryAll('select[name="filterProfileId"] option')).toHaveLength(13);

    await selectValue('select[name="filterProfileId"]', 'p12');
    httpMock.expectOne(`${API_BASE}/users?page=1&size=10&profileId=p12&active=true`).flush(page([]));
    await settle();

    expect(chipTexts()).toEqual(['Perfil: Perfil 12', 'Situação: Ativos']);
    expect(query('.filtered-empty p').textContent?.trim()).toBe('Nenhum registro encontrado.');
    expect(buttonByText('Limpar filtros', '.filtered-empty')).toBeTruthy();
  });

  it('remover o rótulo de Situação lista Todos', async () => {
    await render();

    await click(query('.filter-chip-remove'));
    httpMock.expectOne(`${API_BASE}/users?page=1&size=10`).flush(page([USER, { ...USER, id: 'u2', active: false }]));
    await settle();

    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros');
    expect(queryAll('tbody tr')).toHaveLength(2);
  });

  it('restaura filtros e página ao voltar do cadastro', async () => {
    await render(page([USER], 11, 2));
    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${API_BASE}/users?page=2&size=10&active=true`).flush(page([USER], 11, 2, 2));
    await settle();
    fixture.destroy();

    await render(page([USER], 11, 2, 2), true, `${API_BASE}/users?page=2&size=10&active=true`);

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 2 de 2');
  });

  it('na falha de carga mostra a mensagem na área, sem o vazio', async () => {
    fixture = TestBed.createComponent(Users);
    fixture.detectChanges();
    httpMock.expectOne(DEFAULT_URL).flush(null, { status: 503, statusText: 'Unavailable' });
    httpMock.expectOne(OPTIONS_URL).flush(PROFILES);
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar os usuários.');
    expect(query('.empty-state')).toBeNull();
  });

  it('com a listagem respondendo antes dos perfis, segura as linhas e o rótulo até eles chegarem', async () => {
    TestBed.inject(ListStateService).set('users', {
      filters: { name: '', email: '', profileId: 'p1', active: 'true' },
      page: 1,
    });
    fixture = TestBed.createComponent(Users);
    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE}/users?page=1&size=10&profileId=p1&active=true`).flush(page([USER]));
    await settle();

    expect(query('.loading-state')).not.toBeNull();
    expect(queryAll('tbody tr')).toHaveLength(0);
    expect(chipTexts()).toEqual(['Perfil: …', 'Situação: Ativos']);

    httpMock.expectOne(OPTIONS_URL).flush(PROFILES);
    await settle();

    expect(query('.loading-state')).toBeNull();
    expect(query('tbody td[data-label="Perfil"]').textContent?.trim()).toBe('Administrador');
    expect(chipTexts()).toEqual(['Perfil: Administrador', 'Situação: Ativos']);
  });

  it('na falha dos perfis mostra o erro de carga no lugar das linhas e tenta de novo na próxima carga', async () => {
    fixture = TestBed.createComponent(Users);
    fixture.detectChanges();
    httpMock.expectOne(DEFAULT_URL).flush(page([USER]));
    httpMock.expectOne(OPTIONS_URL).flush(null, { status: 503, statusText: 'Unavailable' });
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar os usuários.');
    expect(queryAll('tbody tr')).toHaveLength(0);
    expect(toastService.toasts()).toHaveLength(1);

    await click(query('.filter-chip-remove'));
    httpMock.expectOne(`${API_BASE}/users?page=1&size=10`).flush(page([USER]));
    httpMock.expectOne(OPTIONS_URL).flush(PROFILES);
    await settle();

    expect(query('.load-error')).toBeNull();
    expect(query('tbody td[data-label="Perfil"]').textContent?.trim()).toBe('Administrador');
  });
});
