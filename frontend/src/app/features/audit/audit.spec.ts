import { provideHttpClient } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { dateTimeLabel } from '../../core/formatters';
import { API_BASE, AuditOptions, AuditRecord, Page } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { Audit, lastDaysPeriod } from './audit';

const OPTIONS_URL = `${API_BASE}/audit/options`;

const OPTIONS: AuditOptions = {
  types: [
    { code: 'CHANGE', label: 'Alteração' },
    { code: 'LOGIN', label: 'Login' },
    { code: 'PRINT', label: 'Impressão' },
  ],
  actions: [
    { code: 'CREATE', label: 'Inclusão' },
    { code: 'UPDATE', label: 'Alteração' },
  ],
  screens: [
    { code: 'CATEGORIES', label: 'Categorias' },
    { code: 'AUDIT', label: 'Auditoria' },
  ],
};

const CHANGE: AuditRecord = {
  id: 'a1',
  occurredAt: '2026-10-06T17:05:09Z',
  userName: 'Ana Souza',
  userEmail: 'ana@financeos.local',
  type: 'CHANGE',
  typeLabel: 'Alteração',
  action: 'UPDATE',
  actionLabel: 'Alteração',
  screen: 'CATEGORIES',
  screenLabel: 'Categorias',
  recordId: 'c1',
  recordLabel: 'Mercado',
  changes: [
    { field: 'Cor', oldValue: '#ff0000', newValue: '#00ff00' },
    { field: 'Categoria pai', oldValue: null, newValue: 'Casa' },
  ],
};

// Tipo que esta versão da tela não conhece: aparece pelo rótulo que o back-end mandou.
const FUTURE_EVENT: AuditRecord = {
  id: 'a2',
  occurredAt: '2026-10-06T16:00:00Z',
  userName: null,
  userEmail: 'desconhecido@financeos.local',
  type: 'NOVO_EVENTO',
  typeLabel: 'Evento novo',
  action: null,
  actionLabel: null,
  screen: null,
  screenLabel: null,
  recordId: null,
  recordLabel: null,
  changes: [],
};

function page(items: AuditRecord[], totalItems = items.length): Page<AuditRecord> {
  return { items, totalItems, totalPages: items.length ? 1 : 0, page: 1, size: 10 };
}

describe('Audit', () => {
  let fixture: ComponentFixture<Audit>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Audit],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    document.body.classList.remove('overlay-open');
  });

  function isList(request: HttpRequest<unknown>): boolean {
    return request.url === `${API_BASE}/audit`;
  }

  async function render(records: Page<AuditRecord> = page([CHANGE, FUTURE_EVENT])): Promise<HttpRequest<unknown>> {
    fixture = TestBed.createComponent(Audit);
    fixture.detectChanges();
    const listRequest = httpMock.expectOne(isList);
    listRequest.flush(records);
    httpMock.expectOne(OPTIONS_URL).flush(OPTIONS);
    await settle();
    return listRequest.request;
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
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

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await settle();
  }

  function buttonByText(text: string, scope = ''): HTMLButtonElement {
    return queryAll<HTMLButtonElement>(`${scope} button`).find((button) => button.textContent?.trim() === text)!;
  }

  function chipTexts(): string[] {
    return queryAll('.filter-chip span').map((chip) => chip.textContent?.trim() ?? '');
  }

  function selectOptions(name: string): string[] {
    return queryAll<HTMLOptionElement>(`select[name="${name}"] option`).map((option) => option.textContent?.trim() ?? '');
  }

  function choiceGroups(): HTMLElement[] {
    return queryAll('.filter-sheet .choice-toggle');
  }

  function groupLabels(): string[] {
    return queryAll('.filter-sheet [role="group"]').map((group) => {
      const id = group.getAttribute('aria-labelledby') ?? '';
      return fixture.nativeElement.querySelector(`#${id}`)?.textContent?.trim() ?? '';
    });
  }

  function choiceButtons(group: number): HTMLButtonElement[] {
    return Array.from(choiceGroups()[group].querySelectorAll('button'));
  }

  function choiceTexts(group: number): string[] {
    return choiceButtons(group).map((button) => button.textContent?.trim() ?? '');
  }

  function choicePressed(group: number): (string | null)[] {
    return choiceButtons(group).map((button) => button.getAttribute('aria-pressed'));
  }

  function choiceButton(group: number, text: string): HTMLButtonElement {
    return choiceButtons(group).find((button) => button.textContent?.trim() === text)!;
  }

  function rowCells(index: number): string[] {
    return Array.from(queryAll('table.audit-table tbody tr')[index].querySelectorAll('td')).map(
      (cell) => cell.textContent?.trim() ?? '',
    );
  }

  function detailRows(): string[][] {
    return queryAll('.detail-list > div:not(.changes-row)').map((row) => [
      (row.querySelector('dt')?.textContent ?? '').trim(),
      (row.querySelector('dd')?.textContent ?? '').trim(),
    ]);
  }

  it('abre filtrada nos últimos 30 dias, no fuso do navegador, e busca as opções dos filtros', async () => {
    const request = await render();
    const period = lastDaysPeriod();

    expect(request.params.get('startDate')).toBe(period.startDate);
    expect(request.params.get('endDate')).toBe(period.endDate);
    expect(request.params.get('timeZone')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(request.params.get('page')).toBe('1');
    expect(queryAll('.filter-chip span').map((chip) => chip.textContent?.trim())).toEqual([
      `Data inicial: ${period.startDate.split('-').reverse().join('/')}`,
      `Data final: ${period.endDate.split('-').reverse().join('/')}`,
    ]);
  });

  it('calcula o período padrão de hoje menos 30 dias até hoje', () => {
    expect(lastDaysPeriod(new Date(2026, 9, 6))).toEqual({ startDate: '2026-09-06', endDate: '2026-10-06' });
    expect(lastDaysPeriod(new Date(2026, 2, 15))).toEqual({ startDate: '2026-02-13', endDate: '2026-03-15' });
  });

  it('mostra as colunas com os rótulos do back-end, data e hora com segundos e rótulo em cada célula', async () => {
    await render();

    expect(queryAll('thead th').map((th) => th.textContent?.trim())).toEqual([
      'Data e hora',
      'Usuário',
      'Tipo',
      'Ação',
      'Funcionalidade',
      'Registro',
    ]);
    expect(rowCells(0)).toEqual([dateTimeLabel(CHANGE.occurredAt), 'Ana Souza', 'Alteração', 'Alteração', 'Categorias', 'Mercado']);
    expect(rowCells(0)[0]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    expect(rowCells(1)).toEqual([
      dateTimeLabel(FUTURE_EVENT.occurredAt),
      'desconhecido@financeos.local',
      'Evento novo',
      '—',
      '—',
      '—',
    ]);
    for (const cell of queryAll('table.audit-table tbody td')) {
      expect(cell.getAttribute('data-label')).not.toBeNull();
    }
  });

  it('não oferece incluir, editar nem excluir', async () => {
    await render();

    const labels = queryAll('button:not(.choice-toggle button)').map(
      (button) => button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '',
    );
    expect(labels.some((label) => /Nov[oa]|Editar|Excluir|Incluir/.test(label))).toBe(false);
  });

  it('a linha abre o Detalhe com todos os campos e a lista campo, anterior e novo', async () => {
    await render();

    queryAll<HTMLTableRowElement>('table.audit-table tbody tr')[0].click();
    await settle();

    expect(query('.detail-panel h2').textContent?.trim()).toBe('Mercado');
    expect(detailRows()).toEqual([
      ['Data e hora', dateTimeLabel(CHANGE.occurredAt)],
      ['Usuário', 'Ana Souza'],
      ['E-mail', 'ana@financeos.local'],
      ['Tipo', 'Alteração'],
      ['Ação', 'Alteração'],
      ['Funcionalidade', 'Categorias'],
      ['Registro', 'Mercado'],
    ]);
    expect(queryAll('.changes-table thead th').map((th) => th.textContent?.trim())).toEqual(['Campo', 'Anterior', 'Novo']);
    expect(
      queryAll('.changes-table tbody tr').map((row) =>
        Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim()),
      ),
    ).toEqual([
      ['Cor', '#ff0000', '#00ff00'],
      ['Categoria pai', '—', 'Casa'],
    ]);
    expect(query('.detail-actions')).toBeNull();

    (query('.detail-close') as HTMLButtonElement).click();
    await settle();
    expect(query('.detail-panel')).toBeNull();
  });

  it('abre o Detalhe pelo teclado no botão da data e mostra o tipo desconhecido pelo rótulo', async () => {
    await render();

    queryAll<HTMLButtonElement>('table.audit-table .detail-trigger')[1].click();
    await settle();

    expect(query('.detail-panel h2').textContent?.trim()).toBe('Evento novo');
    expect(query('.changes-table')).toBeNull();
  });

  it('oferece nos filtros as opções vindas do back-end, inclusive Impressão, em select no desktop e botões no celular', async () => {
    await render();

    expect(selectOptions('filterType')).toEqual(['Tipo: todos', 'Alteração', 'Login', 'Impressão']);
    expect(selectOptions('filterAction')).toEqual(['Ação: todas', 'Inclusão', 'Alteração']);
    expect(selectOptions('filterScreen')).toEqual(['Funcionalidade: todas', 'Categorias', 'Auditoria']);
    for (const select of queryAll<HTMLSelectElement>('select.filter-select')) {
      expect(select.classList).toContain('only-desktop');
      expect(select.closest('.filter-field')).toBeNull();
    }

    expect(groupLabels()).toEqual(['Tipo', 'Ação', 'Funcionalidade']);
    expect(choiceTexts(0)).toEqual(['Todos', 'Alteração', 'Login', 'Impressão']);
    expect(choiceTexts(1)).toEqual(['Todas', 'Inclusão', 'Alteração']);
    expect(choiceTexts(2)).toEqual(['Todas', 'Categorias', 'Auditoria']);
    for (const group of choiceGroups()) {
      expect(group.closest('.filter-field')?.classList).toContain('only-mobile');
      expect(group.querySelector('select')).toBeNull();
    }
    expect(choicePressed(0)).toEqual(['true', 'false', 'false', 'false']);
  });

  it('filtra pelo tipo com o rótulo no filtro ativo e "Limpar filtros" tira também o período', async () => {
    await render();

    const select = query<HTMLSelectElement>('select[name="filterType"]');
    select.value = 'LOGIN';
    select.dispatchEvent(new Event('change'));
    await settle();

    const filtered = httpMock.expectOne(isList);
    expect(filtered.request.params.get('type')).toBe('LOGIN');
    filtered.flush(page([]));
    await settle();
    expect(queryAll('.filter-chip span').map((chip) => chip.textContent?.trim())).toContain('Tipo: Login');
    expect(select.classList).toContain('is-set');
    expect(query('select[name="filterAction"]').classList).not.toContain('is-set');

    (Array.from(fixture.nativeElement.querySelectorAll('.link-button')) as HTMLButtonElement[])
      .find((button) => button.textContent?.trim() === 'Limpar filtros')
      ?.click();
    await settle();

    const cleared = httpMock.expectOne(isList);
    expect(cleared.request.params.has('startDate')).toBe(false);
    expect(cleared.request.params.has('endDate')).toBe(false);
    expect(cleared.request.params.has('type')).toBe(false);
    cleared.flush(page([]));
    await settle();
  });

  it('no painel do celular, Tipo, Ação e Funcionalidade em botões só valem em "Aplicar"', async () => {
    await render();
    const period = lastDaysPeriod();

    await click(query('.filter-toggle'));
    await click(choiceButton(0, 'Login'));
    await click(choiceButton(1, 'Inclusão'));
    await click(choiceButton(2, 'Categorias'));
    httpMock.expectNone(isList);

    expect(choicePressed(0)).toEqual(['false', 'false', 'true', 'false']);
    expect(choicePressed(1)).toEqual(['false', 'true', 'false']);
    expect(choicePressed(2)).toEqual(['false', 'true', 'false']);
    expect(chipTexts()).toEqual([
      `Data inicial: ${period.startDate.split('-').reverse().join('/')}`,
      `Data final: ${period.endDate.split('-').reverse().join('/')}`,
    ]);

    await click(buttonByText('Aplicar', '.filter-sheet'));
    const filtered = httpMock.expectOne(isList);
    expect(filtered.request.params.get('type')).toBe('LOGIN');
    expect(filtered.request.params.get('action')).toBe('CREATE');
    expect(filtered.request.params.get('screen')).toBe('CATEGORIES');
    filtered.flush(page([]));
    await settle();

    expect(chipTexts()).toEqual([
      `Data inicial: ${period.startDate.split('-').reverse().join('/')}`,
      `Data final: ${period.endDate.split('-').reverse().join('/')}`,
      'Tipo: Login',
      'Ação: Inclusão',
      'Funcionalidade: Categorias',
    ]);
  });

  it('no painel do celular, fechar sem "Aplicar" descarta a escolha dos botões', async () => {
    await render();

    await click(query('.filter-toggle'));
    await click(choiceButton(1, 'Alteração'));
    expect(choicePressed(1)).toEqual(['false', 'false', 'true']);

    await click(query<HTMLButtonElement>('.filter-sheet [aria-label="Fechar filtros"]'));
    httpMock.expectNone(isList);
    expect(choicePressed(1)).toEqual(['true', 'false', 'false']);
    expect(chipTexts().some((chip) => chip.startsWith('Ação'))).toBe(false);
  });

  it('mostra o erro do back-end quando a data inicial é posterior à final', async () => {
    await render();
    const toast = TestBed.inject(ToastService);

    const start = query<HTMLInputElement>('input[name="filterStartDate"]');
    start.value = '2099-01-01';
    start.dispatchEvent(new Event('input'));
    start.dispatchEvent(new Event('change'));
    await settle();

    httpMock
      .expectOne(isList)
      .flush({ message: 'A data inicial não pode ser posterior à data final.' }, { status: 400, statusText: 'Bad Request' });
    await settle();

    expect(toast.toasts().map((item) => item.message)).toContain('A data inicial não pode ser posterior à data final.');
  });
});
