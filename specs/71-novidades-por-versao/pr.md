# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/81
- Commit: b1d4bc6
- Branch: `feature/issue-71-novidades-por-versao` -> `main`

## Resumo

Novo submenu "Novidades por versao" em Sobre: tela de consulta ao historico de mudancas por versao, com permissao dedicada `Screen.RELEASE_NOTES` (somente visualizacao), endpoint `GET /release-notes` e migration `V14` que semeia `can_view=true` para os perfis existentes. Conteudo curado do bloco 1.0.2, com tabela de rastreabilidade em `implementation-notes.md`.
