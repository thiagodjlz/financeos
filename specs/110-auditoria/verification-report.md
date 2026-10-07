# Relatorio de verificacao

Ambiente: frontend `http://localhost` (bundle `main-NQQ3ELCF.js`), backend `http://localhost:8080` (stack reconstruida na etapa anterior).
Branch: `feature/issue-110-auditoria` — mudancas ainda **nao commitadas**.
Rodada 2, apos o ajuste dos filtros pedido na validacao. Desde a rodada 1 so mudou `features/audit/audit.{html,ts,scss,spec.ts}`. Tela medida no build servido por Chrome headless (CDP), respostas `/api/*` substituidas dentro do navegador e token falso: nada chegou ao backend, nenhum `/auth/login`. Banco: so `select`. Medicoes da sessao principal (API simulada) citadas como tal.
Evidencias: `evidence/reverificacao-filtros-cdp.md` (nova), `evidence/ajuste-filtros-auditoria.md`, `evidence/tela-auditoria-cdp.md`, `evidence/api-e-banco.md`.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Registro por escrita 2xx | VERIFICADO | `AuditChangeRecordingTest` (12 endpoints, passou); stack: 3 `CHANGE` reais de 06/10 |
| 2 | Detalhe por campo; DELETE /users = Ativo Sim->Nao | VALIDACAO MANUAL | testes de `AuditChangeRecordingTest` passam; falta juizo sobre "Cor" em hexadecimal — roteiro item 3 |
| 3 | Sem senha/hash | VERIFICADO | `#shouldRecordUserChangesWithoutPasswordOrHash`, `AuditEventsTest#shouldNotExposeTheTypedPasswordOnFailedLogin` |
| 4 | Recusa nao grava; mesma transacao | VERIFICADO | `#shouldNotRecordRefusedWrites`, `#shouldRollBackTheOperationWhenTheAuditFails` |
| 5 | Mecanismo unico + reflexao | VERIFICADO | `AuditCoverageTest#everyWriteEndpointIsAudited`, `#reportsWriteEndpointWithoutAudit` |
| 6 | Login / Login com falha | VERIFICADO | `AuditEventsTest`; stack (rodada 1): `LOGIN_FAILED` gravado apesar do 401 |
| 7 | Sair -> logout no servidor; 401 nao chama | VERIFICADO | `main-layout.spec`, `auth.interceptor.spec`, `AuditEventsTest#shouldRecordLoginAndLogout` |
| 8 | Sessao expirada; Acesso negado | VERIFICADO | `AuditEventsTest#shouldRecordExpiredSessionForTokenWithValidSignature`, `#shouldRecordAccessDeniedWithScreenAndAction` |
| 9 | Acesso a tela | VERIFICADO | `screen-access-tracker.spec`, `main-layout.spec`; CDP: 1 `screen-access` ao abrir, nenhum ao filtrar |
| 10 | Tipo novo sem migration; rotulos do back | VERIFICADO | psql sem check; `AuditResourceTest#shouldShowUnknownEventTypeByItsCodeWithoutMigration`; CDP: selects e botoes com os rotulos da resposta, "Impressão" em Tipo |
| 11 | Sem manutencao | VERIFICADO | stack: `PUT`/`DELETE` 405; `#shouldHaveNoMaintenanceEndpoints` |
| 12 | Exclusao/purge nao apagam | VERIFICADO | psql: unica FK sem cascade; `#shouldKeepRecordsWhenTheAuditedDataIsRemoved` |
| 13 | Rotulo do momento | VERIFICADO | `#shouldKeepLabelsAfterDeletingTheRecordAndRenamingTheUser`, `#shouldKeepTheActorNameOfTheMoment` |
| 14 | `AUDIT`, migration, Perfis, 8 telas | VERIFICADO | psql (V17, check, so Administrador); `ProfileResourceTest`; `AuthResourceTest` |
| 15 | 200/403/401 | VERIFICADO | `AuditSecurityTest` (5); stack: 401 sem token |
| 16 | Consulta paginada e filtros | VERIFICADO | `AuditResourceTest`; CDP: select (desktop) e painel (celular) geram uma so `GET /api/audit` com `type/action/screen` |
| 17 | super_admin nunca devolvido | VERIFICADO | `#shouldNeverReturnSuperAdminRecords`, `#shouldRecordSuperAdminWritesButHideThem...` |
| 18 | Rota, menu, "Mais", entry-route | VERIFICADO | `app.routes.ts`, `entry-route.ts`; CDP rodada 1 |
| 19 | 30 dias, colunas, Detalhe | VERIFICADO | CDP: abre com `startDate=2026-09-07&endDate=2026-10-07`; colunas/Detalhe da rodada 1 (markup inalterado); `audit.spec` |
| 20 | 390 px em cartoes; filtros no painel | VERIFICADO | CDP 390/375/320: sem rolagem horizontal, nenhum select visivel, grupos 9/5/9 botoes quebrando linha, painel rola ate "Aplicar"; sessao principal idem |
| 21 | Acentuacao; varreduras | VERIFICADO | varreduras de front, back e cor literal vazias (rodada 2); chunk com `A\xE7\xE3o: todas`, sem `Ã`/`Â` |
| 22 | Central + Novidades | VERIFICADO | `DocumentationContentTest`, `DocumentationResourceTest`; texto dos filtros segue fiel |
| 23 | `knowledge/` | VERIFICADO | `knowledge/audit.md`, `backend-patterns.md`, `README.md` |
| 24 | Suites completas | VERIFICADO | `quality-report.md` (posterior a ultima edicao): backend 219, frontend 538, build ok |

## Nao-regressao das correcoes

Alcance do ajuste: so o componente `features/audit` (estilo encapsulado; `.filter-select` e `.choice-toggle` locais). `styles.scss`, `filter-panel` e Lancamentos intocados. Criterios reconfirmados: 9, 10, 16, 19, 20, 21, 22 (acima) e 24.

## Roteiro de validacao manual

Antes de tudo: o `index.html` e servido sem `Cache-Control`, entao o navegador pode continuar com a tela antiga. Faca **Ctrl+F5** no computador (no celular, feche e reabra a aba). Sinal de tela antiga: no computador os filtros aparecem como pilulas com o titulo "Tipo"/"Ação"/"Funcionalidade" e a palavra "Todos"/"Todas" dentro; na nova a caixa mostra **"Tipo: todos"**, **"Ação: todas"**, **"Funcionalidade: todas"**.

1. Computador: abra `http://localhost`, entre com a sua conta e va em Configurações > Auditoria. Ao lado das datas, clique em cada uma das tres caixas. Esperado: a lista abre do tamanho das opcoes, sem moldura vazia nem corte — Tipo com 9 linhas (de "Tipo: todos" a "Impressão"), Ação com 5 (de "Ação: todas" a "Visualização"), Funcionalidade com 9 (de "Funcionalidade: todas" a "Novidades por versão"). Escolha "Inclusão" em Ação: a tabela recarrega, a caixa fica azul-clara (Computed `background-color: rgb(237, 241, 253)`) e surge o rotulo "Ação: Inclusão" em Filtros ativos; remova-o pelo X. (ajuste pedido; criterios 16 e 20)
2. Celular: abra o FinanceOS como na validacao anterior e va em Auditoria. Toque "Filtros". Esperado: Tipo, Ação e Funcionalidade aparecem como **botoes** que quebram linha (nenhuma lista suspensa), "Todos"/"Todas" marcado, sem arrastar para o lado; role ate o botao "Aplicar". Toque "Login", "Inclusão" e "Categorias": a lista atras nao muda. Toque "Aplicar": o painel fecha e aparecem os rotulos "Tipo: Login", "Ação: Inclusão", "Funcionalidade: Categorias". Abra "Filtros" de novo, toque outro tipo e feche pelo X sem aplicar: os rotulos continuam os mesmos. (ajuste pedido; criterio 20)
3. Computador, Cadastros > Categorias: inclua "Teste auditoria 110" com uma cor; abra-a, troque **so** a cor e salve; depois exclua. Em Auditoria: tres linhas em Funcionalidade "Categorias", Registro "Teste auditoria 110", Ações "Exclusão", "Alteração", "Inclusão". Abra a "Alteração": so a linha "Cor", com anterior e novo como **codigo hexadecimal** (ex.: `#3b82f6` -> `#ef4444`), enquanto Categorias so mostra a bolinha colorida. Decida se esse codigo serve como "texto legivel"; se nao, a correcao e em `CategoryResource.auditValues`. (criterio 2)

## Dados de teste criados

Nenhum nesta rodada. Continuam os tres `LOGIN_FAILED` da rodada 1 (06/10/2026 21:32; contagem conferida agora = 3). Para limpar: `docker compose exec -T postgres psql -U financeos -d financeos -c "delete from audit_records where event_type='LOGIN_FAILED' and occurred_at between '2026-10-06 21:32:00-03' and '2026-10-06 21:33:00-03';"`.

## Achado fora dos criterios

- **Editar um lancamento importado apaga Origem e Observações** (anterior a feature, revelado por ela): o registro real de 06/10 22:13 em "Plano Celular" mostra Status Pendente -> Pago, Origem Importação de planilha -> Manual e Observações apagadas; no banco o lancamento ficou `source = MANUAL`, `notes` nulo. Causa: o formulario nao envia `source`/`notes` e `TransactionResource.apply` (inalterado) grava `MANUAL` e nulo. Vale issue propria.
- Mantidos da rodada 1 (ver `evidence/api-e-banco.md`): Sessao expirada paralela gera um registro por requisicao; comportamento autenticado provado so pela suite (sem JWT na stack).

## Conclusao

23 de 24 criterios verificados automaticamente; 1 (criterio 2) depende do usuario, mais a conferencia visual da lista nativa dos filtros (itens 1 e 2), que o navegador headless nao desenha. Nenhum NAO ATENDIDO.

Validado pelo usuario em 2026-10-07.
