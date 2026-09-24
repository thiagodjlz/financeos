import { WritableSignal, computed, signal } from '@angular/core';
import { classifyHttpError } from './http-error';
import { ListFilters, Page } from './models';
import { ListStateService } from './services/list-state.service';
import { ToastService } from './services/toast.service';

export interface FilterChip {
  key: string;
  label: string;
}

export interface PagedListOptions<F extends ListFilters, T> {
  key: string;
  defaults: F;
  fetch: (filters: F, page: number) => Promise<Page<T>>;
  loadErrorMessage: string;
  state: ListStateService;
  toast: ToastService;
}

function sameFilters(a: ListFilters, b: ListFilters): boolean {
  return Object.keys({ ...a, ...b }).every((key) => (a[key] ?? '').trim() === (b[key] ?? '').trim());
}

// Estado e regras comuns das listagens paginadas: filtros aplicados, página, carga, erro de carga
// e persistência no ListStateService. `filters` é o rascunho ligado aos campos; só `applied` vai à API.
export class PagedList<F extends ListFilters, T> {
  readonly items = signal<T[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly totalItems = signal(0);
  readonly applied: WritableSignal<F>;

  filters: F;

  readonly activeCount = computed(() => Object.values(this.applied()).filter((value) => value.trim() !== '').length);
  readonly differsFromDefault = computed(() => !sameFilters(this.applied(), this.options.defaults));

  private requestSeq = 0;

  constructor(private readonly options: PagedListOptions<F, T>) {
    const saved = options.state.get<F>(options.key);
    const initial = { ...options.defaults, ...(saved?.filters ?? {}) } as F;

    this.applied = signal<F>(initial);
    this.filters = { ...initial };
    this.page.set(saved?.page ?? 1);
  }

  async load(afterChange = false): Promise<void> {
    const seq = ++this.requestSeq;
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const result = await this.options.fetch(this.applied(), this.page());
      if (seq !== this.requestSeq) {
        return;
      }

      // A última página pode ter esvaziado (exclusão, filtro de outra aba): volta para a última que existe.
      if (!result.items.length && result.totalPages > 0 && this.page() > result.totalPages) {
        this.page.set(result.totalPages);
        this.persist();
        await this.load(afterChange);
        return;
      }

      this.items.set(result.items);
      this.totalItems.set(result.totalItems);
      this.totalPages.set(result.totalPages);
    } catch (err) {
      if (seq !== this.requestSeq) {
        return;
      }

      this.items.set([]);
      this.totalItems.set(0);
      this.totalPages.set(0);
      this.loadError.set(this.options.loadErrorMessage);
      this.notifyLoadError(err, afterChange);
    } finally {
      if (seq === this.requestSeq) {
        this.loading.set(false);
      }
    }
  }

  apply(): void {
    if (sameFilters(this.filters, this.applied())) {
      return;
    }

    this.applied.set({ ...this.filters });
    this.page.set(1);
    this.persist();
    void this.load();
  }

  remove(key: string): void {
    this.filters = { ...this.applied(), [key]: '' };
    this.apply();
  }

  clear(): void {
    this.filters = { ...this.options.defaults };
    this.apply();
  }

  goTo(page: number): void {
    if (page < 1 || page === this.page()) {
      return;
    }

    this.page.set(page);
    this.persist();
    void this.load();
  }

  private persist(): void {
    this.options.state.set(this.options.key, { filters: this.applied(), page: this.page() });
  }

  // Depois de uma escrita já gravada, o aviso tem de falar da lista, nunca da operação: senão o
  // usuário repete um cadastro ou uma exclusão que já aconteceu.
  private notifyLoadError(err: unknown, afterChange: boolean): void {
    if (!afterChange) {
      this.options.toast.fromHttpError(err, this.options.loadErrorMessage);
      return;
    }

    if (classifyHttpError(err, this.options.loadErrorMessage)) {
      this.options.toast.error(this.options.loadErrorMessage);
    }
  }
}
