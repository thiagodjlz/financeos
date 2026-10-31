# Relatorio de verificacao

Ambiente: frontend `http://localhost`, backend `http://localhost:8080`. A stack foi reconstruida na etapa anterior: build servido `main-XGEWVGYF.js`, jar `backend-1.0.3-02.jar`.
Branch: `fix/issue-120-icone-guia-ordem-menu` (alvo `v1.0.3`). As mudancas ainda **nao foram commitadas**.
Esta e a rodada pos-validacao (moeda com "F", `?v=2`, item de Novidades reescrito). Os 14 criterios foram medidos de novo.
No Chrome headless, as chamadas `/api/*` (`/auth/me`, `/audit/screen-access`, `/categories`) foram respondidas pelo proprio navegador, com token falso. Nenhuma chegou ao backend, nao houve `/api/auth/login` e nada foi gravado. Do backend, so o jar do container foi copiado e lido.

O diff do working tree tem os 19 arquivos de `implementation-notes.md` e nenhuma mudanca alheia. A revisao `revisar-textos` esta registrada (antes -> depois) para Novidades e Central.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | `favicon.svg` = moeda com "F", so formas | VERIFICADO | O arquivo tem so `svg`/`rect`/`path`, com `#3b5bdb` e `#ffffff` e sem URL alem do `xmlns`. O path do "F" antigo tem 0 ocorrencias. sha256 `2b18eb46...` (difere de `84df37f0...` e `74a83745...`). No quadro de 16 px, o "F" ocupa pixels inteiros (mapa em `evidence/verificacao-tela.md`). Render do Chrome a 16/32/128 px: `evidence/verify-favicon-servido.png` |
| 2 | `favicon.ico` 16/32/48 do mesmo desenho | VERIFICADO | Cabecalho: `type=1 count=3`, quadros 16, 32 e 48 em PNG de 32 bpp. sha256 `aa9dd430...` (difere de `c2140972...` e `810561d7...`). Quadro 16 extraido em `evidence/verify-ico-16-extraido-12x.png`: moeda com o "F" |
| 3 | Contraste >= 3:1 por par | VERIFICADO | Ha so duas cores. Aro, face e "F" (furo `evenodd`) formam sempre o par branco x `#3b5bdb`: 5.67:1 pela WCAG. No `.mark`, o Computed tem fundo `rgb(59, 91, 219)` e path `rgb(255, 255, 255)` |
| 4 | `index.html` com `?v=2`; 200 com o sha256 do repo | VERIFICADO | `frontend/src/index.html:8-9`. `curl http://localhost/` traz os dois `<link>` versionados, com `sizes`/`type`. `GET /favicon.svg?v=2` responde 200 `image/svg+xml` e `/favicon.ico?v=2` responde 200 `image/x-icon`, ambos com o sha256 igual ao do repo |
| 5 | `.mark` do menu = mesmo simbolo, 34x34, visivel recolhido | VERIFICADO | `main-layout.spec.ts:150` (aberto e recolhido; suite 573/573). `d` identico ao do favicon (grep). CDP: 34x34 em 1440/1024/768, texto vazio e `aria-hidden`. Com o menu recolhido, continua 34x34 e visivel (`verify-menu-1440-recolhido.png`, `verify-marca-menu-zoom.png`) |
| 6 | `.mark` do login = mesmo simbolo, 44x44 | VERIFICADO | `login.spec.ts:61` (passou). CDP: 44x44 em 1440/768/390/320, texto vazio, `aria-hidden`, mesmo `d` (`verify-login-1440.png`, `verify-marca-login-zoom.png`) |
| 7 | Menu: Cadastros, Relatórios, Configurações, Sobre | VERIFICADO | `main-layout.spec.ts:144` (passou). CDP: mesma ordem em 1440/1024/768 (`verify-menu-1440.png`) |
| 8 | Painel Mais na mesma ordem, cada item abaixo da sua secao | VERIFICADO | `main-layout.spec.ts:378` e `:389` (`sheetEntries` = Cadastros, Categorias, Relatórios, Lançamentos), passaram. CDP em 390/320: mesma sequencia, sem rolagem horizontal (`verify-mais-390.png`) |
| 9 | Gates e `title`/`aria-label` preservados | VERIFICADO | Specs `:183`, `:194`, `:204`, `:212`, `:401` (secoes conforme a permissao) e `:290` (rotulo no menu recolhido) passaram. Os `*ngIf` estao intocados no diff. CDP com o menu recolhido: `title` e `aria-label` = "Relatórios - Lançamentos" |
| 10 | `resolveEntryRoute` com Categorias antes do relatorio | VERIFICADO | `entry-route.ts:9-10`. `entry-route.spec.ts:44` (CATEGORIES + REPORTS leva a `/categories`) e `:40` (so REPORTS leva a `/transaction-reports`), passaram. O bundle servido tem a nova ordem |
| 11 | `PROFILE_SCREENS` e telas de Perfis | VERIFICADO | `profile-screens.ts:7-8`. `profiles.spec.ts:99` (Detalhe) e `SCREEN_ROWS` de `profile-form.spec.ts:19` passaram. Bundle servido na nova ordem |
| 12 | Central (Overview + Perfis) + teste | VERIFICADO | `DocumentationContentTest#shouldDescribeRegistersBeforeReportsInTheMenuOrder` (23/23 passaram). O jar em execucao tem as 3 frases novas e a matriz, e nao tem "(Relatórios, Cadastros" |
| 13 | Item "Ícone da guia:" reescrito (moeda com F, sem carteira) | VERIFICADO | `ReleaseNotesContent.java:59-60`. `ReleaseNotesContentTest#shouldAnnounceAmountOrderTabIconAndVersionFixIn103` exige menu lateral, tela de entrada e "uma moeda com a letra F", proibe "carteira" e pede item unico. `shouldAnnounceTheTransactionReportAsNewIn103` intocado (18/18). Revisao registrada em `implementation-notes.md`. Texto presente no jar (1x), "carteira" 0x |
| 14 | Varreduras vazias | VERIFICADO | Acentuacao front/back, recurso externo e cor literal em `.scss`: todas sem saida, com controle positivo |

Medicoes completas: `evidence/verificacao-tela.md` e `evidence/favicon.md`.

## Roteiro de validacao manual

Todos os criterios foram medidos. Falta o seu olhar sobre o que motivou o ajuste: a guia mostrar o icone novo no **seu** navegador e a moeda com F agradar.

0. Abra `http://localhost` e faca **Ctrl+F5** (no celular, feche e reabra a aba). Se a guia ainda mostrar o logo do Angular, a carteira ou o "F" sozinho, abra uma **janela anonima** em `http://localhost`. O `index.html` agora pede `favicon.svg?v=2`, e o navegador so ve esse endereco novo depois de recarregar o `index.html`. Confira tambem que o endereco e `http://localhost`, e nao o ambiente de producao.
1. Olhe a guia. Esperado: quadrado azul de cantos arredondados com uma moeda branca de aro duplo e um "F" azul no centro (como em `evidence/verify-favicon-servido.png`). Diga se a moeda e o "F" se reconhecem no tamanho da guia. (criterios 1, 2 e 4)
2. Sem entrar, veja a tela de login. Esperado: acima de "Entrar no FinanceOS", a mesma moeda com "F" num quadrado azul maior. A tela antiga mostrava a carteira ou um "F" de texto. (criterio 6)
3. Entre como administrador, com a janela larga (mais de 680 px). Esperado: a mesma moeda com "F" ao lado de "FinanceOS", no topo do menu. Abaixo de Resumo e Lançamentos vem CADASTROS (Categorias), RELATÓRIOS (Lançamentos), CONFIGURAÇÕES e SOBRE. Clique em "Recolher menu": a moeda continua visivel no topo. Passe o mouse no icone do relatorio: aparece "Relatórios - Lançamentos". (criterios 5, 7 e 9)
4. Estreite a janela para 680 px ou menos (ou use o celular) e toque em **Mais**. Esperado: Cadastros > Categorias, depois Relatórios > Lançamentos, Configurações e Sobre. (criterio 8)
5. Em Sobre > Novidades por versão, bloco 1.0.3, o item deve dizer: "Ícone da guia: a guia do navegador, o topo do menu lateral e a tela de entrada passam a mostrar a marca do FinanceOS, uma moeda com a letra F." Confirme se o texto serve para o usuario final. (criterio 13)

## Dados de teste criados

Nenhum.

## Achado fora dos criterios

- `knowledge/auth-and-permissions.md` ainda descreve Relatórios antes de Cadastros (menu e `entry-route`). Fica para o `sync-knowledge`, como o plano previu.
- Depois do merge em `v1.0.3`, a correcao precisa ir para a `main`: o bloco 1.0.3 com o mesmo texto e nenhum item no 1.0.4.
- O `index.html` sai sem `Cache-Control` (so `ETag`/`Last-Modified`). Por isso o navegador pode seguir com o `index.html` antigo, que nao pede o `?v=2`, ate um Ctrl+F5. Isso ja existia antes da feature.

## Conclusao

Os 14 criterios foram verificados automaticamente e nenhum ficou NAO ATENDIDO. Falta a sua confirmacao visual (roteiro acima) para seguir com `/pipeline:open-pr 120`.

Validado pelo usuario em 2026-10-31.
