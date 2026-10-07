export const API_BASE = '/api';

// Limite do backend: o GET paginado responde 400 a size acima disso.
export const PAGE_SIZE = 10;

export interface Page<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  size: number;
}

export type ListFilters = Record<string, string>;

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'PENDING' | 'PAID';

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
  // Despesas pagas sobre as receitas, com uma casa; nulo sem receita no mês.
  paidExpensePercent: number | null;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyEvolution: MonthlySummary[];
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  type: TransactionType;
  totalAmount: number;
  transactionCount: number;
  // Fatia da categoria no total do mesmo tipo, com uma casa; nulo com total zero.
  sharePercent: number | null;
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
  active: boolean;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

export type Screen =
  | 'DASHBOARD'
  | 'TRANSACTIONS'
  | 'CATEGORIES'
  | 'USERS'
  | 'PROFILES'
  | 'AUDIT'
  | 'DOCUMENTATION'
  | 'RELEASE_NOTES';
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
  profileName: string | null;
}

export interface Transaction {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor?: string | null;
  transactionDate: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus | null;
  source: string;
}

export type DocumentationBlockKind = 'PARAGRAPH' | 'LIST' | 'TABLE' | 'HIGHLIGHT';

export interface DocumentationTable {
  columns: string[];
  rows: string[][];
}

export interface DocumentationBlock {
  kind: DocumentationBlockKind;
  text: string | null;
  items: string[];
  table: DocumentationTable | null;
}

export interface DocumentationSection {
  title: string;
  blocks: DocumentationBlock[];
}

export interface DocumentationArea {
  id: string;
  title: string;
  summary: string;
  sections: DocumentationSection[];
}

export interface DocumentationContent {
  title: string;
  introduction: DocumentationArea;
  areas: DocumentationArea[];
}

export type ReleaseNoteCategoryKind = 'NEW' | 'IMPROVEMENT' | 'FIX';

export interface ReleaseNoteCategory {
  kind: ReleaseNoteCategoryKind;
  items: string[];
}

export interface ReleaseNoteVersion {
  version: string;
  categories: ReleaseNoteCategory[];
}

export interface AuditChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

// Tipo, ação e funcionalidade chegam com o rótulo pronto do back-end: a tela exibe o rótulo e não
// mantém mapa próprio, para que um tipo de evento novo apareça sem mudança aqui.
export interface AuditRecord {
  id: string;
  occurredAt: string;
  userName: string | null;
  userEmail: string | null;
  type: string;
  typeLabel: string;
  action: string | null;
  actionLabel: string | null;
  screen: string | null;
  screenLabel: string | null;
  recordId: string | null;
  recordLabel: string | null;
  changes: AuditChange[];
}

export interface AuditOption {
  code: string;
  label: string;
}

export interface AuditOptions {
  types: AuditOption[];
  actions: AuditOption[];
  screens: AuditOption[];
}

export interface ReleaseNotesResponse {
  currentVersion: string;
  versions: ReleaseNoteVersion[];
}
