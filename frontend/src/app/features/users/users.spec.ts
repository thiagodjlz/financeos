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

  async function render(superAdmin = true): Promise<void> {
    fixture = TestBed.createComponent(Users);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE}/users`).flush([USER]);
    httpMock.expectOne(`${API_BASE}/profiles`).flush(PROFILES);
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

  function queryAll(selector: string): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  function formTitle(): string {
    return query('form .panel-heading h3').textContent?.trim() ?? '';
  }

  function cancelButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('form button.ghost-button');
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
    await click(query<HTMLButtonElement>('tbody button.ghost-button'));
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

  it('exibe o botao Cancelar ao lado de Salvar em modo de criacao', async () => {
    await render();

    const button = cancelButton();
    expect(formTitle()).toBe('Novo usuario');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('nao renderiza o formulario nem o botao Cancelar sem permissao', async () => {
    await render(false);

    expect(query('form')).toBeNull();
  });

  it('limpa o formulario em modo de criacao', async () => {
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

  it('limpa as mensagens de validacao do backend ao cancelar em modo de criacao', async () => {
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

  it('restaura os valores do registro e esvazia a senha no primeiro clique', async () => {
    await render();
    await startEditing();
    await fillText('form input[name="name"]', 'Ana Maria');
    await fillText('form input[name="email"]', 'outra@financeos.dev');
    await fillText('form input[name="password"]', 'novasenha1');
    await selectValue('form select[name="profileId"]', 'profile-2');

    await click(cancelButton());

    expect(value('form input[name="name"]')).toBe('Ana');
    expect(value('form input[name="email"]')).toBe('ana@financeos.dev');
    expect(value('form input[name="password"]')).toBe('');
    expect(value('form select[name="profileId"]')).toBe('profile-1');
    expect(formTitle()).toBe('Editar usuario');
    expect(cancelButton().textContent?.trim()).toBe('Cancelar');
    httpMock.expectNone(() => true);
  });

  it('trata a senha digitada como unica alteracao pendente', async () => {
    await render();
    await startEditing();
    await fillText('form input[name="password"]', 'novasenha1');

    await click(cancelButton());

    expect(value('form input[name="password"]')).toBe('');
    expect(value('form input[name="name"]')).toBe('Ana');
    expect(formTitle()).toBe('Editar usuario');
    httpMock.expectNone(() => true);
  });

  it('sai da edicao ja no primeiro clique quando nao ha alteracao pendente', async () => {
    await render();
    await startEditing();

    await click(cancelButton());

    expect(formTitle()).toBe('Novo usuario');
    expectBlankForm();
    httpMock.expectNone(() => true);
  });

  it('sai da edicao no segundo clique, com o formulario em branco', async () => {
    await render();
    await startEditing();
    await fillText('form input[name="name"]', 'Ana Maria');

    await click(cancelButton());
    expect(formTitle()).toBe('Editar usuario');

    await click(cancelButton());

    expect(formTitle()).toBe('Novo usuario');
    expectBlankForm();
    httpMock.expectNone(() => true);
  });

  it('limpa as mensagens de validacao ao restaurar e ao sair da edicao', async () => {
    await render();
    await startEditing();
    await fillText('form input[name="password"]', '123');
    await submitForm();
    await flushValidationError(`${API_BASE}/users/user-1`);

    expect(queryAll('.field-error').length).toBeGreaterThan(0);
    expect(query('.status-bar')).toBeTruthy();

    await click(cancelButton());

    expect(queryAll('.field-error')).toHaveLength(0);
    expect(query('.status-bar')).toBeNull();
    expect(formTitle()).toBe('Editar usuario');

    await click(cancelButton());

    expect(queryAll('.field-error')).toHaveLength(0);
    expect(query('.status-bar')).toBeNull();
    expect(formTitle()).toBe('Novo usuario');
    httpMock.expectNone(() => true);
  });

  it('salva com PUT do mesmo id apos restaurar os valores', async () => {
    await render();
    await startEditing();
    await fillText('form input[name="name"]', 'Ana Maria');
    await click(cancelButton());

    await submitForm();

    const request = httpMock.expectOne(`${API_BASE}/users/user-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ name: 'Ana', email: 'ana@financeos.dev' });
    request.flush(USER);
    await settle();
    httpMock.expectOne(`${API_BASE}/users`).flush([USER]);
    await settle();
  });

  it('salva com POST apos sair da edicao', async () => {
    await render();
    await startEditing();
    await click(cancelButton());
    await fillText('form input[name="name"]', 'Bruno');
    await fillText('form input[name="email"]', 'bruno@financeos.dev');
    await fillText('form input[name="password"]', 'segredo123');
    await selectValue('form select[name="profileId"]', 'profile-2');

    await submitForm();

    const request = httpMock.expectOne(`${API_BASE}/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({ name: 'Bruno', profileId: 'profile-2' });
    request.flush({ ...USER, id: 'user-2', name: 'Bruno' });
    await settle();
    httpMock.expectOne(`${API_BASE}/users`).flush([USER]);
    await settle();
  });
});
