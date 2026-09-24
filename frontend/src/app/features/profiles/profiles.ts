import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterPanel } from '../../core/filter-panel/filter-panel';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { Profile } from '../../core/models';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { AuthService } from '../../core/services/auth.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';

const LOAD_FALLBACK = 'Não foi possível carregar os perfis.';

@Component({
  selector: 'app-profiles',
  imports: [CommonModule, FormsModule, FilterPanel, ListFeedback, Pagination],
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
