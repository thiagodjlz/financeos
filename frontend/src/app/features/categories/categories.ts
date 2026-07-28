import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, TransactionType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';

const LOAD_FALLBACK = 'Não foi possível carregar as categorias.';
const SAVE_FALLBACK = 'Não foi possível salvar a categoria. Revise os campos e tente novamente.';

function newCategoryForm() {
  return {
    name: '',
    type: 'EXPENSE' as TransactionType,
    color: '#2f7d62',
    icon: '',
    active: true,
  };
}

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  protected readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly categories = this.categoryService.categories;

  protected form = newCategoryForm();

  protected readonly editingId = signal<string | null>(null);
  protected readonly confirmingExit = signal(false);

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
  }

  protected async save(): Promise<void> {
    this.saving.set(true);

    try {
      await this.categoryService.create({
        name: this.form.name,
        type: this.form.type,
        color: this.emptyToNull(this.form.color),
        icon: this.emptyToNull(this.form.icon),
        active: this.form.active,
      });
      await this.categoryService.refresh();
      this.form = newCategoryForm();
      this.toast.success('Categoria salva com sucesso.');
    } catch (err) {
      this.toast.fromHttpError(err, SAVE_FALLBACK);
    } finally {
      this.saving.set(false);
    }
  }

  protected startEdit(category: Category): void {
    if (this.editingId() !== null) {
      return;
    }

    this.editForm = {
      name: category.name,
      type: category.type,
      color: category.color ?? '#2f7d62',
      icon: category.icon ?? '',
      active: category.active,
    };
    this.editSnapshot = { ...this.editForm };
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

    try {
      await this.categoryService.update(category.id, {
        name: this.editForm.name,
        type: this.editForm.type,
        color: this.emptyToNull(this.editForm.color),
        icon: this.emptyToNull(this.editForm.icon),
        active: this.editForm.active,
      });
      await this.categoryService.refresh();
      this.exitEditDiscarding();
      this.toast.success('Categoria atualizada com sucesso.');
    } catch (err) {
      this.toast.fromHttpError(err, SAVE_FALLBACK);
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
    await this.categoryService.refresh();
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
