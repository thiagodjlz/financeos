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

export interface YearMonth {
  year: number;
  month: number;
}

export function currentMonth(today: Date = new Date()): YearMonth {
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

export function monthLabel(year: number, month: number): string {
  return `${longMonthName(month)} de ${year}`;
}

// Mês no calendário, sem pular os que não têm lançamentos: dez/2025 + 1 = jan/2026.
export function shiftMonth(value: YearMonth, delta: number): YearMonth {
  const index = value.year * 12 + (value.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

// Chave `YYYY-MM` guardada no filtro de Lançamentos; vazia quando não há período.
export function monthKey(value: YearMonth): string {
  return `${value.year}-${String(value.month).padStart(2, '0')}`;
}

export function parseMonthKey(key: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key.trim());
  if (!match) {
    return null;
  }

  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year: Number(match[1]), month } : null;
}

export function monthRange(key: string): { startDate: string; endDate: string } | null {
  const value = parseMonthKey(key);
  if (!value) {
    return null;
  }

  const lastDay = new Date(value.year, value.month, 0).getDate();
  const prefix = monthKey(value);
  return { startDate: `${prefix}-01`, endDate: `${prefix}-${String(lastDay).padStart(2, '0')}` };
}

function shortNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

export function shortDate(value: string): string {
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Título do grupo de lançamentos por dia no celular. `today` chega em ISO local para o teste
// fixar o "hoje" sem depender do relógio da máquina.
export function dayHeading(value: string, today: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }

  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const yesterday = isoDate(new Date(todayYear, todayMonth - 1, todayDay - 1));
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month - 1, 1));
  const label = `${day} de ${monthLabel}${year === todayYear ? '' : ` de ${year}`}`;

  if (value === today) {
    return `Hoje, ${label}`;
  }

  if (value === yesterday) {
    return `Ontem, ${label}`;
  }

  return label;
}

export function initials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return '';
  }

  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}
