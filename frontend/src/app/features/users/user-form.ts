import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FieldErrorState, focusFirstInvalidField } from '../../core/field-errors';
import { AppUserSummary, Profile } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';

const LIST_ROUTE = '/users';
const LOAD_FALLBACK = 'Não foi possível carregar o usuário.';
const SAVE_FALLBACK = 'Não foi possível salvar o usuário. Revise os campos e tente novamente.';

const FIELDS = ['name', 'email', 'password', 'profileId', 'active'] as const;

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, FormsModule, ConfirmDialog],
  templateUrl: './user-form.html',
})
export class UserForm implements OnInit {
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  @ViewChild('userForm') private formElement?: ElementRef<HTMLFormElement>;

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly confirmingExit = signal(false);

  protected readonly fieldErrors = new FieldErrorState(FIELDS);
  protected readonly profiles = signal<Profile[]>([]);
  // O 403 cobre o perfil alterado durante a sessão: a tela ainda acha que pode, o servidor já não deixa.
  private readonly profilesDenied = signal(false);
  protected readonly profileUnavailable = computed(
    () => !this.authService.can('PROFILES', 'VIEW') || this.profilesDenied(),
  );

  // A senha nunca é carregada: na edição começa vazia e só vai no payload se for preenchida.
  protected form = { name: '', email: '', password: '', profileId: '', active: true };
  private snapshot = JSON.stringify(this.form);

  ngOnInit(): void {
    void this.loadProfiles();

    if (this.id) {
      void this.loadForEdit(this.id);
    }
  }

  private async loadProfiles(): Promise<void> {
    if (this.profileUnavailable()) {
      return;
    }

    try {
      this.profiles.set(await this.profileService.options());
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 403) {
        this.profilesDenied.set(true);
        return;
      }
      this.toast.fromHttpError(err, 'Não foi possível carregar os perfis.');
    }
  }

  private async loadForEdit(id: string): Promise<void> {
    this.loading.set(true);

    try {
      this.applyUser(await this.userService.get(id));
    } catch (err) {
      this.handleLoadError(err);
    } finally {
      this.loading.set(false);
    }
  }

  private applyUser(user: AppUserSummary): void {
    this.form = {
      name: user.name,
      email: user.email,
      password: '',
      profileId: user.profileId ?? '',
      active: user.active,
    };
    this.snapshot = JSON.stringify(this.form);
  }

  private handleLoadError(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.toast.warning('Usuário não encontrado.');
      void this.router.navigate([LIST_ROUTE]);
      return;
    }

    this.loadError.set(LOAD_FALLBACK);
    this.toast.fromHttpError(err, LOAD_FALLBACK);
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.fieldErrors.reset();

    try {
      if (this.id) {
        await this.userService.update(this.id, {
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
    } catch (err) {
      const errors = this.fieldErrors.apply(err);
      this.toast.fromHttpError(err, SAVE_FALLBACK);
      focusFirstInvalidField(this.formElement?.nativeElement, errors);
      this.saving.set(false);
      return;
    }

    this.toast.success(this.id ? 'Usuário atualizado com sucesso.' : 'Usuário salvo com sucesso.');
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
