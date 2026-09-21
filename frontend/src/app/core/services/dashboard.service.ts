import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, AvailablePeriod, DashboardSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly periods = signal<AvailablePeriod[]>([]);

  async refresh(year: number, month: number): Promise<void> {
    this.summary.set(
      await firstValueFrom(this.http.get<DashboardSummary>(`${API_BASE}/dashboard/summary?year=${year}&month=${month}`)),
    );
  }

  async loadPeriods(): Promise<void> {
    this.periods.set(
      await firstValueFrom(this.http.get<AvailablePeriod[]>(`${API_BASE}/dashboard/periods`)),
    );
  }
}
