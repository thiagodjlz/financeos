import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FilterPanel } from '../../core/filter-panel/filter-panel';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { AppUserSummary, Profile } from '../../core/models';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { AuthService } from '../../core/services/auth.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';

const LOAD_FALLBACK = 'Não foi possível carregar os usuários.';

// Situação padrão "Ativos": conta em "Filtros (N)" e gera rótulo; remover o rótulo significa "Todos".
const DEFAULT_FILTERS = { name: '', email: '', profileId: '', active: 'true' };

const SITUATION_LABELS: Record<string, string> = { true: 'Ativos', false: 'Inativos' };

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, FilterPanel, ListFeedback, Pagination],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly list = new PagedList({
    key: 'users',
    defaults: DEFAULT_FILTERS,
    fetch: async (filters, page) => {
      const [result] = await Promise.all([this.userService.list(filters, page), this.loadProfiles()]);
      return result;
    },
    loadErrorMessage: LOAD_FALLBACK,
    state: inject(ListStateService),
    toast: this.toast,
  });

  protected readonly saving = signal(false);
  protected readonly profiles = signal<Profile[]>([]);
  private readonly profilesLoaded = signal(false);
  private profilesRequest: Promise<void> | null = null;

  protected readonly chips = computed<FilterChip[]>(() => {
    const applied = this.list.applied();
    const chips: FilterChip[] = [];

    if (applied.name.trim()) {
      chips.push({ key: 'name', label: `Nome: ${applied.name.trim()}` });
    }
    if (applied.email.trim()) {
      chips.push({ key: 'email', label: `E-mail: ${applied.email.trim()}` });
    }
    if (applied.profileId) {
      const name = this.profilesLoaded() ? this.profileName(applied.profileId) : '…';
      chips.push({ key: 'profileId', label: `Perfil: ${name}` });
    }
    if (applied.active) {
      chips.push({ key: 'active', label: `Situação: ${SITUATION_LABELS[applied.active] ?? applied.active}` });
    }

    return chips;
  });

  ngOnInit(): void {
    void this.list.load();
  }

  // Todos os perfis, sem paginar: dão o nome do perfil em cada linha e as opções do filtro.
  // Faz parte da carga da listagem: as linhas só aparecem com eles, senão o Perfil sairia "-" até
  // eles chegarem. Falhou, cai no erro de carga da listagem e a próxima carga tenta de novo.
  private loadProfiles(): Promise<void> {
    this.profilesRequest ??= this.profileService.options().then(
      (profiles) => {
        this.profiles.set(profiles);
        this.profilesLoaded.set(true);
      },
      (err: unknown) => {
        this.profilesRequest = null;
        throw err;
      },
    );
    return this.profilesRequest;
  }

  protected create(): void {
    void this.router.navigate(['/users/new']);
  }

  protected edit(user: AppUserSummary): void {
    void this.router.navigate(['/users', user.id, 'edit']);
  }

  protected async deactivate(user: AppUserSummary): Promise<void> {
    this.saving.set(true);

    try {
      await this.userService.deactivate(user.id);
    } catch (err) {
      this.toast.fromHttpError(err, 'Não foi possível desativar o usuário.');
      this.saving.set(false);
      return;
    }

    this.toast.success('Usuário desativado com sucesso.');
    await this.list.load(true);
    this.saving.set(false);
  }

  protected profileName(profileId: string | null): string {
    return this.profiles().find((profile) => profile.id === profileId)?.name ?? '-';
  }
}
