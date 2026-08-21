# Pull Request

- **URL**: https://github.com/thiagodjlz/financeos/pull/46
- **Commit**: `ab5c61a` — "Torna campos obrigatorios e destaca erros em Perfis, Categorias e Lancamentos"
- **Branch**: `feature/issue-45-campos-obrigatorios` -> `main`
- **Issue**: [#45](https://github.com/thiagodjlz/financeos/issues/45) (fechada pelo `Resolve #45` no corpo do PR)
- **Data**: 2026-07-29

## Resumo

Replica em Perfis, Categorias e Novo Lancamento o padrao de validacao da tela de Usuarios (toast de Alerta nomeando os campos, contorno vermelho, legenda por campo e foco no primeiro invalido), com a logica extraida para o modulo compartilhado novo `frontend/src/app/core/field-errors.ts` — Usuarios passa a delegar a ele sem mudanca de comportamento, e os estilos de erro migraram de `users.scss` para o CSS global.

Categorias perde o campo Icone por completo (aplicacao e coluna `categories.icon`, via migration `V12__drop_categories_icon.sql`) e ganha Nome, Tipo, Cor e Situacao obrigatorios. Perfis passa a exigir Nome. Lancamentos passa a exigir Data, Descricao, Valor, Tipo, Status e Categoria — com Status apenas para Despesa, `categoryId` obrigatorio em POST e PUT, mensagem do Valor como "O valor deve ser maior que zero." e o placeholder "Selecione" no lugar de "Sem categoria" no dropdown (a tabela segue exibindo "Sem categoria" para lancamentos legados). Toda validacao e imposta no back-end; o front-end so espelha como UX.

## Conteudo do commit

38 arquivos (2071 insercoes, 172 remocoes): os arquivos listados em `implementation-notes.md` mais a pasta `specs/45-campos-obrigatorios/`. Nenhum arquivo alheio a feature entrou — o `git status` batia exatamente com as notas de implementacao, sem saida pendente de `sync-knowledge` anterior no working tree.

## Estado da esteira

- `quality-report.md`: PASSOU — backend 51 testes (Flyway "now at version v12"), frontend 161 testes, `npm run build` sem erro.
- `build-report.md`: PASSOU — jar em `backend/target/quarkus-app/` e bundle em `frontend/dist/frontend`.
- `verification-report.md`: 44 de 45 criterios verificados automaticamente; o criterio 38 (`<option>` fixada de categoria inativa na edicao inline) ficou para validacao visual. Validacao manual em `http://localhost` aprovada pelo usuario em 2026-07-29.
- `tasks.md`: 27 de 27 tarefas concluidas.
