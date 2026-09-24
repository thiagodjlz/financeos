import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FieldErrorState, focusFirstInvalidField } from '../../core/field-errors';
import { Category, TransactionType } from '../../core/models';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';

const LIST_ROUTE = '/categories';
const LOAD_FALLBACK = 'Não foi possível carregar a categoria.';
const SAVE_FALLBACK = 'Não foi possível salvar a categoria. Revise os campos e tente novamente.';
const DEFAULT_COLOR = '#2f7d62';

const FIELDS = ['name', 'type', 'color', 'active'] as const;

function newCategoryForm() {
  return {
    name: '',
    type: 'EXPENSE' as TransactionType,
    color: DEFAULT_COLOR,
    active: true,
  };
}

@Component({
  selector: 'app-category-form',
  imports: [CommonModule, FormsModule, ConfirmDialog],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryForm implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild('categoryForm') private formElement?: ElementRef<HTMLFormElement>;

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly confirmingExit = signal(false);

  protected readonly fieldErrors = new FieldErrorState(FIELDS);

  protected form = newCategoryForm();
  private snapshot = JSON.stringify(this.form);

  ngOnInit(): void {
    if (this.id) {
      void this.loadForEdit(this.id);
    }
  }

  private async loadForEdit(id: string): Promise<void> {
    this.loading.set(true);

    try {
      this.applyCategory(await this.categoryService.get(id));
    } catch (err) {
      this.handleLoadError(err);
    } finally {
      this.loading.set(false);
    }
  }

  private applyCategory(category: Category): void {
    this.form = {
      name: category.name,
      type: category.type,
      color: category.color ?? DEFAULT_COLOR,
      active: category.active,
    };
    this.snapshot = JSON.stringify(this.form);
  }

  private handleLoadError(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.toast.warning('Categoria não encontrada.');
      void this.router.navigate([LIST_ROUTE]);
      return;
    }

    this.loadError.set(LOAD_FALLBACK);
    this.toast.fromHttpError(err, LOAD_FALLBACK);
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.fieldErrors.reset();

    const payload = {
      name: this.form.name,
      type: this.form.type,
      color: this.form.color ? this.form.color : null,
      active: this.form.active,
    };

    try {
      if (this.id) {
        await this.categoryService.update(this.id, payload);
      } else {
        await this.categoryService.create(payload);
      }
    } catch (err) {
      const errors = this.fieldErrors.apply(err);
      this.toast.fromHttpError(err, SAVE_FALLBACK);
      focusFirstInvalidField(this.formElement?.nativeElement, errors);
      this.saving.set(false);
      return;
    }

    this.toast.success(this.id ? 'Categoria atualizada com sucesso.' : 'Categoria salva com sucesso.');
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
