# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080` (stack reconstruida na etapa anterior, containers de 23:41).
Branch: `feature/issue-99-validacao-documentacao-notas-versao` — mudancas ainda **nao commitadas**.
Nenhuma resposta de API substituida e nenhuma escrita na stack. A assinatura de um JWT local para `GET /api/documentation` e `GET /api/release-notes` foi tentada uma vez e barrada pelo classificador de permissoes ("Credential Exploration", issues #71/#76); nao houve nova tentativa. A leitura de `login.*` e do `Sair` do `main-layout.html` tambem foi barrada pelo mesmo motivo — as afirmacoes sobre elas vao para o roteiro (item 3).
Prova de que o conteudo novo esta **no ar**: o jar servido (`/deployments/app/backend-1.0.2-dev.jar`, copiado para fora do repo) contem, em `OverviewContent.class`, os titulos das 6 secoes novas e as frases "Mostrar senha", "Credenciais inv...", "Sua sess...", "Nenhum registro encontrado", "abre a tela Sem acesso."; "sem confirma..." em `Overview/Transactions/Users/ProfilesAreaContent.class`; e os 7 itens novos em `ReleaseNotesContent.class`. Sem token, os dois endpoints respondem 401.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | Central cobre G1-G7; G1-G4 na introducao; teste dos termos | VERIFICADO | `DocumentationContentTest#shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes` (passou; confere 6 titulos da introducao e 18 termos, incl. os 7 exigidos); `#shouldPublishIntroductionAndFiveAreas` inalterado e verde; `OverviewContent.java:90-184` |
| 2 | 1.0.2 bloco unico com R1-R7, R7 em Correcoes, testes atualizados | VERIFICADO | `ReleaseNotesContentTest#shouldAnnounceListSearchFiltersPasswordCounterDayGroupsAndEntryFixIn102`, `#shouldAnnounceOwnAccountProtectionsAsASingleFixIn102` (3 Correcoes), `#shouldNotRepeatAnyItemAcrossVersions`, `#shouldNeverPublishVersion101`, `#shouldHave102AsTheOldestBlock` e `ReleaseNotesResourceTest` (3 testes) — todos passaram; os dois ultimos e o Resource nao aparecem no diff |
| 3 | Inventario de PRs #51-#100 e rotas | VERIFICADO | `implementation-notes.md` "Inventario": os 27 PRs mergeados na `main` nesse intervalo (`git log --merges`: 51,55,57,60,63,64,66,67,68,72-74,79-86,88,90,91,94,95,98,100) estao todos classificados; "Rotas -> Central" cobre as 20 rotas de `app.routes.ts`, inclusive `login`, `no-access`, `new`, `:id/edit`, `''` e `**` |
| 4 | Tabela afirmacao -> origem; nada de Contas/Cartoes/Relatorios/importacao/recorrencia/subcategorias | VERIFICADO | tabela em `implementation-notes.md`; grep das linhas `+` do diff por esses termos e pelos termos tecnicos: vazio. Origens conferidas no codigo: `toast.service.ts` (Sucesso/Alerta/Falha, 3800/5200/null ms, max 3, sai o mais antigo), `toast-host.html` (Fechar aviso), `list-feedback.html` + `[canClear]="list.differsFromDefault()"`, `no-access.html`, `entry-route.ts` (ordem do menu), `permission.guard.ts:25-26`, `transactions.ts:182`, `users.ts:136`, `profiles.ts:68` (sem dialogo), `categories.html:151` (dialogo), `documentation.ts:27-43`, `release-notes.html`/`.ts`, `transaction-form.html:140` (/255), `formatters.ts:79-83` (Hoje/Ontem), `TextSearch.java` (unaccent + ilike); R1, R4, R5, R6 ausentes em `origin/v1.0.1` (`git grep`) e guard da v1.0.1 volta fixo para `/dashboard` (R7) |
| 5 | Registro da `pipeline:revisar-textos` | VERIFICADO | `implementation-notes.md` "Revisao de textos": aplicada a todo texto novo das duas telas, com o que foi cortado/reescrito |
| 6 | Nenhum texto publicado muda de significado | VERIFICADO | `git diff -U0` dos `*Content.java`: as 6 linhas removidas sao o `List.of(...)` da introducao, o fechamento de duas listas e as 3 linhas de Acoes, todas reaparecendo identicas com acrescimo ("Age na hora, sem confirmação, e avisa ... com sucesso.") |
| 7 | Diff so em conteudo, testes de conteudo e `specs/99-*/` | VERIFICADO | `git status --porcelain`: 5 `*Content.java`, `DocumentationContentTest.java`, `ReleaseNotesContentTest.java` e `specs/99-validacao-documentacao-notas-versao/`; nada em `frontend/`, rota, enum ou migration |
| 8 | `./mvnw test` e `npm test` passam | VERIFICADO | `quality-report.md`: backend 165/0, frontend 408/0; surefire de 23:36-23:37, depois da ultima edicao das fontes (23:33); inclui `DocumentationSecurityTest` e `ReleaseNotesSecurityTest` (5 cada: 200/403/401) |
| 9 | Varreduras de idioma vazias | VERIFICADO | as duas varreduras de `knowledge/architecture.md` rodadas com `grep -rnE` (sem `rg` na maquina; padrao checado com amostra positiva): 0 e 0 |
| 10 | Busca na Central e bloco v1.0.2 na tela | VALIDACAO MANUAL | exige login; roteiro itens 1 e 2. Indicio: o jar servido tem "Mostrar senha" e "Sem acesso" contiguos, e a busca (`documentation.ts:27-43`, `toLowerCase().includes` em titulo, textos, itens e tabelas) os encontra |

## Roteiro de validacao manual

1. Entre em `http://localhost` com a sua conta de administrador e abra `http://localhost/documentation`. No campo "Buscar na documentação" digite `Mostrar senha`. Esperado: o índice mostra só "Como utilizar o sistema" e o conteúdo mostra só a seção "Entrar no sistema". Apague e digite `Sem acesso`. Esperado: o índice mostra só "Como utilizar o sistema", com as seções "Entrar no sistema" e "Tela Sem acesso". Se aparecer "Nenhuma área corresponde à busca.", o backend servido é o antigo. (criterio 10)
2. Abra `http://localhost/release-notes`. Esperado: um único bloco "Versão v1.0.2" com o rótulo "atual"; em Melhorias, 13 itens, os 6 últimos começando por "Busca nas listas", "Filtros ativos", "Volta do cadastro", "Mostrar senha", "Contador na Descrição" e "Lançamentos por dia no celular"; em Correções, 3 itens, o último começando por "Entrada no sistema". Nenhum bloco v1.0.1. (criterio 10)
3. Confira as afirmações da seção "Entrar no sistema" e de "Tela Sem acesso" que não pude cruzar com o código: (a) numa aba anônima, em `http://localhost/login`, o botão "Mostrar senha" fica dentro do campo Senha e, clicado, passa a se chamar "Ocultar senha"; (b) com uma senha errada aparece o Alerta "Credenciais inválidas. Tente novamente."; (c) com a janela estreita (celular), o painel "Mais" da barra de baixo tem o botão Sair. Se algo divergir, o texto da Central precisa ser corrigido. (criterios 1 e 6)
4. Opcional: com a janela estreita (celular), abra a Central, escolha "Como utilizar o sistema" e confira que as 6 seções novas ("Entrar no sistema", "Tela Sem acesso", "Avisos do sistema", "Listas sem resultado ou com falha", "Como usar esta Central", "Novidades por versão") leem bem.

## Dados de teste criados

Nenhum.

## Conclusao

9 de 10 criterios verificados automaticamente; 1 (criterio 10) depende do usuario, com uma conferencia extra de exatidao (item 3). Nenhum criterio NAO ATENDIDO.

Validado pelo usuario em 2026-09-29.
