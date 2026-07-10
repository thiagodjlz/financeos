# Relatorio de qualidade

## Backend (`./mvnw test`)

**FALHOU** — 2 testes falharam de 10 rodados

### Falhas encontradas:

1. **CategoryResourceTest.shouldListSeededCategories**
   - Esperado: >=11 categorias
   - Retornado: 9 categorias
   - O seed tem 11 categorias ("Salario", "Extras", "Cartao", "Casa", "Carro", "Bebe", "Mercado", "Internet", "Celular", "Emprestimo", "Investimentos"), mas o endpoint retorna apenas 9 ativas. Não há nenhuma migration que desativa 2 categorias, então esse é um comportamento inesperado.

2. **DashboardResourceTest.shouldReturnMonthlySummary**
   - Esperado: totalIncome = 5000.0
   - Retornado: totalIncome = 0
   - **Causa identificada**: A query do `DashboardRepository.totals()` usa a condição `status <> 'CANCELED'` para filtrar receitas. Com a nova implementação que grava `status = NULL` para transações INCOME, essa condição retorna `NULL` em SQL (não TRUE), então as receitas não são contadas. A query deveria usar `(status IS NULL OR status <> 'CANCELED')` ou simplesmente `status IS NULL OR status != 'CANCELED'` para receitas.

   Problema no arquivo `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java`, linha 32:
   ```sql
   coalesce(sum(case when type = 'INCOME' and status <> 'CANCELED' then amount else 0 end), 0) as total_income
   ```
   Deveria ser:
   ```sql
   coalesce(sum(case when type = 'INCOME' and (status IS NULL OR status <> 'CANCELED') then amount else 0 end), 0) as total_income
   ```

## Frontend (`npm test`)

**PASSOU** — 24 testes, 10 arquivos de teste, nenhuma falha

Testes executados com sucesso em 508ms.

## Frontend build (`npm run build`)

**PASSOU** — Compilação sem erros de tipo

Build gerado com sucesso em 4.677 segundos. Nenhum erro de TypeScript ou durante a bundagem.

## Conclusao

**Precisa de ajuste em:**
- `backend/src/main/java/br/com/financeos/dashboard/DashboardRepository.java` — Corrigir a query SQL da coluna `total_income` para lidar com `status = NULL` para receitas
- Investigar `CategoryResourceTest` — Entender por que apenas 9 categorias são retornadas em vez de 11 do seed (possível problema com dados de teste)

A implementação da feature no backend está funcionando corretamente (TransactionResource grava `status = null` para INCOME), mas o dashboard não foi atualizado para lidar com essa mudança.
