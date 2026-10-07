import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterPanel } from '../../core/filter-panel/filter-panel';
import { dateTimeLabel, isoDate, shortDate } from '../../core/formatters';
import { ListFeedback } from '../../core/list-feedback/list-feedback';
import { AuditOption, AuditOptions, AuditRecord } from '../../core/models';
import { FilterChip, PagedList } from '../../core/paged-list';
import { Pagination } from '../../core/pagination/pagination';
import { RecordDetail } from '../../core/record-detail/record-detail';
import { AuditService } from '../../core/services/audit.service';
import { ListStateService } from '../../core/services/list-state.service';
import { ToastService } from '../../core/services/toast.service';

const LOAD_FALLBACK = 'Não foi possível carregar a auditoria.';
const DEFAULT_PERIOD_DAYS = 30;

// "Limpar filtros" volta a tudo, sem período; a primeira abertura (`initial`) mostra os últimos 30 dias.
const DEFAULT_FILTERS = { user: '', startDate: '', endDate: '', type: '', action: '', screen: '' };

const EMPTY_OPTIONS: AuditOptions = { types: [], actions: [], screens: [] };

export function lastDaysPeriod(today: Date = new Date()): { startDate: string; endDate: string } {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - DEFAULT_PERIOD_DAYS);
  return { startDate: isoDate(start), endDate: isoDate(today) };
}

@Component({
  selector: 'app-audit',
  imports: [CommonModule, FormsModule, FilterPanel, ListFeedback, Pagination, RecordDetail],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
})
export class Audit implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly toast = inject(ToastService);

  protected readonly list = new PagedList({
    key: 'audit',
    defaults: DEFAULT_FILTERS,
    initial: lastDaysPeriod(),
    fetch: (filters, page) => this.auditService.list(filters, page),
    loadErrorMessage: LOAD_FALLBACK,
    state: inject(ListStateService),
    toast: this.toast,
  });

  protected readonly options = signal<AuditOptions>(EMPTY_OPTIONS);
  private readonly optionsLoaded = signal(false);
  protected readonly detailRecord = signal<AuditRecord | null>(null);

  protected readonly chips = computed<FilterChip[]>(() => {
    const applied = this.list.applied();
    const options = this.options();
    const chips: FilterChip[] = [];

    if (applied.user.trim()) {
      chips.push({ key: 'user', label: `Usuário: ${applied.user.trim()}` });
    }
    if (applied.startDate) {
      chips.push({ key: 'startDate', label: `Data inicial: ${shortDate(applied.startDate)}` });
    }
    if (applied.endDate) {
      chips.push({ key: 'endDate', label: `Data final: ${shortDate(applied.endDate)}` });
    }
    if (applied.type) {
      chips.push({ key: 'type', label: `Tipo: ${this.optionLabel(options.types, applied.type)}` });
    }
    if (applied.action) {
      chips.push({ key: 'action', label: `Ação: ${this.optionLabel(options.actions, applied.action)}` });
    }
    if (applied.screen) {
      chips.push({ key: 'screen', label: `Funcionalidade: ${this.optionLabel(options.screens, applied.screen)}` });
    }

    return chips;
  });

  ngOnInit(): void {
    void this.list.load();
    this.loadOptions();
  }

  // Tipos, ações e funcionalidades vêm do back-end com o rótulo pronto; correm fora da carga da
  // listagem para que a falha deles nunca derrube as linhas.
  private loadOptions(): void {
    this.auditService.options().then(
      (options) => {
        this.options.set(options);
        this.optionsLoaded.set(true);
      },
      (err: unknown) => this.toast.fromHttpError(err, 'Não foi possível carregar as opções dos filtros.'),
    );
  }

  private optionLabel(options: AuditOption[], code: string): string {
    if (!this.optionsLoaded()) {
      return '…';
    }
    return options.find((option) => option.code === code)?.label ?? code;
  }

  // Botões do painel do celular: só mexem no rascunho, que vale no "Aplicar" (o `apply` não age
  // enquanto o painel está aberto).
  protected chooseDraft(key: 'type' | 'action' | 'screen', code: string): void {
    this.list.filters[key] = code;
    this.list.apply();
  }

  protected openDetail(record: AuditRecord): void {
    this.detailRecord.set(record);
  }

  protected closeDetail(): void {
    this.detailRecord.set(null);
  }

  protected occurredAt(record: AuditRecord): string {
    return dateTimeLabel(record.occurredAt);
  }

  protected userLabel(record: AuditRecord): string {
    return record.userName || record.userEmail || '—';
  }

  protected text(value: string | null | undefined): string {
    return value || '—';
  }

  protected detailHeading(record: AuditRecord): string {
    return record.recordLabel || record.typeLabel;
  }
}
