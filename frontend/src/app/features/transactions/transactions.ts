import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterPanel } from '../../core/filter-panel/filter-panel';
import { money, transactionStatusLabel } from '../../core/formatters';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { Category, Transaction, TransactionStatus } from '../../core/models';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';

export const TRANSACTIONS_LOAD_FALLBACK = 'Não foi possível carregar os lançamentos.';

const DEFAULT_FILTERS = {
  description: '',
  categoryId: '',
  type: '',
  status: '',
  startDate: '',
  endDate: '',
};

const TYPE_LABELS: Record<string, string> = { EXPENSE: 'Despesa', INCOME: 'Receita' };

function shortDate(value: string): string {
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, FormsModule, FilterPanel, ListFeedback, Pagination],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly list = new PagedList({
    key: 'transactions',
    defaults: DEFAULT_FILTERS,
    fetch: (filters, page) => {
      this.loadCategories();
      return this.transactionService.list(filters, page);
    },
    loadErrorMessage: TRANSACTIONS_LOAD_FALLBACK,
    state: inject(ListStateService),
    toast: this.toast,
  });

  protected readonly saving = signal(false);
  protected readonly categories = signal<Category[]>([]);
  private readonly categoriesState = signal<'idle' | 'loading' | 'loaded' | 'failed'>('idle');
  private readonly categoriesDenied = signal(false);
  protected readonly canViewCategories = computed(
    () => this.authService.can('CATEGORIES', 'VIEW') && !this.categoriesDenied(),
  );

  protected readonly chips = computed<FilterChip[]>(() => {
    const applied = this.list.applied();
    const chips: FilterChip[] = [];

    if (applied.description.trim()) {
      chips.push({ key: 'description', label: `Descrição: ${applied.description.trim()}` });
    }
    if (applied.categoryId) {
      chips.push({ key: 'categoryId', label: `Categoria: ${this.appliedCategoryLabel(applied.categoryId)}` });
    }
    if (applied.type) {
      chips.push({ key: 'type', label: `Tipo: ${TYPE_LABELS[applied.type] ?? applied.type}` });
    }
    if (applied.status) {
      chips.push({ key: 'status', label: `Status: ${transactionStatusLabel(applied.status as TransactionStatus)}` });
    }
    if (applied.startDate) {
      chips.push({ key: 'startDate', label: `Data de: ${shortDate(applied.startDate)}` });
    }
    if (applied.endDate) {
      chips.push({ key: 'endDate', label: `Data até: ${shortDate(applied.endDate)}` });
    }

    return chips;
  });

  ngOnInit(): void {
    void this.list.load();
  }

  // Catálogo completo, inclusive inativas: só alimenta o filtro e o rótulo dele — o nome de cada
  // linha já vem do back-end. Corre fora da carga da listagem, para que a falta de permissão ou a
  // falha dele nunca derrube as linhas; falhou, a próxima carga da listagem tenta de novo.
  private loadCategories(): void {
    if (!this.canViewCategories() || this.categoriesState() === 'loading' || this.categoriesState() === 'loaded') {
      return;
    }

    this.categoriesState.set('loading');
    void this.categoryService.options().then(
      (categories) => {
        this.categories.set(categories);
        this.categoriesState.set('loaded');
      },
      (err: unknown) => {
        this.categoriesState.set('failed');
        // Permissão retirada durante a sessão: o filtro some, como se o perfil nunca a tivesse tido.
        if (err instanceof HttpErrorResponse && err.status === 403) {
          this.categoriesDenied.set(true);
          return;
        }
        this.toast.fromHttpError(err, 'Não foi possível carregar as categorias.');
      },
    );
  }

  private appliedCategoryLabel(categoryId: string): string {
    if (!this.canViewCategories()) {
      return 'indisponível';
    }
    if (this.categoriesState() === 'loading' || this.categoriesState() === 'idle') {
      return '…';
    }
    return this.categories().find((category) => category.id === categoryId)?.name ?? 'indisponível';
  }

  protected filterCategories(): Category[] {
    const type = this.list.filters.type;
    return type ? this.categories().filter((category) => category.type === type) : this.categories();
  }

  protected onFilterTypeChange(): void {
    const category = this.categories().find((item) => item.id === this.list.filters.categoryId);
    if (category && this.list.filters.type && category.type !== this.list.filters.type) {
      this.list.filters.categoryId = '';
    }

    this.list.apply();
  }

  protected create(): void {
    void this.router.navigate(['/transactions/new']);
  }

  protected edit(transaction: Transaction): void {
    void this.router.navigate(['/transactions', transaction.id, 'edit']);
  }

  protected async cancelTransaction(transaction: Transaction): Promise<void> {
    this.saving.set(true);

    try {
      await this.transactionService.cancel(transaction.id);
    } catch (err) {
      this.toast.fromHttpError(err, 'Não foi possível cancelar o lançamento.');
      this.saving.set(false);
      return;
    }

    this.toast.success('Lançamento cancelado com sucesso.');
    await this.list.load(true);
    this.saving.set(false);
  }

  protected categoryName(transaction: Transaction): string {
    return transaction.categoryName ?? 'Sem categoria';
  }

  protected categoryOptionLabel(category: Category): string {
    return category.active ? category.name : `${category.name} (Inativo)`;
  }

  protected formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  protected statusLabel(status: TransactionStatus | null): string {
    return transactionStatusLabel(status);
  }

  protected statusPillClass(status: TransactionStatus | null): string {
    switch (status) {
      case 'PAID':
        return 'status-pill pill-income';
      case 'PENDING':
        return 'status-pill pill-pending';
      default:
        return 'status-pill pill-neutral';
    }
  }

  protected signedMoney(transaction: Transaction): string {
    const sign = transaction.type === 'EXPENSE' ? '- ' : '+ ';
    return `${sign}${money(transaction.amount)}`;
  }
}
