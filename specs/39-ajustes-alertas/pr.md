# Pull Request

- **URL:** https://github.com/thiagodjlz/financeos/pull/42
- **Commit:** `dcd8479d78fbcd36c2d512b06a4ce8d2bdf81ef0` (`dcd8479`)
- **Branch:** `feature/issue-39-ajustes-alertas` -> `main`
- **Issue:** [#39 — Ajustes de alertas](https://github.com/thiagodjlz/financeos/issues/39) (vinculada como *closing issue* do PR)
- **Data:** 2026-07-28

## Resumo

Commit unico com 71 arquivos: 43 alterados, 18 novos de codigo e os 10 artefatos da esteira em `specs/39-ajustes-alertas/`.

A feature substitui a faixa `.status-bar` por um sistema de toasts em tres estados (Sucesso / Alerta / Falha) no canto superior direito, faz as mensagens de validacao virem do backend nomeando os campos (`ValidationExceptionMapper` + `BusinessExceptionMapper`), acentua todo o texto exibido no app e adiciona a migration `V11`, que acentua os nomes das categorias semeadas.

## Estado da esteira na abertura do PR

- `quality-report.md`: **PASSOU** — 39 testes de backend, 138 de frontend em 19 arquivos, `npm run build` sem erro e sem warning novo de budget.
- `build-report.md`: **PASSOU** — jar em `backend/target/quarkus-app/quarkus-run.jar`, bundle em `frontend/dist/frontend`.
- `verification-report.md`: **57 de 58 criterios verificados automaticamente, nenhum NAO ATENDIDO**. O criterio 45 era o de validacao manual.
- `tasks.md`: 37 de 37 tarefas concluidas.
- Validacao manual em `http://localhost` **aprovada pelo usuario em 2026-07-28**, incluindo o ajuste pos-validacao do login recusado (Falha -> Alerta, revertendo a D12).

## Observacoes registradas no corpo do PR

- Semantica dos tres estados definida pelo usuario: Alerta = erro corrigivel (validacao, regra de negocio, 403, sessao expirada, credenciais invalidas no login); Falha = erro tecnico inesperado (5xx, timeout, rede).
- Limite de 3 toasts simultaneos.
- Mensagem do 403 do `AccessControl` virou texto generico em portugues, com o par tela+acao movido para o log do servidor.
- Ponto para a revisao: o `ToastService` de-duplica toasts de mesmo tipo e texto ainda vivos (reinicia o timer em vez de empilhar), comportamento nao previsto na spec.

## Pendencia apos esta etapa

Este arquivo (`pr.md`) e a atualizacao de `stage: pr-open` no `spec.md` foram gravados **depois** do commit `dcd8479`, entao ficam no working tree — mesmo padrao da issue #37, que os registrou em commit proprio.
