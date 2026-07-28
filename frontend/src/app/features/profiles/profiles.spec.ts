import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, Profile } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Profiles } from './profiles';

const PROFILE: Profile = {
  id: 'profile-1',
  name: 'Administrador',
  active: true,
  permissions: [
    { screen: 'DASHBOARD', canView: true, canCreate: false, canEdit: false, canDelete: false },
    { screen: 'TRANSACTIONS', canView: true, canCreate: true, canEdit: false, canDelete: false },
  ],
};

describe('Profiles', () => {
  let fixture: ComponentFixture<Profiles>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profiles],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => httpMock.verify());

  async function render(superAdmin = true): Promise<void> {
    fixture = TestBed.createComponent(Profiles);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE}/profiles`).flush([PROFILE]);
    await settle();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function query<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function checkboxes(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('form input[type="checkbox"]'));
  }

  const SCREEN_ROWS = ['Resumo', 'Lançamentos', 'Categorias', 'Usuários', 'Perfis'];
  const ACTION_COLUMNS = ['view', 'create', 'edit', 'delete'];

  function checkbox(cell: string): HTMLInputElement {
    const [screenLabel, action] = cell.split('.');
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('form tbody tr'),
    ) as HTMLElement[];
    const row = rows[SCREEN_ROWS.indexOf(screenLabel)];
    return row.querySelectorAll('input[type="checkbox"]')[
      ACTION_COLUMNS.indexOf(action)
    ] as HTMLInputElement;
  }

  function toasts() {
    return toastService.toasts();
  }

  function formTitle(): string {
    return query('form .panel-heading h3').textContent?.trim() ?? '';
  }

  function cancelButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('form button.ghost-button');
  }

  async function fillName(text: string): Promise<void> {
    const input = query<HTMLInputElement>('form input[name="name"]');
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

  async function startEditing(): Promise<void> {
    await click(query<HTMLButtonElement>('.compact-list button.ghost-button'));
  }

  function expectLoadedProfileInForm(): void {
    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('Administrador');
    expect(checkbox('Resumo.view').checked).toBe(true);
    expect(checkbox('Lançamentos.view').checked).toBe(true);
    expect(checkbox('Lançamentos.create').checked).toBe(true);
    expect(checkbox('Categorias.view').checked).toBe(false);
    expect(checkbox('Usuários.delete').checked).toBe(false);
  }

  it('exibe o botao Cancelar ao lado de Salvar em modo de criacao', async () => {
    await render();

    const button = cancelButton();
    expect(formTitle()).toBe('Novo perfil');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('não renderiza o formulário nem o botão Cancelar sem permissão', async () => {
    await render(false);

    expect(query('form')).toBeNull();
  });

  it('limpa o nome e toda a matriz de permissoes em modo de criacao', async () => {
    await render();
    await fillName('Financeiro');
    await toggle('Categorias.view');
    await toggle('Categorias.create');
    await toggle('Usuários.delete');

    await click(cancelButton());

    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('');
    expect(checkboxes()).toHaveLength(20);
    expect(checkboxes().every((input) => !input.checked)).toBe(true);
    expect(formTitle()).toBe('Novo perfil');
    httpMock.expectNone(() => true);
  });

  it('restaura nome e matriz de permissoes no primeiro clique', async () => {
    await render();
    await startEditing();
    await fillName('Outro nome');
    await toggle('Lançamentos.create');
    await toggle('Usuários.edit');

    await click(cancelButton());

    expectLoadedProfileInForm();
    expect(checkbox('Usuários.edit').checked).toBe(false);
    expect(formTitle()).toBe('Editar perfil');
    expect(cancelButton().textContent?.trim()).toBe('Cancelar');
    httpMock.expectNone(() => true);
  });

  it('trata um unico checkbox como alteracao pendente', async () => {
    await render();
    await startEditing();
    await toggle('Perfis.delete');

    await click(cancelButton());

    expect(checkbox('Perfis.delete').checked).toBe(false);
    expect(formTitle()).toBe('Editar perfil');
    httpMock.expectNone(() => true);
  });

  it('sai da edição já no primeiro clique quando não há alteração pendente', async () => {
    await render();
    await startEditing();

    await click(cancelButton());

    expect(formTitle()).toBe('Novo perfil');
    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('');
    expect(checkboxes().every((input) => !input.checked)).toBe(true);
    httpMock.expectNone(() => true);
  });

  it('sai da edicao no segundo clique, zerando a matriz', async () => {
    await render();
    await startEditing();
    await fillName('Outro nome');
    await toggle('Categorias.edit');

    await click(cancelButton());
    expectLoadedProfileInForm();
    expect(formTitle()).toBe('Editar perfil');

    await click(cancelButton());

    expect(formTitle()).toBe('Novo perfil');
    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('');
    expect(checkboxes().every((input) => !input.checked)).toBe(true);
    httpMock.expectNone(() => true);
  });

  it('salva com PUT do mesmo id apos restaurar os valores', async () => {
    await render();
    await startEditing();
    await fillName('Outro nome');
    await click(cancelButton());

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    const request = httpMock.expectOne(`${API_BASE}/profiles/profile-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ name: 'Administrador' });
    request.flush(PROFILE);
    await settle();
    httpMock.expectOne(`${API_BASE}/profiles`).flush([PROFILE]);
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Perfil atualizado com sucesso.');
  });

  it('salva com POST apos sair da edicao', async () => {
    await render();
    await startEditing();
    await click(cancelButton());
    await fillName('Financeiro');

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    const request = httpMock.expectOne(`${API_BASE}/profiles`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({ name: 'Financeiro' });
    request.flush({ ...PROFILE, id: 'profile-2', name: 'Financeiro' });
    await settle();
    httpMock.expectOne(`${API_BASE}/profiles`).flush([PROFILE]);
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Perfil salvo com sucesso.');
  });

  it('exibe toast de sucesso ao excluir o perfil', async () => {
    await render();

    await click(query<HTMLButtonElement>('.compact-list .row-actions button:last-of-type'));

    const request = httpMock.expectOne(`${API_BASE}/profiles/profile-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(`${API_BASE}/profiles`).flush([]);
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Perfil excluído com sucesso.');
  });

  it('exibe alerta com a mensagem do corpo no 409 de perfil em uso', async () => {
    await render();

    await click(query<HTMLButtonElement>('.compact-list .row-actions button:last-of-type'));

    httpMock
      .expectOne(`${API_BASE}/profiles/profile-1`)
      .flush({ message: 'Perfil em uso por usuários.' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Perfil em uso por usuários.');
  });

  it('exibe falha no 500 ao salvar', async () => {
    await render();
    await fillName('Financeiro');

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    httpMock.expectOne(`${API_BASE}/profiles`).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
  });

  it('não dispara toast no Cancelar de dois estágios', async () => {
    await render();
    await startEditing();
    await fillName('Outro nome');

    await click(cancelButton());
    await click(cancelButton());

    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });
});
