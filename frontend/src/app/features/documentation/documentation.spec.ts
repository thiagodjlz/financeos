import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, DocumentationContent } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { Documentation } from './documentation';

const CONTENT: DocumentationContent = {
  title: 'Central de Documentação',
  introduction: {
    id: 'overview',
    title: 'Como utilizar o sistema',
    summary: 'Conceitos gerais do sistema.',
    sections: [
      {
        title: 'Descrição',
        blocks: [{ kind: 'PARAGRAPH', text: 'Sistema de controle financeiro pessoal.', items: [], table: null }],
      },
    ],
  },
  areas: [
    {
      id: 'dashboard',
      title: 'Resumo',
      summary: 'Os totais do mês escolhido.',
      sections: [
        {
          title: 'Indicadores e cálculos',
          blocks: [
            {
              kind: 'TABLE',
              text: null,
              items: [],
              table: {
                columns: ['Indicador', 'O que entra na conta'],
                rows: [['Saldo', 'Receitas menos Despesas pagas.']],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'transactions',
      title: 'Lançamentos',
      summary: 'Onde as receitas e despesas são registradas.',
      sections: [
        {
          title: 'Regras de negócio',
          blocks: [
            { kind: 'LIST', text: null, items: ['Cancelar não apaga o registro.'], table: null },
            { kind: 'HIGHLIGHT', text: 'Nenhum registro é removido.', items: [], table: null },
          ],
        },
      ],
    },
  ],
};

describe('Documentation', () => {
  let fixture: ComponentFixture<Documentation>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Documentation],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => httpMock.verify());

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function create(): void {
    fixture = TestBed.createComponent(Documentation);
    fixture.detectChanges();
  }

  async function render(): Promise<void> {
    create();
    httpMock.expectOne(`${API_BASE}/documentation`).flush(CONTENT);
    await settle();
  }

  function query<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function indexLabels(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.doc-area-link')).map((button) =>
      (button as HTMLElement).textContent?.trim() ?? '',
    );
  }

  function sectionTitles(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.doc-section-title')).map((title) =>
      (title as HTMLElement).textContent?.trim() ?? '',
    );
  }

  function activeAreaTitle(): string {
    return query('.doc-area-title')?.textContent?.trim() ?? '';
  }

  async function type(term: string): Promise<void> {
    const input = query<HTMLInputElement>('.doc-search input')!;
    input.value = term;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  function toasts() {
    return toastService.toasts();
  }

  it('carrega o conteúdo uma única vez e não repete a chamada ao buscar ou trocar de área', async () => {
    await render();

    expect(indexLabels()).toEqual(['Como utilizar o sistema', 'Resumo', 'Lançamentos']);
    expect(activeAreaTitle()).toBe('Como utilizar o sistema');

    await type('lançamento');
    httpMock.expectNone(() => true);

    await type('');
    await click('Resumo');
    httpMock.expectNone(() => true);
  });

  async function click(areaLabel: string): Promise<void> {
    const button = Array.from(fixture.nativeElement.querySelectorAll('.doc-area-link')).find(
      (candidate) => (candidate as HTMLElement).textContent?.trim() === areaLabel,
    ) as HTMLButtonElement;
    button.click();
    await settle();
  }

  it('navega entre as áreas pelo índice, sem requisição', async () => {
    await render();

    await click('Lançamentos');

    expect(activeAreaTitle()).toBe('Lançamentos');
    expect(sectionTitles()).toEqual(['Regras de negócio']);
    httpMock.expectNone(() => true);
  });

  it('filtra o conteúdo pela busca e restaura ao limpar o campo', async () => {
    await render();

    await type('indicador');

    expect(indexLabels()).toEqual(['Resumo']);
    expect(activeAreaTitle()).toBe('Resumo');
    expect(sectionTitles()).toEqual(['Indicadores e cálculos']);

    await type('');

    expect(indexLabels()).toEqual(['Como utilizar o sistema', 'Resumo', 'Lançamentos']);
    httpMock.expectNone(() => true);
  });

  it('encontra o conteúdo pelo texto de lista e de destaque', async () => {
    await render();

    await type('removido');

    expect(indexLabels()).toEqual(['Lançamentos']);
    expect(activeAreaTitle()).toBe('Lançamentos');
  });

  it('mostra um estado vazio em português quando a busca não encontra nada', async () => {
    await render();

    await type('assunto que não existe');

    expect(indexLabels()).toEqual([]);
    expect(query('.doc-content .empty-state')?.textContent?.trim()).toBe(
      'Nenhum conteúdo encontrado para a sua busca.',
    );
    expect(query('.doc-index .empty-state')?.textContent?.trim()).toBe('Nenhuma área corresponde à busca.');
    httpMock.expectNone(() => true);
  });

  it('mostra o estado de carga sem estado vazio antes da resposta', async () => {
    create();

    expect(query('.loading-state')).not.toBeNull();
    expect(query('.empty-state')).toBeNull();
    expect(query('[aria-busy="true"]')).not.toBeNull();

    httpMock.expectOne(`${API_BASE}/documentation`).flush(CONTENT);
    await settle();

    expect(query('.loading-state')).toBeNull();
  });

  it('trata o erro da API pelo canal padrão de feedback', async () => {
    create();
    httpMock
      .expectOne(`${API_BASE}/documentation`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
  });

  it('exibe o 403 como Alerta, não como Falha', async () => {
    create();
    httpMock
      .expectOne(`${API_BASE}/documentation`)
      .flush(
        { message: 'Você não tem permissão para realizar esta ação.' },
        { status: 403, statusText: 'Forbidden' },
      );
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Alerta');
  });

  it('põe data-label em cada célula das tabelas do conteúdo', async () => {
    await render();
    await click('Resumo');

    const cells = Array.from(fixture.nativeElement.querySelectorAll('.doc-content td')) as HTMLElement[];
    expect(cells.map((cell) => cell.getAttribute('data-label'))).toEqual([
      'Indicador',
      'O que entra na conta',
    ]);
  });
});
