import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FilterPanel } from '../../core/filter-panel/filter-panel';
import {
  YearMonth,
  currentMonth,
  dayHeading,
  isoDate,
  money,
  monthKey,
  monthLabel,
  monthRange,
  parseMonthKey,
  shortDate,
  transactionStatusLabel,
} from '../../core/formatters';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { Category, ListFilters, Transaction, TransactionStatus } from '../../core/models';
import { MonthPicker } from '../../core/month-picker/month-picker';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';

export const TRANSACTIONS_LOAD_FALLBACK = 'Não foi possível carregar os lançamentos.';

const DELETE_FALLBACK = 'Não foi possível excluir o lançamento.';

// O período é uma chave só (`month`, `YYYY-MM`): o rótulo "Data" some com um único `remove`, e a
// API continua recebendo `startDate`/`endDate`.
const DEFAULT_FILTERS = {
  description: '',
  categoryId: '',
  type: '',
  status: '',
  month: '',
};

export function transactionQuery(filters: ListFilters): ListFilters {
  const { month, ...rest } = filters;
  const range = monthRange(month ?? '');
  return range ? { ...rest, ...range } : rest;
}

const TYPE_LABELS: Record<string, string> = { EXPENSE: 'Despesa', INCOME: 'Receita' };

interface TransactionRow {
  transaction: Transaction;
  heading: string | null;
}

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, FormsModule, ConfirmDialog, FilterPanel, ListFeedback, MonthPicker, Pagination],
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
    initial: { month: monthKey(currentMonth()) },
    fetch: (filters, page) => {
      this.loadCategories();
      return this.transactionService.list(transactionQuery(filters), page);
    },
    loadErrorMessage: TRANSACTIONS_LOAD_FALLBACK,
    state: inject(ListStateService),
    toast: this.toast,
  });

  protected readonly saving = signal(false);
  protected readonly deletingTransaction = signal<Transaction | null>(null);
  private draftMonthCache: { key: string; value: YearMonth | null } = { key: '', value: null };
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
    const month = parseMonthKey(applied.month);
    if (month) {
      chips.push({ key: 'month', label: `Data: ${monthLabel(month.year, month.month)}` });
    }

    return chips;
  });

  // Cabeçalho por dia só aparece no celular (o CSS esconde `tr.day-row` acima de 680px): a mesma
  // tabela vira a lista em cartões agrupada por data, sem template por largura.
  protected readonly rows = computed<TransactionRow[]>(() => {
    const today = isoDate(new Date());
    let previousDate: string | null = null;

    return this.list.items().map((transaction) => {
      const heading =
        transaction.transactionDate !== previousDate ? dayHeading(transaction.transactionDate, today) : null;
      previousDate = transaction.transactionDate;
      return { transaction, heading };
    });
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

  // O campo mostra o rascunho (`filters`), que no painel do celular muda antes do "Aplicar". A
  // referência só muda com a chave, para o seletor não receber um objeto novo a cada verificação.
  protected draftMonth(): YearMonth | null {
    const key = this.list.filters.month;
    if (key !== this.draftMonthCache.key) {
      this.draftMonthCache = { key, value: parseMonthKey(key) };
    }
    return this.draftMonthCache.value;
  }

  protected onMonthChange(value: YearMonth): void {
    this.list.filters.month = monthKey(value);
    this.list.apply();
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

  protected requestDelete(transaction: Transaction): void {
    this.deletingTransaction.set(transaction);
  }

  protected cancelDelete(): void {
    this.deletingTransaction.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const transaction = this.deletingTransaction();
    this.deletingTransaction.set(null);

    if (!transaction) {
      return;
    }

    this.saving.set(true);

    try {
      await this.transactionService.delete(transaction.id);
    } catch (err) {
      this.toast.fromHttpError(err, DELETE_FALLBACK);
      this.saving.set(false);
      return;
    }

    this.toast.success('Lançamento excluído com sucesso.');
    await this.list.load(true);
    this.saving.set(false);
  }

  protected deleteMessage(transaction: Transaction): string {
    return `Deseja excluir o lançamento "${transaction.description}"? A exclusão não pode ser desfeita.`;
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

  protected formatDate(value: string): string {
    return shortDate(value);
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
    const sign = transaction.type === 'EXPENSE' ? '− ' : '+ ';
    return `${sign}${money(transaction.amount)}`;
  }
}
