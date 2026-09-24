import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FieldErrorState, focusFirstInvalidField } from '../../core/field-errors';
import { PermissionEntry, Profile, Screen } from '../../core/models';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';

const LIST_ROUTE = '/profiles';
const LOAD_FALLBACK = 'Não foi possível carregar o perfil.';
const SAVE_FALLBACK = 'Não foi possível salvar o perfil. Revise os campos e tente novamente.';

const SCREENS: { code: Screen; label: string; viewOnly?: boolean }[] = [
  { code: 'DASHBOARD', label: 'Resumo' },
  { code: 'TRANSACTIONS', label: 'Lançamentos' },
  { code: 'CATEGORIES', label: 'Categorias' },
  { code: 'USERS', label: 'Usuários' },
  { code: 'PROFILES', label: 'Perfis' },
  { code: 'DOCUMENTATION', label: 'Documentação', viewOnly: true },
  { code: 'RELEASE_NOTES', label: 'Novidades por versão', viewOnly: true },
];

function blankPermissions(): PermissionEntry[] {
  return SCREENS.map((screen) => ({
    screen: screen.code,
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  }));
}

@Component({
  selector: 'app-profile-form',
  imports: [CommonModule, FormsModule, ConfirmDialog],
  templateUrl: './profile-form.html',
  styleUrl: './profile-form.scss',
})
export class ProfileForm implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @ViewChild('profileForm') private formElement?: ElementRef<HTMLFormElement>;

  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly screens = SCREENS;
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly confirmingExit = signal(false);

  // A matriz de permissões não recebe destaque por campo: a violação de `permissions`/`screen`
  // fica só no toast (decisão DEC-3 da issue #45).
  protected readonly fieldErrors = new FieldErrorState(['name']);

  protected name = '';
  protected permissions: PermissionEntry[] = blankPermissions();

  // O [(ngModel)] dos switches muta os objetos da matriz: o snapshot é serializado, nunca uma referência.
  private snapshot = this.serialize();

  ngOnInit(): void {
    if (this.id) {
      void this.loadForEdit(this.id);
    }
  }

  private async loadForEdit(id: string): Promise<void> {
    this.loading.set(true);

    try {
      this.applyProfile(await this.profileService.get(id));
    } catch (err) {
      this.handleLoadError(err);
    } finally {
      this.loading.set(false);
    }
  }

  private applyProfile(profile: Profile): void {
    this.name = profile.name;
    this.permissions = SCREENS.map((screen) => {
      const existing = profile.permissions.find((permission) => permission.screen === screen.code);
      return existing
        ? { ...existing }
        : { screen: screen.code, canView: false, canCreate: false, canEdit: false, canDelete: false };
    });
    this.snapshot = this.serialize();
  }

  private handleLoadError(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.toast.warning('Perfil não encontrado.');
      void this.router.navigate([LIST_ROUTE]);
      return;
    }

    this.loadError.set(LOAD_FALLBACK);
    this.toast.fromHttpError(err, LOAD_FALLBACK);
  }

  private serialize(): string {
    return JSON.stringify({ name: this.name, permissions: this.permissions });
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.fieldErrors.reset();

    const payload = { name: this.name, permissions: this.permissions };

    try {
      if (this.id) {
        await this.profileService.update(this.id, payload);
      } else {
        await this.profileService.create(payload);
      }
    } catch (err) {
      const errors = this.fieldErrors.apply(err);
      this.toast.fromHttpError(err, SAVE_FALLBACK);
      focusFirstInvalidField(this.formElement?.nativeElement, errors);
      this.saving.set(false);
      return;
    }

    this.toast.success(this.id ? 'Perfil atualizado com sucesso.' : 'Perfil salvo com sucesso.');
    this.saving.set(false);
    void this.router.navigate([LIST_ROUTE]);
  }

  protected requestCancel(): void {
    if (this.serialize() === this.snapshot) {
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

  protected screenLabel(screen: Screen): string {
    return this.screens.find((item) => item.code === screen)?.label ?? screen;
  }

  protected isViewOnly(screen: Screen): boolean {
    return this.screens.find((item) => item.code === screen)?.viewOnly === true;
  }
}
