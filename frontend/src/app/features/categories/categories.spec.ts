import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE, Category, Page, PermissionEntry } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Categories } from './categories';

const DEFAULT_URL = `${API_BASE}/categories?page=1&size=10&active=true`;

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

const INACTIVE_CATEGORY: Category = {
  id: 'cat-3',
  parentId: null,
  name: 'Farmácia',
  type: 'EXPENSE',
  color: '#654321',
  active: false,
};

const BLOCKING_MESSAGE =
  'Não é possível excluir a categoria. Ela está em uso em:\nLançamentos: 3 registros';

function page(items: Category[], totalItems = items.length, totalPages = items.length ? 1 : 0, current = 1): Page<Category> {
  return { items, totalItems, totalPages, page: current, size: 10 };
}

function categoriesPermission(overrides: Partial<PermissionEntry>): PermissionEntry {
  return {
    screen: 'CATEGORIES',
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    ...overrides,
  };
}

describe('Categories', () => {
  let fixture: ComponentFixture<Categories>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpMock.verify());

  async function render(superAdmin = true, categories: Category[] = [CATEGORY], url = DEFAULT_URL): Promise<void> {
    fixture = TestBed.createComponent(Categories);
    TestBed.inject(AuthService).superAdmin.set(superAdmin);
    fixture.detectChanges();
    httpMock.expectOne(url).flush(page(categories));
    await settle();
  }

  async function renderWithPermissions(permissions: PermissionEntry[]): Promise<void> {
    TestBed.inject(AuthService).permissions.set(permissions);
    await render(false);
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

  function buttonByText(text: string, scope = ''): HTMLButtonElement | undefined {
    return queryAll<HTMLButtonElement>(`${scope} button`).find((button) => button.textContent?.trim() === text);
  }

  function toasts() {
    return toastService.toasts();
  }

  function deleteButtons(): HTMLButtonElement[] {
    return queryAll<HTMLButtonElement>('tbody .row-actions button.icon-button');
  }

  function rowNames(): string[] {
    return queryAll('tbody td[data-label="Nome"]').map((cell) => cell.textContent?.trim() ?? '');
  }

  function chipTexts(): string[] {
    return queryAll('.filter-chip span').map((chip) => chip.textContent?.trim() ?? '');
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  async function selectValue(selector: string, value: string): Promise<void> {
    const select = query<HTMLSelectElement>(selector);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  async function confirmDeletion(): Promise<void> {
    await click(deleteButtons()[0]);
    await click(query<HTMLButtonElement>('.modal-actions button.primary-button'));
  }

  it('abre com Situação = Ativos contando em "Filtros (1)" e com o rótulo "Ativos"', async () => {
    await render();

    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros (1)');
    expect(chipTexts()).toEqual(['Situação: Ativos']);
    expect(query('form')).toBeNull();
    expect(queryAll('tbody input, tbody select')).toHaveLength(0);
    expect(queryAll('tbody tr td').map((cell) => cell.getAttribute('data-label'))).toEqual([
      'Nome',
      'Tipo',
      'Situação',
      null,
    ]);
  });

  it('oferece Situação Ativos, Inativos e Todos; remover o rótulo = Todos e "Limpar filtros" volta a Ativos', async () => {
    await render();
    await click(query('.filter-toggle'));

    const options = queryAll<HTMLOptionElement>('select[name="filterActive"] option').map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toEqual(['Ativos', 'Inativos', 'Todos']);
    expect(buttonByText('Limpar filtros', '.filter-actions')?.disabled).toBe(true);

    await click(query('.filter-chip-remove'));
    httpMock.expectOne(`${API_BASE}/categories?page=1&size=10`).flush(page([CATEGORY, INACTIVE_CATEGORY]));
    await settle();

    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros');
    expect(chipTexts()).toEqual([]);
    expect(query<HTMLSelectElement>('select[name="filterActive"]').value).toBe('');

    await click(buttonByText('Limpar filtros', '.filter-actions') as HTMLButtonElement);
    httpMock.expectOne(DEFAULT_URL).flush(page([CATEGORY]));
    await settle();

    expect(chipTexts()).toEqual(['Situação: Ativos']);
  });

  it('combina Nome, Tipo e Situação e volta à página 1 ao filtrar', async () => {
    await render(true, [CATEGORY]);
    await click(query('.filter-toggle'));

    await selectValue('select[name="filterType"]', 'INCOME');
    httpMock.expectOne(`${API_BASE}/categories?page=1&size=10&type=INCOME&active=true`).flush(page([OTHER_CATEGORY]));
    await settle();
    const name = query<HTMLInputElement>('input[name="filterName"]');
    name.value = 'sal';
    name.dispatchEvent(new Event('input'));
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await settle();
    httpMock
      .expectOne(`${API_BASE}/categories?page=1&size=10&name=sal&type=INCOME&active=true`)
      .flush(page([OTHER_CATEGORY]));
    await settle();

    expect(query('.filter-toggle').textContent?.trim()).toBe('Filtros (3)');
    expect(chipTexts()).toEqual(['Nome: sal', 'Tipo: Receita', 'Situação: Ativos']);
  });

  it('lista vazia só com o padrão mostra "Nenhum registro encontrado." sem "Limpar filtros"', async () => {
    await render(true, []);

    expect(query('.filtered-empty p').textContent?.trim()).toBe('Nenhum registro encontrado.');
    expect(buttonByText('Limpar filtros', '.filtered-empty')).toBeUndefined();
  });

  it('filtro diferente do padrão sem resultado oferece "Limpar filtros"', async () => {
    await render();
    await click(query('.filter-toggle'));
    await selectValue('select[name="filterActive"]', 'false');
    httpMock.expectOne(`${API_BASE}/categories?page=1&size=10&active=false`).flush(page([]));
    await settle();

    await click(buttonByText('Limpar filtros', '.filtered-empty') as HTMLButtonElement);
    httpMock.expectOne(DEFAULT_URL).flush(page([CATEGORY]));
    await settle();

    expect(rowNames()).toEqual(['Mercado']);
  });

  it('sem registros e sem filtro mostra o vazio atual', async () => {
    await render();
    await click(query('.filter-chip-remove'));
    httpMock.expectOne(`${API_BASE}/categories?page=1&size=10`).flush(page([]));
    await settle();

    expect(query('.empty-state').textContent?.trim()).toBe('Nenhuma categoria cadastrada');
  });

  it('pagina e restaura filtros e página ao voltar do cadastro', async () => {
    fixture = TestBed.createComponent(Categories);
    TestBed.inject(AuthService).superAdmin.set(true);
    fixture.detectChanges();
    httpMock.expectOne(DEFAULT_URL).flush(page([CATEGORY], 11, 2));
    await settle();

    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${API_BASE}/categories?page=2&size=10&active=true`).flush(page([OTHER_CATEGORY], 11, 2, 2));
    await settle();
    await click(buttonByText('Editar', 'tbody') as HTMLButtonElement);
    expect(router.navigate).toHaveBeenCalledWith(['/categories', 'cat-2', 'edit']);
    fixture.destroy();

    await render(true, [OTHER_CATEGORY], `${API_BASE}/categories?page=2&size=10&active=true`);

    expect(chipTexts()).toEqual(['Situação: Ativos']);
  });

  it('mostra "Incluir" com CREATE e navega para a inclusão', async () => {
    await render();

    await click(buttonByText('Incluir', '.list-toolbar') as HTMLButtonElement);

    expect(router.navigate).toHaveBeenCalledWith(['/categories/new']);
  });

  it('não mostra Incluir, Editar nem lixeira sem permissão de escrita', async () => {
    await render(false);

    expect(buttonByText('Incluir')).toBeUndefined();
    expect(buttonByText('Editar')).toBeUndefined();
    expect(deleteButtons()).toHaveLength(0);
  });

  it('na falha de carga mostra a mensagem na área, sem o vazio', async () => {
    fixture = TestBed.createComponent(Categories);
    fixture.detectChanges();
    expect(query('.loading-state')).not.toBeNull();
    expect(query('.empty-state')).toBeNull();

    httpMock.expectOne(DEFAULT_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await settle();

    expect(query('.load-error').textContent?.trim()).toBe('Não foi possível carregar as categorias.');
    expect(query('.empty-state')).toBeNull();
    expect(toasts()[0].title).toBe('Falha');
  });

  it('exibe a lixeira nas linhas ativas e inativas com rótulo Excluir e ícone de 20px', async () => {
    await render(true, [CATEGORY, INACTIVE_CATEGORY]);

    const buttons = deleteButtons();
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button.getAttribute('aria-label')).toBe('Excluir');
      expect(button.getAttribute('title')).toBe('Excluir');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.querySelector('svg')?.getAttribute('width')).toBe('20');
    });
  });

  it('exibe a lixeira para o perfil com permissão de excluir, mesmo sem permissão de alterar', async () => {
    await renderWithPermissions([categoriesPermission({ canDelete: true })]);

    expect(deleteButtons()).toHaveLength(1);
    expect(buttonByText('Editar')).toBeUndefined();
  });

  it('não coloca a lixeira no DOM sem a permissão de excluir', async () => {
    await renderWithPermissions([categoriesPermission({ canCreate: true, canEdit: true })]);

    expect(buttonByText('Editar', 'tbody')).toBeTruthy();
    expect(buttonByText('Incluir')).toBeTruthy();
    expect(deleteButtons()).toHaveLength(0);
  });

  it('abre a confirmação citando o nome e fecha em Cancelar sem HTTP e sem toast', async () => {
    await render();

    await click(deleteButtons()[0]);

    expect(query('.modal-card p').textContent).toContain('"Mercado"');
    expect(query('.modal-actions button.primary-button').textContent?.trim()).toBe('Excluir categoria');

    await click(query<HTMLButtonElement>('.modal-actions button.ghost-button'));

    expect(query('.modal-backdrop')).toBeNull();
    expect(toasts()).toEqual([]);
    httpMock.expectNone(() => true);
  });

  it('exclui ao confirmar, recarrega a página e exibe toast de sucesso', async () => {
    await render(true, [CATEGORY, OTHER_CATEGORY]);

    await confirmDeletion();

    const request = httpMock.expectOne(`${API_BASE}/categories/cat-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    httpMock.expectOne(DEFAULT_URL).flush(page([OTHER_CATEGORY]));
    await settle();

    expect(rowNames()).toEqual(['Salario']);
    expect(toasts().map((toast) => [toast.title, toast.message])).toEqual([['Sucesso', 'Categoria excluída com sucesso.']]);
  });

  it('exibe alerta com a mensagem do backend em linhas no 409 e mantém a categoria na lista', async () => {
    await render();

    await confirmDeletion();

    httpMock
      .expectOne(`${API_BASE}/categories/cat-1`)
      .flush({ message: BLOCKING_MESSAGE }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(rowNames()).toEqual(['Mercado']);
    expect(toasts()[0].title).toBe('Alerta');
    expect(toasts()[0].message.split('\n')).toEqual([
      'Não é possível excluir a categoria. Ela está em uso em:',
      'Lançamentos: 3 registros',
    ]);
  });

  it('confirma a exclusão e avisa só da lista quando o recarregamento falha', async () => {
    await render(true, [CATEGORY, OTHER_CATEGORY]);

    await confirmDeletion();

    httpMock.expectOne(`${API_BASE}/categories/cat-1`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    httpMock.expectOne(DEFAULT_URL).flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts().map((toast) => [toast.type, toast.message])).toEqual([
      ['success', 'Categoria excluída com sucesso.'],
      ['error', 'Não foi possível carregar as categorias.'],
    ]);
  });

  it('não soma aviso da lista quando o recarregamento responde 401, que já tem dono', async () => {
    await render(true, [CATEGORY, OTHER_CATEGORY]);

    await confirmDeletion();

    httpMock.expectOne(`${API_BASE}/categories/cat-1`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    httpMock.expectOne(DEFAULT_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(toasts().map((toast) => toast.message)).toEqual(['Categoria excluída com sucesso.']);
  });

  it('ao excluir o único item da última página, volta para a página anterior', async () => {
    fixture = TestBed.createComponent(Categories);
    TestBed.inject(AuthService).superAdmin.set(true);
    fixture.detectChanges();
    httpMock.expectOne(DEFAULT_URL).flush(page([CATEGORY], 11, 2));
    await settle();
    await click(buttonByText('Próxima') as HTMLButtonElement);
    httpMock.expectOne(`${API_BASE}/categories?page=2&size=10&active=true`).flush(page([OTHER_CATEGORY], 11, 2, 2));
    await settle();

    await confirmDeletion();
    httpMock.expectOne(`${API_BASE}/categories/cat-2`).flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    httpMock.expectOne(`${API_BASE}/categories?page=2&size=10&active=true`).flush(page([], 10, 1, 2));
    await settle();
    httpMock.expectOne(DEFAULT_URL).flush(page([CATEGORY], 10, 1));
    await settle();

    expect(query('.pagination-status').textContent?.trim()).toBe('Página 1 de 1');
    expect(rowNames()).toEqual(['Mercado']);
  });
});
