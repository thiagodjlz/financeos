# Estimativa

| Area | Horas |
|---|---|
| Backend | 5 |
| Frontend | 10.5 |
| Migration/dados | 1 |
| Testes | 2.5 |
| **Total** | **19** |

## Confiança

**Média** — A especificação é clara e bem delimitada em 5 blocos, com plano sequencial detalhado (20 passos). Contudo:

- **Escopo alargado**: afeta quase toda a aplicação (sidebar, 2 pacotes inteiros removidos, 3 telas diferentes, enum `Screen`).
- **Remoção de dados irreversível**: migration dropa tabelas `accounts`/`cards` permanentemente — deve-se confirmar que usuários não dependem desses dados.
- **Lógica de categoria inativa complexa**: pré-seleção no dropdown de Lancamentos, descarga de lista filtrada, validação em múltiplos pontos (frontend e backend).
- **Sidebar retrátil + submenu novo**: envolve CSS/template e sinais no Angular — risco de surpresas visuais ou de interação.
- **Verificação de constraint CHECK**: nome do constraint gerado pelo Postgres é por convenção; deve-se confirmar antes de escrever `DROP CONSTRAINT` na migration.

## Premissas

- Constraint CHECK `profile_permissions.screen` pode ser dropado e recriado sem downtime.
- Nenhum código adicional (além do esperado em `registers/`, `account.service.ts`, `card.service.ts`) referencia `Account`/`Card` services.
- Categorias continuam sendo catálogo global (sem filtro por `userId`); situação `active` também é global.
- Nenhum teste existente de backend depende de `findActiveById` em outras operações que não `GET` e `DELETE`.
- Testes E2E/manuais do frontend cobrem os 20 passos do plano sem bloqueios adicionais.
- Nenhuma integração externa ou webhook depende dos endpoints `/accounts` ou `/cards`.
