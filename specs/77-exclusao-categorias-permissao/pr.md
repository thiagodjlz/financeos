# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/85
- Titulo: Adiciona exclusão de categorias com bloqueio por lançamentos vinculados
- Base: `main` <- `feature/issue-77-exclusao-categorias-permissao`
- Commit: `8204ca4a94f238cee772f4cfafd977af71b3c66f`
- Data: 2026-09-23
- Fecha: #77

## Resumo

Exclusao fisica de categoria (ativa ou inativa) sem lancamento vinculado; 409 com contagem por tela quando ha lancamentos (todos os usuarios e status). Lixeira na tela de Categorias com permissao `CATEGORIES/DELETE`, modal de confirmacao e toast multilinha. Central de Ajuda e notas da 1.0.2 atualizadas. Quality (backend 127, frontend 325 testes) e build PASSOU; 18/18 criterios verificados; validado pelo usuario em 2026-09-23. T12 do plano desmarcada (suite completa do backend rodou no quality-check).
