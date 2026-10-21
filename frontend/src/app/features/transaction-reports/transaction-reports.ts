import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from '../../core/confirm-dialog/confirm-dialog';
import {
  formatAmountInput,
  money,
  parseAmountInput,
  shortDate,
  transactionSourceLabel,
  transactionStatusLabel,
  transactionTypeLabel,
} from '../../core/formatters';
import { classifyHttpError } from '../../core/http-error';
import {
  Category,
  ReportColumn,
  ReportCriteria,
  ReportGroup,
  ReportGrouping,
  ReportPreference,
  ReportPreferencePayload,
  ReportRow,
  ReportTotals,
  TransactionReport,
} from '../../core/models';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionReportService } from '../../core/services/transaction-report.service';
import {
  COLUMN_OPTIONS,
  DEFAULT_COLUMNS,
  GROUPING_OPTIONS,
  INSTALLMENT_OPTIONS,
  PERIOD_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  criteriaFromPreference,
  defaultCriteria,
  labelOf,
  orderedColumns,
} from './transaction-report-options';

const LOAD_FALLBACK = 'Não foi possível gerar o relatório.';
const PREFERENCES_FALLBACK = 'Não foi possível carregar as preferências.';
const SAVE_FALLBACK = 'Não foi possível salvar a preferência.';

// Linha da tabela já na ordem de exibição: título do grupo, lançamento ou subtotal do grupo. Os
// valores vêm da API; aqui só se achata a árvore de grupos para o template.
export interface ReportLine {
  kind: 'group' | 'row' | 'subtotal';
  depth: number;
  label?: string;
  fieldLabel?: string;
  totals?: ReportTotals;
  row?: ReportRow;
}

export function reportLines(report: TransactionReport): ReportLine[] {
  if (!report.groups.length) {
    return report.rows.map((row) => ({ kind: 'row', depth: 0, row }));
  }

  const lines: ReportLine[] = [];
  const walk = (groups: ReportGroup[], depth: number) => {
    for (const group of groups) {
      lines.push({ kind: 'group', depth, label: group.label, fieldLabel: group.fieldLabel });
      if (group.groups.length) {
        walk(group.groups, depth + 1);
      } else {
        group.rows.forEach((row) => lines.push({ kind: 'row', depth: depth + 1, row }));
      }
      lines.push({ kind: 'subtotal', depth, label: group.label, totals: group.totals });
    }
  };
  walk(report.groups, 0);
  return lines;
}

@Component({
  selector: 'app-transaction-reports',
  imports: [CommonModule, FormsModule, ConfirmDialog],
  templateUrl: './transaction-reports.html',
  styleUrl: './transaction-reports.scss',
})
export class TransactionReports implements OnInit {
  private readonly reportService = inject(TransactionReportService);
  private readonly categoryService = inject(CategoryService);
  private readonly auditService = inject(AuditService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly periodOptions = PERIOD_OPTIONS;
  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly sourceOptions = SOURCE_OPTIONS;
  protected readonly installmentOptions = INSTALLMENT_OPTIONS;
  protected readonly columnOptions = COLUMN_OPTIONS;

  protected form: ReportCriteria = defaultCriteria();
  protected readonly groupBy = signal<ReportGrouping[]>([]);
  protected readonly columns = signal<ReportColumn[]>([...DEFAULT_COLUMNS]);
  protected readonly columnsMissing = signal(false);

  protected readonly report = signal<TransactionReport | null>(null);
  protected readonly applied = signal<ReportCriteria | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  private generation = 0;

  protected readonly categories = signal<Category[]>([]);
  private readonly categoriesDenied = signal(false);
  protected readonly canViewCategories = computed(
    () => this.authService.can('CATEGORIES', 'VIEW') && !this.categoriesDenied(),
  );

  protected readonly preferences = signal<ReportPreference[]>([]);
  protected readonly selectedPreferenceId = signal('');
  protected preferenceName = '';
  protected preferenceDefault = false;
  protected readonly saving = signal(false);
  protected readonly deletingPreference = signal<ReportPreference | null>(null);

  protected readonly canCreate = computed(() => this.authService.can('TRANSACTION_REPORTS', 'CREATE'));
  protected readonly canEdit = computed(() => this.authService.can('TRANSACTION_REPORTS', 'EDIT'));
  protected readonly canDelete = computed(() => this.authService.can('TRANSACTION_REPORTS', 'DELETE'));

  protected readonly selectedPreference = computed(
    () => this.preferences().find((preference) => preference.id === this.selectedPreferenceId()) ?? null,
  );
  protected readonly availableGroupings = computed(() =>
    GROUPING_OPTIONS.filter((option) => !this.groupBy().includes(option.code)),
  );
  protected readonly visibleColumns = computed(() => orderedColumns(this.columns()));
  protected readonly lines = computed(() => {
    const report = this.report();
    return report ? reportLines(report) : [];
  });
  protected readonly appliedFilters = computed(() => this.describeFilters(this.applied()));

  ngOnInit(): void {
    this.loadCategories();
    void this.start();
  }

  // A preferência padrão vale ao abrir (D9); sem ela, ou se a lista falhar, abre com DD1/DD5.
  private async start(): Promise<void> {
    try {
      const preferences = await this.reportService.preferences();
      this.preferences.set(preferences);
      const preferred = preferences.find((preference) => preference.defaultPreference);
      if (preferred) {
        this.applyPreference(preferred);
      }
    } catch (err: unknown) {
      this.toast.fromHttpError(err, PREFERENCES_FALLBACK);
    }

    await this.generate();
  }

  // Catálogo completo, inclusive inativas: categoria inativa continua valendo na preferência (D9).
  // Corre fora da geração, e a falta de permissão só esconde o filtro.
  private loadCategories(): void {
    if (!this.canViewCategories()) {
      return;
    }

    this.categoryService.options().then(
      (categories) =>
        this.categories.set([...categories].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))),
      (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 403) {
          this.categoriesDenied.set(true);
          return;
        }
        this.toast.fromHttpError(err, 'Não foi possível carregar as categorias.');
      },
    );
  }

  protected async generate(): Promise<void> {
    if (!this.columns().length) {
      this.columnsMissing.set(true);
      return;
    }

    this.columnsMissing.set(false);
    const criteria = this.snapshot();
    const current = ++this.generation;
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const report = await this.reportService.generate(criteria);
      if (current !== this.generation) {
        return;
      }
      this.report.set(report);
      this.applied.set(criteria);
    } catch (err: unknown) {
      if (current !== this.generation) {
        return;
      }
      this.toast.fromHttpError(err, LOAD_FALLBACK);
      // Filtro recusado (400) é corrigível: o relatório anterior continua na tela.
      if (classifyHttpError(err, LOAD_FALLBACK)?.kind !== 'warning') {
        this.report.set(null);
        this.loadError.set(LOAD_FALLBACK);
      }
    } finally {
      if (current === this.generation) {
        this.loading.set(false);
      }
    }
  }

  protected clearFilters(): void {
    this.form = defaultCriteria();
    this.groupBy.set([]);
    this.columns.set([...DEFAULT_COLUMNS]);
    this.selectedPreferenceId.set('');
    this.preferenceName = '';
    this.preferenceDefault = false;
    void this.generate();
  }

  protected isCategorySelected(id: string): boolean {
    return this.form.categoryIds.includes(id);
  }

  protected toggleCategory(id: string): void {
    this.form.categoryIds = this.isCategorySelected(id)
      ? this.form.categoryIds.filter((selected) => selected !== id)
      : [...this.form.categoryIds, id];
  }

  protected addGrouping(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const code = select.value as ReportGrouping;
    if (code && !this.groupBy().includes(code)) {
      this.groupBy.update((groups) => [...groups, code]);
    }
    select.value = '';
  }

  protected moveGrouping(index: number, delta: number): void {
    this.groupBy.update((groups) => {
      const target = index + delta;
      if (target < 0 || target >= groups.length) {
        return groups;
      }
      const next = [...groups];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  protected removeGrouping(index: number): void {
    this.groupBy.update((groups) => groups.filter((_, position) => position !== index));
  }

  protected groupingLabel(code: ReportGrouping): string {
    return labelOf(GROUPING_OPTIONS, code);
  }

  protected isColumnSelected(code: ReportColumn): boolean {
    return this.columns().includes(code);
  }

  protected toggleColumn(code: ReportColumn): void {
    this.columns.update((columns) =>
      columns.includes(code) ? columns.filter((column) => column !== code) : orderedColumns([...columns, code]),
    );
    if (this.columns().length) {
      this.columnsMissing.set(false);
    }
  }

  protected columnLabel(code: ReportColumn): string {
    return labelOf(COLUMN_OPTIONS, code);
  }

  protected cell(row: ReportRow, column: ReportColumn): string {
    switch (column) {
      case 'DATE':
        return shortDate(row.transactionDate);
      case 'DESCRIPTION':
        return row.description;
      case 'CATEGORY':
        return row.categoryName ?? 'Sem categoria';
      case 'TYPE':
        return transactionTypeLabel(row.type);
      case 'STATUS':
        return transactionStatusLabel(row.status);
      case 'SOURCE':
        return transactionSourceLabel(row.source);
      case 'INSTALLMENT':
        return row.installmentNumber && row.installmentTotal
          ? `${row.installmentNumber}/${row.installmentTotal}`
          : '-';
      case 'AMOUNT':
        return money(row.amount);
      case 'NOTES':
        return row.notes || '-';
    }
  }

  protected formatMoney(value: number | null | undefined): string {
    return money(value);
  }

  protected periodSummary(report: TransactionReport): string {
    return `${report.period.label}: ${shortDate(report.period.startDate)} a ${shortDate(report.period.endDate)}`;
  }

  protected generatedOn(report: TransactionReport): string {
    return shortDate(report.generatedOn);
  }

  // Imprime pelo navegador (D10). O registro de Impressão vai antes; se ele falhar, a impressão abre
  // mesmo assim (DD7).
  protected async print(): Promise<void> {
    try {
      await this.auditService.print('TRANSACTION_REPORTS');
    } catch {
      // Sem o registro, a impressão continua valendo.
    }
    window.print();
  }

  protected choosePreference(id: string): void {
    const preference = this.preferences().find((item) => item.id === id);
    if (!preference) {
      this.selectedPreferenceId.set('');
      this.preferenceName = '';
      this.preferenceDefault = false;
      return;
    }

    this.applyPreference(preference);
    void this.generate();
  }

  private applyPreference(preference: ReportPreference): void {
    this.form = criteriaFromPreference(preference, (value) => formatAmountInput(value));
    this.groupBy.set([...preference.groupBy]);
    this.columns.set(orderedColumns(preference.columns));
    this.selectedPreferenceId.set(preference.id);
    this.preferenceName = preference.name;
    this.preferenceDefault = preference.defaultPreference;
  }

  protected async saveAsNew(): Promise<void> {
    await this.save(null);
  }

  protected async saveChanges(): Promise<void> {
    const selected = this.selectedPreference();
    if (selected) {
      await this.save(selected.id);
    }
  }

  private async save(id: string | null): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      const payload = this.payload();
      const saved = id
        ? await this.reportService.updatePreference(id, payload)
        : await this.reportService.createPreference(payload);
      this.preferences.update((preferences) =>
        [...preferences.filter((preference) => preference.id !== saved.id), saved]
          .map((preference) =>
            saved.defaultPreference && preference.id !== saved.id
              ? { ...preference, defaultPreference: false }
              : preference,
          )
          .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
      );
      this.selectedPreferenceId.set(saved.id);
      this.preferenceName = saved.name;
      this.preferenceDefault = saved.defaultPreference;
      this.toast.success(id ? 'Preferência alterada com sucesso.' : 'Preferência salva com sucesso.');
    } catch (err: unknown) {
      this.toast.fromHttpError(err, SAVE_FALLBACK);
    } finally {
      this.saving.set(false);
    }
  }

  protected askDelete(): void {
    this.deletingPreference.set(this.selectedPreference());
  }

  protected cancelDelete(): void {
    this.deletingPreference.set(null);
  }

  protected deleteMessage(preference: ReportPreference): string {
    return `Deseja excluir a preferência "${preference.name}"? Esta ação não pode ser desfeita.`;
  }

  protected async confirmDelete(): Promise<void> {
    const preference = this.deletingPreference();
    this.deletingPreference.set(null);
    if (!preference) {
      return;
    }

    try {
      await this.reportService.removePreference(preference.id);
      this.preferences.update((preferences) => preferences.filter((item) => item.id !== preference.id));
      this.selectedPreferenceId.set('');
      this.preferenceName = '';
      this.preferenceDefault = false;
      this.toast.success('Preferência excluída com sucesso.');
    } catch (err: unknown) {
      this.toast.fromHttpError(err, 'Não foi possível excluir a preferência.');
    }
  }

  private snapshot(): ReportCriteria {
    return { ...this.form, categoryIds: [...this.form.categoryIds], groupBy: [...this.groupBy()] };
  }

  private payload(): ReportPreferencePayload {
    const criteria = this.snapshot();
    const custom = criteria.period === 'CUSTOM';
    return {
      name: this.preferenceName,
      defaultPreference: this.preferenceDefault,
      period: criteria.period,
      startDate: custom && criteria.startDate ? criteria.startDate : null,
      endDate: custom && criteria.endDate ? criteria.endDate : null,
      categoryIds: criteria.categoryIds,
      type: criteria.type || null,
      status: criteria.status || null,
      source: criteria.source || null,
      minAmount: parseAmountInput(criteria.minAmount),
      maxAmount: parseAmountInput(criteria.maxAmount),
      installments: criteria.installments,
      groupBy: criteria.groupBy,
      columns: this.visibleColumns(),
    };
  }

  // Resumo impresso junto do relatório: só o que foi aplicado na última geração.
  private describeFilters(criteria: ReportCriteria | null): string[] {
    if (!criteria) {
      return [];
    }

    const filters: string[] = [];
    if (criteria.categoryIds.length) {
      const names = criteria.categoryIds.map(
        (id) => this.categories().find((category) => category.id === id)?.name ?? 'indisponível',
      );
      filters.push(`Categoria: ${names.join(', ')}`);
    }
    if (criteria.type) {
      filters.push(`Tipo: ${labelOf(TYPE_OPTIONS, criteria.type)}`);
    }
    if (criteria.status) {
      filters.push(`Status: ${labelOf(STATUS_OPTIONS, criteria.status)}`);
    }
    if (criteria.source) {
      filters.push(`Origem: ${labelOf(SOURCE_OPTIONS, criteria.source)}`);
    }
    if (criteria.minAmount.trim()) {
      filters.push(`Valor mínimo: ${criteria.minAmount.trim()}`);
    }
    if (criteria.maxAmount.trim()) {
      filters.push(`Valor máximo: ${criteria.maxAmount.trim()}`);
    }
    if (criteria.installments !== 'ALL') {
      filters.push(`Parcelamento: ${labelOf(INSTALLMENT_OPTIONS, criteria.installments)}`);
    }
    if (criteria.groupBy.length) {
      filters.push(`Agrupado por: ${criteria.groupBy.map((code) => labelOf(GROUPING_OPTIONS, code)).join(' > ')}`);
    }
    return filters;
  }
}
