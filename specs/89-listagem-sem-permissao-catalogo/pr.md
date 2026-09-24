# Pull Request

- PR: https://github.com/thiagodjlz/financeos/pull/91
- Base: `main`
- Branch: `feature/issue-89-listagem-sem-permissao-catalogo`
- Commit: `6ee62e7567403bf74bcddc5965ba5d7d5ffb8054`
- Aberto em: 2026-09-24

## Resumo

Corrige a regressão da #87: as listagens de Lançamentos e Usuários não caem mais em erro sem permissão de ver Categorias/Perfis. O back-end devolve `categoryName`/`profileName` em cada registro; sem a permissão do catálogo, o filtro correspondente fica oculto e os formulários exibem aviso no lugar do dropdown vazio. Quality e build PASSOU; 14/14 critérios verificados; validado pelo usuário em 2026-09-24. Resolve #89.
