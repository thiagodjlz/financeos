import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { money, monthName } from '../../core/formatters';
import { CategoryBreakdown, TransactionType } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';
import { ToastService } from '../../core/services/toast.service';

const CHART_TOP = 15;
const CHART_BOTTOM = 185;
const CHART_WIDTH = 840;
const MONTHS_IN_YEAR = 12;
const BAR_WIDTH = 13;
const BAR_GAP = 3;

interface ChartBar {
  incomeX: number;
  incomeY: number;
  incomeH: number;
  expenseX: number;
  expenseY: number;
  expenseH: number;
  lineX: number;
  lineY: number;
  labelX: number;
  label: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly summary = this.dashboardService.summary;

  protected readonly barWidth = BAR_WIDTH;

  protected period = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };

  protected readonly chart = computed(() => {
    const months = this.summary()?.monthlyEvolution ?? [];
    const chartHeight = CHART_BOTTOM - CHART_TOP;
    const groupWidth = CHART_WIDTH / MONTHS_IN_YEAR;

    const maxValue =
      months.reduce((max, item) => Math.max(max, item.income, item.expense), 0) || 1;
    const balances = months.map((item) => item.balance);
    const minBalance = balances.length ? Math.min(...balances) : 0;
    const maxBalance = balances.length ? Math.max(...balances) : 0;
    const balanceRange = maxBalance - minBalance || 1;

    const bars: ChartBar[] = months.map((item, index) => {
      const center = index * groupWidth + groupWidth / 2;
      const incomeHeight = (item.income / maxValue) * chartHeight;
      const expenseHeight = (item.expense / maxValue) * chartHeight;

      return {
        incomeX: center - BAR_WIDTH - BAR_GAP / 2,
        incomeY: CHART_BOTTOM - incomeHeight,
        incomeH: incomeHeight,
        expenseX: center + BAR_GAP / 2,
        expenseY: CHART_BOTTOM - expenseHeight,
        expenseH: expenseHeight,
        lineX: center,
        lineY: CHART_BOTTOM - ((item.balance - minBalance) / balanceRange) * chartHeight,
        labelX: center,
        label: this.shortMonthLabel(item.month),
      };
    });

    return {
      bars,
      linePoints: bars.map((bar) => `${bar.lineX},${bar.lineY}`).join(' '),
    };
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);

    try {
      await this.dashboardService.refresh(this.period.year, this.period.month);
    } catch (err) {
      this.toast.fromHttpError(err, 'Não foi possível carregar o resumo.');
    } finally {
      this.loading.set(false);
    }
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

  private shortMonthLabel(month: number): string {
    const label = monthName(month).replace('.', '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
