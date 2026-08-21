import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, Category } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Categories } from './categories';

const CATEGORY: Category = {
  id: 'cat-1',
  parentId: null,
  name: 'Mercado',
  type: 'EXPENSE',
  color: '#123456',
  active: true,
};

const OTHER_CATEGORY: Category = {
  id: 'cat-2',
  parentId: null,
  name: 'Salario',
  type: 'INCOME',
  color: null,
  active: true,
};

describe('Categories', () => {
  let fixture: ComponentFixture<Categories>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => httpMock.verify());

  async function render(superAdmin = true, categories: Category[] = [CATEGORY]): Promise<void> {
    fixture = TestBed.createComponent(Categories);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE}/categories`).flush(categories);
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

  function toasts() {
    return toastService.toasts();
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

  async function fillText(selector: string, value: string): Promise<void> {
    const input = query<HTMLInputElement>(selector);
    input.value = value;
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

  async function startEditing(): Promise<void> {
    await click(query<HTMLButtonElement>('tbody button.ghost-button'));
  }

  function fieldErrorTexts(scope: string): string[] {
    return queryAll(`${scope} .field-error`).map((element) => element.textContent?.trim() ?? '');
  }

  async function flushCreateValidationError(): Promise<void> {
    httpMock.expectOne(`${API_BASE}/categories`).flush(
      {
        violations: [
          { field: 'create.request.name', message: 'O nome é obrigatório.' },
          { field: 'create.request.color', message: 'A cor é obrigatória.' },
          { field: 'create.request.active', message: 'A situação é obrigatória.' },
        ],
        message: 'Informe os campos obrigatórios: Nome, Cor, Situação.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();
  }

  function expectBlankForm(): void {
    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('');
    expect(query<HTMLSelectElement>('form select[name="type"]').value).toBe('EXPENSE');
    expect(query<HTMLInputElement>('form input[name="color"]').value).toBe('#2f7d62');
    expect(query<HTMLSelectElement>('form select[name="active"]').selectedIndex).toBe(0);
    expect(controlNames('form')).toEqual(['name', 'type', 'color', 'active']);
  }

  function controlNames(scope: string): string[] {
    return queryAll(`${scope} input[name], ${scope} select[name]`).map(
      (control) => control.getAttribute('name') ?? '',
    );
  }

  it('exibe o formulário somente de criação com título fixo e Cancelar secundário', async () => {
    await render();

    const button = cancelButton();
    expect(formTitle()).toBe('Nova categoria');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('não renderiza o formulário nem o botão Editar sem permissão', async () => {
    await render(false);

    expect(query('form')).toBeNull();
    expect(query('tbody button.ghost-button')).toBeNull();
  });

  it('limpa o formulário de criação em estágio único, sem HTTP', async () => {
    await render();
    await fillText('form input[name="name"]', 'Alterado');
    await selectValue('form select[name="type"]', 'INCOME');
    await fillText('form input[name="color"]', '#aabbcc');
    await selectIndex('form select[name="active"]', 1);

    await click(cancelButton());

    expectBlankForm();
    expect(formTitle()).toBe('Nova categoria');
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });

  it('entra em edição inline com controles de nome, tipo, situação e cor sem tocar o formulário lateral', async () => {
    await render();

    await startEditing();

    expect(query<HTMLInputElement>('tbody input[name="editName"]').value).toBe('Mercado');
    expect(query<HTMLInputElement>('tbody input[name="editColor"]').value).toBe('#123456');
    expect(controlNames('tbody')).toEqual(['editName', 'editColor', 'editType', 'editActive']);
    expect(query<HTMLSelectElement>('tbody select[name="editType"]').value).toBe('EXPENSE');
    expect(query<HTMLSelectElement>('tbody select[name="editActive"]').selectedIndex).toBe(0);
    expect(formTitle()).toBe('Nova categoria');
    expectBlankForm();
    httpMock.expectNone(() => true);
  });

  it('desabilita o Editar das demais linhas com uma linha em edição', async () => {
    await render(true, [CATEGORY, OTHER_CATEGORY]);

    await startEditing();

    const editButtons = queryAll<HTMLButtonElement>('tbody button.ghost-button');
    expect(editButtons).toHaveLength(1);
    expect(editButtons[0].disabled).toBe(true);
  });

  it('salva a edição com PUT incluindo a cor, recarrega e volta ao modo leitura', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Feira');
    await fillText('tbody input[name="editColor"]', '#aabbcc');

    await click(rowSaveButton());

    const request = httpMock.expectOne(`${API_BASE}/categories/cat-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({
      name: 'Feira',
      type: 'EXPENSE',
      color: '#aabbcc',
      active: true,
    });
    expect(Object.keys(request.request.body).sort()).toEqual(['active', 'color', 'name', 'type']);
    request.flush({ ...CATEGORY, name: 'Feira', color: '#aabbcc' });
    await settle();
    httpMock.expectOne(`${API_BASE}/categories`).flush([{ ...CATEGORY, name: 'Feira' }]);
    await settle();

    expect(query('tbody input[name="editName"]')).toBeNull();
    expect(query('tbody tr td').textContent?.trim()).toBe('Feira');
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Categoria atualizada com sucesso.');
  });

  it('sai direto sem modal e sem HTTP quando não há alteração pendente', async () => {
    await render();
    await startEditing();

    await click(rowExitButton());

    expect(query('.modal-backdrop')).toBeNull();
    expect(query('tbody input[name="editName"]')).toBeNull();
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });

  it('abre o modal ao sair com alteração pendente e mantém a edição no Não', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Alterado');

    await click(rowExitButton());

    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');

    await click(query<HTMLButtonElement>('.modal-actions button.ghost-button'));

    expect(query('.modal-backdrop')).toBeNull();
    expect(query<HTMLInputElement>('tbody input[name="editName"]').value).toBe('Alterado');
    httpMock.expectNone(() => true);
  });

  it('descarta e recarrega da API ao confirmar a saída com Sim', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Alterado');
    await click(rowExitButton());

    await click(query<HTMLButtonElement>('.modal-actions button.primary-button'));

    httpMock.expectOne(`${API_BASE}/categories`).flush([CATEGORY]);
    await settle();

    expect(query('.modal-backdrop')).toBeNull();
    expect(query('tbody input[name="editName"]')).toBeNull();
    expect(query('tbody tr td').textContent?.trim()).toBe('Mercado');
  });

  it('exibe alerta com a mensagem de duplicidade no 409 e mantém a linha em edição', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Duplicada');

    await click(rowSaveButton());

    httpMock
      .expectOne(`${API_BASE}/categories/cat-1`)
      .flush(
        { message: 'Já existe uma categoria com esse nome e tipo.' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Já existe uma categoria com esse nome e tipo.');
    expect(query<HTMLInputElement>('tbody input[name="editName"]').value).toBe('Duplicada');
  });

  it('exibe toast de sucesso ao criar a categoria', async () => {
    await render();
    await fillText('form input[name="name"]', 'Lazer');

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    httpMock.expectOne(`${API_BASE}/categories`).flush({ ...CATEGORY, id: 'cat-3', name: 'Lazer' });
    await settle();
    httpMock.expectOne(`${API_BASE}/categories`).flush([CATEGORY]);
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Categoria salva com sucesso.');
  });

  it('exibe toast de sucesso ao desativar pela edição inline', async () => {
    await render();
    await startEditing();
    await selectIndex('tbody select[name="editActive"]', 1);

    await click(rowSaveButton());

    const request = httpMock.expectOne(`${API_BASE}/categories/cat-1`);
    expect(request.request.body).toMatchObject({ active: false });
    request.flush({ ...CATEGORY, active: false });
    await settle();
    httpMock.expectOne(`${API_BASE}/categories`).flush([{ ...CATEGORY, active: false }]);
    await settle();

    expect(toasts()[0].title).toBe('Sucesso');
    expect(toasts()[0].message).toBe('Categoria atualizada com sucesso.');
  });

  it('exibe alerta nomeando os campos obrigatórios quando o backend recusa por validação', async () => {
    await render();

    await click(query<HTMLButtonElement>('form button[type="submit"]'));
    await flushCreateValidationError();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Informe os campos obrigatórios: Nome, Cor, Situação.');
  });

  it('destaca em vermelho cada campo citado no 400 e exibe a legenda da violação', async () => {
    await render();

    await click(query<HTMLButtonElement>('form button[type="submit"]'));
    await flushCreateValidationError();

    expect(query('form input[name="name"]').classList.contains('invalid')).toBe(true);
    expect(query('form input[name="color"]').classList.contains('invalid')).toBe(true);
    expect(query('form select[name="active"]').classList.contains('invalid')).toBe(true);
    expect(query('form select[name="type"]').classList.contains('invalid')).toBe(false);
    expect(fieldErrorTexts('form')).toEqual([
      'O nome é obrigatório.',
      'A cor é obrigatória.',
      'A situação é obrigatória.',
    ]);
  });

  it('limpa o destaque apenas do campo editado', async () => {
    await render();
    await click(query<HTMLButtonElement>('form button[type="submit"]'));
    await flushCreateValidationError();

    await fillText('form input[name="name"]', 'Lazer');

    expect(query('form input[name="name"]').classList.contains('invalid')).toBe(false);
    expect(query('form input[name="color"]').classList.contains('invalid')).toBe(true);
    expect(fieldErrorTexts('form')).toEqual(['A cor é obrigatória.', 'A situação é obrigatória.']);
  });

  it('destaca os campos da linha em edição sem tocar o formulário lateral', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', '');

    await click(rowSaveButton());

    httpMock.expectOne(`${API_BASE}/categories/cat-1`).flush(
      {
        violations: [{ field: 'update.request.name', message: 'O nome é obrigatório.' }],
        message: 'Informe os campos obrigatórios: Nome.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('tbody input[name="editName"]').classList.contains('invalid')).toBe(true);
    expect(fieldErrorTexts('tbody')).toEqual(['O nome é obrigatório.']);
    expect(fieldErrorTexts('form')).toEqual([]);
    expect(query('tbody input[name="editName"]')).toBeTruthy();
  });

  it('limpa os destaques ao cancelar o formulário, sem HTTP e sem toast novo', async () => {
    await render();
    await click(query<HTMLButtonElement>('form button[type="submit"]'));
    await flushCreateValidationError();
    const toastsAfterError = toasts().length;

    await click(cancelButton());

    expect(queryAll('.field-error')).toHaveLength(0);
    expect(queryAll('.invalid')).toHaveLength(0);
    expect(toasts()).toHaveLength(toastsAfterError);
    httpMock.expectNone(() => true);
  });

  it('exibe toast de falha quando a API responde 500', async () => {
    await render();
    await fillText('form input[name="name"]', 'Lazer');

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    httpMock
      .expectOne(`${API_BASE}/categories`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
  });

  it('mantém o empty-state da tabela sem categorias', async () => {
    await render(true, []);

    expect(query('.empty-state').textContent?.trim()).toBe('Nenhuma categoria cadastrada');
  });
});
