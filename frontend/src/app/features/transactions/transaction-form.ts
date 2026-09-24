import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FieldErrorState, focusFirstInvalidField } from '../../core/field-errors';
import { Category, Transaction, TransactionStatus, TransactionType } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';

const LIST_ROUTE = '/transactions';
const LOAD_FALLBACK = 'Não foi possível carregar o lançamento.';
const SAVE_FALLBACK = 'Não foi possível salvar o lançamento. Revise os campos e tente novamente.';

const FIELDS = ['transactionDate', 'description', 'amount', 'type', 'status', 'categoryId'] as const;

function newTransactionForm() {
  return {
    transactionDate: new Date().toISOString().slice(0, 10),
    description: '',
    amount: 0,
    type: 'EXPENSE' as TransactionType,
    status: 'PENDING' as TransactionStatus | null,
    categoryId: '',
  };
}

function formFrom(transaction: Transaction) {
  return {
    transactionDate: transaction.transactionDate,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    status: transaction.status,
    categoryId: transaction.categoryId ?? '',
  };
}

@Component({
  selector: 'app-transaction-form',
  imports: [CommonModule, FormsModule, ConfirmDialog],
  templateUrl: './transaction-form.html',
})
export class TransactionForm implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild('transactionForm') private formElement?: ElementRef<HTMLFormElement>;

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly confirmingExit = signal(false);

  protected readonly fieldErrors = new FieldErrorState(FIELDS);
  protected readonly categories = signal<Category[]>([]);
  // Categoria inativa já gravada no lançamento: entra como opção extra "(Inativo)" até o usuário trocar.
  protected readonly preselectedInactiveCategory = signal<Category | null>(null);

  protected form = newTransactionForm();
  private snapshot = JSON.stringify(this.form);

  ngOnInit(): void {
    void (this.id ? this.loadForEdit(this.id) : this.loadCategoriesForType(this.form.type));
  }

  private async loadForEdit(id: string): Promise<void> {
    this.loading.set(true);

    try {
      const transaction = await this.transactionService.get(id);
      this.form = formFrom(transaction);
      this.snapshot = JSON.stringify(this.form);
      await this.loadCategoriesForType(transaction.type);
      await this.resolveInactiveCategory(transaction.categoryId);
    } catch (err) {
      this.handleLoadError(err);
    } finally {
      this.loading.set(false);
    }
  }

  private handleLoadError(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.toast.warning('Lançamento não encontrado.');
      void this.router.navigate([LIST_ROUTE]);
      return;
    }

    this.loadError.set(LOAD_FALLBACK);
    this.toast.fromHttpError(err, LOAD_FALLBACK);
  }

  private async resolveInactiveCategory(categoryId: string | null): Promise<void> {
    if (!categoryId || this.categories().some((category) => category.id === categoryId)) {
      return;
    }

    try {
      const category = await this.categoryService.get(categoryId);
      this.preselectedInactiveCategory.set(category.active ? null : category);
    } catch {
      this.preselectedInactiveCategory.set(null);
    }
  }

  private async loadCategoriesForType(type: TransactionType): Promise<void> {
    try {
      this.categories.set(await this.categoryService.listByType(type));
    } catch (err) {
      this.toast.fromHttpError(err, LOAD_FALLBACK);
    }
  }

  protected async onTypeChange(): Promise<void> {
    this.preselectedInactiveCategory.set(null);
    await this.loadCategoriesForType(this.form.type);

    if (!this.categories().some((category) => category.id === this.form.categoryId)) {
      this.form.categoryId = '';
    }
  }

  protected onCategoryIdChange(): void {
    const preselected = this.preselectedInactiveCategory();
    if (preselected && preselected.id !== this.form.categoryId) {
      this.preselectedInactiveCategory.set(null);
    }
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.fieldErrors.reset();

    const payload = {
      ...this.form,
      amount: Number(this.form.amount),
      status: this.form.type === 'INCOME' ? null : this.form.status,
      categoryId: this.form.categoryId ? this.form.categoryId : null,
    };

    try {
      if (this.id) {
        await this.transactionService.update(this.id, payload);
      } else {
        await this.transactionService.create(payload);
      }
    } catch (err) {
      const errors = this.fieldErrors.apply(err);
      this.toast.fromHttpError(err, SAVE_FALLBACK);
      focusFirstInvalidField(this.formElement?.nativeElement, errors);
      this.saving.set(false);
      return;
    }

    this.toast.success(this.id ? 'Lançamento atualizado com sucesso.' : 'Lançamento salvo com sucesso.');
    this.saving.set(false);
    void this.router.navigate([LIST_ROUTE]);
  }

  protected requestCancel(): void {
    if (JSON.stringify(this.form) === this.snapshot) {
      void this.router.navigate([LIST_ROUTE]);
      return;
    }

    this.confirmingExit.set(true);
  }

  protected confirmExit(): void {
    this.confirmingExit.set(false);
    void this.router.navigate([LIST_ROUTE]);
  }

  protected keepEditing(): void {
    this.confirmingExit.set(false);
  }
}
