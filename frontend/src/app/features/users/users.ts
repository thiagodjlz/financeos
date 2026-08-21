import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { collectFieldErrors } from '../../core/field-errors';
import { AppUserSummary } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  password: 'Senha',
  profileId: 'Perfil',
};

const FIELD_ORDER = ['name', 'email', 'password', 'profileId'] as const;

const LOAD_FALLBACK = 'Não foi possível carregar os usuários.';
const SAVE_FALLBACK = 'Não foi possível salvar o usuário. Revise os campos e tente novamente.';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  protected readonly authService = inject(AuthService);

  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('emailInput') private emailInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') private passwordInput?: ElementRef<HTMLInputElement>;
  @ViewChild('profileSelect') private profileSelect?: ElementRef<HTMLSelectElement>;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly fieldErrors = signal<Map<string, string>>(new Map());

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

  protected async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      await Promise.all([this.userService.refresh(), this.profileService.refresh()]);
    } catch (err) {
      this.toast.fromHttpError(err, LOAD_FALLBACK);
    } finally {
      this.loading.set(false);
    }
  }

  protected cancel(): void {
    this.resetForm();
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
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
      this.toast.success('Usuário salvo com sucesso.');
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
      this.toast.success('Usuário atualizado com sucesso.');
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

    try {
      await this.userService.deactivate(user.id);
      await this.userService.refresh();
      this.toast.success('Usuário desativado com sucesso.');
    } catch (err) {
      this.toast.fromHttpError(err, 'Não foi possível desativar o usuário.');
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
  }

  private applySaveError(err: unknown): void {
    const errors = this.collectFieldErrors(err);
    this.fieldErrors.set(errors);
    this.toast.fromHttpError(err, SAVE_FALLBACK);

    if (errors.size > 0) {
      this.focusFirstInvalidField(errors);
    }
  }

  private applyEditSaveError(err: unknown): void {
    this.editFieldErrors.set(this.collectFieldErrors(err));
    this.toast.fromHttpError(err, SAVE_FALLBACK);
  }

  private collectFieldErrors(err: unknown): Map<string, string> {
    return collectFieldErrors(err, Object.keys(FIELD_LABELS));
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
