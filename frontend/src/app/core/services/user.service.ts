import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, AppUserSummary, ListFilters, Page } from '../models';
import { pageParams } from './page-params';

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  profileId: string;
}

export interface UserUpdatePayload {
  name: string;
  email: string;
  profileId: string;
  active: boolean;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  list(filters: ListFilters, page: number): Promise<Page<AppUserSummary>> {
    return firstValueFrom(
      this.http.get<Page<AppUserSummary>>(`${API_BASE}/users`, { params: pageParams(filters, page) }),
    );
  }

  get(id: string): Promise<AppUserSummary> {
    return firstValueFrom(this.http.get<AppUserSummary>(`${API_BASE}/users/${id}`));
  }

  create(payload: UserCreatePayload): Promise<AppUserSummary> {
    return firstValueFrom(this.http.post<AppUserSummary>(`${API_BASE}/users`, payload));
  }

  update(id: string, payload: UserUpdatePayload): Promise<AppUserSummary> {
    return firstValueFrom(this.http.put<AppUserSummary>(`${API_BASE}/users/${id}`, payload));
  }

  async deactivate(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE}/users/${id}`));
  }
}
