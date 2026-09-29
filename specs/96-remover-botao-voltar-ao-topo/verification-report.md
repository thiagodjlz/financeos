# Relatorio de verificacao

Ambiente: frontend `http://localhost` (200), backend `http://localhost:8080` (`/api/health` UP, versao 1.0.2-dev).
Branch: `feature/issue-96-remover-botao-voltar-ao-topo` — mudancas ainda **nao commitadas**.
Nenhuma resposta de API substituida e nenhum JWT proprio usado; nenhuma escrita ocorreu. `GET /api/release-notes` e `/api/documentation` exigem JWT (401 sem token); o conteudo foi provado pelos testes da suite.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| CA1 | Nenhum botao no DOM apos rolar > 300 px | VERIFICADO | Teste reescrito em `main-layout.spec.ts:534` (define `scrollY`=500, dispara `scroll`, afirma 0 botoes `topo`); `main-layout.html` sem `app-back-to-top`; frontend 408 testes passaram (quality-report). Observacao nas 7 telas: roteiro 1 |
| CA2 | Pasta removida; `rg` vazio | VERIFICADO | Pasta inexistente; `rg -i "back-to-top\|BackToTop\|BACK_TO_TOP\|voltar ao topo" frontend/src` vazio; `styles.scss:37` sem "voltar ao topo" |
| CA3 | Layout sem import/tag; teste reescrito | VERIFICADO | Diff de `main-layout.ts` (import e `imports` sem `BackToTop`) e `main-layout.html` |
| CA4 | Nenhum listener `scroll` | VERIFICADO | Mesmo teste: `addSpy` filtrado por `'scroll'` com `toHaveLength(0)`, apos navegar `/transactions` -> `/documentation` |
| CA5 | Rolagem preservada | VALIDACAO MANUAL | `app.config.ts:12` mantem `scrollPositionRestoration: 'top'` e sem diff; `.workspace` sem `overflow` novo. Roda do mouse/toque: roteiro 1 |
| CA6 | Novidades 1.0.2 sem o item | VERIFICADO | Diff `ReleaseNotesContent.java` (item removido); `ReleaseNotesContentTest#shouldNotAnnounceTheBackToTopButtonIn102` e `ReleaseNotesResourceTest#shouldNotListTheBackToTopButtonAmongThe102Improvements` existem invertidos; backend 163 testes, 0 falhas |
| CA7 | Central sem o paragrafo | VERIFICADO | Diff `OverviewContent.java` (paragrafo e concatenacao removidos, demais intactos); `DocumentationContentTest#shouldNotMentionTheBackToTopButtonInHowToNavigate` (passou) |
| CA8 | Varredura de producao vazia | VERIFICADO | `rg -n -i "voltar ao\s*\"?\s*\+?\s*\"?\s*topo\|back-to-top\|backtotop" backend/src/main frontend/src` vazio; `main-*.js` servido em `http://localhost` sem "back-to-top" |
| CA9 | Suite, build, acentuacao | VERIFICADO | quality-report: backend 163 OK, frontend 408 OK, build sem warning de budget; as duas varreduras de acentuacao de `architecture.md` rodadas por mim: 0 ocorrencias (igual ao baseline vazio) |
| CA10 | Sem alteracao fora do escopo; mobile intacto | VALIDACAO MANUAL | `git diff --stat` nao toca `features/`, `app.config.ts`, migrations, Resources/servicos (parte estatica verificada). Sobreposicao no celular: roteiro 2 |

## Roteiro de validacao manual

1. Abra `http://localhost`, entre com seu usuario e, em cada tela (Resumo, Lancamentos, Categorias, Usuarios, Perfis, Documentacao, Novidades), role a pagina bem alem do topo (mais de 300 px; em Lancamentos use varias linhas). Esperado: nenhum botao redondo aparece no canto inferior direito e a roda do mouse/toque rola o documento normalmente. Ao trocar de tela, a nova tela abre no topo. (criterios 1 e 5). Se ainda aparecer o botao, e bundle em cache: recarregue com Ctrl+F5.
2. Ainda em `http://localhost`, reduza a janela para 680 px ou menos (ou emulacao de celular no DevTools). Esperado: a barra inferior (Resumo, Lancamentos, +, Mais) aparece como antes, o fim do conteudo nao fica escondido atras dela e nada esta sobreposto no canto inferior direito. (criterio 10)
3. Va em Novidades, versao 1.0.2, Melhorias. Esperado: nao ha item sobre "Voltar ao topo". Va em Documentacao > Como utilizar o sistema > Como navegar. Esperado: o texto termina em "O botao Sair fica no painel Mais.", sem paragrafo sobre "Voltar ao topo". (reconfirma criterios 6 e 7)

## Dados de teste criados

Nenhum.

## Conclusao

8 de 10 verificados automaticamente; 2 (CA5 e CA10) dependem do usuario para a parte de observacao no navegador. Nenhum NAO ATENDIDO.
Ponto ainda aberto da spec: a remocao do item de Novidades e do paragrafo da Central foi decisao da spec, sem veto do usuario ate agora. `knowledge/frontend-ui.md` e `testing.md` ainda citam o botao (trabalho do `sync-knowledge`).

Validado pelo usuario em 2026-09-28.
