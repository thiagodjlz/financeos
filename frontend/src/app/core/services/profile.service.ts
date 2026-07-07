import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, PermissionEntry, Profile } from '../models';

export interface ProfilePayload {
  name: string;
  permissions: PermissionEntry[];
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  readonly profiles = signal<Profile[]>([]);

  async refresh(): Promise<void> {
    this.profiles.set(await firstValueFrom(this.http.get<Profile[]>(`${API_BASE}/profiles`)));
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
