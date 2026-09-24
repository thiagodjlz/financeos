import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, Category, ListFilters, Page, TransactionType } from '../models';
import { pageParams } from './page-params';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  list(filters: ListFilters, page: number): Promise<Page<Category>> {
    return firstValueFrom(
      this.http.get<Page<Category>>(`${API_BASE}/categories`, { params: pageParams(filters, page) }),
    );
  }

  get(id: string): Promise<Category> {
    return firstValueFrom(this.http.get<Category>(`${API_BASE}/categories/${id}`));
  }

  // Catálogo completo, inclusive inativas: resolve o nome da categoria nas linhas de Lançamentos.
  options(): Promise<Category[]> {
    return firstValueFrom(this.http.get<Category[]>(`${API_BASE}/categories/options`));
  }

  // Só as ativas do tipo: é o dropdown do cadastro de lançamento.
  listByType(type: TransactionType): Promise<Category[]> {
    return firstValueFrom(this.http.get<Category[]>(`${API_BASE}/categories/options`, { params: { type } }));
  }

  create(payload: Partial<Category>): Promise<Category> {
    return firstValueFrom(this.http.post<Category>(`${API_BASE}/categories`, payload));
  }

  update(id: string, payload: Partial<Category>): Promise<Category> {
    return firstValueFrom(this.http.put<Category>(`${API_BASE}/categories/${id}`, payload));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/categories/${id}`));
  }
}
