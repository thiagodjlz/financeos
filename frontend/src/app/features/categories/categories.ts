import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, TransactionType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  private readonly categoryService = inject(CategoryService);
  protected readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly editingId = signal<string | null>(null);

  protected readonly categories = this.categoryService.categories;

  protected form = {
    name: '',
    type: 'EXPENSE' as TransactionType,
    color: '#2f7d62',
    icon: '',
    active: true,
  };

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await this.categoryService.refresh();
    } catch {
      this.error.set('API indisponivel. Confirme se o backend Quarkus esta rodando em localhost:8080.');
    } finally {
      this.loading.set(false);
    }
  }

  protected edit(category: Category): void {
    this.editingId.set(category.id);
    this.form = {
      name: category.name,
      type: category.type,
      color: category.color ?? '#2f7d62',
      icon: category.icon ?? '',
      active: category.active,
    };
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      const id = this.editingId();
      const payload = {
        name: this.form.name,
        type: this.form.type,
        color: this.emptyToNull(this.form.color),
        icon: this.emptyToNull(this.form.icon),
        active: this.form.active,
      };

      if (id) {
        await this.categoryService.update(id, payload);
      } else {
        await this.categoryService.create(payload);
      }

      await this.categoryService.refresh();
      this.editingId.set(null);
      this.resetForm();
    } catch {
      this.error.set('Nao foi possivel salvar. Revise os campos e tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  private resetForm(): void {
    this.form = { name: '', type: 'EXPENSE', color: '#2f7d62', icon: '', active: true };
  }

  private emptyToNull(value: string): string | null {
    return value ? value : null;
  }
}
