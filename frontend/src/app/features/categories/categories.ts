import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FieldErrorState, focusFirstInvalidField } from '../../core/field-errors';
import { classifyHttpError } from '../../core/http-error';
import { Category, TransactionType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';

const LOAD_FALLBACK = 'Não foi possível carregar as categorias.';
const SAVE_FALLBACK = 'Não foi possível salvar a categoria. Revise os campos e tente novamente.';
const DELETE_FALLBACK = 'Não foi possível excluir a categoria.';

const FIELDS = ['name', 'type', 'color', 'active'] as const;

function newCategoryForm() {
  return {
    name: '',
    type: 'EXPENSE' as TransactionType,
    color: '#2f7d62',
    active: true,
  };
}

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule, ConfirmDialog],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  protected readonly authService = inject(AuthService);

  @ViewChild('createForm') private createForm?: ElementRef<HTMLFormElement>;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly categories = this.categoryService.categories;

  protected readonly fieldErrors = new FieldErrorState(FIELDS);
  protected readonly editFieldErrors = new FieldErrorState(FIELDS);

  protected form = newCategoryForm();

  protected readonly editingId = signal<string | null>(null);
  protected readonly confirmingExit = signal(false);
  protected readonly deletingCategory = signal<Category | null>(null);

  protected editForm = newCategoryForm();

  private editSnapshot: typeof this.editForm | null = null;

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      await this.categoryService.refresh();
    } catch (err) {
      this.toast.fromHttpError(err, LOAD_FALLBACK);
    } finally {
      this.loading.set(false);
    }
  }

  protected cancel(): void {
    this.form = newCategoryForm();
    this.fieldErrors.reset();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.fieldErrors.reset();

    try {
      await this.categoryService.create({
        name: this.form.name,
        type: this.form.type,
        color: this.emptyToNull(this.form.color),
        active: this.form.active,
      });
    } catch (err) {
      const errors = this.fieldErrors.apply(err);
      this.toast.fromHttpError(err, SAVE_FALLBACK);
      focusFirstInvalidField(this.createForm?.nativeElement, errors);
      this.saving.set(false);
      return;
    }

    this.form = newCategoryForm();
    this.toast.success('Categoria salva com sucesso.');
    await this.refreshAfterChange();
    this.saving.set(false);
  }

  protected startEdit(category: Category): void {
    if (this.editingId() !== null) {
      return;
    }

    this.editForm = {
      name: category.name,
      type: category.type,
      color: category.color ?? '#2f7d62',
      active: category.active,
    };
    this.editSnapshot = { ...this.editForm };
    this.editFieldErrors.reset();
    this.confirmingExit.set(false);
    this.editingId.set(category.id);
  }

  protected isEditDirty(): boolean {
    if (!this.editSnapshot) {
      return false;
    }

    return JSON.stringify(this.editForm) !== JSON.stringify(this.editSnapshot);
  }

  protected async saveEdit(category: Category): Promise<void> {
    this.saving.set(true);
    this.editFieldErrors.reset();

    try {
      await this.categoryService.update(category.id, {
        name: this.editForm.name,
        type: this.editForm.type,
        color: this.emptyToNull(this.editForm.color),
        active: this.editForm.active,
      });
    } catch (err) {
      this.editFieldErrors.apply(err);
      this.toast.fromHttpError(err, SAVE_FALLBACK);
      this.saving.set(false);
      return;
    }

    this.exitEditDiscarding();
    this.toast.success('Categoria atualizada com sucesso.');
    await this.refreshAfterChange();
    this.saving.set(false);
  }

  protected requestExit(): void {
    if (!this.isEditDirty()) {
      this.exitEditDiscarding();
      return;
    }

    this.confirmingExit.set(true);
  }

  protected async confirmExitYes(): Promise<void> {
    await this.categoryService.refresh();
    this.exitEditDiscarding();
  }

  protected confirmExitNo(): void {
    this.confirmingExit.set(false);
  }

  protected requestDelete(category: Category): void {
    if (this.editingId() !== null) {
      return;
    }

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
    await this.refreshAfterChange();
  }

  protected deleteMessage(category: Category): string {
    return `Deseja excluir a categoria "${category.name}"? A exclusão não pode ser desfeita.`;
  }

  // A operação já foi gravada quando o recarregamento falha: o aviso tem de falar da lista, nunca
  // da operação, senão o usuário repete um cadastro ou uma exclusão que já aconteceu.
  private async refreshAfterChange(): Promise<void> {
    try {
      await this.categoryService.refresh();
    } catch (err) {
      if (classifyHttpError(err, LOAD_FALLBACK)) {
        this.toast.error(LOAD_FALLBACK);
      }
    }
  }

  private exitEditDiscarding(): void {
    this.editingId.set(null);
    this.confirmingExit.set(false);
    this.editSnapshot = null;
    this.editFieldErrors.reset();
  }

  private emptyToNull(value: string): string | null {
    return value ? value : null;
  }
}
