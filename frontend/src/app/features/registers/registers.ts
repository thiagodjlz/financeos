import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { money } from '../../core/formatters';
import { AccountType, TransactionType } from '../../core/models';
import { AccountService } from '../../core/services/account.service';
import { CardService } from '../../core/services/card.service';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-registers',
  imports: [CommonModule, FormsModule],
  templateUrl: './registers.html',
  styleUrl: './registers.scss',
})
export class Registers implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly accountService = inject(AccountService);
  private readonly cardService = inject(CardService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly accounts = this.accountService.accounts;
  protected readonly cards = this.cardService.cards;

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
      await Promise.all([this.categoryService.refresh(), this.accountService.refresh(), this.cardService.refresh()]);
    } catch {
      this.error.set('API indisponivel. Confirme se o backend Quarkus esta rodando em localhost:8080.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async saveCategory(): Promise<void> {
    await this.save(async () => {
      await this.categoryService.create({
        ...this.categoryForm,
        color: this.emptyToNull(this.categoryForm.color),
        icon: this.emptyToNull(this.categoryForm.icon),
      });
      await this.categoryService.refresh();
    });

    this.categoryForm.name = '';
    this.categoryForm.icon = '';
  }

  protected async saveAccount(): Promise<void> {
    await this.save(async () => {
      await this.accountService.create({
        ...this.accountForm,
        initialBalance: Number(this.accountForm.initialBalance),
      });
      await this.accountService.refresh();
    });

    this.accountForm.name = '';
    this.accountForm.initialBalance = 0;
  }

  protected async saveCard(): Promise<void> {
    await this.save(async () => {
      await this.cardService.create({
        ...this.cardForm,
        accountId: this.emptyToNull(this.cardForm.accountId),
        brand: this.emptyToNull(this.cardForm.brand),
        creditLimit: Number(this.cardForm.creditLimit),
        closingDay: Number(this.cardForm.closingDay),
        dueDay: Number(this.cardForm.dueDay),
      });
      await this.cardService.refresh();
    });

    this.cardForm.name = '';
    this.cardForm.brand = '';
    this.cardForm.creditLimit = 0;
  }

  protected formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  private async save(action: () => Promise<void>): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await action();
    } catch {
      this.error.set('Nao foi possivel salvar. Revise os campos e tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  private emptyToNull(value: string): string | null {
    return value ? value : null;
  }
}
