import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { longMonthName, money, monthName, shortMoney } from '../../core/formatters';
import { CategoryBreakdown, MonthlySummary, TransactionType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { ToastService } from '../../core/services/toast.service';
import {
  DayPeriod,
  GREETING_TICK_MS,
  buildGreeting,
  dayPeriod,
  greetingDisplayName,
} from './greeting';

const MONTHS_IN_YEAR = 12;
const CHART_HEIGHT = 240;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 196;
const MONTH_LABEL_Y = 214;
const AXIS_WIDTH = 64;
const NARROW_AXIS_WIDTH = 44;
const NARROW_CHART_WIDTH = 520;
const AXIS_LABEL_GAP = 10;
const PLOT_RIGHT_PAD = 12;
const DEFAULT_CHART_WIDTH = 840;
const MIN_CHART_WIDTH = 320;
const BAR_GAP = 3;
const MIN_BAR_WIDTH = 6;
const MAX_BAR_WIDTH = 18;
const BAR_WIDTH_RATIO = 0.26;
const TARGET_AXIS_INTERVALS = 6;
const MIN_AXIS_TICKS = 4;
const EMPTY_DOMAIN_MAX = 100;
const STEP_MANTISSAS = [1, 2, 2.5, 5];
const TOOLTIP_WIDTH = 196;
const COMPACT_MONTH_LABEL_WIDTH = 30;

type ActiveSource = 'mouse' | 'touch' | 'keyboard' | null;

interface ChartMonth {
  index: number;
  month: number;
  label: string;
  left: number;
  width: number;
  center: number;
  income: number;
  expense: number;
  balance: number;
  incomeX: number;
  incomeY: number;
  incomeH: number;
  expenseX: number;
  expenseY: number;
  expenseH: number;
}

interface ChartTick {
  value: number;
  label: string;
  y: number;
}

interface ChartPoint {
  index: number;
  cx: number;
  cy: number;
}

interface ChartModel {
  width: number;
  height: number;
  viewBox: string;
  plotTop: number;
  plotBottom: number;
  plotHeight: number;
  plotLeft: number;
  plotRight: number;
  monthLabelY: number;
  axisLabelX: number;
  barWidth: number;
  zeroY: number;
  months: ChartMonth[];
  ticks: ChartTick[];
  balancePoints: ChartPoint[];
  linePoints: string;
}

interface MonthTooltip {
  title: string;
  income: string;
  expense: string;
  balance: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  @ViewChild('chartViewport') private chartViewport?: ElementRef<HTMLElement>;

  private resizeObserver?: ResizeObserver;
  private greetingTimer?: ReturnType<typeof setInterval>;

  private readonly greetingPeriod = signal<DayPeriod>(dayPeriod(new Date().getHours()));
  private readonly greetingSeed = signal(Math.random());

  protected readonly greeting = computed(() =>
    buildGreeting(
      this.greetingPeriod(),
      greetingDisplayName(this.auth.me()?.name),
      this.greetingSeed(),
    ),
  );

  protected readonly loading = signal(false);
  protected readonly summary = this.dashboardService.summary;
  protected readonly chartWidth = signal(DEFAULT_CHART_WIDTH);
  protected readonly activeMonth = signal<number | null>(null);

  private readonly activeSource = signal<ActiveSource>(null);

  protected period = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };

  private readonly monthlySeries = computed<MonthlySummary[]>(() => {
    const received = this.summary()?.monthlyEvolution ?? [];
    const year = received[0]?.year ?? this.period.year;

    return Array.from({ length: MONTHS_IN_YEAR }, (_, index) => {
      const month = index + 1;
      return (
        received.find((item) => item.month === month) ?? {
          year,
          month,
          income: 0,
          expense: 0,
          balance: 0,
        }
      );
    });
  });

  protected readonly chart = computed<ChartModel>(() => {
    const width = this.chartWidth();
    const axisWidth = width < NARROW_CHART_WIDTH ? NARROW_AXIS_WIDTH : AXIS_WIDTH;
    const plotLeft = axisWidth;
    const plotRight = Math.max(plotLeft + MONTHS_IN_YEAR, width - PLOT_RIGHT_PAD);
    const groupWidth = (plotRight - plotLeft) / MONTHS_IN_YEAR;
    const barWidth = clamp(groupWidth * BAR_WIDTH_RATIO, MIN_BAR_WIDTH, MAX_BAR_WIDTH);
    const series = this.monthlySeries();

    const rawMax = series.reduce(
      (max, item) => Math.max(max, item.income, item.expense, item.balance),
      0,
    );
    const rawMin = series.reduce((min, item) => Math.min(min, item.balance), 0);
    const axis = buildAxis(rawMin, rawMax === 0 && rawMin === 0 ? EMPTY_DOMAIN_MAX : rawMax);
    const span = axis.domainMax - axis.domainMin || 1;
    const scaleY = (value: number) =>
      PLOT_BOTTOM - ((value - axis.domainMin) / span) * (PLOT_BOTTOM - PLOT_TOP);
    const zeroY = scaleY(0);

    const months: ChartMonth[] = series.map((item, index) => {
      const left = plotLeft + index * groupWidth;
      const center = left + groupWidth / 2;
      const incomeY = scaleY(item.income);
      const expenseY = scaleY(item.expense);

      return {
        index,
        month: item.month,
        label: monthAxisLabel(item.month, groupWidth),
        left,
        width: groupWidth,
        center,
        income: item.income,
        expense: item.expense,
        balance: item.balance,
        incomeX: center - barWidth - BAR_GAP / 2,
        incomeY,
        incomeH: Math.max(0, zeroY - incomeY),
        expenseX: center + BAR_GAP / 2,
        expenseY,
        expenseH: Math.max(0, zeroY - expenseY),
      };
    });

    const lastActiveIndex = series.reduce(
      (last, item, index) => (item.income !== 0 || item.expense !== 0 ? index : last),
      -1,
    );
    const balancePoints: ChartPoint[] = months
      .slice(0, lastActiveIndex + 1)
      .map((item) => ({ index: item.index, cx: item.center, cy: scaleY(item.balance) }));

    return {
      width,
      height: CHART_HEIGHT,
      viewBox: `0 0 ${width} ${CHART_HEIGHT}`,
      plotTop: PLOT_TOP,
      plotBottom: PLOT_BOTTOM,
      plotHeight: PLOT_BOTTOM - PLOT_TOP,
      plotLeft,
      plotRight,
      monthLabelY: MONTH_LABEL_Y,
      axisLabelX: axisWidth - AXIS_LABEL_GAP,
      barWidth,
      zeroY,
      months,
      ticks: axis.values.map((value) => ({ value, label: shortMoney(value), y: scaleY(value) })),
      balancePoints,
      linePoints: balancePoints.map((point) => `${point.cx},${point.cy}`).join(' '),
    };
  });

  protected readonly activeTooltip = computed<MonthTooltip | null>(() => {
    const index = this.activeMonth();
    if (index === null) {
      return null;
    }

    const month = this.chart().months[index];
    if (!month) {
      return null;
    }

    return {
      title: longMonthName(month.month),
      income: money(month.income),
      expense: money(month.expense),
      balance: money(month.balance),
    };
  });

  protected readonly announcement = computed(() => {
    const tooltip = this.activeTooltip();
    return tooltip
      ? `${tooltip.title}: Receita ${tooltip.income}, Despesa ${tooltip.expense}, Saldo ${tooltip.balance}`
      : '';
  });

  protected readonly chartAriaLabel = computed(() => {
    const base =
      'Gráfico de evolução anual de receitas, despesas e saldo. Use as setas para navegar entre os meses.';
    const announcement = this.announcement();
    return announcement ? `${base} ${announcement}` : base;
  });

  protected readonly tooltipLeft = computed(() => {
    const index = this.activeMonth();
    const model = this.chart();
    const month = index === null ? undefined : model.months[index];

    if (!month) {
      return 0;
    }

    return clamp(month.center - TOOLTIP_WIDTH / 2, 0, Math.max(0, model.width - TOOLTIP_WIDTH));
  });

  ngOnInit(): void {
    this.greetingTimer = setInterval(() => this.syncGreetingPeriod(), GREETING_TICK_MS);
    void this.load();
  }

  ngAfterViewInit(): void {
    const host = this.chartViewport?.nativeElement;
    if (!host) {
      return;
    }

    this.chartWidth.set(measureWidth(host));

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.chartWidth.set(measureWidth(host)));
    this.resizeObserver.observe(host);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    clearInterval(this.greetingTimer);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.closeTooltip();

    try {
      await this.dashboardService.refresh(this.period.year, this.period.month);
    } catch (err) {
      this.toast.fromHttpError(err, 'Não foi possível carregar o resumo.');
    } finally {
      this.loading.set(false);
    }
  }

  protected onMonthEnter(index: number): void {
    if (this.activeSource() === 'touch' && this.activeMonth() === index) {
      return;
    }

    this.openTooltip(index, 'mouse');
  }

  protected onMonthLeave(): void {
    // O toque dispara eventos de compatibilidade de mouse: fechar aqui sem checar a origem
    // apagaria na hora o informativo recem-aberto por `pointerdown`.
    if (this.activeSource() !== 'mouse') {
      return;
    }

    this.closeTooltip();
  }

  protected onMonthPointerDown(event: PointerEvent, index: number): void {
    if (event.pointerType === 'mouse') {
      return;
    }

    event.stopPropagation();
    this.openTooltip(index, 'touch');
  }

  protected onChartKeydown(event: KeyboardEvent): void {
    const current = this.activeMonth();
    const last = MONTHS_IN_YEAR - 1;
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
        next = current === null ? 0 : Math.min(last, current + 1);
        break;
      case 'ArrowLeft':
        next = current === null ? 0 : Math.max(0, current - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      case 'Escape':
        event.preventDefault();
        this.closeTooltip();
        return;
      default:
        return;
    }

    event.preventDefault();
    this.openTooltip(next, 'keyboard');
  }

  protected onChartBlur(): void {
    if (this.activeSource() === 'keyboard') {
      this.closeTooltip();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: Event): void {
    const host = this.chartViewport?.nativeElement;
    const target = event.target as Node | null;

    if (host && target && host.contains(target)) {
      return;
    }

    this.closeTooltip();
  }

  protected formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  protected formatMonthName(month: number): string {
    return monthName(month);
  }

  protected categoriesByType(type: TransactionType): CategoryBreakdown[] {
    return this.summary()?.categoryBreakdown.filter((item) => item.type === type) ?? [];
  }

  protected maxAmount(type: TransactionType): number {
    return this.categoriesByType(type).reduce((max, item) => Math.max(max, item.totalAmount), 0) || 1;
  }

  private syncGreetingPeriod(): void {
    const current = dayPeriod(new Date().getHours());

    if (current === this.greetingPeriod()) {
      return;
    }

    this.greetingPeriod.set(current);
    this.greetingSeed.set(Math.random());
  }

  private openTooltip(index: number, source: Exclude<ActiveSource, null>): void {
    this.activeMonth.set(index);
    this.activeSource.set(source);
  }

  private closeTooltip(): void {
    this.activeMonth.set(null);
    this.activeSource.set(null);
  }

}

export function monthAxisLabel(month: number, groupWidth: number): string {
  const label = monthName(month).replace('.', '');
  const short = label.charAt(0).toUpperCase() + label.slice(1);

  return groupWidth < COMPACT_MONTH_LABEL_WIDTH ? short.charAt(0) : short;
}

function measureWidth(host: HTMLElement): number {
  return Math.max(MIN_CHART_WIDTH, Math.round(host.clientWidth || DEFAULT_CHART_WIDTH));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildAxis(
  rawMin: number,
  rawMax: number,
): { step: number; domainMin: number; domainMax: number; values: number[] } {
  let step = niceStep((rawMax - rawMin) / TARGET_AXIS_INTERVALS);
  let domain = domainFor(rawMin, rawMax, step);

  for (let attempt = 0; attempt < STEP_MANTISSAS.length * 2 && domain.count < MIN_AXIS_TICKS; attempt++) {
    step = smallerStep(step);
    domain = domainFor(rawMin, rawMax, step);
  }

  const values = Array.from({ length: domain.count }, (_, index) =>
    roundValue(domain.min + index * step),
  );

  return { step, domainMin: domain.min, domainMax: domain.max, values };
}

function domainFor(
  rawMin: number,
  rawMax: number,
  step: number,
): { min: number; max: number; count: number } {
  const min = roundValue(Math.floor(rawMin / step + 1e-9) * step);
  const max = roundValue(Math.ceil(rawMax / step - 1e-9) * step);

  return { min, max, count: Math.round((max - min) / step) + 1 };
}

function niceStep(rough: number): number {
  const target = rough > 0 ? rough : 1;
  const exponent = Math.floor(Math.log10(target));

  for (let power = exponent - 1; power <= exponent + 2; power++) {
    const magnitude = Math.pow(10, power);

    for (const mantissa of STEP_MANTISSAS) {
      const candidate = mantissa * magnitude;
      if (candidate >= target - target * 1e-9) {
        return candidate;
      }
    }
  }

  return Math.pow(10, exponent + 2);
}

function smallerStep(step: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(step) + 1e-9));
  const mantissa = step / magnitude;

  if (mantissa >= 4.9) {
    return 2.5 * magnitude;
  }

  if (mantissa >= 2.4) {
    return 2 * magnitude;
  }

  if (mantissa >= 1.9) {
    return magnitude;
  }

  return magnitude / 2;
}

function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}
