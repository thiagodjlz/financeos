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
  icon: 'carrinho',
  active: true,
};

const OTHER_CATEGORY: Category = {
  id: 'cat-2',
  parentId: null,
  name: 'Salario',
  type: 'INCOME',
  color: null,
  icon: null,
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

  function expectBlankForm(): void {
    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('');
    expect(query<HTMLSelectElement>('form select[name="type"]').value).toBe('EXPENSE');
    expect(query<HTMLInputElement>('form input[name="color"]').value).toBe('#2f7d62');
    expect(query<HTMLInputElement>('form input[name="icon"]').value).toBe('');
    expect(query<HTMLSelectElement>('form select[name="active"]').selectedIndex).toBe(0);
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
    await fillText('form input[name="icon"]', 'outro');
    await selectIndex('form select[name="active"]', 1);

    await click(cancelButton());

    expectBlankForm();
    expect(formTitle()).toBe('Nova categoria');
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });

  it('entra em edição inline com controles de nome, tipo, situação, cor e ícone sem tocar o formulário lateral', async () => {
    await render();

    await startEditing();

    expect(query<HTMLInputElement>('tbody input[name="editName"]').value).toBe('Mercado');
    expect(query<HTMLInputElement>('tbody input[name="editColor"]').value).toBe('#123456');
    expect(query<HTMLInputElement>('tbody input[name="editIcon"]').value).toBe('carrinho');
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

  it('salva a edição com PUT incluindo cor e ícone, recarrega e volta ao modo leitura', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Feira');
    await fillText('tbody input[name="editColor"]', '#aabbcc');
    await fillText('tbody input[name="editIcon"]', 'cesta');

    await click(rowSaveButton());

    const request = httpMock.expectOne(`${API_BASE}/categories/cat-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({
      name: 'Feira',
      type: 'EXPENSE',
      color: '#aabbcc',
      icon: 'cesta',
      active: true,
    });
    request.flush({ ...CATEGORY, name: 'Feira', color: '#aabbcc', icon: 'cesta' });
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

  it('exibe alerta nomeando o campo Nome quando o backend recusa por validação', async () => {
    await render();

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    httpMock.expectOne(`${API_BASE}/categories`).flush(
      {
        violations: [{ field: 'create.request.name', message: 'O nome é obrigatório.' }],
        message: 'Informe os campos obrigatórios: Nome.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Informe os campos obrigatórios: Nome.');
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
