# Pull Request

- **URL:** https://github.com/thiagodjlz/financeos/pull/36
- **Issue:** [#35 — Mudança de desing](https://github.com/thiagodjlz/financeos/issues/35)
- **Branch:** `feature/issue-35-redesign-interface` -> `main`
- **Commit:** `03b4822799907ff67cd2eceb5e4104998884172f` — "Aplica o redesign da interface em todas as telas"
- **Data:** 2026-07-27

## Resumo

Redesign completo da interface a partir do mockup de referencia (`design/FinanceOS-Redesign.dc.html`), aplicado a Login, Resumo, Lancamentos, Categorias, Usuarios, Perfis e ao shell da aplicacao:

- Paleta (`oklch`), tipografia, raios e sombras centralizados como custom properties CSS em `:root` no `styles.scss`; nenhum `.scss` de feature tem cor literal.
- Fonte Inter self-hosted (fonte variavel, 2 subsets, `font-weight: 400 800`), sem CDN e sem dependencia npm nova.
- Sidebar como trilho de icones de 76px que expande para 236px no hover e no `:focus-within`, `position: fixed` sobrepondo o conteudo; toggle de minimizar removido; Categorias sobe para o primeiro nivel e Usuarios/Perfis seguem no grupo "Configuracoes".
- Resumo com grafico SVG real de evolucao anual (barras de receita/despesa + linha de saldo, 12 meses) alimentado pelo `monthlyEvolution` ja retornado por `GET /api/dashboard/summary` — sem endpoint novo.
- Perfis com switches na matriz de permissao, mantendo `<input type="checkbox">` como controle real.
- Nenhuma alteracao em `backend/` e nenhuma regra de negocio alterada; edicao inline (#31), botao "Cancelar" (#28) e visibilidade do menu por permissao (#33) preservados.

## Conteudo do commit

- 24 arquivos modificados em `frontend/`: `angular.json`, `src/styles.scss`, `src/app/app.scss`, os 4 de `layout/main-layout/` e os `.html`/`.scss`/`.ts`/`.spec.ts` das 6 telas.
- Novos: `frontend/src/assets/fonts/` (`inter-latin.woff2`, `inter-latin-ext.woff2`, `README.md`).
- Novos: `specs/35-redesign-interface/` (spec, plano, tarefas, notas de implementacao, relatorios da esteira e a subpasta `design/` com o mockup de referencia).

Nenhum arquivo alheio a feature entrou no commit: no momento do `git add` o working tree continha exclusivamente arquivos desta feature.

## Qualidade e verificacao

- `quality-report.md`: PASSOU — backend 30 testes verdes, frontend 66 testes verdes, `npm run build` sem warning de budget.
- `build-report.md`: PASSOU — jar do backend e bundle do frontend gerados, com os dois `.woff2` em `/assets/fonts/`.
- `verification-report.md`: 29 dos 37 criterios de aceite verificados automaticamente, nenhum criterio nao atendido; os 8 restantes (5, 13, 19, 23, 27, 32, 36, 37) cobertos pelo roteiro de validacao manual, aprovada pelo usuario em `http://localhost` em 2026-07-27.
- `tasks.md`: 25 de 26 tarefas concluidas. A T26 e a propria validacao manual da etapa `/pipeline:verify`, executada com o usuario.
