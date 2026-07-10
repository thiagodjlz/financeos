# Estimativa

| Area | Horas |
|---|---|
| Backend | 3.5 |
| Frontend | 4.5 |
| Migration/dados | 0.5 |
| Testes | 2 |
| **Total** | **10.5** |

## Confianca

**Média** — A especificação é clara e bem delimitada, com escopo confirmado nas conversas ("Fora de escopo"). Há código existente reutilizável (filtro de categoria por tipo já existe no backend, tipos de categoria já estão mapeados). Porém:

- Migration envolve verificação de constraint CHECK do Postgres com NULL (segue three-valued logic padrão, mas deve ser validado com teste de integração)
- Lógica no `apply()` fica condicional por tipo de transação (INCOME vs EXPENSE), afetando dois paths (POST e PUT) simultaneamente — risco de regressão em despesas
- Gerenciamento de signal filtrado no Angular sem quebrar lookup de nomes na tabela de "Últimos lançamentos" (signal global `categories` não pode ser sobrescrito)
- Campo Status desaparece do formulário para INCOME, mas continua obrigatório para EXPENSE — risco de deixar `null` acidental se validação de form não for clara
- Cancelamento (`DELETE`) não muda, mas é fácil confundir durante implementação

## Premissas

- Constraint CHECK de `status` no Postgres (Postgres 12+) aceita NULL sem mudança de constraint — comportamento padrão de SQL three-valued logic
- Testes existentes do backend não têm dependências hardcoded de `status NOT NULL`
- Signal `CategoryService.categories` é consumido apenas em `transactions.ts` (dropdown + `categoryName()` na tabela) e em nenhum outro lugar
- Limpeza de categoria selecionada quando tipo muda é simples (verificação de array sem busca de API adicional)
- Migration será executada sem downtime; dados existentes (despesas com status não-nulo) não são afetados
- Nenhuma validação server-side de compatibilidade `categoryId`/`type` será adicionada (fora de escopo)
