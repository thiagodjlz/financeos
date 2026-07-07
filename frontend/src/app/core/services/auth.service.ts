import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Action, API_BASE, AuthResponse, MeResponse, PermissionEntry, Screen } from '../models';

const TOKEN_KEY = 'financeos_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly superAdmin = signal(false);
  readonly permissions = signal<PermissionEntry[]>([]);
  readonly me = signal<MeResponse | null>(null);

  private profileLoaded = false;
  private profilePromise: Promise<void> | null = null;

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_BASE}/auth/login`, { email, password }),
    );
    this.setToken(response.token);
    await this.fetchMe();
  }

  logout(): void {
    this.setToken(null);
    this.superAdmin.set(false);
    this.permissions.set([]);
    this.me.set(null);
    this.profileLoaded = false;
    this.profilePromise = null;
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  can(screen: Screen, action: Action): boolean {
    if (this.superAdmin()) {
      return true;
    }

    const entry = this.permissions().find((permission) => permission.screen === screen);

    if (!entry) {
      return false;
    }

    switch (action) {
      case 'VIEW':
        return entry.canView;
      case 'CREATE':
        return entry.canCreate;
      case 'EDIT':
        return entry.canEdit;
      case 'DELETE':
        return entry.canDelete;
    }
  }

  ensureProfileLoaded(): Promise<void> {
    if (this.profileLoaded) {
      return Promise.resolve();
    }

    if (!this.profilePromise) {
      this.profilePromise = this.token() ? this.fetchMe() : Promise.resolve();
    }

    return this.profilePromise;
  }

  private async fetchMe(): Promise<void> {
    const me = await firstValueFrom(this.http.get<MeResponse>(`${API_BASE}/auth/me`));
    this.superAdmin.set(me.superAdmin);
    this.permissions.set(me.permissions);
    this.me.set(me);
    this.profileLoaded = true;
  }

  private setToken(token: string | null): void {
    this.token.set(token);

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}
