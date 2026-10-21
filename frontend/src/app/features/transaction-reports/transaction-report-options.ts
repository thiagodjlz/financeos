import {
  InstallmentFilter,
  ReportColumn,
  ReportCriteria,
  ReportGrouping,
  ReportPeriod,
  ReportPreference,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from '../../core/models';

export interface Option<T extends string> {
  code: T;
  label: string;
}

export const PERIOD_OPTIONS: Option<ReportPeriod>[] = [
  { code: 'CURRENT_MONTH', label: 'Mês atual' },
  { code: 'PREVIOUS_MONTH', label: 'Mês anterior' },
  { code: 'CURRENT_YEAR', label: 'Ano atual' },
  { code: 'PREVIOUS_YEAR', label: 'Ano anterior' },
  { code: 'CUSTOM', label: 'Personalizado' },
];

export const TYPE_OPTIONS: Option<TransactionType>[] = [
  { code: 'INCOME', label: 'Receita' },
  { code: 'EXPENSE', label: 'Despesa' },
];

export const STATUS_OPTIONS: Option<TransactionStatus>[] = [
  { code: 'PENDING', label: 'Pendente' },
  { code: 'PAID', label: 'Pago' },
];

export const SOURCE_OPTIONS: Option<TransactionSource>[] = [
  { code: 'MANUAL', label: 'Manual' },
  { code: 'EXCEL_IMPORT', label: 'Importação de planilha' },
  { code: 'RECURRENCE', label: 'Recorrência' },
];

export const INSTALLMENT_OPTIONS: Option<InstallmentFilter>[] = [
  { code: 'ALL', label: 'Todos' },
  { code: 'INSTALLMENT', label: 'Parcelados' },
  { code: 'SINGLE', label: 'À vista' },
];

export const GROUPING_OPTIONS: Option<ReportGrouping>[] = [
  { code: 'CATEGORY', label: 'Categoria' },
  { code: 'TYPE', label: 'Tipo' },
  { code: 'STATUS', label: 'Status' },
  { code: 'SOURCE', label: 'Origem' },
  { code: 'DAY', label: 'Dia' },
  { code: 'MONTH', label: 'Mês' },
  { code: 'YEAR', label: 'Ano' },
];

// Ordem em que as colunas aparecem na tabela, qualquer que seja a ordem em que foram marcadas.
export const COLUMN_OPTIONS: Option<ReportColumn>[] = [
  { code: 'DATE', label: 'Data' },
  { code: 'DESCRIPTION', label: 'Descrição' },
  { code: 'CATEGORY', label: 'Categoria' },
  { code: 'TYPE', label: 'Tipo' },
  { code: 'STATUS', label: 'Status' },
  { code: 'SOURCE', label: 'Origem' },
  { code: 'INSTALLMENT', label: 'Parcela' },
  { code: 'AMOUNT', label: 'Valor' },
  { code: 'NOTES', label: 'Observações' },
];

// DD5 da issue #114: abrir sem preferência padrão mostra estas colunas.
export const DEFAULT_COLUMNS: ReportColumn[] = ['DATE', 'DESCRIPTION', 'CATEGORY', 'TYPE', 'STATUS', 'AMOUNT'];

export function labelOf<T extends string>(options: Option<T>[], code: T | '' | null | undefined): string {
  return options.find((option) => option.code === code)?.label ?? '';
}

// DD1: "Mês atual" e nenhum filtro.
export function defaultCriteria(): ReportCriteria {
  return {
    period: 'CURRENT_MONTH',
    startDate: '',
    endDate: '',
    categoryIds: [],
    type: '',
    status: '',
    source: '',
    minAmount: '',
    maxAmount: '',
    installments: 'ALL',
    groupBy: [],
  };
}

export function criteriaFromPreference(preference: ReportPreference, amount: (value: number | null) => string): ReportCriteria {
  return {
    period: preference.period,
    startDate: preference.startDate ?? '',
    endDate: preference.endDate ?? '',
    categoryIds: [...preference.categoryIds],
    type: preference.type ?? '',
    status: preference.status ?? '',
    source: preference.source ?? '',
    minAmount: amount(preference.minAmount),
    maxAmount: amount(preference.maxAmount),
    installments: preference.installments,
    groupBy: [...preference.groupBy],
  };
}

export function orderedColumns(columns: ReportColumn[]): ReportColumn[] {
  return COLUMN_OPTIONS.map((option) => option.code).filter((code) => columns.includes(code));
}
