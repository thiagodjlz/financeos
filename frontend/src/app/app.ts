import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TransactionType = 'INCOME' | 'EXPENSE';
type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELED';
type AccountType = 'CHECKING' | 'SAVINGS' | 'WALLET' | 'INVESTMENT' | 'OTHER';

interface Period {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}

interface DashboardSummary {
  period: Period;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  paidExpense: number;
  pendingExpense: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyEvolution: MonthlySummary[];
}

interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  type: TransactionType;
  totalAmount: number;
  transactionCount: number;
}

interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

interface Category {
  id: string;
  parentId: string | null;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  active: boolean;
}

interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  active: boolean;
}

interface Card {
  id: string;
  accountId: string | null;
  name: string;
  brand: string | null;
  creditLimit: number | null;
  closingDay: number | null;
  dueDay: number | null;
  active: boolean;
}

interface Transaction {
  id: string;
  categoryId: string | null;
  accountId: string | null;
  cardId: string | null;
  transactionDate: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  source: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:8080/api';

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly activeTab = signal<'dashboard' | 'transactions' | 'registers'>('dashboard');

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly cards = signal<Card[]>([]);
  protected readonly transactions = signal<Transaction[]>([]);

  protected period = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };

  protected transactionForm = {
    transactionDate: new Date().toISOString().slice(0, 10),
    description: '',
    amount: 0,
    type: 'EXPENSE' as TransactionType,
    status: 'PENDING' as TransactionStatus,
    categoryId: '',
    accountId: '',
    cardId: '',
  };

  protected categoryForm = {
    name: '',
    type: 'EXPENSE' as TransactionType,
    color: '#2f7d62',
    icon: '',
  };

  protected accountForm = {
    name: '',
    type: 'CHECKING' as AccountType,
    initialBalance: 0,
  };

  protected cardForm = {
    name: '',
    accountId: '',
    brand: '',
    creditLimit: 0,
    closingDay: 10,
    dueDay: 20,
  };

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const [summary, categories, accounts, cards, transactions] = await Promise.all([
        this.get<DashboardSummary>(`/dashboard/summary?year=${this.period.year}&month=${this.period.month}`),
        this.get<Category[]>('/categories'),
        this.get<Account[]>('/accounts'),
        this.get<Card[]>('/cards'),
        this.get<Transaction[]>('/transactions'),
      ]);

      this.summary.set(summary);
      this.categories.set(categories);
      this.accounts.set(accounts);
      this.cards.set(cards);
      this.transactions.set(transactions);
    } catch {
      this.error.set('API indisponivel. Confirme se o backend Quarkus esta rodando em localhost:8080.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async saveTransaction(): Promise<void> {
    await this.save('/transactions', {
      ...this.transactionForm,
      amount: Number(this.transactionForm.amount),
      categoryId: this.emptyToNull(this.transactionForm.categoryId),
      accountId: this.emptyToNull(this.transactionForm.accountId),
      cardId: this.emptyToNull(this.transactionForm.cardId),
    });

    this.transactionForm.description = '';
    this.transactionForm.amount = 0;
  }

  protected async saveCategory(): Promise<void> {
    await this.save('/categories', {
      ...this.categoryForm,
      color: this.emptyToNull(this.categoryForm.color),
      icon: this.emptyToNull(this.categoryForm.icon),
    });

    this.categoryForm.name = '';
    this.categoryForm.icon = '';
  }

  protected async saveAccount(): Promise<void> {
    await this.save('/accounts', {
      ...this.accountForm,
      initialBalance: Number(this.accountForm.initialBalance),
    });

    this.accountForm.name = '';
    this.accountForm.initialBalance = 0;
  }

  protected async saveCard(): Promise<void> {
    await this.save('/cards', {
      ...this.cardForm,
      accountId: this.emptyToNull(this.cardForm.accountId),
      brand: this.emptyToNull(this.cardForm.brand),
      creditLimit: Number(this.cardForm.creditLimit),
      closingDay: Number(this.cardForm.closingDay),
      dueDay: Number(this.cardForm.dueDay),
    });

    this.cardForm.name = '';
    this.cardForm.brand = '';
    this.cardForm.creditLimit = 0;
  }

  protected async cancelTransaction(transaction: Transaction): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.http.delete<void>(`${this.apiBase}/transactions/${transaction.id}`).toPromise();
      await this.loadData();
    } catch {
      this.error.set('Nao foi possivel cancelar o lancamento.');
    } finally {
      this.saving.set(false);
    }
  }

  protected categoryName(id: string | null): string {
    return this.categories().find((category) => category.id === id)?.name ?? 'Sem categoria';
  }

  protected accountName(id: string | null): string {
    return this.accounts().find((account) => account.id === id)?.name ?? '-';
  }

  protected cardName(id: string | null): string {
    return this.cards().find((card) => card.id === id)?.name ?? '-';
  }

  protected money(value: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value ?? 0);
  }

  protected monthName(month: number): string {
    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(2026, month - 1, 1));
  }

  private async save(path: string, body: unknown): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.http.post(`${this.apiBase}${path}`, body).toPromise();
      await this.loadData();
    } catch {
      this.error.set('Nao foi possivel salvar. Revise os campos e tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  private get<T>(path: string): Promise<T> {
    return this.http.get<T>(`${this.apiBase}${path}`).toPromise() as Promise<T>;
  }

  private emptyToNull(value: string): string | null {
    return value ? value : null;
  }
}
