# Pull Request

- **URL:** https://github.com/thiagodjlz/financeos/pull/40
- **Issue:** [#37 — Menu Cadastros](https://github.com/thiagodjlz/financeos/issues/37)
- **Branch:** `feature/issue-37-menu-cadastros` -> `main`
- **Commit:** `de06d59` — "Adiciona grupo Cadastros ao menu e recolhimento automatico da sidebar"
- **Data:** 2026-07-27

## Resumo

- Novo grupo "Cadastros" no menu lateral com o subitem "Categorias" (que sai do primeiro nivel), entre "Lancamentos" e "Configuracoes", visivel apenas com `CATEGORIES/VIEW`.
- Grupos do menu em acordeao: no maximo um aberto por vez.
- Recolhimento automatico da sidebar ao ativar um item que abre tela (mouse e teclado), com foco movido para a area de conteudo; o trilho so reexpande apos o ponteiro sair e reentrar ou novo foco de teclado.
- Mudanca 100% de frontend: apenas os 4 arquivos de `frontend/src/app/layout/main-layout/` (ts, html, scss, spec.ts) mais os artefatos da esteira em `specs/37-menu-cadastros/`.

## Conteudo do commit

- 4 arquivos modificados em `frontend/src/app/layout/main-layout/`.
- Novos: os 8 artefatos da esteira em `specs/37-menu-cadastros/` (spec, plano, tarefas, notas de implementacao e relatorios).
- A pasta untracked `specs/39-ajustes-alertas/` (de outra feature em andamento) ficou deliberadamente fora do commit.

## Qualidade e verificacao

- `quality-report.md`: PASSOU — backend 30 testes verdes, frontend 73 testes verdes, build sem erros.
- `build-report.md`: PASSOU — jar do backend e bundle do frontend gerados.
- `verification-report.md`: 14 dos 17 criterios verificados automaticamente, nenhum nao atendido; os 3 restantes cobertos pela validacao manual aprovada pelo usuario em `http://localhost` em 2026-07-27.
- `tasks.md`: 7 de 7 tarefas concluidas.
