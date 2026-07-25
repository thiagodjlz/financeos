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

  async function render(superAdmin = true): Promise<void> {
    fixture = TestBed.createComponent(Categories);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE}/categories`).flush([CATEGORY]);
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

  function formTitle(): string {
    return query('form .panel-heading h3').textContent?.trim() ?? '';
  }

  function cancelButton(): HTMLButtonElement {
    return query<HTMLButtonElement>('form button.ghost-button');
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

  async function changeEveryField(): Promise<void> {
    await fillText('form input[name="name"]', 'Alterado');
    await selectValue('form select[name="type"]', 'INCOME');
    await fillText('form input[name="color"]', '#aabbcc');
    await fillText('form input[name="icon"]', 'outro');
    await selectIndex('form select[name="active"]', 1);
  }

  function expectBlankForm(): void {
    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('');
    expect(query<HTMLSelectElement>('form select[name="type"]').value).toBe('EXPENSE');
    expect(query<HTMLInputElement>('form input[name="color"]').value).toBe('#2f7d62');
    expect(query<HTMLInputElement>('form input[name="icon"]').value).toBe('');
    expect(query<HTMLSelectElement>('form select[name="active"]').selectedIndex).toBe(0);
  }

  function expectLoadedCategoryInForm(): void {
    expect(query<HTMLInputElement>('form input[name="name"]').value).toBe('Mercado');
    expect(query<HTMLSelectElement>('form select[name="type"]').value).toBe('EXPENSE');
    expect(query<HTMLInputElement>('form input[name="color"]').value).toBe('#123456');
    expect(query<HTMLInputElement>('form input[name="icon"]').value).toBe('carrinho');
    expect(query<HTMLSelectElement>('form select[name="active"]').selectedIndex).toBe(0);
  }

  it('exibe o botao Cancelar ao lado de Salvar em modo de criacao', async () => {
    await render();

    const button = cancelButton();
    expect(formTitle()).toBe('Nova categoria');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Cancelar');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('nao renderiza o formulario nem o botao Cancelar sem permissao', async () => {
    await render(false);

    expect(query('form')).toBeNull();
    expect(query('form button.ghost-button')).toBeNull();
  });

  it('limpa o formulario em modo de criacao', async () => {
    await render();
    await changeEveryField();

    await click(cancelButton());

    expectBlankForm();
    expect(formTitle()).toBe('Nova categoria');
    httpMock.expectNone(() => true);
  });

  it('restaura os valores originais no primeiro clique e mantem a edicao', async () => {
    await render();
    await startEditing();
    await changeEveryField();

    await click(cancelButton());

    expectLoadedCategoryInForm();
    expect(formTitle()).toBe('Editar categoria');
    expect(cancelButton().textContent?.trim()).toBe('Cancelar');
    httpMock.expectNone(() => true);
  });

  it('sai da edicao no segundo clique, com o formulario em branco', async () => {
    await render();
    await startEditing();
    await changeEveryField();

    await click(cancelButton());
    await click(cancelButton());

    expect(formTitle()).toBe('Nova categoria');
    expectBlankForm();
    httpMock.expectNone(() => true);
  });

  it('sai da edicao ja no primeiro clique quando nao ha alteracao pendente', async () => {
    await render();
    await startEditing();

    await click(cancelButton());

    expect(formTitle()).toBe('Nova categoria');
    expectBlankForm();
    httpMock.expectNone(() => true);
  });

  it('salva com PUT do mesmo id apos restaurar os valores', async () => {
    await render();
    await startEditing();
    await changeEveryField();
    await click(cancelButton());

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    const request = httpMock.expectOne(`${API_BASE}/categories/cat-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toMatchObject({ name: 'Mercado', type: 'EXPENSE' });
    request.flush(CATEGORY);
    await settle();
    httpMock.expectOne(`${API_BASE}/categories`).flush([CATEGORY]);
    await settle();
  });

  it('salva com POST apos sair da edicao', async () => {
    await render();
    await startEditing();
    await click(cancelButton());
    await fillText('form input[name="name"]', 'Nova');

    await click(query<HTMLButtonElement>('form button[type="submit"]'));

    const request = httpMock.expectOne(`${API_BASE}/categories`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toMatchObject({ name: 'Nova' });
    request.flush({ ...CATEGORY, id: 'cat-2', name: 'Nova' });
    await settle();
    httpMock.expectOne(`${API_BASE}/categories`).flush([CATEGORY]);
    await settle();
  });
});
