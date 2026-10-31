# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/118
- Base: `v1.0.3` (head `fix/issue-117-desconto-saldo-acumulado`)
- Commit: `c680d9f596307311b119f9c6653c4ecd1e1ee54c`
- Build gerada pelo hook: `1.0.3-02`

## Resumo

O Saldo do mês agora soma o Saldo anterior (DEC-1, que substituiu o checkbox de desconto pedido na issue). O Saldo acumulado saiu do Resumo e da API. Lançamentos passam a ser ordenados por valor, sem título por dia no celular. A versão fica em linha própria no rodapé do menu, e o favicon passou a ser a marca "F". Central e Novidades 1.0.3 foram atualizadas, com a revisão de textos aplicada. Os 13 critérios foram verificados automaticamente, e o usuário validou em 2026-10-30.

Depois do merge em `v1.0.3`, a correção ainda precisa ir para a `main` (`git checkout main && git merge v1.0.3` ou cherry-pick de `c680d9f`).
