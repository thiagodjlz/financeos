import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, Category } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
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

  function formTitle(): string {
    return query('form .panel-heading h3').textContent?.trim() ?? '';
  }

  function cancelButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('form button.danger-button');
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

  it('exibe o formulario somente de criacao com titulo fixo e Cancelar vermelho', async () => {
    await render();

    const button = cancelButton();
    expect(formTitle()).toBe('Nova categoria');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('nao renderiza o formulario nem o botao Editar sem permissao', async () => {
    await render(false);

    expect(query('form')).toBeNull();
    expect(query('tbody button.ghost-button')).toBeNull();
  });

  it('limpa o formulario de criacao em estagio unico, sem HTTP', async () => {
    await render();
    await fillText('form input[name="name"]', 'Alterado');
    await selectValue('form select[name="type"]', 'INCOME');
    await fillText('form input[name="color"]', '#aabbcc');
    await fillText('form input[name="icon"]', 'outro');
    await selectIndex('form select[name="active"]', 1);

    await click(cancelButton());

    expectBlankForm();
    expect(formTitle()).toBe('Nova categoria');
    httpMock.expectNone(() => true);
  });

  it('entra em edicao inline com controles de nome, tipo, situacao, cor e icone sem tocar o formulario lateral', async () => {
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

  it('desabilita o Editar das demais linhas com uma linha em edicao', async () => {
    await render(true, [CATEGORY, OTHER_CATEGORY]);

    await startEditing();

    const editButtons = queryAll<HTMLButtonElement>('tbody button.ghost-button');
    expect(editButtons).toHaveLength(1);
    expect(editButtons[0].disabled).toBe(true);
  });

  it('salva a edicao com PUT incluindo cor e icone, recarrega e volta ao modo leitura', async () => {
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
  });

  it('sai direto sem modal e sem HTTP quando nao ha alteracao pendente', async () => {
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
    await fillText('tbody input[name="editName"]', 'Alterado');

    await click(rowExitButton());

    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');

    await click(query<HTMLButtonElement>('.modal-actions button.ghost-button'));

    expect(query('.modal-backdrop')).toBeNull();
    expect(query<HTMLInputElement>('tbody input[name="editName"]').value).toBe('Alterado');
    httpMock.expectNone(() => true);
  });

  it('descarta e recarrega da API ao confirmar a saida com Sim', async () => {
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

  it('exibe a mensagem de duplicidade no 409 e mantem a linha em edicao', async () => {
    await render();
    await startEditing();
    await fillText('tbody input[name="editName"]', 'Duplicada');

    await click(rowSaveButton());

    httpMock
      .expectOne(`${API_BASE}/categories/cat-1`)
      .flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(query('.status-bar').textContent?.trim()).toBe('Ja existe uma categoria com esse nome e tipo.');
    expect(query<HTMLInputElement>('tbody input[name="editName"]').value).toBe('Duplicada');
  });
});
