# Revisão de textos (revisar-textos) — issue 109

Aplicada a `.claude/skills/pipeline/revisar-textos/SKILL.md` (lida como arquivo) a todo texto novo ou alterado da Central e de Novidades. Nenhum termo técnico (endpoint, campo `paidExpensePercent`/`sharePercent`, HALF_UP, componente) chegou ao texto: o arredondamento virou "com uma casa decimal", o nulo virou "Sem receitas no mês", o componente de detalhe virou "o detalhe do lançamento". "Cartão" foi trocado por "quadro" no Resumo, para não confundir com cartão de crédito (funcionalidade removida).

## Central — Resumo (`SummaryAreaContent`)

| Antes | Depois | Origem |
|---|---|---|
| "Quatro indicadores no alto da tela: Saldo do mês, Receitas, Despesas e Pendentes…" | Quadro Saldo do mês (barra, "Despesas pagas equivalem a 29,3% das receitas", Receitas/Despesas) + quadro "Pendentes · despesas a pagar" com "Ver pendentes" (no celular, "Ver") | spec D1, DEC-1, DEC-2, DEC-10; `dashboard.html` |
| "…apresenta em indicadores, gráfico e listas" | "…em quadros, gráfico e listas" + parágrafo das duas colunas / ordem no celular | criterio 5, `dashboard.scss` |
| — | Linhas "Despesas pagas equivalem a" e "Fatia da categoria" na tabela de cálculos (uma casa, passa de 100%, "Sem receitas no mês" com barra vazia; total do mesmo tipo) | DEC-2, DEC-3, DEC-10, DEC-11; `DashboardResource.percent` |
| "…aparece somente no indicador Pendentes" | "…somente no quadro Pendentes" | `knowledge/dashboard.md` (totais) |
| — | Permissões: "Ver pendentes" só com ver Lançamentos; "Novo lançamento" só com incluir | DEC-1, criterio 5 |
| — | Mês do período com faixa e nome em negrito; quadro abaixo do gráfico no celular com "Toque em um mês do gráfico para ver os valores." | criterio 4, DEC-4 |
| — | Fatia por categoria e "a soma pode dar 99,9% ou 100,1%" | DEC-11; risco do plano |
| — | Ações "Ver pendentes" (substitui os filtros de Lançamentos) e "Novo lançamento" | DEC-1; `Dashboard.openPending` |

Mantidos de propósito: "sempre disponíveis", "Qualquer mês pode ser escolhido", sem "desabilitado" (exigências do `DocumentationContentTest`).

## Central — Lançamentos (`TransactionsAreaContent`)

| Antes | Depois | Origem |
|---|---|---|
| Rodapé "Mostrando 1–10 de 23" | + "o total encontrado aparece acima da tabela, como 23 lançamentos" | criterio 6 |
| "Filtros que ficam acima da tabela: Tipo, Categoria, Status e Data…" | Passo de mês (Mês anterior/Próximo mês), botões Todos/Despesas/Receitas que valem na hora, Filtros de Categoria e Status | criterios 6 e 7, D3 |
| Tabela de campos na ordem Data, Descrição, Valor, Tipo, Status, Categoria | Ordem Tipo, Valor, Descrição, Categoria, Data, Status; Valor "com vírgula nos centavos, como 184,90. Começa vazio"; Data com "Hoje e Ontem" | DEC-7, DEC-8 |
| "O valor precisa ser maior que zero…" | + "salvar com o campo vazio mostra O valor é obrigatório." | DEC-7; `TransactionRequest` |
| "Para ver todos os meses… o campo Data fica vazio." | "…no lugar do mês aparece Todo o período, e os botões Mês anterior e Próximo mês ficam desabilitados" | DEC-5 |
| Cartões "com os títulos Hoje, Ontem e a data dos demais dias" | "…o dia da semana e a data, como Sábado, 10 de outubro; o ano só aparece em datas de outro ano"; editar/excluir no detalhe | criterio 8, `dayHeading` |
| Painel do celular só com os filtros | Mês acima da busca, Tipo abaixo (valem na hora); Período (mês ou Todo o período), Status e Categoria no painel com Aplicar | D3, DEC-6 |
| — | Detalhe: abre ao tocar/clicar, fecha por X/fora/Esc sem alterar; botões da linha no computador agem direto | DEC-9, criterio 9 |
| Ações: "Excluir lançamento (linha)" | "(linha ou detalhe)", "…fecha o detalhe"; novas linhas Tocar/clicar, Mês anterior / Próximo mês, Todos / Despesas / Receitas, Tentar novamente; Salvar mostra "Salvando…" | criterios 9, 10, 11 |

## Central — introdução (`OverviewContent`)

| Antes | Depois | Origem |
|---|---|---|
| "Entre os botões das linhas das listas, Excluir lançamento e Excluir categoria pedem confirmação" | "Excluir lançamento, na linha ou no detalhe do lançamento, e Excluir categoria pedem confirmação…; no celular, os botões da confirmação ficam um embaixo do outro" | DEC-9, criterio 12 |
| — | "Enquanto uma lista carrega, linhas cinzas ocupam o lugar dos registros." | criterio 11, `list-feedback` |
| "…a mensagem do problema aparece no lugar dela…" | + "Em Lançamentos, a mensagem vem com o botão Tentar novamente…" | criterio 11 (`retryable` só em Lançamentos) |

## Novidades — bloco 1.0.3 (`ReleaseNotesContent`)

Bloco estava vazio; nada reescrito em 1.0.2 (histórico). Itens novos, no formato "Título curto: frase":

- Melhorias: "Resumo redesenhado", "Percentual por categoria", "Mês em destaque no gráfico", "Filtros de Lançamentos mais à mão", "Detalhe do registro" (era "Detalhe do lançamento", ampliado em 2026-10-06), "Cadastro de lançamento mais rápido", "Listas mais claras".
- Correções: nenhum item. O item sobre a data do cadastro à noite foi retirado por decisão do usuário (a correção fica só no código); a categoria vazia não é publicada.

Verificado: nenhum item repete o 1.0.2 (`shouldNotRepeatAnyItemAcrossVersions`), sem termo técnico (`shouldNotExposeTechnicalIdentifiers`).

## Ajustes de 2026-10-06 (DEC-12, DEC-13, DEC-14) — mesma revisão aplicada

| Área | Antes | Depois | Origem |
|---|---|---|---|
| Resumo | "No celular, um quadro logo abaixo do gráfico… Toque em um mês…" | O quadro nas duas faixas, com a dica "Toque…" no celular e "Clique…" no computador; trocar o período o devolve ao mês do período | DEC-13; `dashboard.ts` (`pinnedMonth`) |
| Lançamentos | "um valor zero é recusado com… O valor deve ser maior que zero." | + negativo recusado com a mesma mensagem; texto que não é número, como 12abc, com "O valor informado é inválido."; o sistema não corrige o que foi digitado | DEC-14; `InvalidFormatExceptionMapper`, `@DecimalMin` |
| Categorias, Usuários, Perfis | — | Item "Tocar ou clicar… abre o detalhe…" (campos de cada tela, X/fora/Esc, celular só no detalhe) e linhas "(linha ou detalhe)" e "Tocar ou clicar…" em Ações | DEC-12; templates das três telas |
| Usuários / Perfis | "Age na hora, sem confirmação, e avisa…" | "…sem confirmação, fecha o detalhe e avisa…" | DEC-12 + `knowledge/users.md`, `auth-and-permissions.md` |
| Introdução | "Excluir lançamento, na linha ou no detalhe do lançamento, e Excluir categoria pedem confirmação" | Desativar usuário e Excluir perfil sem confirmação "também quando usados no detalhe do registro"; Excluir lançamento e Excluir categoria, na linha ou no detalhe, pedem confirmação; + item sobre o detalhe nas quatro listas | DEC-12 |
| Novidades 1.0.3 | "Mês em destaque…: no celular, um quadro…"; "Detalhe do lançamento: …" | "…um quadro abaixo do gráfico mostra os valores do mês tocado ou clicado"; "Detalhe do registro: em Lançamentos, Categorias, Usuários e Perfis…" | DEC-12, DEC-13 |

Nenhum termo técnico (mapper, JSON, componente); "detalhe" em minúscula, como nome comum, sem rótulo de tela inventado.

## DEC-15 (2026-10-06) — confirmação em Usuários e Perfis

| Área | Antes | Depois | Origem |
|---|---|---|---|
| Introdução | "Desativar usuário e Excluir perfil agem na hora, sem confirmação…" | "Excluir lançamento, Excluir categoria, Desativar usuário e Excluir perfil, na linha ou no detalhe do registro, pedem confirmação antes de agir…; Cancelar desiste sem alterar nada" | DEC-15 |
| Usuários (Ações) | "…Age na hora, sem confirmação, fecha o detalhe e avisa…" | "Pergunta Deseja desativar o usuário, com o nome da pessoa. Confirmar… tira o acesso dela, sem apagar o cadastro…; Cancelar desiste sem alterar nada." | DEC-15; `knowledge/users.md` (desativar = sem hard delete) |
| Perfis (Ações) | "…Age na hora, sem confirmação…" | "Pergunta Deseja excluir o perfil, com o nome dele. Confirmar… remove o perfil, desde que nenhum usuário o esteja usando…" | DEC-15; `knowledge/auth-and-permissions.md` (409 em uso) |
| Novidades 1.0.3 | — | "Confirmação antes de desativar e excluir: Desativar usuário e Excluir perfil passam a perguntar antes de agir, como já acontecia em Lançamentos e Categorias." | DEC-15 |
