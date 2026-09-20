# Pull Request

- **URL:** https://github.com/thiagodjlz/financeos/pull/59
- **Commit:** `fe1659a` — "Escurece a borda dos campos para atingir o contraste da WCAG"
- **Branch:** `fix/issue-58-contraste-borda-campos` -> base **`v1.0.1`**
- **Build gerada pelo hook `pre-commit`:** `1.0.1-05` -> **`1.0.1-06`**
- **Issue:** #58 (fechada pelo merge, via `Closes #58`)

## Resumo

Corrige a ultima pendencia da auditoria de acessibilidade da issue #54: o token
`--border-input` passa de `oklch(88% 0.008 80)` para `oklch(64% 0.008 80)`
(`rgb(143, 140, 135)`), elevando o contraste da borda dos campos de formulario de
1.44:1 para 3.36:1 contra `--surface` (3.22:1 contra `--surface-login-input` e
3.11:1 contra `--card-row-bg`), acima dos 3:1 exigidos pelo criterio 1.4.11
(Non-text Contrast) da WCAG 2.1.

Uma unica linha de producao alterada (`frontend/src/styles.scss:72`), no token,
conforme a convencao do design system. Os demais consumidores (`.ghost-button`,
`--chart-zero`, anel do `.loading-state`) escurecem junto, por decisao do usuario.

## Conteudo do commit

- `frontend/src/styles.scss` — a mudanca do token.
- `specs/58-contraste-borda-campos/` — artefatos da esteira.
- `VERSION`, `backend/pom.xml`, `frontend/src/app/core/version.ts`, `.env.example` —
  acrescentados automaticamente pelo hook `.githooks/pre-commit` (incremento de build
  da versao `v1.0.1`). O `.env` tambem foi atualizado pelo hook no disco, mas e
  gitignored e nao entrou no commit.

## Qualidade e verificacao

- `quality-report.md`: PASSOU (backend 51 testes, frontend 215 testes).
- `build-report.md`: PASSOU (jar do backend e bundle do frontend gerados).
- `verification-report.md`: 6 de 11 criterios verificados automaticamente; os 5
  restantes validados manualmente pelo usuario em `http://localhost` em 2026-09-20.

## Pos-merge

Depois de mergear na `v1.0.1`, levar a correcao para a `main`
(`git checkout main && git merge v1.0.1`, ou cherry-pick do commit `fe1659a`) —
senao ela se perde na proxima versao.
