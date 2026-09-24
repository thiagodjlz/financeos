import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FilterPanel } from '../../core/filter-panel/filter-panel';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { Category } from '../../core/models';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';

const LOAD_FALLBACK = 'Não foi possível carregar as categorias.';
const DELETE_FALLBACK = 'Não foi possível excluir a categoria.';

// Situação padrão "Ativos": conta em "Filtros (N)" e gera rótulo; remover o rótulo significa "Todos".
const DEFAULT_FILTERS = { name: '', type: '', active: 'true' };

const TYPE_LABELS: Record<string, string> = { EXPENSE: 'Despesa', INCOME: 'Receita' };
const SITUATION_LABELS: Record<string, string> = { true: 'Ativos', false: 'Inativos' };

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, ConfirmDialog, FilterPanel, ListFeedback, Pagination],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly list = new PagedList({
    key: 'categories',
    defaults: DEFAULT_FILTERS,
    fetch: (filters, page) => this.categoryService.list(filters, page),
    loadErrorMessage: LOAD_FALLBACK,
    state: inject(ListStateService),
    toast: this.toast,
  });

  protected readonly deletingCategory = signal<Category | null>(null);

  protected readonly chips = computed<FilterChip[]>(() => {
    const applied = this.list.applied();
    const chips: FilterChip[] = [];

    if (applied.name.trim()) {
      chips.push({ key: 'name', label: `Nome: ${applied.name.trim()}` });
    }
    if (applied.type) {
      chips.push({ key: 'type', label: `Tipo: ${TYPE_LABELS[applied.type] ?? applied.type}` });
    }
    if (applied.active) {
      chips.push({ key: 'active', label: `Situação: ${SITUATION_LABELS[applied.active] ?? applied.active}` });
    }

    return chips;
  });

  ngOnInit(): void {
    void this.list.load();
  }

  protected create(): void {
    void this.router.navigate(['/categories/new']);
  }

  protected edit(category: Category): void {
    void this.router.navigate(['/categories', category.id, 'edit']);
  }

  protected requestDelete(category: Category): void {
    this.deletingCategory.set(category);
  }

  protected cancelDelete(): void {
    this.deletingCategory.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const category = this.deletingCategory();
    this.deletingCategory.set(null);

    if (!category) {
      return;
    }

    try {
      await this.categoryService.remove(category.id);
    } catch (err) {
      this.toast.fromHttpError(err, DELETE_FALLBACK);
      return;
    }

    this.toast.success('Categoria excluída com sucesso.');
    await this.list.load(true);
  }

  protected deleteMessage(category: Category): string {
    return `Deseja excluir a categoria "${category.name}"? A exclusão não pode ser desfeita.`;
  }
}
