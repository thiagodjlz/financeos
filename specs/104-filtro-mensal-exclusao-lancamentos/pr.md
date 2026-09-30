# Pull Request — issue #104

- PR: https://github.com/thiagodjlz/financeos/pull/105
- Base: `v1.0.2` (branch `fix/issue-104-filtro-mensal-exclusao-lancamentos`)
- Commit: `63c1115afe4b29c1612639a274023419bdae2f12`
- Build gerada pelo hook `pre-commit`: `1.0.2-03` (antes `1.0.2-02`)
- Aberto em: 2026-09-30

## Resumo

Seletor de mês/ano no Resumo e no filtro "Data" de Lançamentos (campo único, abre no mês atual, corrige o layout no celular); Excluir lançamento com confirmação e exclusão definitiva, com o status Cancelado removido e a `V16` apagando os cancelados existentes; Resumo aceita período sem lançamentos; Documentação e Novidades 1.0.2 atualizadas.

## Pendências

- Dump do banco antes do deploy: a `V16` apaga de vez os lançamentos `CANCELED`.
- C22 / T18: depois do merge, levar a `v1.0.2` para a `main` (`git checkout main && git merge v1.0.2` ou cherry-pick) e conferir a `V16` nas duas.
