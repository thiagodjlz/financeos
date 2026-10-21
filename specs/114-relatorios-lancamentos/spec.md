---
issue: 114
url: https://github.com/thiagodjlz/financeos/issues/114
title: "Relatórios"
domains: [transactions, dashboard, auth, audit, documentation]
target: main
stage: pr-open
branch: feature/issue-114-relatorios-lancamentos
created: 2026-10-20
---

# Relatórios

## Historia

Como pessoa que controla as finanças, quero montar relatórios dos meus lançamentos com filtros, agrupamentos e colunas, e salvar a montagem como preferência, para ver o meu recorte com saldo do período e saldo atual sem remontar tudo.

## Contexto

Issue: menu "Relatórios" > "Lançamentos"; filtros, agrupamentos e detalhes sobre os dados de Lançamentos; opções fixas **Saldo** (período filtrado) e **Saldo atual** (na geração); preferências salvas; tela nos privilégios. Sem mockup.

Regras que se aplicam: lançamento é do `userId` logado; receita tem `status = null`; saldo do Resumo = receitas − despesas `PAID`, acumulado desde out/2026; tela nova segue o modelo `V13`; "Impressão" (`PRINT`) existe sem emissor.

## Decisoes

Do usuário (2026-10-20):
- D1 (PA-1). Perfis: "Relatórios - Lançamentos"; menu: seção "Relatórios" após "Lançamentos", item "Lançamentos".
- D2 (PA-2). Ver = gerar; Incluir/Alterar/Excluir = preferências; todas concedidas a todos os perfis.
- D3 (PA-3). Filtros = campos não-texto: Período, Categoria, Tipo, Status, Origem, Valor, Parcelamento.
- D4 (PA-4). Níveis de agrupamento ilimitados e ordenados: Categoria, Tipo, Status, Origem, Dia, Mês, Ano; subtotais por grupo.
- D5 (PA-5). Sempre analítico; o usuário escolhe as colunas.
- D6 (PA-6). Saldo = receitas − despesas pagas do que passou em todos os filtros; no total e em cada grupo.
- D7 (PA-7). Saldo atual = receitas − despesas pagas de 01/10/2026 até hoje, inclusive, do usuário; independe dos filtros.
- D8 (PA-8). Saldo e Saldo atual em dois quadros fixos no topo, sem opção de ocultar.
- D9 (PA-9). Preferências por usuário, nome obrigatório e único por usuário, editáveis/excluíveis, período relativo ou fixo, uma padrão aplicada ao abrir; categoria excluída é ignorada, inativa vale.
- D10 (PA-10). Tela + "Imprimir" (PDF pelo navegador), que grava "Impressão".
- D11 (PA-11). Sem paginação; abaixo de 680px a tabela rola na horizontal.

Derivadas (opção mais simples):
- DD1. Período: "Mês atual" (padrão), "Mês anterior", "Ano atual", "Ano anterior" ou "Personalizado" (datas inicial e final obrigatórias, inclusivas); o back-end resolve o relativo com a data de hoje de um bean mockável (como `CurrentMonth`).
- DD2. Categoria múltipla (nenhuma = todas; legado sem categoria só entra sem esse filtro). Tipo, Status, Origem: escolha única opcional, semântica de `GET /transactions` (Status exclui receita). Valor: mínimo/máximo opcionais, inclusivos. Parcelamento: Todos / Parcelados (`installmentTotal > 1`) / À vista.
- DD3. Subtotais: Receitas, Despesas pagas, Saldo; pendentes só nas linhas. Campo repetido no agrupamento = 400. Receita agrupa em Status "Sem status"; legado em "Sem categoria".
- DD4. Grupos por nome (categoria), ordem do enum ou cronológica; linhas por data crescente.
- DD5. Colunas: Data, Descrição, Categoria, Tipo, Status, Origem, Parcela, Valor, Observações; padrão Data, Descrição, Categoria, Tipo, Status, Valor; mínimo uma. A resposta traz todos os campos; a escolha é gravada e validada na preferência.
- DD6. Nome único ignorando maiúsculas e espaços nas pontas, até 100 caracteres; marcar uma padrão desmarca a anterior.
- DD7. "Imprimir" chama `POST /audit/print {screen}` (`require(tela, VIEW)`) e abre a impressão mesmo se o registro falhar.

## Criterios de aceite

- [x] 1. `Screen` ganha valor com `label()` "Relatórios - Lançamentos"; migration recria o check e insere a tela com os quatro flags `true` para todos os perfis, sem `update` em linha existente; `GET /api/auth/me` a devolve; Perfis a exibe com as quatro ações.
- [x] 2. Menu e painel "Mais" mostram a seção/item de D1 só com `VIEW`. Rota com `permissionGuard`, em `resolveEntryRoute` na ordem do menu, gera "Acesso à tela" uma vez por entrada.
- [x] 3. Todo endpoint novo começa com `accessControl.require(<tela>, ...)` (gerar/listar VIEW, criar CREATE, alterar EDIT, excluir DELETE): sem permissão = 403 "Você não tem permissão para realizar esta ação.", sem token = 401, `super_admin` = 200.
- [x] 4. Lançamento de outro usuário não entra em linha, grupo, total nem Saldo atual.
- [x] 5. Filtros (DD1, DD2) combinados por E, um teste cada: Período (com hoje = 20/10/2026, "Mês anterior" = 01/09 a 30/09/2026); categoria múltipla (duas de três categorias); Tipo; Status; Origem; Valor 100,00–200,00 inclui 100,00 e 200,00 e exclui 99,99; Parcelados exclui `installmentTotal` 1 e nulo.
- [x] 6. Respondem 400 em português: "Personalizado" sem data; data inicial > final ("A data inicial não pode ser posterior à data final."); mínimo > máximo; valor negativo; enum, período ou agrupamento inválido; agrupamento repetido.
- [x] 7. Agrupamento Categoria > Mês com Alimentação (despesas pagas 50,00 em out e 30,00 em nov) e Salário (receita 1000,00 em out) devolve dois grupos de 1º nível, cada um com subgrupos por mês; Alimentação/out = Receitas 0,00, Despesas pagas 50,00, Saldo −50,00; Salário = Saldo 1000,00. Três níveis funcionam igual; vale DD3.
- [x] 8. Saldo do período: receita 1000,00, despesa paga 600,00 e pendente 300,00 no período → Saldo 400,00 no total e no grupo; filtrando uma categoria, só ela entra. A tela exibe em `money()` sem recalcular.
- [x] 9. Saldo atual com hoje fixado em 20/10/2026: receita 500,00 em 30/09/2026 (fora), receita 1000,00 em 05/10, despesa paga 300,00 em 10/10, pendente 200,00 em 15/10, paga 100,00 em 20/10 e receita 400,00 em 25/10 (futura) → 600,00, igual com Tipo Despesa e "Ano anterior".
- [x] 10. Os dois quadros de D8 aparecem sempre, sem controle para ocultá-los (`*.spec.ts`).
- [x] 11. Colunas: desmarcar "Categoria" a remove do cabeçalho e das linhas; só colunas de DD5; sem coluna, a tela não gera e a preferência = 400. Tipo, Status e Origem saem rotulados como em Lançamentos, nunca o enum cru.
- [x] 12. Sem paginação: com 120 lançamentos no período a resposta traz 120 linhas.
- [x] 13. Preferências: criar sem nome = 400 "O nome é obrigatório."; nome repetido do mesmo usuário = 409, de outro usuário = aceito; lista só as do usuário; alterar/excluir de outro = 404; com período relativo, reabrir noutro mês resolve para o mês novo; "Personalizado" mantém as datas.
- [x] 14. Padrão: marcar B desmarca A; abrir a tela aplica a padrão e gera o relatório; sem padrão, abre com DD1/DD5 e sem filtros (`*.spec.ts`).
- [x] 15. Preferência: categoria excluída some da listagem; inativa fica e continua filtrando.
- [x] 16. Escritas de preferência com `@Audited` + `AuditTrail` (tela nova, rótulo = nome); `POST /audit/print` está em `EVENT_ENDPOINTS`; `AuditCoverageTest` passa.
- [x] 17. "Imprimir" grava "Impressão" com a tela e chama `window.print()`; em `@media print` (emulação) menu, filtros e botões somem e ficam quadros, período, filtros aplicados e tabela.
- [x] 18. Em 375px a tabela rola na horizontal e a página não (`scrollWidth` do documento = largura da janela).
- [x] 19. Sem lançamentos: `.empty-state`, Saldo 0,00 e Saldo atual preenchido; falha da API = toast de Falha.
- [x] 20. Central ganha a área (Saldo e Saldo atual como D6/D7) e o bloco `1.0.3` de Novidades um item; `DocumentationContentTest` e testes de Novidades passam; textos por `revisar-textos`.
- [x] 21. Não-regressão: `GET /transactions`, tela Lançamentos e `GET /dashboard/summary` sem mudança; suítes completas passam; varreduras de idioma (`knowledge/architecture.md`, "Idioma") continuam vazias.

## Fora de escopo

- Outras telas; CSV/Excel; modo sintético; filtro por texto; preferência compartilhada; mudar regras de Lançamentos ou do Resumo.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/114
- Conhecimento: `knowledge/` README, architecture, transactions, dashboard, auth-and-permissions, audit, documentation; código de transactions, dashboard e audit.
