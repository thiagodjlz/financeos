---
issue: 78
url: https://github.com/thiagodjlz/financeos/issues/78
title: "Acentuar os 8 comentarios de codigo que sobraram das varreduras"
domains: [dashboard, auth]
target: main
stage: validated
branch: feature/issue-78-acentuar-comentarios-varreduras
created: 2026-09-23
---

# Acentuar os 8 comentarios de codigo que sobraram das varreduras

## Historia

Como mantenedor do FinanceOS, quero que as duas varreduras de acentuacao do projeto voltem vazias, para que o criterio de idioma das proximas issues seja "a varredura sai vazia" em vez de comparar com um baseline de divida antiga.

## Contexto

Issue sem corpo ("-") nem comentarios; escopo inferido do titulo e do repositorio.

`knowledge/architecture.md` ("Idioma") define duas varreduras de acentuacao (frontend e backend, regex diferentes) e registra que **nenhuma sai vazia**: sobra divida de **comentario de codigo** (2 linhas no front, 6 no back), medida na issue #70, que decidiu nao acentua-la por estar fora do seu escopo. Desde entao as specs #71, #75, #76 e #77 exigem "nenhuma ocorrencia nova sobre o baseline"; esta issue quita a divida.

**Remedido na `main` em 2026-09-23 (`d59ded8`)** com os regex exatos: **8 linhas** (2 + 6), as mesmas do baseline, todas comentario de codigo: `frontend/src/styles.scss` 24 e 30; `backend/.../bootstrap/ProductionBootstrap.java` 178 e 179; `backend/.../dashboard/DashboardResource.java` 41, 85, 124 e 125 (`backend/...` = `backend/src/main/java/br/com/financeos`). O texto atual de cada uma e o do CA3 sem os acentos.

Essas 8 linhas estao em 5 blocos de comentario: `styles.scss` 22-36, `ProductionBootstrap.java` 177-179 e `DashboardResource.java` 41-43, 85-86 e 124-125. O ultimo ja e apontado inteiro pela varredura; nos outros **4 comentarios** ha mais **6 linhas sem acento que o regex nao detecta** (`styles.scss` 23, 27, 33; `ProductionBootstrap.java` 177; `DashboardResource.java` 42, 86), que tambem serao acentuadas (ver Decisoes). As demais linhas dos blocos ja estao corretas e nao mudam.

A correcao acentua **a linha inteira**, inclusive palavras que o regex nao pega (`tres`, `catalogo`, `mes`, `e` verbo etc.). Os tres arquivos ja sao UTF-8 com texto acentuado; `styles.scss` e `ProductionBootstrap.java` estao em CRLF no working tree, `DashboardResource.java` em LF (indice em LF nos tres; `.gitattributes`: `* text=auto`).

Nenhuma regra de negocio muda. Os comentarios documentam regras ja descritas em `knowledge/dashboard.md` e `knowledge/auth-and-permissions.md`, e o sentido de cada um se mantem.

## Criterios de aceite

- [x] **CA1**: a varredura do frontend de `knowledge/architecture.md` ("Idioma"), `rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'`, retorna **zero linhas**. Baseline antes da mudanca: 2 linhas (`styles.scss` 24 e 30), medido em 2026-09-23 na `d59ded8`.
- [x] **CA2**: a varredura do backend, `rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'`, retorna **zero linhas**. Baseline: 6 linhas (`DashboardResource.java` 41, 85, 124, 125 e `ProductionBootstrap.java` 178, 179), mesma medicao.
- [x] **CA3**: as 8 linhas apontadas pelas varreduras ficam, na mesma posicao, exatamente com o texto abaixo (so muda a acentuacao, sem reescrever nem quebrar a linha de outro jeito):
  1. `styles.scss:24`: ` * exatamente uma destas três larguras — não existe corte para aparelho específico:`
  2. `styles.scss:30`: `` * `@media (hover: hover)` não declara largura e por isso não pertence a este conjunto:``
  3. `ProductionBootstrap.java:178`: `    // levaria junto o que estivesse pendurado nela. As tabelas saem do catálogo, e não de uma`
  4. `ProductionBootstrap.java:179`: `    // lista fixa aqui, para que uma migration futura não abra esse buraco silenciosamente.`
  5. `DashboardResource.java:41`: `    // Os parâmetros são lidos do UriInfo, e não por @QueryParam Integer: a conversão falharia fora do`
  6. `DashboardResource.java:85`: `    // A checagem do mês vem antes da do ano de propósito: ano fixo em teste/URL antiga com mês inválido`
  7. `DashboardResource.java:124`: `    // A mensagem da NumberFormatException ("For input string: ...") não pode virar texto de tela:`
  8. `DashboardResource.java:125`: `    // o valor inválido vira null e quem responde é a mensagem em português do chamador.`
- [x] **CA4**: as 6 linhas adjacentes dos mesmos comentarios ficam, na mesma posicao, exatamente com o texto abaixo (mesma regra do CA3):
  1. `styles.scss:23`: `` * Conjunto único de breakpoints do FinanceOS. Toda `@media` de largura do frontend usa``
  2. `styles.scss:27`: ` *    680px (--bp-mobile)  — modo mobile: gaveta de navegação e tabela em cartões`
  3. `styles.scss:33`: `` * Os tokens `--bp-*` abaixo são documentação e inspeção no DevTools. Custom property NÃO é``
  4. `ProductionBootstrap.java:177`: ``    // Toda FK para app_users é `on delete cascade` ou `set null`, então remover a conta``
  5. `DashboardResource.java:42`: `    // corpo do método em "?year=abc" e a resposta escaparia do BusinessExceptionMapper; e "?year="`
  6. `DashboardResource.java:86`: `    // tem de continuar respondendo o erro de mês, mesmo quando aquele ano deixar de ser o corrente.`
- [x] **CA5**: `git diff --stat` contra a `main` mostra alterados **apenas** `frontend/src/styles.scss`, `backend/src/main/java/br/com/financeos/bootstrap/ProductionBootstrap.java` e `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java`, com **14 linhas** trocadas no total (3 + 2 no `styles.scss`, 3 no `ProductionBootstrap.java`, 6 no `DashboardResource.java`). Em `git diff` toda linha alterada e uma das 14 listadas no CA3 e no CA4 — nenhuma outra linha dos 5 blocos nem de codigo muda. Nenhum arquivo aparece inteiro alterado por troca de fim de linha ou codificacao.
- [x] **CA6**: os tres arquivos continuam UTF-8 validos (`file <arquivo>` informa "UTF-8"), e os caracteres acentuados das linhas do CA3 e do CA4 aparecem corretos no `git diff`, sem mojibake (`Ã£`, `Ã©`, `�`).
- [x] **CA7**: o backend compila e a suite completa passa (`cd backend && ./mvnw test`), e o frontend gera o bundle (`cd frontend && npm run build`, que compila o `styles.scss`) com a suite `npm test` verde.

## Fora de escopo

- Outros comentarios sem acento fora desses 4 blocos que as varreduras **nao** pegam (busca mais ampla achou ao menos `ProfileResource.java` 34-35, `CategoryUsageCheck.java` 22, `TransactionResource.java` 148, `ReleaseNotesContent.java` 16-19, `ProductionBootstrap.java` 32/39, `release-notes.ts` 26-27, `entry-route.ts` 16, `login.spec.ts` 52 e testes em `backend/src/test`). Ampliar o regex ou quitar essa divida e outra issue.
- Mudar os regex das varreduras ou texto exibido ao usuario: as duas varreduras ja nao acham nenhum texto de tela.
- Atualizar `knowledge/architecture.md` ("Idioma"), que hoje diz que "nenhuma das duas sai vazia" e registra o baseline 2 + 6. Isso e trabalho da etapa `sync-knowledge`, que deve trocar o criterio de baseline por "a varredura sai vazia" depois do merge.
- Renomear identificadores ou reescrever o conteudo dos comentarios.

## Decisoes

- **2026-09-23 — acentuar os comentarios inteiros, nao so as 8 linhas.** O usuario escolheu acentuar os comentarios de que as 8 linhas fazem parte: entram tambem `styles.scss` 23, 27, 33, `ProductionBootstrap.java` 177 e `DashboardResource.java` 42 e 86 (CA4), para nao deixar paragrafos meio acentuados. O CA5 passa a aceitar essas 14 linhas e nenhuma outra. O titulo da issue ("8 comentarios") fica como esta; o numero se refere as linhas da varredura.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/78
- Origem da divida: `specs/70-sobre-central-documentacao/spec.md` (Decisoes, 2026-09-21, e criterio 46); baselines repetidos em `specs/71`, `75`, `76` e `77`
- Conhecimento consultado: `knowledge/README.md`, `knowledge/architecture.md` (secao "Idioma"), `knowledge/dashboard.md`, `knowledge/auth-and-permissions.md` ("Travas de ambiente de producao")
