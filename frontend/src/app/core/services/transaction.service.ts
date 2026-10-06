import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, ListFilters, Page, Transaction } from '../models';
import { pageParams } from './page-params';

// Valor nulo é o campo vazio do cadastro e texto é o que não é número: nos dois casos quem responde é
// o back-end ("O valor é obrigatório." / "O valor informado é inválido.", issue #109).
export type TransactionPayload = Omit<Partial<Transaction>, 'amount'> & { amount?: number | string | null };

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  list(filters: ListFilters, page: number): Promise<Page<Transaction>> {
    return firstValueFrom(
      this.http.get<Page<Transaction>>(`${API_BASE}/transactions`, { params: pageParams(filters, page) }),
    );
  }

  get(id: string): Promise<Transaction> {
    return firstValueFrom(this.http.get<Transaction>(`${API_BASE}/transactions/${id}`));
  }

  create(payload: TransactionPayload): Promise<Transaction> {
    return firstValueFrom(this.http.post<Transaction>(`${API_BASE}/transactions`, payload));
  }

  update(id: string, payload: TransactionPayload): Promise<Transaction> {
    return firstValueFrom(this.http.put<Transaction>(`${API_BASE}/transactions/${id}`, payload));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/transactions/${id}`));
  }
}
