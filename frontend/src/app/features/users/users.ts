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
  protected readonly fieldErrors = signal<Map<string, string>>(new Map());

  private errorTimeout?: ReturnType<typeof setTimeout>;

  protected readonly users = this.userService.users;
  protected readonly profiles = this.profileService.profiles;

  protected form = {
    name: '',
    email: '',
    password: '',
    profileId: '',
  };

  protected readonly editingId = signal<string | null>(null);
  protected readonly confirmingExit = signal(false);
  protected readonly editFieldErrors = signal<Map<string, string>>(new Map());

  protected editForm = {
    name: '',
    email: '',
    password: '',
    profileId: '',
    active: true,
  };

  private editSnapshot: typeof this.editForm | null = null;

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

  protected cancel(): void {
    this.dismissError();
    this.resetForm();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.dismissError();
    this.fieldErrors.set(new Map());

    try {
      await this.userService.create({
        name: this.form.name,
        email: this.form.email,
        password: this.form.password,
        profileId: this.form.profileId,
      });

      await this.userService.refresh();
      this.resetForm();
    } catch (err) {
      this.applySaveError(err);
    } finally {
      this.saving.set(false);
    }
  }

  protected startEdit(user: AppUserSummary): void {
    if (this.editingId() !== null) {
      return;
    }

    this.editForm = {
      name: user.name,
      email: user.email,
      password: '',
      profileId: user.profileId ?? '',
      active: user.active,
    };
    this.editSnapshot = { ...this.editForm };
    this.editFieldErrors.set(new Map());
    this.confirmingExit.set(false);
    this.editingId.set(user.id);
  }

  protected isEditDirty(): boolean {
    if (!this.editSnapshot) {
      return false;
    }

    return JSON.stringify(this.editForm) !== JSON.stringify(this.editSnapshot);
  }

  protected async saveEdit(user: AppUserSummary): Promise<void> {
    this.saving.set(true);
    this.dismissError();
    this.editFieldErrors.set(new Map());

    try {
      await this.userService.update(user.id, {
        name: this.editForm.name,
        email: this.editForm.email,
        profileId: this.editForm.profileId,
        active: this.editForm.active,
        password: this.editForm.password || undefined,
      });

      await this.userService.refresh();
      this.exitEditDiscarding();
    } catch (err) {
      this.applyEditSaveError(err);
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
    await this.userService.refresh();
    this.exitEditDiscarding();
  }

  protected confirmExitNo(): void {
    this.confirmingExit.set(false);
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

  protected isEditFieldInvalid(field: string): boolean {
    return this.editFieldErrors().has(field);
  }

  protected editFieldError(field: string): string {
    return this.editFieldErrors().get(field) ?? '';
  }

  protected clearEditFieldError(field: string): void {
    if (!this.editFieldErrors().has(field)) {
      return;
    }

    const remaining = new Map(this.editFieldErrors());
    remaining.delete(field);
    this.editFieldErrors.set(remaining);

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
    const errors = this.collectFieldErrors(err);

    if (errors.size === 0) {
      this.showError(this.fallbackSaveMessage(err));
      return;
    }

    this.fieldErrors.set(errors);
    this.showError(this.invalidFieldsMessage(errors));
    this.focusFirstInvalidField(errors);
  }

  private applyEditSaveError(err: unknown): void {
    const errors = this.collectFieldErrors(err);

    if (errors.size === 0) {
      this.showError(this.fallbackSaveMessage(err));
      return;
    }

    this.editFieldErrors.set(errors);
    this.showError(this.invalidFieldsMessage(errors));
  }

  private collectFieldErrors(err: unknown): Map<string, string> {
    const errors = new Map<string, string>();

    for (const violation of this.extractViolations(err)) {
      const field = violation.field.split('.').pop() ?? '';
      if (field in FIELD_LABELS && !errors.has(field)) {
        errors.set(field, violation.message);
      }
    }

    return errors;
  }

  private invalidFieldsMessage(errors: Map<string, string>): string {
    const labels = FIELD_ORDER.filter((field) => errors.has(field)).map((field) => FIELD_LABELS[field]);
    return `Revise o(s) campo(s) invalido(s): ${labels.join(', ')}.`;
  }

  private fallbackSaveMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 409) {
      return this.conflictMessage(err);
    }

    return 'Nao foi possivel salvar o usuario. Revise os campos e tente novamente.';
  }

  private conflictMessage(err: HttpErrorResponse): string {
    const body = err.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (body && typeof body === 'object' && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }

    return 'E-mail ja cadastrado.';
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

  private exitEditDiscarding(): void {
    this.editingId.set(null);
    this.confirmingExit.set(false);
    this.editSnapshot = null;
    this.editFieldErrors.set(new Map());
  }

  private resetForm(): void {
    this.form = { name: '', email: '', password: '', profileId: '' };
    this.fieldErrors.set(new Map());
  }
}
