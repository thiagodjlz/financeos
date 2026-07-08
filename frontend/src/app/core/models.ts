export const API_BASE = '/api';

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELED';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'WALLET' | 'INVESTMENT' | 'OTHER';

export interface Period {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}

export interface DashboardSummary {
  period: Period;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  paidExpense: number;
  pendingExpense: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyEvolution: MonthlySummary[];
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  type: TransactionType;
  totalAmount: number;
  transactionCount: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  active: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  active: boolean;
}

export interface Card {
  id: string;
  accountId: string | null;
  name: string;
  brand: string | null;
  creditLimit: number | null;
  closingDay: number | null;
  dueDay: number | null;
  active: boolean;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

export type Screen = 'DASHBOARD' | 'TRANSACTIONS' | 'CATEGORIES' | 'ACCOUNTS' | 'CARDS' | 'USERS' | 'PROFILES';
export type Action = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';

export interface PermissionEntry {
  screen: Screen;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface MeResponse {
  name: string;
  email: string;
  superAdmin: boolean;
  permissions: PermissionEntry[];
}

export interface Profile {
  id: string;
  name: string;
  active: boolean;
  permissions: PermissionEntry[];
}

export interface AppUserSummary {
  id: string;
  name: string;
  email: string;
  active: boolean;
  profileId: string | null;
}

export interface Transaction {
  id: string;
  categoryId: string | null;
  transactionDate: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus | null;
  source: string;
}
