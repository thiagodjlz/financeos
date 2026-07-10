# Estimativa

| Area | Horas |
|---|---|
| Backend | 3 |
| Frontend | 7.5 |
| Migration/dados | 0 |
| Testes | 2 |
| **Total** | **12.5** |

## Confianca

**Média** — A especificação é clara, bem delimitada e com escopo confirmado. Há código existente reutilizável (filtro de categoria por tipo, tipos mapeados). Porém:

- Edição inline envolve múltiplos signals (`editingId`, `editForm`, `editCategories`, `confirmingExit`) que precisam sincronizar; refatoração significativa da tabela (duas `<tr>` mutuamente exclusivas por linha).
- Validação de alteração pendente (`isEditDirty`) requer comparação profunda de estado (snapshot + diff).
- Lógica condicional de status por tipo (null para INCOME, obrigatório para EXPENSE) precisa estar sincronizada entre formulário de criação e linha de edição, risco de divergência.
- Queries do dashboard (`totals`, `categoryBreakdown`, `monthlyEvolution`) já funcionam; tocar nelas para condicional INCOME/EXPENSE em uma delas pode gerar regressão.
- Múltiplos pontos de interação (botão Editar, dropdown Tipo triggerando refiltro, confirmação de saída) precisam conviver sem estado inconsistente.

## Premissas

- Lógica de filtro de categoria por tipo (`categoryService.listByType()`) pode ser reutilizada; novo signal `editCategories` coexiste com `filteredCategories` sem conflito.
- Testes unitários existentes do backend (`DashboardResourceTest`) cobrem todos os cenários de status; não há dependências hardcoded que quebrem ao alterar SQL.
- Validação manual ponta a ponta é suficiente; não há necessidade de testes e2e automatizados além do descrito no plano (edit, reativar CANCELED, confirmar rejeição de saída, reload automático, exclusão de PENDING dos totais).
- Template Angular comporta coexistência de formulário de criação + linha de edição sem colisão de `NgModel` (nomes de input diferenciados: `editDate`, `editType`, etc.).
- Mudança na ordem dos cards (reordenar `pending` e `balance` no markup) não quebra qualquer CSS ou referência indireta a ordem atual.
