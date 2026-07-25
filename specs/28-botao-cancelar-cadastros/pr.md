# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/30
- Commit: `79aeaf8` — "Adiciona botao Cancelar nos quatro formularios de cadastro"
- Branch: `feature/issue-28-botao-cancelar-cadastros` -> `main`
- Aberto em: 2026-07-25

## Resumo

Botao "Cancelar" ao lado de "Salvar" nas quatro telas de cadastro (Categorias, Usuarios, Perfis e "Novo lancamento"). Em criacao, limpa o formulario para o estado inicial sem requisicao HTTP; nas telas com edicao o botao tem dois estagios (restaurar valores originais / sair da edicao). Em Usuarios limpa tambem as mensagens de validacao e a faixa de erro; em Lancamentos o reset repoe o dropdown de Despesa via cache local. Inclui 32 testes de componente novos, os primeiros de `features/` no projeto. Nenhum arquivo de `backend/` alterado.

O commit contem os 12 arquivos de `frontend/src/app/features/` da feature mais os artefatos da esteira em `specs/28-botao-cancelar-cadastros/`. As mudancas de evolucao da esteira (`.claude/**`, `CLAUDE.md`, `knowledge/architecture.md`, `specs/README.md`, `specs/14-tipo-categoria-lancamento/spec.md`) ficaram fora do commit, no working tree, por nao pertencerem a esta feature.
