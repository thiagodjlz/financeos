---
issue: 96
url: https://github.com/thiagodjlz/financeos/issues/96
title: "Remover a funcionalidade do botão de volar ao topo da pagina"
domains: [documentation]
target: main
stage: validated
branch: feature/issue-96-remover-botao-voltar-ao-topo
created: 2026-09-28
---

# Remover a funcionalidade do botão de volar ao topo da pagina

## Historia

Como usuário do FinanceOS, quero que as telas não exibam mais o botão flutuante "Voltar ao topo", para que a interface fique sem esse elemento e a rolagem use só os recursos nativos do navegador/dispositivo.

## Contexto

A issue #75 criou o botão global `BackToTop` (`frontend/src/app/core/back-to-top/`), montado uma vez em `main-layout.html` (`<app-back-to-top [focusTarget]="workspace" />`) e importado em `main-layout.ts`. Ele aparece após 300 px de rolagem, com listener `scroll` em `window`. A issue pede a remoção global do botão e de toda a lógica de exibir, ocultar e executar a ação, sem alterar as demais funcionalidades.

Levantamento no repositório (branch `main`, `VERSION` 1.0.2-dev; a única versão cortada é a v1.0.1):

- Frontend: pasta `core/back-to-top/` (`.ts`, `.html`, `.scss`, `.spec.ts`), uso em `main-layout.{ts,html}`, teste em `main-layout.spec.ts` (~linha 534) e menção à camada 40 em comentário de `styles.scss`.
- Backend: o botão é **anunciado ao usuário** em dois conteúdos publicados: item de Melhorias do bloco 1.0.2 em `ReleaseNotesContent` e último parágrafo da seção "Como navegar" em `OverviewContent` (texto quebrado em `"...o botão Voltar ao " + "topo..."`, por isso uma busca por "Voltar ao topo" não o acha). Os testes `ReleaseNotesContentTest`, `ReleaseNotesResourceTest` e `DocumentationContentTest` exigem esses textos. Como 1.0.2 ainda não foi cortada, o botão nunca chegou a uma versão publicada; manter os textos seria publicar uma funcionalidade inexistente.
- Rolagem que deve **permanecer**: `withInMemoryScrolling({ scrollPositionRestoration: 'top' })` em `app.config.ts` (volta ao topo a cada troca de tela) não faz parte do botão. `.workspace` continua sem `overflow` próprio.
- O botão não tem regra de negócio nem endpoint; a mudança é de apresentação e de conteúdo textual publicado.

## Criterios de aceite

- [x] CA1 — Nenhum elemento `app-back-to-top` nem `.back-to-top` existe no DOM de `main-layout` após rolar a página além de 300 px (teste de `main-layout.spec.ts` com `scrollY` simulado + evento `scroll`, ou observação no navegador em `http://localhost` nas telas Resumo, Lançamentos, Categorias, Usuários, Perfis, Documentação e Novidades).
- [x] CA2 — A pasta `frontend/src/app/core/back-to-top/` não existe mais e `rg -n -i "back-to-top|BackToTop|BACK_TO_TOP" frontend/src` retorna vazio, exceto o comentário de camadas de `styles.scss` se ainda citar "voltar ao topo" — este também deve ser ajustado: `rg -n -i "voltar ao topo" frontend/src` retorna vazio.
- [x] CA3 — `main-layout.ts` não importa `BackToTop`; `main-layout.html` não contém `app-back-to-top`; o teste "monta um único botão Voltar ao topo..." de `main-layout.spec.ts` foi removido (não adaptado a afirmar ausência de forma frágil) ou reescrito para afirmar que nenhum `.back-to-top` é renderizado.
- [x] CA4 — Ao montar `MainLayout` e navegar entre telas, nenhum listener `scroll` é registrado em `window` por código do app (teste espiando `window.addEventListener` e filtrando `'scroll'`, sem chamadas).
- [x] CA5 — Rolagem preservada: `scrollPositionRestoration: 'top'` continua em `app.config.ts` (sem diff nessa linha) e `.workspace` continua sem `overflow` próprio; em tela longa (ex.: Lançamentos com várias linhas), a roda do mouse/toque rola o documento normalmente (observação no navegador).
- [x] CA6 — `GET /api/release-notes` não traz, em nenhum item do bloco `1.0.2`, texto contendo "Voltar ao topo"; o item foi removido de `ReleaseNotesContent` e os testes `ReleaseNotesContentTest#shouldAnnounceTheBackToTopButtonAsImprovementIn102` e `ReleaseNotesResourceTest#shouldListTheBackToTopButtonAmongThe102Improvements` foram removidos ou invertidos para afirmar a ausência. A contagem/ordem dos demais itens de Melhorias não muda (nenhum outro teste de `ReleaseNotes*` quebra).
- [x] CA7 — `GET /api/documentation` não traz, na seção "Como navegar" da introdução, bloco com "Voltar ao topo"; o parágrafo foi removido de `OverviewContent.navegacao()` (incluindo a linha `"topo..."` da concatenação) e `DocumentationContentTest#shouldExplainTheBackToTopButtonInHowToNavigate` foi removido ou invertido. Os demais parágrafos de "Como navegar" ficam inalterados.
- [x] CA8 — Varredura de produção sem ocorrência: `rg -n -i "voltar ao\s*\"?\s*\+?\s*\"?\s*topo|back-to-top|backtotop" backend/src/main frontend/src` retorna vazio (o regex cobre a quebra de string do `OverviewContent`; testes e `specs/` antigos não contam).
- [x] CA9 — Não regressão: a suite completa passa (`npm test` no frontend e `./mvnw test` no backend), `npm run build` termina sem warning novo de budget e as varreduras de acentuação de `knowledge/architecture.md` (seção "Idioma") não ganham ocorrência nova em relação ao baseline da `main` (medir antes de implementar).
- [x] CA10 — Sem alteração fora do escopo: `git diff --stat` não toca `frontend/src/app/features/`, `app.config.ts`, migrations nem controllers/serviços do backend; no celular (≤ 680 px) a barra inferior e o `padding-bottom` de `.workspace` continuam como antes e nada fica sobreposto por um botão (observação no navegador por emulação).

## Fora de escopo

- Trocar o botão por outro mecanismo de retorno ao topo, atalho de teclado ou âncora.
- Alterar `scrollPositionRestoration`, o foco da `.workspace` no clique do menu, a barra inferior, o menu lateral ou a escala de camadas dos demais elementos fixos (só a menção ao "voltar ao topo" sai).
- Reescrever specs históricos (`specs/75-botao-voltar-ao-topo/`); eles permanecem como registro.
- Criar novo bloco/versão em Novidades: a remoção é só do item do bloco 1.0.2 em desenvolvimento.

## Decisoes

- 2026-09-28 — Remover também o item de Novidades (1.0.2) e o parágrafo de "Como navegar" da Central de Documentação, porque a issue diz "remover do sistema" e esses textos passariam a descrever uma funcionalidade inexistente. A issue não os cita; a inclusão é decisão desta spec para manter o conteúdo publicado correto, sujeita a veto do usuário.
- 2026-09-28 — Critério "não introduzir impactos" (4º da issue) virou CA9/CA10 mensuráveis (suite, build, diff limitado) em vez de texto genérico.

## Pontos em aberto

- Confirmar com o usuário se o item de Novidades e o parágrafo da Central devem mesmo ser removidos (a issue fala só em telas/lógica). Assumido como sim em "Decisoes", por ser a única opção coerente com "remover do sistema", mas não foi validado.
- `knowledge/frontend-ui.md` (regra "Rolagem" e escala de camadas com "Voltar ao topo 40") e `knowledge/testing.md` (padrão de `window.scrollTo`) citam o botão; a atualização é trabalho da etapa `sync-knowledge`, não critério desta feature.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/96
- Feature original: `specs/75-botao-voltar-ao-topo/spec.md`
- Conhecimento consultado: `knowledge/README.md`, `knowledge/frontend-ui.md` e `knowledge/testing.md` (so por busca do termo; `documentation.md` e `architecture.md` nao lidos); código: `main-layout.{ts,html}`, `ReleaseNotesContent.java`, `OverviewContent.java`
