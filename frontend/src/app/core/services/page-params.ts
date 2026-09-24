import { HttpParams } from '@angular/common/http';
import { ListFilters, PAGE_SIZE } from '../models';

// Filtro vazio não vai na URL: para o backend, "ausente" e "vazio" significam "sem filtro".
export function pageParams(filters: ListFilters, page: number): HttpParams {
  let params = new HttpParams().set('page', page).set('size', PAGE_SIZE);

  for (const [key, value] of Object.entries(filters)) {
    const trimmed = value.trim();
    if (trimmed) {
      params = params.set(key, trimmed);
    }
  }

  return params;
}
