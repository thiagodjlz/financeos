import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { money, transactionStatusLabel } from '../../core/formatters';
import { Category, Transaction, TransactionStatus, TransactionType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-transactions',
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  protected readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly transactions = this.transactionService.transactions;
  protected readonly categories = this.categoryService.categories;
  protected readonly filteredCategories = signal<Category[]>([]);

  protected transactionForm = {
    transactionDate: new Date().toISOString().slice(0, 10),
    description: '',
    amount: 0,
    type: 'EXPENSE' as TransactionType,
    status: 'PENDING' as TransactionStatus | null,
    categoryId: '',
  };

  protected readonly editingId = signal<string | null>(null);
  protected readonly editCategories = signal<Category[]>([]);
  protected readonly confirmingExit = signal(false);

  protected editForm = {
    transactionDate: '',
    description: '',
    amount: 0,
    type: 'EXPENSE' as TransactionType,
    status: 'PENDING' as TransactionStatus | null,
    categoryId: '',
  };

  private editSnapshot: typeof this.editForm | null = null;

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await Promise.all([
        this.transactionService.refresh(),
        this.categoryService.refresh(),
        this.loadCategoriesForType(this.transactionForm.type),
      ]);
    } catch {
      this.error.set('API indisponivel. Confirme se o backend Quarkus esta rodando em localhost:8080.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async onTypeChange(): Promise<void> {
    await this.loadCategoriesForType(this.transactionForm.type);

    if (!this.filteredCategories().some((category) => category.id === this.transactionForm.categoryId)) {
      this.transactionForm.categoryId = '';
    }
  }

  private async loadCategoriesForType(type: TransactionType): Promise<void> {
    this.filteredCategories.set(await this.categoryService.listByType(type));
  }

  protected async saveTransaction(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.transactionService.create({
        ...this.transactionForm,
        amount: Number(this.transactionForm.amount),
        status: this.transactionForm.type === 'INCOME' ? null : this.transactionForm.status,
        categoryId: this.emptyToNull(this.transactionForm.categoryId),
      });
      await this.transactionService.refresh();

      this.transactionForm.description = '';
      this.transactionForm.amount = 0;
    } catch {
      this.error.set('Nao foi possivel salvar. Revise os campos e tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async cancelTransaction(transaction: Transaction): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.transactionService.cancel(transaction.id);
      await this.transactionService.refresh();
    } catch {
      this.error.set('Nao foi possivel cancelar o lancamento.');
    } finally {
      this.saving.set(false);
    }
  }

  protected categoryName(id: string | null): string {
    return this.categories().find((category) => category.id === id)?.name ?? 'Sem categoria';
  }

  protected formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  protected statusLabel(status: TransactionStatus | null): string {
    return transactionStatusLabel(status);
  }

  protected startEdit(transaction: Transaction): void {
    if (this.editingId() !== null) {
      return;
    }

    this.editForm = {
      transactionDate: transaction.transactionDate,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      categoryId: transaction.categoryId ?? '',
    };
    this.editSnapshot = { ...this.editForm };
    this.confirmingExit.set(false);
    this.editingId.set(transaction.id);
    void this.loadCategoriesForEdit(transaction.type);
  }

  protected async onEditTypeChange(): Promise<void> {
    await this.loadCategoriesForEdit(this.editForm.type);

    if (!this.editCategories().some((category) => category.id === this.editForm.categoryId)) {
      this.editForm.categoryId = '';
    }
  }

  private async loadCategoriesForEdit(type: TransactionType): Promise<void> {
    this.editCategories.set(await this.categoryService.listByType(type));
  }

  protected isEditDirty(): boolean {
    if (!this.editSnapshot) {
      return false;
    }

    return JSON.stringify(this.editForm) !== JSON.stringify(this.editSnapshot);
  }

  protected async saveEdit(transaction: Transaction): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.transactionService.update(transaction.id, {
        ...this.editForm,
        amount: Number(this.editForm.amount),
        status: this.editForm.type === 'INCOME' ? null : this.editForm.status,
        categoryId: this.emptyToNull(this.editForm.categoryId),
      });
      await this.transactionService.refresh();
      this.exitEditDiscarding();
    } catch {
      this.error.set('Nao foi possivel salvar. Revise os campos e tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  protected requestExit(): void {
    if (!this.isEditDirty()) {
      this.exitEditDiscarding();
      return;
    }

    this.confirmingExit.set(true);
  }

  protected async confirmExitYes(): Promise<void> {
    await this.transactionService.refresh();
    this.exitEditDiscarding();
  }

  protected confirmExitNo(): void {
    this.confirmingExit.set(false);
  }

  private exitEditDiscarding(): void {
    this.editingId.set(null);
    this.confirmingExit.set(false);
    this.editSnapshot = null;
  }

  private emptyToNull(value: string): string | null {
    return value ? value : null;
  }
}
