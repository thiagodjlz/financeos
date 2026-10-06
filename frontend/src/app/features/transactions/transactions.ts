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
  shiftMonth,
  shortDate,
  transactionStatusLabel,
} from '../../core/formatters';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { Category, ListFilters, Transaction, TransactionStatus, TransactionType } from '../../core/models';
import { MonthPicker } from '../../core/month-picker/month-picker';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { RecordDetail } from '../../core/record-detail/record-detail';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { TRANSACTIONS_LIST_KEY, TRANSACTION_DEFAULT_FILTERS } from './transaction-filters';

export const TRANSACTIONS_LOAD_FALLBACK = 'Não foi possível carregar os lançamentos.';

const DELETE_FALLBACK = 'Não foi possível excluir o lançamento.';

export function transactionQuery(filters: ListFilters): ListFilters {
  const { month, ...rest } = filters;
  const range = monthRange(month ?? '');
  return range ? { ...rest, ...range } : rest;
}

const TYPE_LABELS: Record<string, string> = { EXPENSE: 'Despesa', INCOME: 'Receita' };

interface TransactionRow {
  transaction: Transaction;
  heading: string | null;
  groupStart: boolean;
  groupEnd: boolean;
}

interface MonthCache {
  key: string;
  value: YearMonth | null;
}

@Component({
  selector: 'app-transactions',
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialog,
    FilterPanel,
    ListFeedback,
    MonthPicker,
    Pagination,
    RecordDetail,
  ],
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
    key: TRANSACTIONS_LIST_KEY,
    defaults: TRANSACTION_DEFAULT_FILTERS,
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
  protected readonly detailTransaction = signal<Transaction | null>(null);
  private draftMonthCache: MonthCache = { key: '', value: null };
  private appliedMonthCache: MonthCache = { key: '', value: null };
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
  // tabela vira a lista em cartões agrupada por data, sem template por largura. `groupStart`/`groupEnd`
  // arredondam o cartão de cada dia.
  protected readonly rows = computed<TransactionRow[]>(() => {
    const today = isoDate(new Date());
    const items = this.list.items();

    return items.map((transaction, index) => {
      const previous = items[index - 1]?.transactionDate;
      const next = items[index + 1]?.transactionDate;
      const groupStart = transaction.transactionDate !== previous;
      return {
        transaction,
        heading: groupStart ? dayHeading(transaction.transactionDate, today) : null,
        groupStart,
        groupEnd: transaction.transactionDate !== next,
      };
    });
  });

  protected readonly hasMonth = computed(() => !!parseMonthKey(this.list.applied().month));

  // Total da consulta (todas as páginas), no cabeçalho do celular e na faixa de filtros do desktop.
  protected readonly totalLabel = computed(() => {
    if (this.list.loading() || this.list.loadError()) {
      return '';
    }

    const total = this.list.totalItems();
    return `${total.toLocaleString('pt-BR')} ${total === 1 ? 'lançamento' : 'lançamentos'}`;
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

  // O campo Período do painel mostra o rascunho (`filters`), que no celular muda antes do "Aplicar";
  // o passo de mês, fora do painel, mostra o aplicado. A referência só muda com a chave, para o
  // seletor não receber um objeto novo a cada verificação.
  protected draftMonth(): YearMonth | null {
    this.draftMonthCache = cachedMonth(this.draftMonthCache, this.list.filters.month);
    return this.draftMonthCache.value;
  }

  protected appliedMonth(): YearMonth | null {
    this.appliedMonthCache = cachedMonth(this.appliedMonthCache, this.list.applied().month);
    return this.appliedMonthCache.value;
  }

  protected onMonthChange(value: YearMonth): void {
    this.list.filters.month = monthKey(value);
    this.list.apply();
  }

  // Setas do passo de mês: andam a partir do mês aplicado; em "Todo o período" ficam desabilitadas.
  protected stepMonth(delta: number): void {
    const current = parseMonthKey(this.list.applied().month);
    if (!current) {
      return;
    }

    this.list.filters.month = monthKey(shiftMonth(current, delta));
    this.list.apply();
  }

  // "Todo o período" do painel do celular: só mexe no rascunho, vale no "Aplicar".
  protected clearMonth(): void {
    this.list.filters.month = '';
  }

  // Tipo fica fora do painel e aplica na hora; a categoria de outro tipo sai junto.
  protected chooseType(type: TransactionType | ''): void {
    this.list.filters.type = type;
    const category = this.categories().find((item) => item.id === this.list.filters.categoryId);
    if (category && type && category.type !== type) {
      this.list.filters.categoryId = '';
    }

    this.list.apply();
  }

  protected chooseDraftStatus(status: TransactionStatus | ''): void {
    this.list.filters.status = status;
    this.list.apply();
  }

  protected openDetail(transaction: Transaction): void {
    this.detailTransaction.set(transaction);
  }

  protected closeDetail(): void {
    this.detailTransaction.set(null);
  }

  protected editFromDetail(): void {
    const transaction = this.detailTransaction();
    if (transaction) {
      this.edit(transaction);
    }
  }

  // A confirmação abre por cima do Detalhe; recusar volta a ele, confirmar fecha os dois.
  protected deleteFromDetail(): void {
    this.deletingTransaction.set(this.detailTransaction());
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
    this.detailTransaction.set(null);

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

  protected typeLabel(transaction: Transaction): string {
    return TYPE_LABELS[transaction.type] ?? transaction.type;
  }

  protected signedMoney(transaction: Transaction): string {
    const sign = transaction.type === 'EXPENSE' ? '− ' : '+ ';
    return `${sign}${money(transaction.amount)}`;
  }
}

function cachedMonth(cache: MonthCache, key: string): MonthCache {
  return key === cache.key ? cache : { key, value: parseMonthKey(key) };
}
