# Pull Request

- **URL**: https://github.com/thiagodjlz/financeos/pull/67
- **Commit**: `003652a` — "Adiciona saudacao personalizada no Painel Financeiro"
- **Branch**: `feature/issue-65-saudacao-painel-financeiro` -> `main`
- **Issue**: https://github.com/thiagodjlz/financeos/issues/65
- **Data**: 2026-09-20

## Resumo

Saudacao personalizada no topo da aba Resumo: duas linhas com o primeiro nome do
operador autenticado (lido do `AuthService.me()` ja carregado, sem requisicao HTTP
nova) e um complemento de contexto, sorteadas de um catalogo de 24 mensagens
distribuidas em quatro periodos do dia. A frase permanece estavel enquanto o
periodo nao vira e se atualiza sozinha na virada de faixa (`setInterval` de 60s
encerrado no `ngOnDestroy`, sem re-render em tique dentro da mesma faixa).

Feature 100% front-end: nada sob `backend/`, sem endpoint, migration ou dependencia
nova. Por ser PR contra `main`, nao houve incremento de build.

## Arquivos no commit

- `frontend/src/app/features/dashboard/greeting.ts` (novo) e `greeting.spec.ts` (novo)
- `frontend/src/app/features/dashboard/dashboard.ts`, `dashboard.html`, `dashboard.scss`, `dashboard.spec.ts`
- `frontend/src/styles.scss` (dois tokens `--fs-greeting-*`)
- `specs/65-saudacao-painel-financeiro/` (artefatos da esteira)

## Situacao

- Qualidade: backend 51/51, frontend 241/241, `npm run build` sem warning de orcamento.
- Verificacao: 39/39 criterios VERIFICADO; validado pelo usuario em 2026-09-20.
- `tasks.md`: T11 a T14 desmarcadas (medicoes no DevTools, executadas na etapa de verificacao) — registrado no corpo do PR.
