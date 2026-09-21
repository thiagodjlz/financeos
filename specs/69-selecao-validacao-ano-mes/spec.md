---
issue: 69
url: https://github.com/thiagodjlz/financeos/issues/69
title: "Ajustar seleção e validação dos campos Ano e Mês"
slug: selecao-validacao-ano-mes
domains: [dashboard, transactions, auth]
target: main
stage: validated
branch: feature/issue-69-selecao-validacao-ano-mes
created: 2026-09-20
---

# Ajustar seleção e validação dos campos Ano e Mês

## Historia

Como operador autenticado do FinanceOS, quero escolher o periodo do Resumo em dois campos de selecao — Mes com o nome completo e listando apenas os meses com lancamentos do ano escolhido, e Ano numa lista que so oferece anos com lancamentos meus —, para que eu nao consiga pedir um periodo invalido por digitacao e para que a escolha do periodo reflita os dados que realmente existem.

## Contexto

A issue pede tres coisas sobre os campos **Ano** e **Mes**: (1) exibir o mes por extenso em vez de abreviado, (2) transformar o Ano num campo de **selecao controlada** oferecendo **somente anos que possuem dados**, e (3) **validar** o ano antes de executar consultas, impedindo que o usuario "contorne a validacao digitando manualmente um valor". A secao 4 da issue pede ainda que a selecao "respeite os dados efetivamente existentes" na relacao Ano x Mes — ponto decidido com o usuario (Decisao PA4) no sentido de **tambem filtrar a lista de meses**. A issue exige inventario do codigo antes da especificacao ("identificar onde os campos sao utilizados, como os valores sao carregados, de onde vem os dados disponiveis, quais componentes de selecao ja existem, quais regras de Ano/Mes ja existem"). O inventario abaixo foi feito no repositorio.

### Onde os campos Ano e Mes existem hoje (unico lugar: o Resumo)

- `frontend/src/app/features/dashboard/dashboard.html`, bloco `.period-controls` do `<header class="topbar">`, com exatamente dois controles:
  - **Ano**: `<input aria-label="Ano" type="number" [(ngModel)]="period.year" min="2023" max="2035" (change)="load()" />` — campo **livre de digitacao**; `min`/`max` sao atributos HTML que o navegador **nao** impede de serem burlados (digitar `1900` e sair do campo dispara `load()` normalmente) e que **nao existem no backend**.
  - **Mes**: `<select aria-label="Mês" [(ngModel)]="period.month" (change)="load()">` com `*ngFor` sobre o literal `[1,...,12]` e rotulo `{{ formatMonthName(month) | titlecase }}`.
- `<h2>{{ formatMonthName(period.month) | titlecase }} {{ period.year }}</h2>` no mesmo cabecalho — e a exibicao do valor selecionado (hoje `Set. 2026`).
- **Nao ha nenhum outro Ano/Mes no app**: `rg 'type="number"' frontend/src/app --glob '*.html'` devolve so este campo e os dois campos de **valor** (`amount`) de Lancamentos; a tela de Lancamentos **nao tem filtro de periodo** (os `<select>` de la sao Tipo, Status e Categoria). O backend `GET /transactions` aceita `startDate`/`endDate`, mas nenhuma tela os usa hoje.
- **Componente de selecao reutilizavel**: nao existe componente Angular customizado de dropdown no projeto — o padrao e o `<select>` nativo estilizado globalmente (`styles.scss`), na mesma linha da regra "controle de formulario estilizado, nunca substituido" (`knowledge/architecture.md`, issue #35). O Ano deve seguir esse mesmo padrao; criar um dropdown custom seria implementacao paralela.

### Como o mes e formatado hoje

- `frontend/src/app/core/formatters.ts` tem **duas** funcoes: `monthName(month)` -> `Intl` com `{ month: 'short' }` (`"set."`, abreviado **com ponto**) e `longMonthName(month)` -> `{ month: 'long' }` ja capitalizado (`"Setembro"`).
- `dashboard.ts` expoe `formatMonthName()` chamando `monthName()` — e essa a origem das abreviacoes no `<h2>` e nas 12 `<option>`.
- `longMonthName()` **ja e usado** no informativo por mes do grafico (`tooltip.title`), ou seja, o nome completo ja existe no projeto e nao precisa ser criado.
- **Cuidado**: `monthName()` tambem alimenta `monthAxisLabel(month, groupWidth)` — funcao pura exportada de `dashboard.ts` que devolve 3 letras (`Jan`) e cai para 1 letra abaixo de `COMPACT_MONTH_LABEL_WIDTH = 30px` (issue #54). **Os rotulos do eixo X do grafico nao sao "o campo Mes"** e nao entram nesta mudanca: por extenso eles colidiriam a 390px e quebrariam assercoes existentes de `dashboard.spec.ts`.

### De onde vem o periodo e quais regras de Ano/Mes ja existem (a preservar)

- `GET /api/dashboard/summary?year&month` (`DashboardResource.summary` -> `resolvePeriod`), unica fonte do Resumo:
  - `year` e `month` vem **juntos ou nenhum**; nenhum = `YearMonth.now()`; so um = 400 `"Informe o ano e o mês juntos."`;
  - `month` validado `1..12` = 400 `"O mês deve estar entre 1 e 12."`;
  - **nao existe hoje nenhuma validacao de `year`** — qualquer inteiro e aceito e devolve um resumo zerado.
- Todas as consultas de `DashboardRepository` (SQL cru sobre `transactions`, sem Panache) sao **escopadas por `user_id`**: `totals`, `categoryBreakdown` e `monthlyEvolution` sempre filtram `where user_id = ?`. Logo, "dados disponiveis" no dominio existente ja significa **dados do usuario autenticado** (confirmado como decisao PA2).
- **A unica tabela com data e `transactions`** (`transaction_date`); nao existe tabela de periodos, calendario ou parametro de anos. A fonte real de periodos disponiveis e, portanto, `select distinct extract(year ...), extract(month ...) from transactions where user_id = ?`.
- **Regra de dependencia Ano x Mes ja existente** (`knowledge/dashboard.md`): `monthlyEvolution` **sempre** devolve os 12 meses do ano pedido, zero-preenchidos via `MonthlySummaryResponse.empty`, sobrepondo os reais onde existirem; o front exibe `.empty-state` "Sem dados no período" nos paineis quando o periodo escolhido nao tem lancamento. Ou seja: **o sistema hoje ja distingue "mes existente" de "mes com dados" e nunca assume que todo mes do ano tem dados** — e exatamente a regra que a secao 4 da issue manda preservar, e ela continua valendo depois desta issue (Decisoes PA4-1 e PA4-2).
- Recarga: trocar Ano ou Mes chama `load()` por `(change)` (evento **nativo**, deliberadamente nao `(ngModelChange)`, para nao disparar uma chamada por digito) -> `DashboardService.refresh(year, month)` -> **uma** `GET /api/dashboard/summary`. Falha vira toast de Falha via `toast.fromHttpError` (issue #39); o `.empty-state` de periodo sem dados **nao** vira toast.
- Permissao: todo endpoint comeca por `accessControl.require(Screen.DASHBOARD, Action.VIEW)` (`knowledge/auth-and-permissions.md`); `Screen` = `DASHBOARD, TRANSACTIONS, CATEGORIES, USERS, PROFILES`. O endpoint novo de periodos segue a mesma linha (Decisao PA4-6).
- Cancelamento: `DELETE /transactions/{id}` nao apaga — grava `status = CANCELED`, e o registro continua existindo e consultavel (`knowledge/transactions.md`). Isso alimenta a Decisao PA3.

### O que muda no back-end (obrigatorio, nao opcional)

A convencao do projeto (CLAUDE.md) e que **toda regra de negocio e validacao e imposta no back-end**, com o front apenas espelhando como UX. Aqui ha duas regras novas de verdade:

1. **Quais periodos existem** — nao pode ser faixa fixa no front (o `min=2023 max=2035` atual e exatamente o antipadrao que a issue quer eliminar). Precisa de um endpoint que derive anos **e meses** dos dados reais do usuario autenticado, numa unica chamada (Decisao PA4-5). Contrato fixado nesta spec:

   **`GET /api/dashboard/periods`** -> array JSON ordenado por ano **decrescente**, meses **crescentes**:

   ```json
   [
     { "year": 2026, "months": [1, 2, 3, 4, 5, 6, 9] },
     { "year": 2025, "months": [7, 11] },
     { "year": 2023, "months": [3] }
   ]
   ```

   Nome coerente com os demais recursos do dashboard (`/dashboard/summary`) e com o vocabulario ja usado no dominio (`period` no `DashboardSummaryResponse`). Como o record `PeriodResponse` ja existe e significa outra coisa (o periodo consultado, com `startDate`/`endDate`), o DTO novo precisa de nome proprio (ex.: `AvailablePeriodResponse(int year, List<Integer> months)`) — o plano decide o nome da classe, mas **o caminho e o formato JSON acima sao contrato desta spec**: mudar exige atualizar os criterios que os citam.

2. **Ano invalido nao consulta** — `GET /api/dashboard/summary` precisa recusar ano que nao e ano e ano fora do conjunto disponivel, com **duas mensagens distintas** em portugues acentuado (Decisao PA5), do mesmo jeito que ja recusa mes fora de 1..12. Sem isso, trocar o `<input>` por `<select>` seria validacao **so de front**, proibida pela convencao.
   - Ponto de atencao tecnico para o plano: `@QueryParam("year") Integer` com valor nao numerico (`?year=abc`) falha na **conversao**, fora do corpo do metodo, e nao passa pelo `BusinessExceptionMapper` — chegar a 400 com mensagem em portugues exige tratamento explicito (parametro como `String`, `ParamConverter` ou mapper proprio). Os criterios 20 e 21 cobram o resultado, nao a tecnica.
   - **O mes continua com a validacao que ja tem** (`1..12` + par ano/mes), e mes sem dados **nao** e erro (Decisao PA4-1).

### Regras existentes que restringem esta mudanca

- **Resumo** (`knowledge/dashboard.md`, issues #16/#18/#35/#48/#54/#65): totais e suas regras de status, painel "Detalhamento" com contagem de categorias, grafico "Evolucao anual" (escala unica, linha terminando no ultimo mes com lancamento, informativo por mouse/toque/teclado, `monthAxisLabel`), saudacao personalizada estavel ao trocar Ano/Mes, ordem dos 4 cards, ausencia de botao "Atualizar" — nada disso pode mudar.
- **Design system** (issue #35): `<select>` nativo estilizado globalmente; medida/cor nova nasce como custom property em `frontend/src/styles.scss`; nenhuma cor literal em `frontend/src/app/**/*.scss`; nenhuma dependencia de UI nova.
- **Mobile** (issue #54): breakpoints 1080/680/480px; ate 480px campo com `font-size: var(--fs-input-mobile)` (16px) e `min-height: var(--touch-target)` (44px) — regras **globais** que o `<select>` nativo ja herda; em 680px `.period-controls` vira coluna e o campo ocupa 100%; sem rolagem horizontal; sem `!important` em `frontend/src/**/*.scss`; `:hover` sempre dentro de `@media (hover: hover)`.
- **Erros da API** (issue #39): 400 com `message` no corpo (`BusinessExceptionMapper`) e exibido como toast; texto sempre em portugues acentuado.
- **Testes existentes de `dashboard.spec.ts` que tocam esses controles** e vao precisar ser atualizados (sem afrouxar assercao): `host().querySelector('select')` no bloco "nao-regressao do Resumo" (assume que o **primeiro** `<select>` da tela e o de Mes) e `pick<HTMLInputElement>('input')` no bloco da saudacao (assume que o Ano e um `<input>`).

## Decisoes

- **2026-09-20 — PA1: o ano corrente sempre entra na lista de anos.** Decisao do usuario: mesmo sem nenhum lancamento (usuario novo, ou ano corrente ainda vazio), `GET /api/dashboard/periods` inclui o ano corrente e a validacao do backend o aceita. O campo Ano **nunca** fica vazio nem desabilitado, e o Resumo abre no periodo corrente exibindo o `.empty-state` "Sem dados no período" ja existente. Consequencia: criterios 12 e 23.
- **2026-09-20 — PA2: a lista de periodos e por usuario.** Decidido pela sessao principal (sem consulta ao usuario), por coerencia com todo o dashboard, que ja filtra `user_id` em todas as consultas: um ano/mes que so existe em lancamentos de outro usuario nao aparece para o usuario autenticado. Consequencia: criterio 14.
- **2026-09-20 — PA3: lancamento cancelado conta como dado disponivel.** Decisao do usuario: um ano (e um mes) cujo unico lancamento esta `CANCELED` **entra** na lista. Justificativa alinhada ao dominio: nao ha hard delete, o registro continua existindo e consultavel, e esconder o periodo tiraria do usuario o unico caminho de tela para chegar ate ele. A clausula de disponibilidade nao filtra por `status`. Consequencia: criterio 13.
- **2026-09-20 — PA4: o campo Mes lista somente os meses com dados do ano selecionado.** Decisao do usuario, escolhendo a opcao **nao recomendada** pela versao anterior desta spec. Amplia o escopo da issue: o campo Mes deixa de ser a lista fixa de 12 opcoes e passa a ser derivado do mesmo endpoint de periodos. As cinco assuncoes abaixo delimitam essa ampliacao.
- **2026-09-20 — PA4-1: filtrar meses e disponibilidade de lista, nao validacao de consulta.** Consultar um mes sem dados continua devolvendo **200** com paineis zerados e o `.empty-state` "Sem dados no período" — nunca um erro. O back-end continua validando apenas `month` em `1..12` e a exigencia de ano+mes juntos; **a unica validacao nova que rejeita e a do ano**. Isso preserva a regra ja existente do Resumo e evita que uma URL antiga ou um bookmark quebrem. Consequencia: criterios 10 e 27.
- **2026-09-20 — PA4-2: o grafico continua com os 12 meses zero-preenchidos.** A filtragem vale para o **dropdown** do filtro; `monthlyEvolution` continua devolvendo as 12 entradas do ano (`MonthlySummaryResponse.empty` onde nao ha lancamento) e o grafico "Evolucao anual" continua desenhando os 12 rotulos de mes. Registrado explicitamente para ninguem "corrigir" isso depois achando que e inconsistencia. Consequencia: criterio 28.
- **2026-09-20 — PA4-3: trocar de ano reposiciona o mes quando preciso.** Se o mes selecionado nao existir na lista do ano recem-escolhido, o sistema seleciona automaticamente o **mes mais recente com dados** daquele ano (maior valor da lista) e consulta o resumo com ele — o campo nunca fica em branco nem com valor fora das opcoes. Se o mes selecionado existir no ano novo, ele e mantido. Consequencia: criterios 8 e 9.
- **2026-09-20 — PA4-4: ano sem nenhum mes com dados lista os 12 meses.** Caso do ano corrente incluido pela PA1: o campo Mes volta a oferecer os 12 meses (para nao ficar vazio/travado) e o **mes corrente permanece selecionado**. Consequencia: criterio 7.
- **2026-09-20 — PA4-5: um unico endpoint devolve anos e meses.** Para nao gastar um round-trip a cada troca de ano, o contrato e `GET /api/dashboard/periods` com `[{ "year": <int>, "months": [<int>...] }]` (anos decrescentes, meses crescentes), detalhado em "O que muda no back-end". Substitui o `GET /api/dashboard/years` que a versao anterior desta spec havia fixado. Consequencia: criterios 11 e 19.
- **2026-09-20 — PA4-6: o endpoint novo comeca pelo controle de acesso.** `accessControl.require(Screen.DASHBOARD, Action.VIEW)` como primeira linha, no padrao obrigatorio do projeto. Consequencia: criterio 15.
- **2026-09-20 — PA5: duas mensagens distintas para o ano recusado.** Decisao do usuario: ano que nao e um ano valido (nao numerico, vazio, fora de 4 digitos plausiveis) e ano valido porem sem lancamentos recebem **mensagens diferentes**, ambas em portugues acentuado e ambas com status 400. Textos adotados nesta spec: `"O ano informado é inválido."` e `"Não há lançamentos no ano informado."`. O caso `?year=abc`, que hoje escaparia do `BusinessExceptionMapper`, esta explicitamente coberto. Consequencia: criterios 20, 21, 22 e 23.
- **2026-09-20 — Derivacao desta spec (nao veio do usuario): no ano corrente, o mes corrente sempre consta na lista de meses.** Sem isso, abrir `/dashboard` em setembro com dados apenas de Janeiro a Junho colocaria o `<select>` de Mes num valor inexistente entre as opcoes (campo em branco) ou obrigaria a tela a abrir em Junho — mudando o periodo padrao do Resumo, que hoje e sempre o mes corrente, e contrariando a PA1 ("o dashboard continua mostrando o empty-state atual"). Logo, para o **ano corrente** a lista de meses e "meses com dados ∪ {mes corrente}". Consequencia: criterio 6. **Este e o ponto a rever caso o usuario prefira que o Resumo passe a abrir no ultimo mes com dados.**
- **2026-09-20 — Criterio dependente de comportamento nativo nao reprova a feature.** Criterios verificaveis apenas por emulacao no DevTools (viewport de 390x844, abertura do seletor nativo, toque) trazem a ressalva "(verificavel por emulacao — comportamento nativo nao reproduzido)" e nao sao motivo de reprovacao na etapa `/pipeline:verify` — padrao acordado com o usuario na issue #54.
- **2026-09-20 — Derivacao da issue: o Ano vira `<select>` nativo, nao um dropdown custom.** A issue manda "reutilizar o mesmo componente/padrao de selecao utilizado pelo campo Mes" e "nao criar implementacao paralela". O padrao do Mes e o `<select>` nativo estilizado em `styles.scss`; ele ja entrega de graca teclado (setas, digitacao do primeiro caractere, `Home`/`End`), foco, os 16px/44px de mobile e um seletor que o sistema operacional posiciona sem cortar na tela pequena.
- **2026-09-20 — Derivacao da issue: o eixo X do grafico continua abreviado.** "Mes por extenso" vale para o campo de selecao e para o titulo do periodo; os 12 rotulos do eixo do grafico "Evolucao anual" seguem em `monthAxisLabel` (3 letras / 1 letra abaixo de 30px de faixa), regra da issue #54 — por extenso eles colidiriam a 390px.
- **2026-09-20 — Derivacao da issue: o contrato de `summary` nao muda para acomodar o nome do mes.** `period.month` continua inteiro `1..12` no request e na resposta; o nome completo e **so apresentacao** no front (a issue pede "manter o valor interno, alterando somente a representacao visual").
- **2026-09-20 — Nao se herda numero de faixa da tela atual.** O `min="2023" max="2035"` do campo atual **nao** vira criterio nem limite de backend: e justamente a faixa fixa que a issue proibe ("nao criar uma regra fixa"). Os unicos limites admitidos sao o conjunto derivado dos dados reais (criterio 11) e a checagem de sanidade de formato de ano (criterio 21).

## Criterios de aceite

### Mes — apresentacao

- [x] 1. No Resumo (`/dashboard`), as opcoes do campo **Mes** exibem o nome completo em portugues acentuado e capitalizado, no vocabulario `Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro` — conferido lendo o `textContent` das `<option>` do `<select>` de Mes (teste de componente em `dashboard.spec.ts`, com um ano cujos 12 meses estao disponiveis, comparando a lista inteira na ordem).
- [x] 2. Nenhuma opcao nem o valor exibido do campo Mes contem abreviacao: o `textContent` das `<option>` do campo de Mes **nao** casa com `/^[A-Za-zÀ-ÿ]{3}\.?$/` e nao contem ponto final (`"Set."`, `"set"`, `"Jan."` nao aparecem).
- [x] 3. O titulo do periodo no cabecalho exibe mes por extenso + ano, no formato `"Setembro 2026"` — o `textContent` de `.topbar h2` para `period = {year: 2026, month: 9}` e exatamente `Setembro 2026`.
- [x] 4. O **valor interno** do mes continua inteiro `1..12`: ao selecionar "Março", a requisicao disparada e `GET /api/dashboard/summary?year=<ano>&month=3` (conferido no `httpMock`/aba Network) — nenhum nome de mes trafega na URL, no corpo ou no banco, e `DashboardSummaryResponse.period.month` continua inteiro.
- [x] 5. Os rotulos do eixo X do grafico "Evolucao anual" **nao** mudam: `monthAxisLabel(1, 60) === 'Jan'` e `monthAxisLabel(1, 20) === 'J'` continuam valendo (teste unitario existente passa sem alteracao).

### Mes — disponibilidade por ano (Decisao PA4)

- [x] 6. As opcoes do campo Mes sao exatamente os meses do ano selecionado devolvidos por `GET /api/dashboard/periods`. Teste de componente: resposta `[{ "year": 2026, "months": [1,2,3,4,5,6] }, { "year": 2025, "months": [7,11] }]` com o ano **2025** selecionado -> o `<select>` de Mes tem exatamente duas opcoes, `Julho` e `Novembro`, nessa ordem. Para o **ano corrente** vale a uniao com o mes corrente (Decisao derivada): selecionado o ano corrente com `months: [1,2,3,4,5,6]` e hoje em setembro, as opcoes sao `Janeiro..Junho` **mais** `Setembro`, em ordem cronologica.
- [x] 7. Ano selecionado sem **nenhum** mes na resposta (`months: []`, caso do ano corrente incluido pela PA1 num usuario sem lancamentos) -> o campo Mes lista os **12** meses por extenso e o **mes corrente** permanece selecionado; o campo nao fica vazio, desabilitado nem em branco.
- [x] 8. Trocar o Ano para um ano em que o mes selecionado **nao** existe reposiciona o mes para o **maior** mes disponivel daquele ano: partindo de `2026`/`Setembro`, selecionar `2025` com `months: [7, 11]` deixa o campo Mes em `Novembro`, o `<h2>` em `Novembro 2025`, e dispara **uma unica** `GET /api/dashboard/summary?year=2025&month=11` (nenhuma requisicao com `month=9`).
- [x] 9. Trocar o Ano para um ano em que o mes selecionado **existe** mantem o mes: partindo de `2026`/`Março`, selecionar `2025` com `months: [3, 7]` mantem `Março` e dispara `GET /api/dashboard/summary?year=2025&month=3`.
- [x] 10. Mes sem dados **nao** e erro (Decisao PA4-1): `GET /api/dashboard/summary?year=<ano com dados>&month=<mes sem lancamento>` retorna **200** com totais zerados e `monthlyEvolution` completo — nunca 400 — e a tela mostra o `.empty-state` "Sem dados no período" sem toast de erro (teste de backend + verificacao na tela).

### Ano — selecao a partir dos dados reais

- [x] 11. Existe `GET /api/dashboard/periods` devolvendo, para o usuario autenticado, um array JSON de objetos `{ "year": <int>, "months": [<int>...] }`, com **anos em ordem decrescente** e **meses em ordem crescente**, derivados de `transactions.transaction_date`. Teste de backend: lancamentos do usuario em `2023-03-10`, `2025-07-01`, `2025-11-02` e `2026-01-05` produzem `[{2026,[1]}, {2025,[7,11]}, {2023,[3]}]` (mais o ano corrente, conforme criterio 12) — **sem** `2024`, provando que a lista nao e a faixa continua entre o menor e o maior ano, e sem meses inventados dentro de 2025.
- [x] 12. O **ano corrente sempre aparece** na resposta (Decisao PA1), mesmo sem nenhum lancamento: teste de backend com um usuario sem nenhuma transacao devolve `[{ "year": <ano corrente>, "months": [] }]` — array nunca vazio.
- [x] 13. Lancamento **cancelado conta** (Decisao PA3): um usuario cujo unico lancamento de 2022 esta com `status = CANCELED` recebe `2022` na lista, com o mes correspondente em `months` (teste de backend).
- [x] 14. A lista e escopada por usuario (Decisao PA2): um ano/mes que existe **apenas** em lancamentos de outro `user_id` nao aparece na resposta do usuario autenticado (teste de backend com dois usuarios).
- [x] 15. O endpoint exige a mesma permissao do Resumo (Decisao PA4-6): comeca com `accessControl.require(Screen.DASHBOARD, Action.VIEW)` e responde **403** para um usuario cujo perfil nao tem `DASHBOARD/VIEW` (teste de backend no padrao dos demais `*ResourceTest`), e **401** sem token.
- [x] 16. No front, o campo **Ano** e um `<select>` (mesmo controle nativo do Mes), **nao** um `<input>`: `dashboard.html` nao tem mais `type="number"` no bloco `.period-controls` e `rg -n 'aria-label="Ano"' frontend/src/app/features/dashboard/dashboard.html` casa com uma linha de `<select>`. O campo mantem `aria-label="Ano"`.
- [x] 17. As opcoes do `<select>` de Ano sao exatamente os anos devolvidos pelo endpoint, na mesma ordem decrescente (teste de componente: resposta com 2026, 2025 e 2023 -> `<option>` `2026, 2025, 2023`), e **nenhum ano fora da resposta** e oferecido (nao existe `<option>` `2024`).
- [x] 18. O valor interno do ano continua `number`: a requisicao sai como `?year=2025`, nunca `?year=[object Object]`, com aspas ou como texto de rotulo.
- [x] 19. Os periodos disponiveis sao buscados **uma unica vez** por carregamento da tela (Decisao PA4-5): abrir `/dashboard` dispara exatamente uma `GET /api/dashboard/periods`, e trocar Ano ou Mes em seguida dispara **somente** `GET /api/dashboard/summary` — nenhuma segunda chamada de periodos, inclusive na troca de ano (conferido no `httpMock` e na aba Network).

### Validacao do Ano — o back-end e a fonte da regra (Decisao PA5)

- [x] 20. `GET /api/dashboard/summary?year=abc&month=9` retorna **400** com `message` exatamente `"O ano informado é inválido."` no corpo JSON — **nao** 404, nao 500 e nao corpo vazio (caso que hoje falharia na conversao do `@QueryParam Integer` e escaparia do `BusinessExceptionMapper`). Mesmo resultado para `?year=&month=9`.
- [x] 21. `GET /api/dashboard/summary?year=0&month=9` e `?year=99999&month=9` retornam **400** com a mesma mensagem `"O ano informado é inválido."` (valor que nao representa um ano de 4 digitos plausivel).
- [x] 22. `GET /api/dashboard/summary?year=<ano valido sem lancamentos do usuario>&month=9` retorna **400** com `message` exatamente `"Não há lançamentos no ano informado."` — mensagem **diferente** da do criterio 20/21 — e **nao** executa a consulta do resumo (nenhum corpo de `DashboardSummaryResponse`). Teste de backend: usuario com lancamentos so em 2026, chamada com `year=2019`.
- [x] 23. O **ano corrente nunca cai** no 400 do criterio 22 (Decisao PA1): mesmo para um usuario sem nenhum lancamento, `?year=<ano corrente>&month=<mes corrente>` retorna **200** com totais zerados (teste de backend).
- [x] 24. A recusa do criterio 22 vale **sem passar pela tela** (chamada direta por `curl`/Swagger/`fetch` no console): a validacao esta no `DashboardResource`, nao no template Angular — `rg -n "2023|2035" frontend/src/app/features/dashboard/dashboard.html` nao retorna nada (a faixa fixa do front deixou de existir) e o 400 se reproduz com `curl` autenticado, sem navegador.
- [x] 25. As validacoes de periodo que ja existiam continuam identicas, palavra por palavra: `?year=2026` sozinho -> 400 `"Informe o ano e o mês juntos."`; `?year=2026&month=13` -> 400 `"O mês deve estar entre 1 e 12."`; sem nenhum parametro -> 200 com `period` do mes corrente (os tres testes de `DashboardResourceTest` passam sem alteracao).
- [x] 26. No front, um 400 dos criterios 20/21/22 e exibido como toast com a **mensagem do backend** (fluxo `toast.fromHttpError` ja existente), e nao como tela quebrada, `[object Object]` ou texto em ingles.

### Ano x Mes — dependencia existente preservada

- [x] 27. Selecionar um ano **nao** faz o sistema assumir que todos os meses tem dados: com o usuario tendo lancamentos so em Janeiro a Junho de 2026, consultar `2026` + `Setembro` (via URL direta ou via mes corrente do criterio 6) continua retornando `totalIncome`, `totalExpense`, `pendingExpense` e `balance` zerados e exibindo o `.empty-state` "Sem dados no período" — sem toast de erro e sem 400 (mes sem dados nao e erro; ano sem dados e, ver criterio 22).
- [x] 28. `monthlyEvolution` continua devolvendo **12** entradas para o ano pedido, zero-preenchidas onde nao ha lancamento (`MonthlySummaryResponse.empty`), e o grafico "Evolucao anual" continua desenhando os 12 rotulos de mes — a filtragem de meses da Decisao PA4 vale **so** para o dropdown (Decisao PA4-2). O teste de backend existente `shouldReturnMonthlySummary` continua passando sem alteracao.
- [x] 29. A linha de saldo do grafico continua terminando no **ultimo mes com lancamento** (`income !== 0 || expense !== 0`) apos a mudanca dos campos — assercao existente de `dashboard.spec.ts` passa sem afrouxamento.

### UX/UI e responsividade

- [x] 30. Os campos Ano e Mes usam o **mesmo** controle e a mesma aparencia: ambos sao `<select>` dentro de `.period-controls`, sem classe de estilo exclusiva de um deles, e no DevTools > Computed os dois apresentam o mesmo `height`, `font-size`, `border` e `border-radius` a 1440px.
- [x] 31. Teclado: com foco no campo Ano, `Tab` alcanca o campo, `Seta para baixo`/`Seta para cima` trocam o ano e disparam **uma** `GET /api/dashboard/summary` (aplicando o reposicionamento de mes do criterio 8 quando for o caso); `Esc` nao deixa o campo num estado invalido. *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*
- [x] 32. Estados visuais existentes preservados: o `:focus` do campo Ano usa a mesma regra global de `styles.scss` que o Mes (nenhum `outline: none` novo) e qualquer `:hover` adicionado fica dentro de `@media (hover: hover)` — `rg -n ":hover" frontend/src/app/features/dashboard/dashboard.scss` nao mostra nenhuma ocorrencia fora desse envelope.
- [x] 33. Nenhuma cor literal e nenhum `!important` entram na tela: `rg -n "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(|!important" frontend/src/app/features/dashboard/dashboard.scss` nao retorna nada; medida nova de tema, se houver, nasce como custom property em `frontend/src/styles.scss`.
- [x] 34. Desktop (1440x900) e tablet (1024x768 e 768x1024): `document.documentElement.scrollWidth <= window.innerWidth` em `/dashboard`, os dois campos ficam lado a lado no `.topbar` ate 680px e o texto `Setembro` nao e truncado dentro do campo (`scrollWidth <= clientWidth` do `<select>` de Mes).
- [x] 35. Mobile (390x844): sem rolagem horizontal (`document.documentElement.scrollWidth <= window.innerWidth`); os dois campos empilham em coluna ocupando 100% da largura (regra de 680px ja existente, agora valendo tambem para o Ano, que deixou de ter `width: 88px`); no DevTools > Computed cada campo tem `font-size: 16px` e `min-height: 44px`. *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*
- [x] 36. Mobile (390x844) e 320px de largura: a lista de opcoes de Ano e de Mes abre sem ficar cortada nem ultrapassar a tela — consequencia de usar o seletor nativo do sistema (criterio 16). *(Verificavel por emulacao — comportamento nativo nao reproduzido.)*

### Qualidade e nao regressao

- [x] 37. `mvn -q test` (backend) e `npm test` (frontend) passam. Os testes existentes de `dashboard.spec.ts` que dependiam do formato antigo dos controles (`host().querySelector('select')` assumindo Mes como primeiro `<select>`; `pick<HTMLInputElement>('input')` para o Ano) sao **atualizados para os novos controles mantendo a mesma assercao** (uma unica chamada de resumo por troca; saudacao estavel ao trocar Ano e Mes) — nenhuma assercao e removida ou enfraquecida, e os mocks passam a responder tambem `GET /api/dashboard/periods`.
- [x] 38. Existem testes novos de backend cobrindo as regras novas: periodos derivados dos dados com ano faltante no meio (criterio 11), ano corrente sempre presente (criterio 12), cancelado contando (criterio 13), escopo por usuario (criterio 14), permissao (criterio 15), ano nao numerico/implausivel (criterios 20 e 21), ano sem dados (criterio 22) e ano corrente sem dados aceito (criterio 23).
- [x] 39. Existem testes novos de frontend cobrindo o comportamento novo do campo Mes: lista derivada do ano (criterio 6), ano sem meses caindo nos 12 (criterio 7), reposicionamento do mes ao trocar de ano (criterio 8) e manutencao do mes quando ele existe no ano novo (criterio 9).
- [x] 40. Nenhuma migration nova, nenhuma tabela/coluna nova e nenhuma alteracao nos contratos ja existentes: `DashboardSummaryResponse`, `PeriodResponse`, `MonthlySummaryResponse` e `CategoryBreakdownResponse` mantem os mesmos campos e tipos (o DTO de periodos disponiveis e uma classe **nova**, nao uma alteracao dessas); `git status --porcelain` nao lista nada em `backend/src/main/resources/db/migration/`.
- [x] 41. Nenhuma dependencia nova: `git diff frontend/package.json backend/pom.xml` nao adiciona entradas — nenhuma biblioteca de dropdown, datepicker ou i18n e introduzida.
- [x] 42. Sem logica duplicada de nome de mes: o nome completo vem de `longMonthName()` de `core/formatters.ts` (ja existente) e **nao** e criado um segundo array/objeto de nomes de mes — `rg -n "Janeiro|Fevereiro" frontend/src/app --glob '!*.spec.ts'` nao retorna nenhuma lista de meses escrita a mao no codigo de producao.
- [x] 43. A saudacao do Resumo (issue #65) continua estavel ao trocar Ano e Mes, os 4 cards mantem a ordem Receitas/Despesas/Pendente/Saldo, o painel "Detalhamento" continua com a contagem de categorias e nao surge botao "Atualizar" — toda a suite existente de `dashboard.spec.ts` passa.

## Fora de escopo

- Criar filtro de periodo (Ano/Mes) na tela de Lancamentos ou em qualquer outra tela: hoje o Resumo e o unico lugar com esses campos, e a issue trata de ajustar o que existe.
- Mudar o contrato de `GET /api/dashboard/summary` alem da validacao nova de ano (campos, nomes, tipos e `period` permanecem).
- Alterar os rotulos do eixo X do grafico "Evolucao anual" (seguem abreviados, issue #54), a serie de 12 meses do grafico (Decisao PA4-2) ou qualquer regra dos totais, do painel "Detalhamento" e da saudacao.
- Transformar mes sem dados em erro de API (Decisao PA4-1) ou remover o `.empty-state` "Sem dados no período".
- Seletor de intervalo (data inicial/final), atalhos tipo "ultimos 12 meses", "ano atual" ou navegacao por setas de periodo.
- Componente de dropdown customizado, biblioteca de UI, datepicker ou busca digitavel dentro do campo Ano.
- Atualizar a lista de periodos em tempo real apos criar um lancamento em outra tela (a lista e carregada por carregamento do Resumo, criterio 19).
- Internacionalizacao / troca de idioma (UI 100% em portugues).
- Persistir a ultima selecao de periodo do usuario entre sessoes.
- Backfill, limpeza ou migracao de dados historicos de `transactions`.
- Validacao em aparelho fisico como condicao de aceite (a verificacao e por emulacao, conforme a Decisao correspondente).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/69
- Documentos de conhecimento consultados: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/dashboard.md`, `knowledge/transactions.md`, `knowledge/auth-and-permissions.md`
- Specs anteriores relacionadas: `specs/48-ajuste-grafico-dashboard/spec.md` (grafico do Resumo), `specs/54-responsividade-mobile/spec.md` (breakpoints, 16px/44px de campo, criterio verificavel por emulacao), `specs/35-redesign-interface/spec.md` (design system, `<select>` nativo estilizado), `specs/65-saudacao-painel-financeiro/spec.md` (cabecalho do Resumo e nao-regressao dos controles de periodo)
- Codigo inventariado: `frontend/src/app/features/dashboard/{dashboard.html,dashboard.ts,dashboard.scss,dashboard.spec.ts}`, `frontend/src/app/core/formatters.ts`, `frontend/src/app/core/services/dashboard.service.ts`, `frontend/src/app/core/models.ts`, `frontend/src/styles.scss`, `backend/src/main/java/br/com/financeos/dashboard/{DashboardResource.java,DashboardRepository.java,PeriodResponse.java,MonthlySummaryResponse.java}`, `backend/src/test/java/br/com/financeos/dashboard/DashboardResourceTest.java`
