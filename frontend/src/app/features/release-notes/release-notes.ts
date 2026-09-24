import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReleaseNoteCategoryKind } from '../../core/models';
import { ReleaseNotesService } from '../../core/services/release-notes.service';
import { ToastService } from '../../core/services/toast.service';

const CATEGORY_LABELS: Record<ReleaseNoteCategoryKind, string> = {
  NEW: 'Novidades',
  IMPROVEMENT: 'Melhorias',
  FIX: 'Correções',
};

const LOAD_FALLBACK = 'Não foi possível carregar as novidades por versão.';

@Component({
  selector: 'app-release-notes',
  imports: [CommonModule],
  templateUrl: './release-notes.html',
  styleUrl: './release-notes.scss',
})
export class ReleaseNotes implements OnInit {
  private readonly releaseNotesService = inject(ReleaseNotesService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly content = this.releaseNotesService.content;

  // O backend ja devolve as versoes ordenadas da mais recente para a mais antiga: o componente
  // nunca reordena, so decide rotulos.
  protected readonly versions = computed(() => this.content()?.versions ?? []);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);

    try {
      await this.releaseNotesService.load();
    } catch (err) {
      this.loadError.set(LOAD_FALLBACK);
      this.toast.fromHttpError(err, LOAD_FALLBACK);
    } finally {
      this.loading.set(false);
    }
  }

  protected categoryLabel(kind: ReleaseNoteCategoryKind): string {
    return CATEGORY_LABELS[kind];
  }

  protected isCurrent(version: string): boolean {
    return version === this.content()?.currentVersion;
  }

  protected trackByVersion(_index: number, version: { version: string }): string {
    return version.version;
  }
}
