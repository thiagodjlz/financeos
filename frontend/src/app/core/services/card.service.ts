import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, Card } from '../models';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);

  readonly cards = signal<Card[]>([]);

  async refresh(): Promise<void> {
    this.cards.set(await firstValueFrom(this.http.get<Card[]>(`${API_BASE}/cards`)));
  }

  create(payload: Partial<Card>): Promise<Card> {
    return firstValueFrom(this.http.post<Card>(`${API_BASE}/cards`, payload));
  }
}
