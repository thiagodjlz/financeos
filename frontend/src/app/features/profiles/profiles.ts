import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PermissionEntry, Profile, Screen } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

const SCREENS: { code: Screen; label: string }[] = [
  { code: 'DASHBOARD', label: 'Resumo' },
  { code: 'TRANSACTIONS', label: 'Lancamentos' },
  { code: 'CATEGORIES', label: 'Categorias' },
  { code: 'USERS', label: 'Usuarios' },
  { code: 'PROFILES', label: 'Perfis' },
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
  selector: 'app-profiles',
  imports: [CommonModule, FormsModule],
  templateUrl: './profiles.html',
  styleUrl: './profiles.scss',
})
export class Profiles implements OnInit {
  private readonly profileService = inject(ProfileService);
  protected readonly authService = inject(AuthService);

  protected readonly screens = SCREENS;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly editingId = signal<string | null>(null);

  protected readonly profiles = this.profileService.profiles;

  protected name = '';
  protected permissions: PermissionEntry[] = blankPermissions();

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await this.profileService.refresh();
    } catch {
      this.error.set('Nao foi possivel carregar os perfis.');
    } finally {
      this.loading.set(false);
    }
  }

  protected edit(profile: Profile): void {
    this.editingId.set(profile.id);
    this.name = profile.name;
    this.permissions = SCREENS.map((screen) => {
      const existing = profile.permissions.find((permission) => permission.screen === screen.code);
      return existing
        ? { ...existing }
        : { screen: screen.code, canView: false, canCreate: false, canEdit: false, canDelete: false };
    });
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
      const payload = { name: this.name, permissions: this.permissions };

      if (id) {
        await this.profileService.update(id, payload);
      } else {
        await this.profileService.create(payload);
      }

      await this.profileService.refresh();
      this.editingId.set(null);
      this.resetForm();
    } catch {
      this.error.set('Nao foi possivel salvar o perfil.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(profile: Profile): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.profileService.delete(profile.id);
      await this.profileService.refresh();
    } catch {
      this.error.set('Nao foi possivel excluir o perfil (pode estar em uso por usuarios).');
    } finally {
      this.saving.set(false);
    }
  }

  protected screenLabel(screen: Screen): string {
    return this.screens.find((item) => item.code === screen)?.label ?? screen;
  }

  private resetForm(): void {
    this.name = '';
    this.permissions = blankPermissions();
  }
}
