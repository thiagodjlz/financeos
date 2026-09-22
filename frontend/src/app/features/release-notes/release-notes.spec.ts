import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, ReleaseNotesResponse } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { ReleaseNotes } from './release-notes';

const CONTENT: ReleaseNotesResponse = {
  currentVersion: '1.0.2',
  versions: [
    {
      version: '1.0.2',
      categories: [
        { kind: 'NEW', items: ['Nova área de novidades por versão.'] },
        { kind: 'IMPROVEMENT', items: ['Saudação personalizada no Resumo.'] },
        { kind: 'FIX', items: ['Contraste da borda dos campos corrigido.'] },
      ],
    },
  ],
};

describe('ReleaseNotes', () => {
  let fixture: ComponentFixture<ReleaseNotes>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseNotes],
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
    fixture = TestBed.createComponent(ReleaseNotes);
    fixture.detectChanges();
  }

  async function render(content: ReleaseNotesResponse = CONTENT): Promise<void> {
    create();
    httpMock.expectOne(`${API_BASE}/release-notes`).flush(content);
    await settle();
  }

  function query<T extends HTMLElement>(selector: string): T | null {
    return fixture.nativeElement.querySelector(selector) as T | null;
  }

  function queryAll<T extends HTMLElement>(selector: string): T[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  function blocks(): HTMLElement[] {
    return queryAll('.release-block');
  }

  function categoryTitles(block: HTMLElement): string[] {
    return Array.from(block.querySelectorAll('.release-category-title')).map(
      (title) => title.textContent?.trim() ?? '',
    );
  }

  function toasts() {
    return toastService.toasts();
  }

  it('carrega o conteúdo uma única vez', async () => {
    await render();

    httpMock.expectNone(() => true);
    expect(blocks()).toHaveLength(1);
  });

  it('nunca exibe um bloco da versão 1.0.1', async () => {
    await render();

    expect(blocks().map((block) => block.textContent)).not.toEqual(
      expect.arrayContaining([expect.stringContaining('1.0.1')]),
    );
  });

  it('o bloco mais antigo exibido é o 1.0.2, ordenado do mais recente ao mais antigo', async () => {
    const twoVersions: ReleaseNotesResponse = {
      currentVersion: '1.0.3',
      versions: [
        { version: '1.0.3', categories: [{ kind: 'NEW', items: ['Item da 1.0.3.'] }] },
        { version: '1.0.2', categories: [{ kind: 'NEW', items: ['Item da 1.0.2.'] }] },
      ],
    };

    await render(twoVersions);

    const titles = queryAll('.panel-heading h3').map((el) => el.textContent?.trim() ?? '');
    expect(titles).toEqual(['Versão v1.0.3', 'Versão v1.0.2']);
  });

  it('exibe só as categorias com conteúdo', async () => {
    const withEmptyCategory: ReleaseNotesResponse = {
      currentVersion: '1.0.2',
      versions: [
        {
          version: '1.0.2',
          categories: [{ kind: 'FIX', items: ['Correção única.'] }],
        },
      ],
    };

    await render(withEmptyCategory);

    expect(categoryTitles(blocks()[0])).toEqual(['Correções']);
  });

  it('rotula a versão mais recente como atual, calculada a partir de currentVersion', async () => {
    await render();

    const badge = query('.panel-heading span');
    expect(badge?.textContent?.trim()).toBe('atual');
  });

  it('não rotula versão nenhuma como atual quando currentVersion não bate com nenhum bloco', async () => {
    const mismatched: ReleaseNotesResponse = {
      currentVersion: '1.0.3',
      versions: [{ version: '1.0.2', categories: [{ kind: 'FIX', items: ['Correção.'] }] }],
    };

    await render(mismatched);

    expect(query('.panel-heading span')).toBeNull();
  });

  it('trata o erro da API pelo canal padrão de feedback', async () => {
    create();
    httpMock
      .expectOne(`${API_BASE}/release-notes`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
  });

  it('mostra o estado de carga antes da resposta', async () => {
    create();

    expect(query('.loading-state')).not.toBeNull();
    expect(query('[aria-busy="true"]')).not.toBeNull();

    httpMock.expectOne(`${API_BASE}/release-notes`).flush(CONTENT);
    await settle();

    expect(query('.loading-state')).toBeNull();
  });
});
