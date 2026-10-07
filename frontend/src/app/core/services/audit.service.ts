import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, AuditOptions, AuditRecord, ListFilters, Page, Screen } from '../models';
import { pageParams } from './page-params';

// Fuso do navegador: o back-end lê o período (início e fim do dia) nele, para "hoje" bater com o
// relógio de quem consulta.
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);

  list(filters: ListFilters, page: number): Promise<Page<AuditRecord>> {
    return firstValueFrom(
      this.http.get<Page<AuditRecord>>(`${API_BASE}/audit`, {
        params: pageParams({ ...filters, timeZone: browserTimeZone() }, page),
      }),
    );
  }

  options(): Promise<AuditOptions> {
    return firstValueFrom(this.http.get<AuditOptions>(`${API_BASE}/audit/options`));
  }

  async screenAccess(screen: Screen): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${API_BASE}/audit/screen-access`, { screen }));
  }
}
