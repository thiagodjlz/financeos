import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, ListFilters, Page, PermissionEntry, Profile } from '../models';
import { pageParams } from './page-params';

export interface ProfilePayload {
  name: string;
  permissions: PermissionEntry[];
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  list(filters: ListFilters, page: number): Promise<Page<Profile>> {
    return firstValueFrom(this.http.get<Page<Profile>>(`${API_BASE}/profiles`, { params: pageParams(filters, page) }));
  }

  get(id: string): Promise<Profile> {
    return firstValueFrom(this.http.get<Profile>(`${API_BASE}/profiles/${id}`));
  }

  // Todos os perfis, sem paginar: dropdown de Perfil e nome do perfil nas linhas de Usuários.
  options(): Promise<Profile[]> {
    return firstValueFrom(this.http.get<Profile[]>(`${API_BASE}/profiles/options`));
  }

  create(payload: ProfilePayload): Promise<Profile> {
    return firstValueFrom(this.http.post<Profile>(`${API_BASE}/profiles`, payload));
  }

  update(id: string, payload: ProfilePayload): Promise<Profile> {
    return firstValueFrom(this.http.put<Profile>(`${API_BASE}/profiles/${id}`, payload));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/profiles/${id}`));
  }
}
