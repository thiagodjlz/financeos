import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, AppUserSummary, Profile } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { Users } from './users';

const USER: AppUserSummary = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@financeos.dev',
  active: true,
  profileId: 'profile-1',
};

const OTHER_USER: AppUserSummary = {
  id: 'user-2',
  name: 'Bruno',
  email: 'bruno@financeos.dev',
  active: true,
  profileId: 'profile-2',
};

const PROFILES: Profile[] = [
  { id: 'profile-1', name: 'Administrador', active: true, permissions: [] },
  { id: 'profile-2', name: 'Leitura', active: true, permissions: [] },
];

describe('Users', () => {
  let fixture: ComponentFixture<Users>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function render(superAdmin = true, users: AppUserSummary[] = [USER]): Promise<void> {
    fixture = TestBed.createComponent(Users);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE}/users`).flush(users);
    httpMock.expectOne(`${API_BASE}/profiles`).flush(PROFILES);
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

  function formTitle(): string {
    return query('form .panel-heading h3').textContent?.trim() ?? '';
  }

  function cancelButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('form button.ghost-button');
  }

  function rowSaveButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('tbody .row-actions button.primary-button');
  }

  function rowExitButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('tbody .row-actions button.danger-button');
  }

  function rowButtonByText(text: string): HTMLButtonElement | undefined {
    return queryAll<HTMLButtonElement>('tbody .row-actions button').find(
      (button) => button.textContent?.trim() === text,
    );
  }

  function value(selector: string): string {
    return query<HTMLInputElement>(selector).value;
  }

  async function fillText(selector: string, text: string): Promise<void> {
    const input = query<HTMLInputElement>(selector);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function selectValue(selector: string, optionValue: string): Promise<void> {
    const select = query<HTMLSelectElement>(selector);
    select.value = optionValue;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  async function startEditing(): Promise<void> {
    await click(rowButtonByText('Editar') as HTMLButtonElement);
  }

  async function submitForm(): Promise<void> {
    await click(query<HTMLButtonElement>('form button[type="submit"]'));
  }

  async function flushValidationError(url: string): Promise<void> {
    httpMock.expectOne(url).flush(
      {
        violations: [
          { field: 'save.request.email', message: 'Informe um e-mail valido.' },
          { field: 'save.request.password', message: 'A senha deve ter entre 8 e 72 caracteres.' },
        ],
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
  }

  function expectBlankForm(): void {
    expect(value('form input[name="name"]')).toBe('');
    expect(value('form input[name="email"]')).toBe('');
    expect(value('form input[name="password"]')).toBe('');
    expect(value('form select[name="profileId"]')).toBe('');
  }

  it('exibe o formulario somente de criacao com titulo fixo, senha obrigatoria e Cancelar secundario', async () => {
    await render();

    const button = cancelButton();
    expect(formTitle()).toBe('Novo usuario');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
    expect(query<HTMLInputElement>('form input[name="password"]').hasAttribute('required')).toBe(true);
  });

  it('nao renderiza o formulario nem os botoes de linha sem permissao', async () => {
    await render(false);

    expect(query('form')).toBeNull();
    expect(queryAll('tbody .row-actions button')).toHaveLength(0);
  });

  it('limpa o formulario de criacao em estagio unico, sem HTTP', async () => {
    await render();
    await fillText('form input[name="name"]', 'Bruno');
    await fillText('form input[name="email"]', 'bruno@financeos.dev');
    await fillText('form input[name="password"]', 'segredo123');
    await selectValue('form select[name="profileId"]', 'profile-2');

    await click(cancelButton());

    expectBlankForm();
    expect(formTitle()).toBe('Novo usuario');
    httpMock.expectNone(() => true);
  });

  it('limpa as mensagens de validacao do backend ao cancelar a criacao', async () => {
    await render();
    await fillText('form input[name="name"]', 'Bruno');
    await fillText('form input[name="email"]', 'invalido');
    await fillText('form input[name="password"]', '123');
    await selectValue('form select[name="profileId"]', 'profile-2');
    await submitForm();
    await flushValidationError(`${API_BASE}/users`);

    expect(queryAll('.field-error').length).toBeGreaterThan(0);
    expect(query('.status-bar')).toBeTruthy();

    await click(cancelButton());

    expect(queryAll('.field-error')).toHaveLength(0);
    expect(query('.status-bar')).toBeNull();
    expectBlankForm();
    httpMock.expectNone(() => true);
  });

  it('entra em edicao inline com senha vazia e formulario lateral intocado', async () => {
    await render();

    await startEditing();

    expect(value('tbody input[name="editName"]')).toBe('Ana');
    expect(value('tbody input[name="editEmail"]')).toBe('ana@financeos.dev');
    expect(value('tbody input[name="editPassword"]')).toBe('');
    expect(query<HTMLSelectElement>('tbody select[name="editProfileId"]').value).toBe('profile-1');
    expect(query<HTMLSelectElement>('tbody select[name="editActive"]').selectedIndex).toBe(0);
    expect(formTitle()).toBe('Novo usuario');
    expectBlankForm();
    httpMock.expectNone(() => true);
  });

  it('desabilita o Editar das demais linhas com uma linha em edicao', async () => {
    await render(true, [USER, OTHER_USER]);

    await startEditing();

    const editButtons = queryAll<HTMLButtonElement>('tbody .row-actions button').filter(
      (button) => button.textContent?.trim() === 'Editar',
    );
    expect(editButtons).toHaveLength(1);
    expect(editButtons[0].disabled).toBe(true);
  });

  it('salva com PUT sem password quando o campo de senha fica vazio', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Ana Maria');

    await click(rowSaveButton());

    const request = httpMock.expectOne(`${API_BASE}/users/user-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ name: 'Ana Maria', email: 'ana@financeos.dev', active: true });
    expect(request.request.body.password).toBeUndefined();
    request.flush({ ...USER, name: 'Ana Maria' });
    await settle();
    httpMock.expectOne(`${API_BASE}/users`).flush([{ ...USER, name: 'Ana Maria' }]);
    await settle();

    expect(query('tbody input[name="editName"]')).toBeNull();
  });

  it('salva com PUT incluindo a senha quando preenchida', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editPassword"]', 'novasenha1');

    await click(rowSaveButton());

    const request = httpMock.expectOne(`${API_BASE}/users/user-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.password).toBe('novasenha1');
    request.flush(USER);
    await settle();
    httpMock.expectOne(`${API_BASE}/users`).flush([USER]);
    await settle();
  });

  it('sai direto sem modal e sem HTTP quando so a senha vazia permanece', async () => {
    await render();
    await startEditing();

    await click(rowExitButton());

    expect(query('.modal-backdrop')).toBeNull();
    expect(query('tbody input[name="editName"]')).toBeNull();
    httpMock.expectNone(() => true);
  });

  it('abre o modal ao sair com alteracao pendente e mantem a edicao no Nao', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Ana Maria');

    await click(rowExitButton());

    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');

    await click(query<HTMLButtonElement>('.modal-actions button.ghost-button'));

    expect(query('.modal-backdrop')).toBeNull();
    expect(value('tbody input[name="editName"]')).toBe('Ana Maria');
    httpMock.expectNone(() => true);
  });

  it('descarta e recarrega da API ao confirmar a saida com Sim', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Ana Maria');
    await click(rowExitButton());

    await click(query<HTMLButtonElement>('.modal-actions button.primary-button'));

    httpMock.expectOne(`${API_BASE}/users`).flush([USER]);
    await settle();

    expect(query('.modal-backdrop')).toBeNull();
    expect(query('tbody input[name="editName"]')).toBeNull();
    expect(query('tbody tr td').textContent?.trim()).toBe('Ana');
  });

  it('exibe erros de violations por campo na linha e na faixa do topo mantendo a edicao', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editEmail"]', 'invalido');
    await fillText('tbody input[name="editPassword"]', '123');

    await click(rowSaveButton());
    await flushValidationError(`${API_BASE}/users/user-1`);

    const rowErrors = queryAll('tbody .field-error').map((error) => error.textContent?.trim());
    expect(rowErrors).toContain('Informe um e-mail valido.');
    expect(rowErrors).toContain('A senha deve ter entre 8 e 72 caracteres.');
    expect(query('.status-bar').textContent).toContain('Revise o(s) campo(s) invalido(s)');
    expect(value('tbody input[name="editEmail"]')).toBe('invalido');
  });

  it('exibe E-mail ja cadastrado. no 409 mantendo a edicao', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editEmail"]', 'bruno@financeos.dev');

    await click(rowSaveButton());

    httpMock.expectOne(`${API_BASE}/users/user-1`).flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(query('.status-bar').textContent).toContain('E-mail ja cadastrado.');
    expect(value('tbody input[name="editEmail"]')).toBe('bruno@financeos.dev');
  });

  it('mantem o Desativar na linha em leitura com DELETE e o esconde em edicao', async () => {
    await render();

    await click(rowButtonByText('Desativar') as HTMLButtonElement);

    const request = httpMock.expectOne(`${API_BASE}/users/user-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await settle();
    httpMock.expectOne(`${API_BASE}/users`).flush([USER]);
    await settle();

    await startEditing();

    expect(rowButtonByText('Desativar')).toBeUndefined();
    expect(rowButtonByText('Salvar')).toBeTruthy();
    expect(rowButtonByText('Sair')).toBeTruthy();
  });
});
