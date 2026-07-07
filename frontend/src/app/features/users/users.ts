import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppUserSummary } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  protected readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly editingId = signal<string | null>(null);

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

  protected async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      await Promise.all([this.userService.refresh(), this.profileService.refresh()]);
    } catch {
      this.error.set('Nao foi possivel carregar os usuarios.');
    } finally {
      this.loading.set(false);
    }
  }

  protected edit(user: AppUserSummary): void {
    this.editingId.set(user.id);
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
    this.error.set('');

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
    } catch {
      this.error.set('Nao foi possivel salvar o usuario. Revise os campos e tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async deactivate(user: AppUserSummary): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.userService.deactivate(user.id);
      await this.userService.refresh();
    } catch {
      this.error.set('Nao foi possivel desativar o usuario.');
    } finally {
      this.saving.set(false);
    }
  }

  protected profileName(profileId: string | null): string {
    return this.profiles().find((profile) => profile.id === profileId)?.name ?? '-';
  }

  private resetForm(): void {
    this.form = { name: '', email: '', password: '', profileId: '', active: true };
  }
}
