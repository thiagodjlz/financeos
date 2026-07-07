import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, Category } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([]);

  async refresh(): Promise<void> {
    this.categories.set(await firstValueFrom(this.http.get<Category[]>(`${API_BASE}/categories`)));
  }

  create(payload: Partial<Category>): Promise<Category> {
    return firstValueFrom(this.http.post<Category>(`${API_BASE}/categories`, payload));
  }
}
