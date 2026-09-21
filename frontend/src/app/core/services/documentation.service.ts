import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE, DocumentationContent } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentationService {
  private readonly http = inject(HttpClient);

  readonly content = signal<DocumentationContent | null>(null);

  async load(): Promise<void> {
    this.content.set(await firstValueFrom(this.http.get<DocumentationContent>(`${API_BASE}/documentation`)));
  }
}
