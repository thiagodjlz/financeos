import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import { FilterPanel } from '../../core/filter-panel/filter-panel';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { Profile } from '../../core/models';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { RecordDetail } from '../../core/record-detail/record-detail';
import { AuthService } from '../../core/services/auth.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { PermissionSummary, permissionSummary } from './profile-screens';

const LOAD_FALLBACK = 'Não foi possível carregar os perfis.';

@Component({
  selector: 'app-profiles',
  imports: [CommonModule, FormsModule, ConfirmDialog, FilterPanel, ListFeedback, Pagination, RecordDetail],
  templateUrl: './profiles.html',
  styleUrl: './profiles.scss',
})
export class Profiles implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly list = new PagedList({
    key: 'profiles',
    defaults: { name: '' },
    fetch: (filters, page) => this.profileService.list(filters, page),
    loadErrorMessage: LOAD_FALLBACK,
    state: inject(ListStateService),
    toast: this.toast,
  });

  protected readonly saving = signal(false);
  protected readonly detailProfile = signal<Profile | null>(null);
  protected readonly deletingProfile = signal<Profile | null>(null);

  protected readonly chips = computed<FilterChip[]>(() => {
    const name = this.list.applied().name.trim();
    return name ? [{ key: 'name', label: `Nome: ${name}` }] : [];
  });

  ngOnInit(): void {
    void this.list.load();
  }

  protected create(): void {
    void this.router.navigate(['/profiles/new']);
  }

  protected edit(profile: Profile): void {
    void this.router.navigate(['/profiles', profile.id, 'edit']);
  }

  protected openDetail(profile: Profile): void {
    this.detailProfile.set(profile);
  }

  protected closeDetail(): void {
    this.detailProfile.set(null);
  }

  protected editFromDetail(): void {
    const profile = this.detailProfile();
    if (profile) {
      this.edit(profile);
    }
  }

  // DEC-15: excluir pede confirmação, na linha e no Detalhe. A confirmação abre por cima do
  // Detalhe; recusar volta a ele, confirmar fecha os dois e faz um único DELETE.
  protected requestDelete(profile: Profile): void {
    this.deletingProfile.set(profile);
  }

  protected removeFromDetail(): void {
    this.deletingProfile.set(this.detailProfile());
  }

  protected cancelDelete(): void {
    this.deletingProfile.set(null);
  }

  protected confirmDelete(): void {
    const profile = this.deletingProfile();
    this.deletingProfile.set(null);
    this.detailProfile.set(null);
    if (profile) {
      void this.remove(profile);
    }
  }

  protected deleteMessage(profile: Profile): string {
    return `Deseja excluir o perfil "${profile.name}"? A exclusão não pode ser desfeita.`;
  }

  protected permissions(profile: Profile): PermissionSummary[] {
    return permissionSummary(profile.permissions ?? []);
  }

  protected async remove(profile: Profile): Promise<void> {
    this.saving.set(true);

    try {
      await this.profileService.delete(profile.id);
    } catch (err) {
      this.toast.fromHttpError(err, 'Não foi possível excluir o perfil.');
      this.saving.set(false);
      return;
    }

    this.toast.success('Perfil excluído com sucesso.');
    await this.list.load(true);
    this.saving.set(false);
  }
}
