import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_BASE, Profile } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { ProfileForm } from './profile-form';

const PROFILE: Profile = {
  id: 'profile-1',
  name: 'Administrador',
  active: true,
  permissions: [
    { screen: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { screen: 'TRANSACTIONS', canView: true, canCreate: true, canEdit: false, canDelete: false },
  ],
};

const SCREEN_ROWS = [
  'Resumo',
  'Lançamentos',
  'Categorias',
  'Usuários',
  'Perfis',
  'Documentação',
  'Novidades por versão',
];
const ACTION_COLUMNS = ['view', 'create', 'edit', 'delete'];

describe('ProfileForm', () => {
  let fixture: ComponentFixture<ProfileForm>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  async function setup(id: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ProfileForm],
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
    fixture = TestBed.createComponent(ProfileForm);
    fixture.detectChanges();
    await settle();
  }

  async function renderEdit(): Promise<void> {
    await setup('profile-1');
    httpMock.expectOne(`${API_BASE}/profiles/profile-1`).flush(PROFILE);
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

  function checkbox(cell: string): HTMLInputElement {
    const [screenLabel, action] = cell.split('.');
    const rows = Array.from(fixture.nativeElement.querySelectorAll('form tbody tr')) as HTMLElement[];
    const row = rows[SCREEN_ROWS.indexOf(screenLabel)];
    return row.querySelectorAll('input[type="checkbox"]')[ACTION_COLUMNS.indexOf(action)] as HTMLInputElement;
  }

  function button(text: string): HTMLButtonElement {
    return (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(
      (item) => item.textContent?.trim() === text,
    ) as HTMLButtonElement;
  }

  async function fillName(text: string): Promise<void> {
    const input = query<HTMLInputElement>('input[name="name"]');
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function toggle(name: string): Promise<void> {
    const input = checkbox(name);
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change'));
    await settle();
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  function toasts() {
    return toastService.toasts();
  }

  it('abre a inclusão com "Novo perfil", nome vazio e a matriz zerada', async () => {
    await setup(null);

    expect(query('.page-title').textContent?.trim()).toBe('Novo perfil');
    expect(query<HTMLInputElement>('input[name="name"]').value).toBe('');
    const boxes = Array.from(fixture.nativeElement.querySelectorAll('form input[type="checkbox"]')) as HTMLInputElement[];
    expect(boxes).toHaveLength(22);
    expect(boxes.every((box) => !box.checked)).toBe(true);
  });

  it('tem sete linhas e só a coluna Ver nas linhas Documentação e Novidades por versão', async () => {
    await setup(null);

    const rows = Array.from(fixture.nativeElement.querySelectorAll('form tbody tr')) as HTMLElement[];
    expect(rows.map((row) => row.querySelector('.screen-cell')?.textContent?.trim())).toEqual(SCREEN_ROWS);
    rows.forEach((row) => expect(row.querySelectorAll('td')).toHaveLength(5));
    rows.slice(5).forEach((row) => expect(row.querySelectorAll('input[type="checkbox"]')).toHaveLength(1));
  });

  it('salva a inclusão com POST da matriz completa e volta à listagem', async () => {
    await setup(null);
    await fillName('Leitura');
    await toggle('Resumo.view');

    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/profiles`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.name).toBe('Leitura');
    expect(request.request.body.permissions).toHaveLength(7);
    expect(request.request.body.permissions[0]).toEqual({
      screen: 'DASHBOARD',
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    });
    request.flush({ ...PROFILE, id: 'profile-2', name: 'Leitura' });
    await settle();

    expect(toasts()[0].message).toBe('Perfil salvo com sucesso.');
    expect(router.navigate).toHaveBeenCalledWith(['/profiles']);
  });

  it('abre a edição carregando nome e matriz e salva com PUT', async () => {
    await renderEdit();

    expect(query('.page-title').textContent?.trim()).toBe('Editar perfil');
    expect(query<HTMLInputElement>('input[name="name"]').value).toBe('Administrador');
    expect(checkbox('Lançamentos.create').checked).toBe(true);
    expect(checkbox('Categorias.view').checked).toBe(false);

    await toggle('Documentação.view');
    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/profiles/profile-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.permissions).toContainEqual({
      screen: 'DOCUMENTATION',
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    });
    request.flush(PROFILE);
    await settle();

    expect(toasts()[0].message).toBe('Perfil atualizado com sucesso.');
    expect(router.navigate).toHaveBeenCalledWith(['/profiles']);
  });

  it('trata um único switch como alteração: Cancelar pergunta e recusar mantém a matriz', async () => {
    await renderEdit();
    await toggle('Categorias.view');

    await click(button('Cancelar'));
    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');

    await click(button('Continuar editando'));
    expect(checkbox('Categorias.view').checked).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();

    await click(button('Cancelar'));
    await click(button('Sair sem salvar'));
    expect(router.navigate).toHaveBeenCalledWith(['/profiles']);
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });

  it('desfazer o switch volta a não ter alteração: Cancelar sai direto', async () => {
    await renderEdit();
    await toggle('Categorias.view');
    await toggle('Categorias.view');

    await click(button('Cancelar'));

    expect(query('.modal-card')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/profiles']);
  });

  it('destaca o Nome no 400 e deixa a violação da matriz só no toast', async () => {
    await setup(null);

    await click(button('Salvar'));
    httpMock.expectOne(`${API_BASE}/profiles`).flush(
      {
        violations: [
          { field: 'create.request.name', message: 'O nome é obrigatório.' },
          { field: 'create.request.permissions[0].screen', message: 'A tela é obrigatória.' },
        ],
        message: 'Informe os campos obrigatórios: Nome, Tela.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('input[name="name"]').classList.contains('invalid')).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.field-error')).toHaveLength(1);
    expect((document.activeElement as HTMLElement).getAttribute('name')).toBe('name');
    expect(toasts()[0].message).toBe('Informe os campos obrigatórios: Nome, Tela.');
  });

  it('com id inexistente volta à listagem com alerta', async () => {
    await setup('inexistente');
    httpMock.expectOne(`${API_BASE}/profiles/inexistente`).flush(null, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(toasts().map((toast) => [toast.title, toast.message])).toEqual([['Alerta', 'Perfil não encontrado.']]);
    expect(router.navigate).toHaveBeenCalledWith(['/profiles']);
  });
});
