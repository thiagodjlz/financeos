import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { money } from '../../core/formatters';
import { Transaction, TransactionStatus, TransactionType } from '../../core/models';
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

  protected transactionForm = {
    transactionDate: new Date().toISOString().slice(0, 10),
    description: '',
    amount: 0,
    type: 'EXPENSE' as TransactionType,
    status: 'PENDING' as TransactionStatus,
    categoryId: '',
  };

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await Promise.all([this.transactionService.refresh(), this.categoryService.refresh()]);
    } catch {
      this.error.set('API indisponivel. Confirme se o backend Quarkus esta rodando em localhost:8080.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async saveTransaction(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.transactionService.create({
        ...this.transactionForm,
        amount: Number(this.transactionForm.amount),
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

  private emptyToNull(value: string): string | null {
    return value ? value : null;
  }
}
