import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Account, API_BASE } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  readonly accounts = signal<Account[]>([]);

  async refresh(): Promise<void> {
    this.accounts.set(await firstValueFrom(this.http.get<Account[]>(`${API_BASE}/accounts`)));
  }

  create(payload: Partial<Account>): Promise<Account> {
    return firstValueFrom(this.http.post<Account>(`${API_BASE}/accounts`, payload));
  }
}
