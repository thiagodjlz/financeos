import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_BASE, Category } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { CategoryForm } from './category-form';

const INACTIVE: Category = {
  id: 'cat-3',
  parentId: null,
  name: 'Farmácia',
  type: 'EXPENSE',
  color: '#654321',
  active: false,
};

describe('CategoryForm', () => {
  let fixture: ComponentFixture<CategoryForm>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  async function setup(id: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CategoryForm],
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
    fixture = TestBed.createComponent(CategoryForm);
    fixture.detectChanges();
    await settle();
  }

  async function renderEdit(category: Category = INACTIVE): Promise<void> {
    await setup(category.id);
    httpMock.expectOne(`${API_BASE}/categories/${category.id}`).flush(category);
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

  function selectedText(selector: string): string {
    const select = query<HTMLSelectElement>(selector);
    return select.options[select.selectedIndex]?.textContent?.trim() ?? '';
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

  it('abre a inclusão com "Nova categoria" e os valores iniciais atuais', async () => {
    await setup(null);

    expect(query('.page-title').textContent?.trim()).toBe('Nova categoria');
    expect(query<HTMLInputElement>('input[name="name"]').value).toBe('');
    expect(query<HTMLSelectElement>('select[name="type"]').value).toBe('EXPENSE');
    expect(query<HTMLInputElement>('input[name="color"]').value).toBe('#2f7d62');
    expect(selectedText('select[name="active"]')).toBe('Ativo');
  });

  it('salva a inclusão com o payload atual, avisa e volta à listagem', async () => {
    await setup(null);
    await fillText('input[name="name"]', 'Lazer');

    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/categories`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Lazer', type: 'EXPENSE', color: '#2f7d62', active: true });
    request.flush({ ...INACTIVE, id: 'cat-9', name: 'Lazer', active: true });
    await settle();

    expect(toasts().map((toast) => [toast.title, toast.message])).toEqual([['Sucesso', 'Categoria salva com sucesso.']]);
    expect(router.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('abre a categoria inativa com Situação "Inativo" e permite reativar', async () => {
    await renderEdit();

    expect(query('.page-title').textContent?.trim()).toBe('Editar categoria');
    expect(query<HTMLInputElement>('input[name="name"]').value).toBe('Farmácia');
    expect(query<HTMLInputElement>('input[name="color"]').value).toBe('#654321');
    expect(selectedText('select[name="active"]')).toBe('Inativo');

    await selectIndex('select[name="active"]', 0);
    await click(button('Salvar'));

    const request = httpMock.expectOne(`${API_BASE}/categories/cat-3`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Farmácia', type: 'EXPENSE', color: '#654321', active: true });
    request.flush({ ...INACTIVE, active: true });
    await settle();

    expect(toasts()[0].message).toBe('Categoria atualizada com sucesso.');
    expect(router.navigate).toHaveBeenCalledWith(['/categories']);
  });

  it('usa a cor padrão na edição de categoria sem cor', async () => {
    await renderEdit({ ...INACTIVE, color: null });

    expect(query<HTMLInputElement>('input[name="color"]').value).toBe('#2f7d62');
  });

  it('no 409 de duplicidade permanece no cadastro com o alerta do backend', async () => {
    await renderEdit();
    await fillText('input[name="name"]', 'Mercado');

    await click(button('Salvar'));
    httpMock
      .expectOne(`${API_BASE}/categories/cat-3`)
      .flush({ message: 'Já existe uma categoria com esse nome e tipo.' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message).toBe('Já existe uma categoria com esse nome e tipo.');
    expect(query<HTMLInputElement>('input[name="name"]').value).toBe('Mercado');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no 400 destaca e foca o campo citado', async () => {
    await setup(null);

    await click(button('Salvar'));
    httpMock.expectOne(`${API_BASE}/categories`).flush(
      {
        violations: [{ field: 'create.request.name', message: 'O nome é obrigatório.' }],
        message: 'Informe os campos obrigatórios: Nome.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(query('input[name="name"]').classList.contains('invalid')).toBe(true);
    expect(query('.field-error').textContent?.trim()).toBe('O nome é obrigatório.');
    expect((document.activeElement as HTMLElement).getAttribute('name')).toBe('name');
  });

  it('Cancelar sem alteração volta sem modal e sem HTTP; com alteração pergunta antes', async () => {
    await renderEdit();

    await click(button('Cancelar'));
    expect(query('.modal-card')).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);

    await selectIndex('select[name="active"]', 0);
    await click(button('Cancelar'));
    expect(query('.modal-card p').textContent?.trim()).toBe('Deseja sair sem salvar?');

    await click(button('Continuar editando'));
    expect(selectedText('select[name="active"]')).toBe('Ativo');
    expect(router.navigate).toHaveBeenCalledTimes(1);

    await click(button('Cancelar'));
    await click(button('Sair sem salvar'));
    expect(router.navigate).toHaveBeenCalledTimes(2);
    expect(router.navigate).toHaveBeenLastCalledWith(['/categories']);
    httpMock.expectNone(() => true);
  });

  it('com id inexistente volta à listagem com alerta', async () => {
    await setup('inexistente');
    httpMock.expectOne(`${API_BASE}/categories/inexistente`).flush(null, { status: 404, statusText: 'Not Found' });
    await settle();

    expect(toasts().map((toast) => [toast.title, toast.message])).toEqual([['Alerta', 'Categoria não encontrada.']]);
    expect(router.navigate).toHaveBeenCalledWith(['/categories']);
  });
});
