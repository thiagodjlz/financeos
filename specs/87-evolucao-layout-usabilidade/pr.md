# Pull Request

- PR: https://github.com/thiagodjlz/financeos/pull/88
- Base: `main` <- `feature/issue-87-evolucao-layout-usabilidade`
- Commit: `d4a5a2c6661cf9591e772293b3daf109b59a5d02` ("Evolui layout e usabilidade das listagens e cadastros")
- Fecha: #87

## Resumo

Listagens de Lançamentos, Categorias, Usuários e Perfis paginadas e filtráveis no back-end (400 em português, texto sem acento via `unaccent`), inclusão/edição em tela própria, e estados de carga/vazio/falha padronizados (inclusive Resumo, Documentação e Novidades). Qualidade e build: PASSOU (153 testes back, 350 front). 25/25 critérios verificados; validação manual aprovada pelo usuário em 2026-09-24. Modernização visual (seção 8 da issue) fora de escopo, para issue separada (P7). T33 desmarcada no plano apenas pelo `./mvnw test` completo, que rodou e passou na etapa de qualidade.
