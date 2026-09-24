import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_BASE, AppUserSummary, Profile } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserForm } from './user-form';

const PROFILES: Profile[] = Array.from({ length: 12 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Perfil ${index + 1}`,
  active: true,
  permissions: [],
}));

const USER: AppUserSummary = {
  id: 'u1',
  name: 'Ana',
  email: 'ana@financeos.local',
  active: true,
  profileId: 'p12',
  profileName: 'Perfil 12',
};

const NO_PERMISSION_NOTICE = 'Seu perfil não tem permissão para ver Perfis, por isso não é possível escolher o perfil.';

type ProfilesAccess = 'allowed' | 'noPermission' | 'forbidden';

describe('UserForm', () => {
  let fixture: ComponentFixture<UserForm>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  // Zoneless: o createComponent já roda o ngOnInit, então a permissão precisa estar posta antes dele.
  async function setup(id: string | null, access: ProfilesAccess = 'allowed'): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);
    auth.superAdmin.set(access !== 'noPermission');
    auth.permissions.set([{ screen: 'USERS', canView: true, canCreate: true, canEdit: true, canDelete: true }]);
    fixture = TestBed.createComponent(UserForm);
    fixture.detectChanges();
    if (access === 'allowed') {
      httpMock.expectOne(`${API_BASE}/profiles/options`).flush(PROFILES);
    } else if (access === 'forbidden') {
      httpMock
        .expectOne(`${API_BASE}/profiles/options`)
        .flush({ message: 'Você não tem permissão para realizar esta ação.' }, { status: 403, statusText: 'Forbidden' });
    } else {
      httpMock.expectNone(`${API_BASE}/profiles/options`);
    }
    await settle();
  }

  async function renderEdit(user: AppUserSummary = USER, access: ProfilesAccess = 'allowed'): Promise<void> {
    await setup(user.id, access);
    httpMock.expectOne(`${API_BASE}/users/${user.id}`).flush(user);
    await settle();
  }

  afterEach(() => httpMock.verify());

  async function settle(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await fixture.whenStable();
      fixture.detectChanges();
    }
  }

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function labels(): string[] {
    return (Array.from(fixture.nativeElement.querySelectorAll('form > label')) as HTMLElement[]).map(
      (label) => label.childNodes[0].textContent?.trim() ?? '',
    );
  }

  function button(text: string): HTMLButtonElement {
    return (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(
      (item) => item.textContent?.trim() === text,
    ) as HTMLButtonElement;
  }

  async function fillText(selector: string, text: string): Promise<void> {
    const input = query<HTMLInputElement>(selector);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function selectValue(selector: string, value: string): Promise<void> {
    const select = query<HTMLSelectElement>(selector);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  async function selectIndex(selector: string, index: number): Promise<void> {
    const select = query<HTMLSelectElement>(selector);
    select.selectedIndex = index;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  function toasts() {
    return toastService.toasts();
  }

  it('abre a inclusão com senha obrigatória, sem Status, e todos os perfis', async () => {
    await setup(null);

    expect(query('.page-title').textContent?.trim()).toBe('Novo usuário');
    expect(labels()).toEqual(['Nome', 'E-mail', 'Senha', 'Perfil']);
    expect(query<HTMLInputElement>('input[name="password"]').required).toBe(true);
    expect(query('select[name="active"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('select[name="profileId"] option')).toHaveLength(13);
  });

  it('salva a inclusão com o payload atual e volta à listagem', async () => {
    await setup(null);
    await fillText('input[name="name"]', 'Bia');
    await fillText('input[name="email"]', 'bia@financeos.local');
    await fillText('input[name="password"]', 'senha-valida');
    await selectValue('select[name="profileId"]', 'p2');

    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Bia',
      email: 'bia@financeos.local',
      password: 'senha-valida',
      profileId: 'p2',
    });
    request.flush({ ...USER, id: 'u2' });
    await settle();

    expect(toasts()[0].message).toBe('Usuário salvo com sucesso.');
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('abre a edição com senha vazia opcional e Status, e salva sem password quando vazia', async () => {
    await renderEdit();

    expect(query('.page-title').textContent?.trim()).toBe('Editar usuário');
    expect(labels()).toEqual(['Nome', 'E-mail', 'Nova senha (opcional)', 'Perfil', 'Status']);
    expect(query<HTMLInputElement>('input[name="password"]').value).toBe('');
    expect(query<HTMLInputElement>('input[name="password"]').required).toBe(false);
    expect(query<HTMLSelectElement>('select[name="profileId"]').value).toBe('p12');

    await selectIndex('select[name="active"]', 1);
    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/users/u1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: 'Ana',
      email: 'ana@financeos.local',
      profileId: 'p12',
      active: false,
    });
    request.flush({ ...USER, active: false });
    await settle();

    expect(toasts()[0].message).toBe('Usuário atualizado com sucesso.');
  });

  it('inclui a senha no PUT quando preenchida', async () => {
    await renderEdit();
    await fillText('input[name="password"]', 'nova-senha-1');

    await click(button('Salvar'));

    expect(httpMock.expectOne(`${API_BASE}/users/u1`).request.body.password).toBe('nova-senha-1');
  });

  it('no 409 da própria conta permanece com o alerta do backend', async () => {
    await renderEdit();
    await selectIndex('select[name="active"]', 1);

    await click(button('Salvar'));
    httpMock
      .expectOne(`${API_BASE}/users/u1`)
      .flush({ message: 'Você não pode desativar a própria conta.' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Você não pode desativar a própria conta.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no 400 destaca os campos citados e foca o primeiro na ordem do formulário', async () => {
    await setup(null);

    await click(button('Salvar'));
    httpMock.expectOne(`${API_BASE}/users`).flush(
      {
        violations: [
          { field: 'create.request.profileId', message: 'O perfil é obrigatório.' },
          { field: 'create.request.email', message: 'O e-mail é obrigatório.' },
        ],
        message: 'Informe os campos obrigatórios: E-mail, Perfil.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('input[name="email"]').classList.contains('invalid')).toBe(true);
    expect(query('select[name="profileId"]').classList.contains('invalid')).toBe(true);
    expect((document.activeElement as HTMLElement).getAttribute('name')).toBe('email');
    expect(toasts()[0].message).toBe('Informe os campos obrigatórios: E-mail, Perfil.');
  });

  it('senha vazia não conta como alteração: Cancelar volta direto', async () => {
    await renderEdit();
    await fillText('input[name="password"]', 'x');
    await fillText('input[name="password"]', '');

    await click(button('Cancelar'));

    expect(query('.modal-card')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('com alteração pergunta antes de sair e mantém o digitado ao recusar', async () => {
    await renderEdit();
    await fillText('input[name="name"]', 'Ana Paula');

    await click(button('Cancelar'));
    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');
    await click(button('Continuar editando'));

    expect(query<HTMLInputElement>('input[name="name"]').value).toBe('Ana Paula');
    expect(router.navigate).not.toHaveBeenCalled();

    await click(button('Cancelar'));
    await click(button('Sair sem salvar'));
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
    expect(toasts()).toEqual([]);
  });

  it('com id inexistente (ou o super_admin oculto) volta à listagem com alerta', async () => {
    await setup('oculto');
    httpMock.expectOne(`${API_BASE}/users/oculto`).flush(null, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(toasts().map((toast) => [toast.title, toast.message])).toEqual([['Alerta', 'Usuário não encontrado.']]);
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  });

  function fieldErrors(): string[] {
    return (Array.from(fixture.nativeElement.querySelectorAll('.field-error')) as HTMLElement[]).map(
      (error) => error.textContent?.trim() ?? '',
    );
  }

  for (const access of ['noPermission', 'forbidden'] as const) {
    const scenario = access === 'noPermission' ? 'sem permissão de ver Perfis' : 'com os perfis negados pelo servidor (403)';

    it(`${scenario}, a inclusão mostra o aviso no lugar do Perfil, sem toast, e o 400 segue com a legenda`, async () => {
      await setup(null, access);

      expect(labels()).toEqual(['Nome', 'E-mail', 'Senha', 'Perfil']);
      expect(query('select[name="profileId"]')).toBeNull();
      expect(query('.field-notice').textContent?.trim()).toBe(NO_PERMISSION_NOTICE);
      expect(toasts()).toEqual([]);

      await click(button('Salvar'));
      httpMock.expectOne(`${API_BASE}/users`).flush(
        {
          violations: [{ field: 'create.request.profileId', message: 'O perfil é obrigatório.' }],
          message: 'Informe os campos obrigatórios: Perfil.',
        },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle();

      expect(fieldErrors()).toEqual(['O perfil é obrigatório.']);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it(`${scenario}, a edição mantém o perfil gravado no PUT, sem toast`, async () => {
      await renderEdit(USER, access);

      expect(query('select[name="profileId"]')).toBeNull();
      expect(query('.field-notice').textContent?.trim()).toBe(NO_PERMISSION_NOTICE);
      expect(toasts()).toEqual([]);

      await fillText('input[name="name"]', 'Ana Paula');
      await click(button('Salvar'));

      const request = httpMock.expectOne(`${API_BASE}/users/u1`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body.profileId).toBe('p12');
      request.flush({ ...USER, name: 'Ana Paula' });
      await settle();

      expect(toasts().map((toast) => toast.message)).toEqual(['Usuário atualizado com sucesso.']);
    });
  }
});
