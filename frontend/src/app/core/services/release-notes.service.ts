import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, ReleaseNotesResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ReleaseNotesService {
  private readonly http = inject(HttpClient);

  readonly content = signal<ReleaseNotesResponse | null>(null);

  async load(): Promise<void> {
    this.content.set(await firstValueFrom(this.http.get<ReleaseNotesResponse>(`${API_BASE}/release-notes`)));
  }
}
