import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, Profile } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profiles],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
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

  const SCREEN_ROWS = ['Resumo', 'Lancamentos', 'Categorias', 'Usuarios', 'Perfis'];
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
    expect(checkbox('Lancamentos.view').checked).toBe(true);
    expect(checkbox('Lancamentos.create').checked).toBe(true);
    expect(checkbox('Categorias.view').checked).toBe(false);
    expect(checkbox('Usuarios.delete').checked).toBe(false);
  }

  it('exibe o botao Cancelar ao lado de Salvar em modo de criacao', async () => {
    await render();

    const button = cancelButton();
    expect(formTitle()).toBe('Novo perfil');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('nao renderiza o formulario nem o botao Cancelar sem permissao', async () => {
    await render(false);

    expect(query('form')).toBeNull();
  });

  it('limpa o nome e toda a matriz de permissoes em modo de criacao', async () => {
    await render();
    await fillName('Financeiro');
    await toggle('Categorias.view');
    await toggle('Categorias.create');
    await toggle('Usuarios.delete');

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
    await toggle('Lancamentos.create');
    await toggle('Usuarios.edit');

    await click(cancelButton());

    expectLoadedProfileInForm();
    expect(checkbox('Usuarios.edit').checked).toBe(false);
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

  it('sai da edicao ja no primeiro clique quando nao ha alteracao pendente', async () => {
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
  });
});
