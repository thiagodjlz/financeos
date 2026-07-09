import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, Category, TransactionType } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([]);

  async refresh(): Promise<void> {
    this.categories.set(await firstValueFrom(this.http.get<Category[]>(`${API_BASE}/categories`)));
  }

  listByType(type: TransactionType): Promise<Category[]> {
    return firstValueFrom(this.http.get<Category[]>(`${API_BASE}/categories`, { params: { type } }));
  }

  create(payload: Partial<Category>): Promise<Category> {
    return firstValueFrom(this.http.post<Category>(`${API_BASE}/categories`, payload));
  }

  update(id: string, payload: Partial<Category>): Promise<Category> {
    return firstValueFrom(this.http.put<Category>(`${API_BASE}/categories/${id}`, payload));
  }
}
