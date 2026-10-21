import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  API_BASE,
  ReportCriteria,
  ReportPreference,
  ReportPreferencePayload,
  TransactionReport,
} from '../models';

const REPORT_URL = `${API_BASE}/transaction-reports`;
const PREFERENCES_URL = `${REPORT_URL}/preferences`;

// Filtro vazio não vai na URL; categorias e agrupamentos repetem o parâmetro, na ordem escolhida.
// As datas só seguem no Personalizado: nos demais períodos quem resolve é o back-end.
export function reportParams(criteria: ReportCriteria): HttpParams {
  let params = new HttpParams().set('period', criteria.period);

  if (criteria.period === 'CUSTOM') {
    params = setIfPresent(params, 'startDate', criteria.startDate);
    params = setIfPresent(params, 'endDate', criteria.endDate);
  }
  for (const categoryId of criteria.categoryIds) {
    params = params.append('categoryId', categoryId);
  }
  params = setIfPresent(params, 'type', criteria.type);
  params = setIfPresent(params, 'status', criteria.status);
  params = setIfPresent(params, 'source', criteria.source);
  params = setIfPresent(params, 'minAmount', criteria.minAmount);
  params = setIfPresent(params, 'maxAmount', criteria.maxAmount);
  if (criteria.installments !== 'ALL') {
    params = params.set('installments', criteria.installments);
  }
  for (const grouping of criteria.groupBy) {
    params = params.append('groupBy', grouping);
  }

  return params;
}

function setIfPresent(params: HttpParams, key: string, value: string): HttpParams {
  const trimmed = value.trim();
  return trimmed ? params.set(key, trimmed) : params;
}

@Injectable({ providedIn: 'root' })
export class TransactionReportService {
  private readonly http = inject(HttpClient);

  generate(criteria: ReportCriteria): Promise<TransactionReport> {
    return firstValueFrom(this.http.get<TransactionReport>(REPORT_URL, { params: reportParams(criteria) }));
  }

  preferences(): Promise<ReportPreference[]> {
    return firstValueFrom(this.http.get<ReportPreference[]>(PREFERENCES_URL));
  }

  createPreference(payload: ReportPreferencePayload): Promise<ReportPreference> {
    return firstValueFrom(this.http.post<ReportPreference>(PREFERENCES_URL, payload));
  }

  updatePreference(id: string, payload: ReportPreferencePayload): Promise<ReportPreference> {
    return firstValueFrom(this.http.put<ReportPreference>(`${PREFERENCES_URL}/${id}`, payload));
  }

  async removePreference(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${PREFERENCES_URL}/${id}`));
  }
}
