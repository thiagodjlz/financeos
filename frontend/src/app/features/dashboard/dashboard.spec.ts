import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE, DashboardSummary, MonthlySummary } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '../../core/http-error';
import { Dashboard } from './dashboard';

const PLOT_TOP = 16;
const PLOT_BOTTOM = 196;
const CHART_WIDTH = 840;
const PLOT_LEFT = 64;
const PLOT_RIGHT = 828;
const GROUP_WIDTH = (PLOT_RIGHT - PLOT_LEFT) / 12;

type MonthValues = [income: number, expense: number, balance: number];

function evolution(values: Partial<Record<number, MonthValues>> = {}): MonthlySummary[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const [income, expense, balance] = values[month] ?? [0, 0, 0];
    return { year: 2026, month, income, expense, balance };
  });
}

function payload(monthlyEvolution: MonthlySummary[]): DashboardSummary {
  return {
    period: { year: 2026, month: 7, startDate: '2026-07-01', endDate: '2026-07-31' },
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    paidExpense: 0,
    pendingExpense: 0,
    transactionCount: 0,
    categoryBreakdown: [],
    monthlyEvolution,
  };
}

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(Dashboard);
  });

  afterEach(() => httpMock.verify());

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function toasts() {
    return toastService.toasts();
  }

  function summaryRequest() {
    fixture.detectChanges();
    return httpMock.expectOne((request) => request.url.startsWith(`${API_BASE}/dashboard/summary`));
  }

  async function render(monthlyEvolution: MonthlySummary[] = evolution()): Promise<void> {
    summaryRequest().flush(payload(monthlyEvolution));
    await settle();
  }

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function chart(): SVGSVGElement {
    return host().querySelector<SVGSVGElement>('svg.evolution-chart')!;
  }

  function all(selector: string): Element[] {
    return Array.from(host().querySelectorAll(selector));
  }

  function one(selector: string): Element | null {
    return host().querySelector(selector);
  }

  function num(element: Element | null | undefined, attribute: string): number {
    return Number(element?.getAttribute(attribute));
  }

  function label(element: Element | null | undefined): string {
    if (!element) {
      return '';
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const parts: string[] = [];

    while (walker.nextNode()) {
      const part = (walker.currentNode.textContent ?? '').replace(/\u00a0/g, ' ').trim();
      if (part) {
        parts.push(part);
      }
    }

    return parts.join(' ');
  }

  function axisLabels(): string[] {
    return all('text.chart-axis-label').map(label);
  }

  function tooltipText(): string {
    return label(one('.chart-tooltip'));
  }

  function hitArea(index: number): Element {
    return all('rect.month-hit')[index];
  }

  async function hover(index: number): Promise<void> {
    hitArea(index).dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    await settle();
  }

  async function touch(target: Element): Promise<void> {
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    target.dispatchEvent(event);
    await settle();
  }

  async function press(key: string): Promise<void> {
    chart().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await settle();
  }

  it('exibe toast de falha quando a API responde 500', async () => {
    summaryRequest().flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
    expect(toasts()[0].message).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(toasts()[0].duration).toBeNull();
  });

  it('exibe toast de falha quando a API está fora do ar (status 0)', async () => {
    summaryRequest().error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
    expect(toasts()[0].message).toBe(NETWORK_ERROR_MESSAGE);
  });

  it('não exibe toast quando a carga responde 200', async () => {
    summaryRequest().flush({
      period: { year: 2026, month: 7, startDate: '2026-07-01', endDate: '2026-07-31' },
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      paidExpense: 0,
      pendingExpense: 0,
      transactionCount: 0,
      categoryBreakdown: [],
      monthlyEvolution: [],
    });
    await settle();

    expect(toasts()).toEqual([]);
  });

  describe('escala do gráfico', () => {
    it('plota o ponto de saldo na mesma escala da barra de receita', async () => {
      await render(evolution({ 1: [1000, 0, 1000] }));

      const barY = num(all('rect.bar-income')[0], 'y');
      const pointY = num(all('circle.balance-point')[0], 'cy');

      expect(Math.abs(pointY - barY)).toBeLessThanOrEqual(0.5);
    });

    it('plota o saldo proporcional à barra de receita no mês com despesa', async () => {
      await render(evolution({ 1: [1000, 400, 600] }));

      const barY = num(all('rect.bar-income')[0], 'y');
      const zeroY = num(one('line.chart-zero-line'), 'y1');
      const pointY = num(all('circle.balance-point')[0], 'cy');

      expect(pointY).toBeGreaterThan(barY);
      expect(pointY).toBeLessThan(zeroY);
      expect(Math.abs(zeroY - pointY - 0.6 * (zeroY - barY))).toBeLessThanOrEqual(0.5);
    });

    it('arredonda o topo do eixo para a marca redonda acima do maior valor', async () => {
      await render(evolution({ 1: [1000, 0, 1400] }));

      const topValue = 1500;
      const step = 250;

      expect(axisLabels()).toEqual([
        'R$ 0',
        'R$ 250',
        'R$ 500',
        'R$ 750',
        'R$ 1 mil',
        'R$ 1,25 mil',
        'R$ 1,5 mil',
      ]);
      expect(topValue).toBeGreaterThanOrEqual(1400);
      expect(topValue % step).toBe(0);

      const gridLines = all('line.chart-grid-line');
      expect(num(gridLines[gridLines.length - 1], 'y1')).toBeCloseTo(PLOT_TOP, 5);
      expect(num(all('circle.balance-point')[0], 'cy')).toBeGreaterThan(PLOT_TOP);
      expect(num(all('rect.bar-income')[0], 'y')).toBeGreaterThan(PLOT_TOP);
    });

    it('mantém todas as séries dentro da área de plotagem, inclusive com saldo negativo', async () => {
      await render(evolution({ 1: [100, 500, -400], 5: [600, 100, 500] }));

      for (const bar of all('rect.bar-income, rect.bar-expense')) {
        expect(num(bar, 'y')).toBeGreaterThanOrEqual(PLOT_TOP - 0.5);
        expect(num(bar, 'y') + num(bar, 'height')).toBeLessThanOrEqual(PLOT_BOTTOM + 0.5);
      }

      for (const point of all('circle.balance-point')) {
        expect(num(point, 'cy')).toBeGreaterThanOrEqual(PLOT_TOP - 0.5);
        expect(num(point, 'cy')).toBeLessThanOrEqual(PLOT_BOTTOM + 0.5);
      }
    });

    it('desenha o saldo negativo abaixo da linha de zero, com as barras apoiadas nela', async () => {
      await render(evolution({ 1: [100, 500, -400] }));

      const zeroLine = one('line.chart-zero-line');
      expect(zeroLine).not.toBeNull();

      const zeroY = num(zeroLine, 'y1');
      const incomeBar = all('rect.bar-income')[0];

      expect(num(all('circle.balance-point')[0], 'cy')).toBeGreaterThan(zeroY);
      expect(Math.abs(num(incomeBar, 'y') + num(incomeBar, 'height') - zeroY)).toBeLessThanOrEqual(
        0.5,
      );
    });

    it('plota o saldo recebido da API, sem recalcular receita menos despesa', async () => {
      await render(evolution({ 1: [1000, 200, 700] }));

      const barY = num(all('rect.bar-income')[0], 'y');
      const zeroY = num(one('line.chart-zero-line'), 'y1');
      const scale = (value: number) => zeroY - (value / 1000) * (zeroY - barY);
      const pointY = num(all('circle.balance-point')[0], 'cy');

      expect(Math.abs(pointY - scale(700))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(pointY - scale(800))).toBeGreaterThan(0.5);
    });

    it('não gera atributo NaN em ano sem lançamentos', async () => {
      await render();

      expect(chart().getAttribute('viewBox')).toBe(`0 0 ${CHART_WIDTH} 240`);

      for (const element of Array.from(chart().querySelectorAll('*'))) {
        for (const attribute of ['x', 'y', 'width', 'height', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2']) {
          if (element.hasAttribute(attribute)) {
            expect(Number.isFinite(num(element, attribute))).toBe(true);
          }
        }
      }
    });
  });

  describe('saldo mensal e fim da linha', () => {
    it('plota o saldo do próprio mês, e não um acumulado', async () => {
      await render(evolution({ 1: [1000, 0, 1000], 2: [500, 0, 500] }));

      const points = all('circle.balance-point');
      const zeroY = num(one('line.chart-zero-line'), 'y1');
      const janY = num(points[0], 'cy');
      const fevY = num(points[1], 'cy');

      expect(fevY).toBeGreaterThan(janY);
      expect(Math.abs(zeroY - fevY - (zeroY - janY) / 2)).toBeLessThanOrEqual(0.5);
    });

    it('interrompe a linha de saldo depois do último mês com lançamento', async () => {
      await render(
        evolution({
          1: [1000, 0, 1000],
          2: [900, 100, 800],
          3: [900, 100, 800],
          4: [900, 100, 800],
          5: [900, 100, 800],
          6: [900, 100, 800],
          7: [900, 100, 800],
          8: [900, 100, 800],
        }),
      );

      expect(all('circle.balance-point')).toHaveLength(8);
      expect(one('polyline.balance-line')!.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(
        8,
      );
    });

    it('mantém na linha o mês sem lançamento que fica no meio da série', async () => {
      await render(evolution({ 1: [1000, 0, 1000], 3: [500, 0, 500] }));

      expect(all('circle.balance-point')).toHaveLength(3);
      expect(one('polyline.balance-line')!.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(
        3,
      );
    });

    it('desenha as barras dos meses depois do fim da linha e mantém os 12 meses no eixo X', async () => {
      await render(
        evolution({
          1: [1000, 400, 600],
          9: [700, 0, 700],
          10: [700, 0, 700],
          11: [700, 0, 700],
          12: [700, 0, 700],
        }),
      );

      expect(all('text.chart-month').map(label)).toEqual([
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ]);
      expect(all('circle.balance-point')).toHaveLength(12);
      expect(num(all('rect.bar-income')[8], 'height')).toBeGreaterThan(0);
    });

    it('não desenha ponto nem linha de saldo no ano sem lançamentos', async () => {
      await render();

      expect(all('circle.balance-point')).toHaveLength(0);
      expect(one('polyline.balance-line')).toBeNull();
      expect(all('text.chart-month')).toHaveLength(12);
    });
  });

  describe('eixo, título e legenda', () => {
    it('rotula o eixo em milhares e mostra o valor cheio no informativo', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      expect(axisLabels()).toEqual([
        'R$ 0',
        'R$ 250',
        'R$ 500',
        'R$ 750',
        'R$ 1 mil',
        'R$ 1,25 mil',
        'R$ 1,5 mil',
      ]);
      expect(axisLabels()).toContain('R$ 1,5 mil');
      expect(axisLabels()).toContain('R$ 0');

      await hover(2);

      expect(tooltipText()).toContain('R$ 1.500,00');
      expect(tooltipText()).not.toContain('R$ 1,5 mil');
    });

    it('rotula o eixo com valores negativos abaixo de mil', async () => {
      const series = evolution({ 1: [400, 0, 400], 2: [0, 1000, -1000] });

      for (const month of series) {
        expect(month.balance).toBe(month.income - month.expense);
      }

      await render(series);

      expect(axisLabels()).toEqual([
        '-R$ 1 mil',
        '-R$ 500',
        'R$ 0',
        'R$ 500',
        'R$ 1 mil',
      ]);
      expect(axisLabels()).toContain('-R$ 500');
      expect(axisLabels()).toContain('R$ 0');
    });

    it('rotula o eixo em milhões', async () => {
      await render(evolution({ 4: [1_200_000, 200_000, 1_000_000] }));

      expect(axisLabels()).toEqual([
        'R$ 0',
        'R$ 200 mil',
        'R$ 400 mil',
        'R$ 600 mil',
        'R$ 800 mil',
        'R$ 1 mi',
        'R$ 1,2 mi',
      ]);
      expect(axisLabels()).toContain('R$ 1,2 mi');
    });

    it('desenha uma gridline horizontal para cada marca do eixo', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      const gridLines = all('line.chart-grid-line');

      expect(gridLines).toHaveLength(axisLabels().length);
      expect(gridLines.length).toBeGreaterThanOrEqual(4);

      for (const line of gridLines) {
        expect(num(line, 'y1')).toBe(num(line, 'y2'));
        expect(num(line, 'y1')).toBeGreaterThanOrEqual(PLOT_TOP);
        expect(num(line, 'y1')).toBeLessThanOrEqual(PLOT_BOTTOM);
        expect(num(line, 'x1')).toBe(PLOT_LEFT);
        expect(num(line, 'x2')).toBe(PLOT_RIGHT);
      }
    });

    it('exibe o título e o rótulo acessível acentuados', async () => {
      await render();

      expect(label(one('.chart-panel h3'))).toBe('Evolução anual');
      expect(chart().getAttribute('aria-label')).toContain('Gráfico de evolução anual');
    });

    it('mantém a legenda das três séries com marcador de linha no saldo', async () => {
      await render();

      expect(all('.chart-legend span').map(label)).toEqual(['Receita', 'Despesa', 'Saldo']);
      expect(one('.chart-legend .legend-marker.balance')).not.toBeNull();
    });
  });

  describe('informativo por mouse', () => {
    it('exibe receita, despesa e saldo do mês apontado', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      await hover(2);

      expect(tooltipText()).toBe('Março Receita R$ 1.500,00 Despesa R$ 400,00 Saldo R$ 1.100,00');
    });

    it('cobre a faixa inteira do mês e exibe zero no mês sem lançamento', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      const hit = hitArea(5);

      expect(num(hit, 'width')).toBeCloseTo(GROUP_WIDTH, 5);
      expect(num(hit, 'y')).toBe(PLOT_TOP);
      expect(num(hit, 'height')).toBe(PLOT_BOTTOM - PLOT_TOP);

      await hover(5);

      expect(tooltipText()).toBe('Junho Receita R$ 0,00 Despesa R$ 0,00 Saldo R$ 0,00');
    });

    it('fecha o informativo ao tirar o mouse da faixa do mês', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      await hover(2);
      expect(one('.chart-tooltip')).not.toBeNull();

      hitArea(2).dispatchEvent(new MouseEvent('mouseleave'));
      await settle();

      expect(one('.chart-tooltip')).toBeNull();
    });

    it('abre o informativo sem disparar requisição', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      await hover(2);
      hitArea(2).dispatchEvent(new MouseEvent('mousemove'));
      await settle();

      expect(one('.chart-tooltip')).not.toBeNull();
      httpMock.expectNone(() => true);
    });
  });

  describe('informativo por toque', () => {
    it('abre pelo toque o mesmo informativo do mouse', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      await hover(2);
      const byHover = tooltipText();

      hitArea(2).dispatchEvent(new MouseEvent('mouseleave'));
      await settle();

      await touch(hitArea(2));

      expect(tooltipText()).toBe(byHover);
    });

    it('troca o informativo ao tocar em outro mês e fecha ao tocar fora do gráfico', async () => {
      await render(evolution({ 3: [1500, 400, 1100], 4: [200, 100, 100] }));

      await touch(hitArea(2));
      expect(tooltipText()).toContain('Março');

      await touch(hitArea(3));
      expect(all('.chart-tooltip')).toHaveLength(1);
      expect(tooltipText()).toBe('Abril Receita R$ 200,00 Despesa R$ 100,00 Saldo R$ 100,00');

      await touch(document.body);
      expect(one('.chart-tooltip')).toBeNull();
    });
  });

  describe('teclado e acessibilidade', () => {
    it('entra na ordem de tabulação com uma única parada', async () => {
      await render();

      expect(chart().getAttribute('tabindex')).toBe('0');
      expect(all('.chart-panel [tabindex]:not([tabindex="-1"])')).toHaveLength(1);
    });

    it('navega entre os meses com as setas e para nas extremidades', async () => {
      await render(evolution({ 1: [100, 0, 100], 3: [1500, 400, 1100] }));

      await press('ArrowRight');
      expect(tooltipText()).toContain('Janeiro');

      await press('ArrowLeft');
      expect(tooltipText()).toContain('Janeiro');

      await press('ArrowRight');
      await press('ArrowRight');
      expect(tooltipText()).toBe('Março Receita R$ 1.500,00 Despesa R$ 400,00 Saldo R$ 1.100,00');

      await press('End');
      expect(tooltipText()).toContain('Dezembro');

      await press('ArrowRight');
      expect(tooltipText()).toContain('Dezembro');
    });

    it('destaca a faixa do mês focado', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      await press('ArrowRight');
      await press('ArrowRight');
      await press('ArrowRight');

      const bands = all('rect.month-band');

      expect(bands.filter((band) => band.classList.contains('is-active'))).toHaveLength(1);
      expect(bands[2].classList.contains('is-active')).toBe(true);
    });

    it('fecha o informativo com Escape mantendo o foco no gráfico', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      chart().focus();
      await press('ArrowRight');
      expect(one('.chart-tooltip')).not.toBeNull();

      await press('Escape');

      expect(one('.chart-tooltip')).toBeNull();
      expect(document.activeElement).toBe(chart());
    });

    it('anuncia o mês focado em português para leitores de tela', async () => {
      await render(evolution({ 3: [1500, 400, 1100] }));

      expect(one('.chart-tooltip-layer')!.getAttribute('aria-live')).toBe('polite');

      await press('ArrowRight');
      await press('ArrowRight');
      await press('ArrowRight');

      const announcement = 'Março: Receita R$ 1.500,00, Despesa R$ 400,00, Saldo R$ 1.100,00';

      expect(label(one('.chart-tooltip-layer .sr-only'))).toBe(announcement);
      expect(
        (chart().getAttribute('aria-label') ?? '').replace(/\u00a0/g, ' '),
      ).toContain(announcement);
    });
  });

  describe('não-regressão do Resumo', () => {
    it('recarrega o resumo ao trocar o mês, com uma única chamada', async () => {
      await render(evolution({ 1: [1000, 0, 1000] }));

      const select = host().querySelector('select')!;
      select.selectedIndex = 2;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      httpMock
        .expectOne((request) => request.url.startsWith(`${API_BASE}/dashboard/summary`))
        .flush(payload(evolution({ 1: [500, 0, 500], 2: [500, 0, 500] })));
      await settle();

      expect(all('circle.balance-point')).toHaveLength(2);
    });

    it('mantém os cards de métricas e o painel de detalhamento', async () => {
      await render();

      expect(all('.metric-card .metric-label').map(label)).toEqual([
        'Receitas',
        'Despesas',
        'Pendentes',
        'Saldo',
      ]);
      expect(label(one('.breakdown-panel h3'))).toBe('Detalhamento');
      expect(all('.breakdown-panel .empty-state').map(label)).toEqual([
        'Sem dados no período',
        'Sem dados no período',
      ]);
    });
  });
});
