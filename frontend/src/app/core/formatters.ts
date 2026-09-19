import { TransactionStatus } from './models';

export function money(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0);
}

export function monthName(month: number): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(2026, month - 1, 1));
}

export function transactionStatusLabel(status: TransactionStatus | null): string {
  switch (status) {
    case 'PENDING':
      return 'Pendente';
    case 'PAID':
      return 'Pago';
    case 'CANCELED':
      return 'Cancelado';
    default:
      return '-';
  }
}

export function shortMoney(value: number | null | undefined): string {
  const amount = value ?? 0;
  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);

  if (absolute >= 1_000_000) {
    return `${sign}R$ ${shortNumber(absolute / 1_000_000)} mi`;
  }

  if (absolute >= 1_000) {
    return `${sign}R$ ${shortNumber(absolute / 1_000)} mil`;
  }

  return `${sign}R$ ${shortNumber(absolute)}`;
}

export function longMonthName(month: number): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(2026, month - 1, 1),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shortNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}
