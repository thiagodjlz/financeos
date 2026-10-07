# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/112
- Commit: `fbb5ab1be1fae6fe213de5388985c92e6ebb19c9` ("Adiciona auditoria de alteracoes e eventos de uso")
- Branch: `feature/issue-110-auditoria` -> base `main`
- Fecha: #110

## Resumo

Auditoria de alteracoes (Categorias, Lancamentos, Usuarios, Perfis, com detalhe por campo, imutavel e na mesma transacao) e de eventos (login, login com falha, logout, acesso a telas, acesso negado, sessao expirada), mais a tela Auditoria em Configuracoes. Qualidade e build PASSOU; 23 de 24 criterios verificados automaticamente e validacao manual aprovada em 2026-10-07. Achado fora de escopo registrado no PR: editar lancamento importado troca Origem para Manual e apaga Observacoes (preexistente, issue propria).
