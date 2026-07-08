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
