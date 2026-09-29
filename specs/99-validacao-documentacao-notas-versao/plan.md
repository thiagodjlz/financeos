# Plano de implementacao

## Abordagem

Mudanca so de conteudo: a introducao da Central (`OverviewContent`) ganha secoes novas para G1-G6, as linhas de Acoes de Lancamentos, Usuarios e Perfis ganham o "sem confirmação" + aviso de sucesso (G7), e o bloco `1.0.2` de `ReleaseNotesContent` ganha itens para R1-R7 (R7 em Correções). Os dois testes de conteudo recebem asserts novos que provam a cobertura; nenhum componente, template, rota, enum ou migration muda. O inventario (PRs #51-#100 e rotas) e a tabela afirmacao -> origem vao para `implementation-notes.md`, e todo texto novo passa pela skill `pipeline:revisar-textos` antes de gravar.

## Arquivos a alterar

### Backend (conteudo)
- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — novas secoes da introducao, depois das 4 atuais (sugestao de titulos: "Entrar no sistema", "Tela Sem acesso", "Novidades por versão", "Como usar esta Central", "Avisos do sistema", "Listas: carregamento e filtros sem resultado"); `List.of(...)` do `build()` recebe os novos metodos.
- `backend/src/main/java/br/com/financeos/documentation/content/TransactionsAreaContent.java` — linha "Cancelar lançamento (linha)" das Acoes: acrescenta que age na hora, sem confirmação, com o aviso "Lançamento cancelado com sucesso.".
- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — idem em "Desativar usuário (linha)" ("Usuário desativado com sucesso.").
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — idem em "Excluir perfil (linha)" ("Perfil excluído com sucesso.").
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — itens novos em `Kind.IMPROVEMENT` (R1-R6) e `Kind.FIX` (R7), sem alterar os itens existentes.

### Testes
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — teste novo de cobertura G1-G7.
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — contagem de Correções 2 -> 3 e teste novo de R1-R7.

### Frontend
- Nenhum (CA7).

### Migration
- Nenhuma.

### Specs
- `specs/99-validacao-documentacao-notas-versao/implementation-notes.md` — inventario, rastreamento, registro da skill.

## Tarefas

- [x] **T1** — Confirmar o inventario na `main`: listar os PRs mergeados #51-#100 (`git log --merges --oneline`) e classificar cada um como "item novo", "já coberto (qual item)" ou "sem item (motivo)", partindo das tabelas da spec; mapear cada rota de `app.routes.ts` (inclusive `login`, `no-access` e as de cadastro `new`/`:id/edit`) para a secao da Central que a descreve. Lacuna nova que aparecer fora de G1-G7/R1-R7 e registrada e reportada, nao implementada de carona.
  - Arquivos: `specs/99-validacao-documentacao-notas-versao/implementation-notes.md`
  - Criterios: 3
- [x] **T2** — Escrever na introducao as secoes de G1 (Entrar no sistema), G2 (Tela Sem acesso), G3 (Novidades por versão) e G4 (Como usar esta Central), com os rotulos e mensagens literais do briefing; o texto precisa conter "Mostrar senha", "Credenciais inválidas", "Sem acesso" e "Correções". Na G4 nao afirmar que a busca ignora acentos. Rodar a skill `pipeline:revisar-textos` antes de gravar.
  - Arquivos: `OverviewContent.java`
  - Criterios: 1, 6, 10
- [x] **T3** — Escrever na introducao as secoes de G5 (Avisos do sistema: Sucesso/Alerta/Falha, Fechar aviso, "Sua sessão expirou. Entre novamente.", "Você não tem permissão para acessar esta tela.") e G6 (falha de carga no lugar do conteudo; "Nenhum registro encontrado." com Limpar filtros). O item atual "A sessão dura 12 horas..." fica como esta. Skill `pipeline:revisar-textos` antes de gravar.
  - Arquivos: `OverviewContent.java`
  - Criterios: 1, 6
- [x] **T4** — Completar G7 nas linhas de Acoes: Cancelar lançamento, Desativar usuário e Excluir perfil agem na hora, sem confirmação, com o aviso "... com sucesso."; manter o texto atual de cada linha e so acrescentar (a linha de Excluir categoria ja diz que pede confirmação). Skill `pipeline:revisar-textos` antes de gravar.
  - Arquivos: `TransactionsAreaContent.java`, `UsersAreaContent.java`, `ProfilesAreaContent.java`
  - Criterios: 1, 6
- [x] **T5** — Acrescentar a `DocumentationContentTest` um teste que (a) confere que as secoes da introducao incluem os titulos adotados para G1-G4 e (b) procura, no texto de todas as secoes (`displayedTexts()`), "Mostrar senha", "Credenciais inválidas", "Sem acesso", "Correções", "Nenhum registro encontrado", "Sua sessão expirou" e "sem confirmação" (ou o rotulo que a redacao adotar, registrado no teste). `shouldPublishIntroductionAndFiveAreas` nao muda.
  - Arquivos: `DocumentationContentTest.java`
  - Criterios: 1
- [x] **T6** — Acrescentar ao bloco `1.0.2` os itens de R1-R6 em Melhorias (varios R podem dividir um item) e R7 em Correções, sem editar os itens existentes. Respeitar as travas do briefing: nenhum item novo com "Categorias"+"Excluir", nem com "tela própria"+"Filtros"+"por página", nem "botão Filtros". Skill `pipeline:revisar-textos` antes de gravar.
  - Arquivos: `ReleaseNotesContent.java`
  - Criterios: 2, 6, 10
- [x] **T7** — Ajustar `ReleaseNotesContentTest`: `assertEquals(2, fixes.size())` passa a 3 (em `shouldAnnounceOwnAccountProtectionsAsASingleFixIn102`, mantendo os demais asserts) e teste novo que confere um item de Melhorias para cada R1-R6 (por trecho: sem diferenciar maiusculas/acentos, Filtros ativos, mesmos filtros/pagina, Mostrar senha, contador de caracteres, agrupados por dia) e o item de R7 em Correções. `shouldNeverPublishVersion101`, `shouldHave102AsTheOldestBlock` e `ReleaseNotesResourceTest` nao mudam.
  - Arquivos: `ReleaseNotesContentTest.java`
  - Criterios: 2
- [x] **T8** — Completar o `implementation-notes.md`: tabela afirmacao -> origem com uma linha por afirmacao nova ou alterada (T2-T4, T6), conferencia de que nenhuma cita Contas, Cartões, Relatórios, importação, recorrência ou subcategorias, e registro da passagem da skill `pipeline:revisar-textos` (o que foi cortado/reescrito) sobre todo texto novo das duas telas; nota de que nenhum texto publicado mudou de significado (so acrescimos).
  - Arquivos: `specs/99-validacao-documentacao-notas-versao/implementation-notes.md`
  - Criterios: 4, 5, 6
- [ ] **T9** — Validar: `./mvnw test` inteiro, `npm test`, as duas varreduras de idioma do briefing (vazias) e `git status`/`git diff --stat` restrito a `documentation/content/`, `releasenotes/content/`, os dois testes de conteudo e `specs/99-*/`.
  - Arquivos: — (so execucao)
  - Criterios: 7, 8, 9

## Cobertura dos criterios de aceite

| Criterio | Resumo | Tarefas |
|---|---|---|
| 1 | Central cobre G1-G7, G1-G4 como secoes da introducao, teste dos 7 termos | T2, T3, T4, T5 |
| 2 | 1.0.2 bloco unico com R1-R7, R7 em Correções, testes atualizados | T6, T7 |
| 3 | inventario de PRs #51-#100 e rotas -> secoes | T1 |
| 4 | tabela afirmacao -> origem, sem funcionalidade inexistente | T8 |
| 5 | registro da skill `pipeline:revisar-textos` | T8 (skill aplicada em T2, T3, T4, T6) |
| 6 | nenhum texto publicado muda de significado | T2, T3, T4, T6, T8 |
| 7 | diff so em conteudo, testes de conteudo e specs | T9 |
| 8 | `./mvnw test` e `npm test` verdes | T9 |
| 9 | varreduras de idioma vazias | T9 |
| 10 | busca "Mostrar senha"/"Sem acesso" e bloco v1.0.2 na tela | T2, T6 (+ validacao manual) |

Conferencia inversa: toda tarefa tem criterio; T9 e so execucao.

## Superficie de validacao

- Criterio 1 — `DocumentationContentTest#<novo teste de cobertura G1-G7>` + `DocumentationResourceTest` (5 areas, introducao) seguem verdes.
- Criterio 2 — `ReleaseNotesContentTest#shouldAnnounceOwnAccountProtectionsAsASingleFixIn102` (3 Correções), `ReleaseNotesContentTest#<novo teste R1-R7>`, `#shouldNotRepeatAnyItemAcrossVersions`, `#shouldNeverPublishVersion101`; `ReleaseNotesResourceTest` (`versions` com 1 bloco `1.0.2`).
- Criterios 3, 4, 5 — leitura do `implementation-notes.md` (secoes Inventario, Rastreamento, Revisao de textos).
- Criterio 6 — `git diff` dos `*Content.java`: so linhas acrescentadas ou linhas de Acoes estendidas, sem remover frase existente.
- Criterio 7 — `git status --porcelain` / `git diff --stat`.
- Criterio 8 — `cd backend; ./mvnw test` e `cd frontend; npm test`.
- Criterio 9 — as duas varreduras `rg` do briefing, saida vazia.
- Criterio 10 — tela (ver abaixo).

## Validacao manual (etapa 7)

- Criterio 10 — requer login com a senha que so o usuario tem (`knowledge/architecture.md`, Auth). Em `http://localhost/documentation`, digitar "Mostrar senha" e depois "Sem acesso" no campo Buscar na documentação: a area "Como utilizar o sistema" aparece com a secao correspondente. Em `http://localhost/release-notes`, o bloco "Versão v1.0.2" (rotulo atual) mostra os itens de R1-R6 em Melhorias e R7 em Correções. Conferir tambem, em largura de celular, que as secoes novas da introducao leem bem.

## Riscos e pontos de atencao

- **Travas dos testes existentes sobre a redacao** (principal risco): contagem exata de Correções (vira 3), unicidade de item com "Categorias"+"Excluir" e com "tela própria"+"Filtros"+"por página", termos de infraestrutura/identificador barrados (nas Novidades sem diferenciar maiusculas) e interface antiga barrada ("botão Filtros", "botão Incluir", "gaveta"). Redacao que esbarre nisso quebra teste antigo, nao o novo (`knowledge/documentation.md`).
- **Busca da Central nao ignora acentos** (`documentation.ts`): a G4 nao pode dizer o contrario, e para o CA10 o texto precisa conter "Sem acesso" e "Mostrar senha" contiguos.
- **Sobreposicao com itens ja publicados do mesmo bloco**: R2 encosta em "Cadastros e listas" e R6 em "Uso completo pelo celular". CA6 proibe mudar significado do existente — itens novos em vez de reescrever os antigos, e o teste de nao repeticao compara string exata.
- **R7 e correcao de comportamento que existia na v1.0.1** (redirecionamento fixo para o Resumo, trocado pela primeira tela permitida na #70), por isso vai em Correções; redigir pelo efeito percebido, sem "redirect"/"rota".
- **A propria #99 nao gera item nas Novidades**: completa a Central, que estreou na versao corrente (regra "corrigir algo que estreou na versao corrente nao gera item", `knowledge/documentation.md`).
- Paragrafos novos ate 600 caracteres; afirmacoes sobre duracao dos avisos devem ser percebidas ("fecha sozinho"), nao milissegundos.
- Commit (etapa 8) exige `FINANCEOS_TEXTOS_REVISADOS=1` pelo hook `check-texts.sh`.

## Lacunas

Nenhuma.
