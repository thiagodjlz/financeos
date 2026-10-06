// Chave e filtros da listagem de Lançamentos no ListStateService. Ficam fora de `transactions.ts`
// porque o Resumo também grava esse estado ("Ver pendentes") e não deve carregar a tela inteira.
export const TRANSACTIONS_LIST_KEY = 'transactions';

// O período é uma chave só (`month`, `YYYY-MM`): o rótulo "Data" some com um único `remove`, e a
// API continua recebendo `startDate`/`endDate`.
export const TRANSACTION_DEFAULT_FILTERS = {
  description: '',
  categoryId: '',
  type: '',
  status: '',
  month: '',
};
