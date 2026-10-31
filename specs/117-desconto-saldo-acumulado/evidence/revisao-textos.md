# Revisao de textos (pipeline:revisar-textos) — issue 117

Aplicada a `.claude/skills/pipeline/revisar-textos/SKILL.md` em todo texto novo ou alterado da Central e de Novidades. Nenhum texto cita API, campo, classe ou infraestrutura; todos usam os rotulos da tela (Saldo do mês, Saldo anterior, Saldo atual, Relatórios - Lançamentos, painel Mais). Origem de cada afirmacao: spec (DEC-1, DEC-2, DEC-5, DEC-7, DEC-8) e o codigo desta branch.

## Central — Resumo (`SummaryAreaContent.java`)

| Antes | Depois | Motivo |
|---|---|---|
| "Também mostra quanto você juntou desde 1º de outubro de 2026, somando o que sobrou de cada mês." | "O Saldo do mês já traz o que sobrou dos meses anteriores desde 1º de outubro de 2026, mostrado à parte como Saldo anterior." | DEC-1: sobra entra no Saldo do mês |
| Quadro "...as linhas Saldo anterior e Saldo acumulado..." | "...com o saldo e a legenda Saldo anterior mais receitas menos despesas pagas, ... a linha Saldo anterior..." | Saldo acumulado saiu da tela; legenda nova |
| Tabela: Saldo do mês = "Receitas menos Despesas pagas."; Saldo anterior = "Soma do Saldo do mês de cada mês..."; linha "Saldo acumulado" | Saldo do mês = "Saldo anterior mais Receitas menos Despesas pagas. Pode ficar negativo."; Saldo anterior = "Soma de Receitas menos Despesas pagas de cada mês..."; linha removida | Somar o Saldo do mês novo contaria a sobra duas vezes (criterio 2) |
| "O Saldo é sempre Receitas menos as Despesas pagas do mês..." | "O Saldo do mês é o Saldo anterior mais as Receitas menos as Despesas pagas do mês...; Para usar o que sobrou, basta lançar a despesa." | DEC-1 |
| Exclusão/edição muda "o Saldo acumulado"/"o acumulado" | "...no Saldo anterior e no Saldo do mês dos meses seguintes ... muda esses saldos" | Termo removido |
| "O Saldo acumulado vale a partir de 1º de outubro de 2026 ... o Saldo acumulado é igual ao Saldo do mês." | "O Saldo anterior vale a partir de 1º de outubro de 2026 ... o Saldo do mês é só Receitas menos Despesas pagas." | Idem |
| "...desconta do acumulado, e essa diferença também segue adiante." | "...desconta do Saldo anterior, e essa diferença também segue adiante. A mesma sobra nunca é contada duas vezes." | Idem |
| "a tela mostra todos os valores zerados" | "Receitas, Despesas e Pendentes ficam zerados, o Saldo do mês fica igual ao Saldo anterior" | O mês vazio deixa de ter Saldo zero |
| (novo) | "No mês atual, o Saldo do mês conta o mês inteiro, inclusive lançamentos com data ainda por vir. Já o Saldo atual de Relatórios - Lançamentos vai só até hoje; por isso os dois podem mostrar valores diferentes." | DEC-8 |
| "chegar a um mês zerado é esperado" | "chegar a um mês sem lançamentos é esperado" | Mês vazio nao e mais "zerado" |
| "A linha de saldo do gráfico mostra o saldo de cada mês isolado, e não um acumulado do ano. O Saldo acumulado aparece só..." | "A linha de saldo do gráfico mostra o Saldo do mês de cada mês, já com o Saldo anterior: de outubro de 2026 em diante, o que sobrou de um mês segue nos seguintes." | DEC-2 |
| Quadro abaixo do gráfico: "a receita, a despesa, o saldo e o acumulado" | "a receita, a despesa e o saldo" | DEC-2 |

## Central — Lançamentos (`TransactionsAreaContent.java`)

| Antes | Depois |
|---|---|
| "...do mais recente para o mais antigo, com até 10 registros por página;" | "...do maior valor para o menor, com receitas e despesas juntas (valores iguais seguem do mais recente para o mais antigo), e com até 10 registros por página;" |
| "...lista de cartões agrupados por dia, com os títulos Hoje, Ontem e ... como Sábado, 10 de outubro; o ano só aparece em datas de outro ano." | "...lista de cartões na mesma ordem, sem títulos por dia: cada cartão mostra a sua data." |

## Central — Relatórios - Lançamentos (`TransactionReportsAreaContent.java`)

Acrescentado ao item do Saldo atual: "Como vai só até hoje, pode ser diferente do Saldo do mês atual no Resumo, que conta o mês inteiro, inclusive lançamentos com data ainda por vir." (DEC-8)

## Novidades — bloco 1.0.3 (`ReleaseNotesContent.java`)

| Antes | Depois |
|---|---|
| NEW "Saldo acumulado: a partir de outubro de 2026, o que sobra de cada mês passa para o seguinte, e o Resumo mostra o Saldo anterior e o Saldo acumulado no quadro Saldo do mês e no quadro abaixo do gráfico." | NEW "Sobra do mês anterior: a partir de outubro de 2026, o que sobra de cada mês passa para o seguinte e já entra no Saldo do mês do Resumo, que mostra essa sobra na linha Saldo anterior." |
| (novo) | IMPROVEMENT "Lançamentos por valor: a lista mostra os lançamentos do maior valor para o menor, com receitas e despesas juntas, e no celular cada lançamento traz a sua data." |
| (novo) | IMPROVEMENT "Ícone da guia: a guia do navegador passa a mostrar a marca do FinanceOS." |
| (novo, categoria Correções criada no 1.0.3) | FIX "Versão no menu: o número da versão aparece inteiro, numa linha abaixo do nome FinanceOS, no rodapé do menu e no painel Mais do celular." |

Bloco 1.0.2 intocado (inclusive "Lançamentos por dia no celular").
