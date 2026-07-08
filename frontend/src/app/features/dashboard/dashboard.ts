import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { money, monthName } from '../../core/formatters';
import { CategoryBreakdown, TransactionType } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly summary = this.dashboardService.summary;

  protected period = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await this.dashboardService.refresh(this.period.year, this.period.month);
    } catch {
      this.error.set('API indisponivel. Confirme se o backend Quarkus esta rodando em localhost:8080.');
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
}
