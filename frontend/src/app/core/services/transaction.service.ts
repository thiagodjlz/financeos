import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, Transaction } from '../models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);

  readonly transactions = signal<Transaction[]>([]);

  async refresh(): Promise<void> {
    this.transactions.set(await firstValueFrom(this.http.get<Transaction[]>(`${API_BASE}/transactions`)));
  }

  create(payload: Partial<Transaction>): Promise<Transaction> {
    return firstValueFrom(this.http.post<Transaction>(`${API_BASE}/transactions`, payload));
  }

  update(id: string, payload: Partial<Transaction>): Promise<Transaction> {
    return firstValueFrom(this.http.put<Transaction>(`${API_BASE}/transactions/${id}`, payload));
  }

  async cancel(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/transactions/${id}`));
  }
}
