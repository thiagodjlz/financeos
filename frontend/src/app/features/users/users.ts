import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppUserSummary } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserService } from '../../core/services/user.service';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  password: 'Senha',
  profileId: 'Perfil',
};

const FIELD_ORDER = ['name', 'email', 'password', 'profileId'] as const;

const ERROR_DISMISS_MS = 5000;

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  protected readonly authService = inject(AuthService);

  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('emailInput') private emailInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') private passwordInput?: ElementRef<HTMLInputElement>;
  @ViewChild('profileSelect') private profileSelect?: ElementRef<HTMLSelectElement>;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly editingId = signal<string | null>(null);
  protected readonly fieldErrors = signal<Map<string, string>>(new Map());

  private errorTimeout?: ReturnType<typeof setTimeout>;

  protected readonly users = this.userService.users;
  protected readonly profiles = this.profileService.profiles;

  protected form = {
    name: '',
    email: '',
    password: '',
    profileId: '',
    active: true,
  };

  ngOnInit(): void {
    void this.loadData();
  }

  ngOnDestroy(): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.dismissError();

    try {
      await Promise.all([this.userService.refresh(), this.profileService.refresh()]);
    } catch {
      this.showError('Nao foi possivel carregar os usuarios.');
    } finally {
      this.loading.set(false);
    }
  }

  protected edit(user: AppUserSummary): void {
    this.editingId.set(user.id);
    this.fieldErrors.set(new Map());
    this.form = {
      name: user.name,
      email: user.email,
      password: '',
      profileId: user.profileId ?? '',
      active: user.active,
    };
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.dismissError();
    this.fieldErrors.set(new Map());

    try {
      const id = this.editingId();

      if (id) {
        await this.userService.update(id, {
          name: this.form.name,
          email: this.form.email,
          profileId: this.form.profileId,
          active: this.form.active,
          password: this.form.password || undefined,
        });
      } else {
        await this.userService.create({
          name: this.form.name,
          email: this.form.email,
          password: this.form.password,
          profileId: this.form.profileId,
        });
      }

      await this.userService.refresh();
      this.editingId.set(null);
      this.resetForm();
    } catch (err) {
      this.applySaveError(err);
    } finally {
      this.saving.set(false);
    }
  }

  protected async deactivate(user: AppUserSummary): Promise<void> {
    this.saving.set(true);
    this.dismissError();

    try {
      await this.userService.deactivate(user.id);
      await this.userService.refresh();
    } catch {
      this.showError('Nao foi possivel desativar o usuario.');
    } finally {
      this.saving.set(false);
    }
  }

  protected profileName(profileId: string | null): string {
    return this.profiles().find((profile) => profile.id === profileId)?.name ?? '-';
  }

  protected isFieldInvalid(field: string): boolean {
    return this.fieldErrors().has(field);
  }

  protected fieldError(field: string): string {
    return this.fieldErrors().get(field) ?? '';
  }

  protected clearFieldError(field: string): void {
    if (!this.fieldErrors().has(field)) {
      return;
    }

    const remaining = new Map(this.fieldErrors());
    remaining.delete(field);
    this.fieldErrors.set(remaining);

    if (remaining.size === 0) {
      this.dismissError();
    }
  }

  protected dismissError(): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = undefined;
    }

    this.error.set('');
  }

  private showError(message: string): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    this.error.set(message);
    this.errorTimeout = setTimeout(() => this.dismissError(), ERROR_DISMISS_MS);
  }

  private applySaveError(err: unknown): void {
    const violations = this.extractViolations(err);
    const errors = new Map<string, string>();

    for (const violation of violations) {
      const field = violation.field.split('.').pop() ?? '';
      if (field in FIELD_LABELS && !errors.has(field)) {
        errors.set(field, violation.message);
      }
    }

    if (errors.size === 0) {
      this.showError('Nao foi possivel salvar o usuario. Revise os campos e tente novamente.');
      return;
    }

    this.fieldErrors.set(errors);

    const labels = FIELD_ORDER.filter((field) => errors.has(field)).map((field) => FIELD_LABELS[field]);
    this.showError(`Revise o(s) campo(s) invalido(s): ${labels.join(', ')}.`);
    this.focusFirstInvalidField(errors);
  }

  private extractViolations(err: unknown): { field: string; message: string }[] {
    if (!(err instanceof HttpErrorResponse)) {
      return [];
    }

    const body = err.error;
    if (!body || typeof body !== 'object' || !Array.isArray(body.violations)) {
      return [];
    }

    return body.violations;
  }

  private focusFirstInvalidField(errors: Map<string, string>): void {
    const firstField = FIELD_ORDER.find((field) => errors.has(field));

    switch (firstField) {
      case 'name':
        this.nameInput?.nativeElement.focus();
        break;
      case 'email':
        this.emailInput?.nativeElement.focus();
        break;
      case 'password':
        this.passwordInput?.nativeElement.focus();
        break;
      case 'profileId':
        this.profileSelect?.nativeElement.focus();
        break;
    }
  }

  private resetForm(): void {
    this.form = { name: '', email: '', password: '', profileId: '', active: true };
    this.fieldErrors.set(new Map());
  }
}
