---
issue: 117
url: https://github.com/thiagodjlz/financeos/issues/117
title: "Desconto do saldo acumulado"
domains: [dashboard, transactions, documentation]
target: v1.0.3
branch: fix/issue-117-desconto-saldo-acumulado
stage: pr-open
created: 2026-10-30
---

# Desconto do saldo acumulado

## Historia

Como pessoa que usa a sobra do mês anterior, quero que o Saldo do mês já some essa sobra, para que o Resumo mostre um único saldo sem contar o mesmo dinheiro duas vezes.

## Contexto

A issue pedia um checkbox para descontar a sobra do mês anterior do Saldo acumulado; ao discutir, o usuário trocou o modelo (DEC-1): a sobra passa a somar no Saldo do mês e o acumulado sai. Pedia também: Lançamentos do maior valor para o menor, versão quebrando no rodapé do menu e favicon do Angular. Alvo `v1.0.3`; depois do merge, levar à `main`.

Regras atuais (#113, `knowledge/dashboard.md`): Saldo do mês = receitas − despesas `PAID` (invariante `balance = income - expense`, que muda); Saldo anterior(M) = soma de out/2026 até `min(M-1, C)`; acumulado = anterior + saldo; a linha do gráfico plota o saldo isolado (D1 da #48). Relatório (#114): Saldo = receitas − pagas do filtrado; Saldo atual = mesma soma de 01/10/2026 até hoje. Lista: data desc, `createdAt` desc, `id`; no celular, agrupada por título de dia (`tr.day-row`).

## Criterios de aceite

Saldo do mês:

- [x] 1. Teste de back-end (C = dez/2026; out: receita 1000,00 e despesa paga 600,00; nov: receita 3000,00, despesa paga 2800,00 e uma pendente de 500,00): o summary traz out: Saldo anterior 0,00 e Saldo do mês 400,00; nov: 400,00 e 600,00; dez (sem lançamento): 600,00 e 600,00; fev/2027: 600,00 e 600,00. Set/2026 com receita 100,00: Saldo do mês 100,00, sem anterior.
- [x] 2. Saldo anterior(M) segue somando só receitas − despesas pagas de out/2026 até `min(M-1, C)` (nunca o Saldo do mês novo, que já traz o anterior); editar ou excluir lançamento antigo continua mudando os meses seguintes.
- [x] 3. `monthlyEvolution` de 2026 no cenário do critério 1 traz como saldo de cada mês o mesmo valor do summary daquele mês (out 400,00, nov 600,00, dez 600,00); antes de out/2026, receitas − despesas pagas.
- [x] 4. Cartão "Saldo do mês" (teste em `dashboard.spec.ts`, fixture anterior 400, receitas 3000, pagas 2800): mostra R$ 600,00, a legenda "Saldo anterior mais receitas menos despesas pagas", a linha "Saldo anterior" com R$ 400,00 e "Despesas pagas equivalem a 93,3% das receitas"; nenhum texto "Saldo acumulado" na tela.
- [x] 5. Linha, informativo e bloco do mês da Evolução anual usam o Saldo novo; o bloco mostra só Receita, Despesa e Saldo (sem "Acumulado"), nas duas larguras.
- [x] 6. Relatório de lançamentos: Saldo e Saldo atual não mudam (testes da #114 passam sem alteração).

Ordenação:

- [x] 7. `GET /api/transactions` ordena por `amount` desc, receitas e despesas misturadas, desempate data desc, `createdAt` desc, `id`, em todas as páginas (teste de back-end com valores e tipos alternados e um empate de valor em datas diferentes).
- [x] 8. A 390px a lista não tem `tr.day-row` e cada linha mostra a sua data (teste em `transactions.spec.ts`); a tabela do desktop mantém as colunas.

Versão no rodapé:

- [x] 9. No rodapé do menu e na conta do menu do celular, "FinanceOS" e "v1.0.3-NN" ficam em linhas separadas, sem o "·"; o elemento da versão tem `white-space: nowrap` (teste em `main-layout.spec.ts`; a 1280px o print não se repete).

Favicon:

- [x] 10. `index.html` declara um ícone SVG com a marca (tokens abaixo) e `frontend/public/favicon.ico` deixa de ser o do Angular (sha256 inicia `f9102be80297c052`, 15086 bytes); `http://localhost/` serve os dois com 200.

Transversais:

- [x] 11. Central: Resumo define o Saldo do mês novo e o Saldo anterior por receitas menos despesas pagas, sem "acumulado" em `SummaryAreaContent.java`; Lançamentos descreve a nova ordem; testes de conteúdo passam.
- [x] 12. Bloco `1.0.3` de Novidades: o item "Saldo acumulado" é reescrito (não promete mais o Saldo acumulado na tela) e há itens para a ordem por valor, a versão no rodapé e o ícone da guia.
- [x] 13. As duas varreduras de idioma de `knowledge/architecture.md` continuam vazias.

## Tokens extraidos do mockup

| Valor | Origem |
|---|---|
| Versão: 12px, `var(--text-muted)` | `design/versao-layout-quebrado.png`; `.app-version` em `main-layout.scss` |
| Marca: "F", 700, `#ffffff` sobre `#3b5bdb` (`--accent`), raio 10px em 34px | `.mark` em `main-layout.scss`; `styles.scss` |

## Telas do mockup -> arquivos do app

| Print | Arquivos |
|---|---|
| `versao-layout-quebrado.png` | `layout/main-layout/main-layout.{html,scss,spec.ts}` |
| `icone-guia-atual.png` | `frontend/src/index.html`, `frontend/public/` |

## Divergencias entre o mockup e o app atual

| # | Divergência | Resolução |
|---|---|---|
| D1 | O print mostra só o menu lateral; a conta do menu do celular tem o mesmo texto | Vale para os dois (DEC-7) |
| D2 | O print não desenha o ícone novo | Marca "F" do menu (DEC-6) |

## Regras existentes que restringem o redesign

- Menu recolhido continua escondendo nome e versão; o nome continua com reticências.
- Teste "mostra iniciais, nome, versão e Sair no rodapé" continua passando.

## Fora de escopo

- Checkbox/campo de desconto no lançamento e registro na Auditoria (DEC-1).
- Início em out/2026 e o que conta como receita/despesa paga.
- Ordenação do Relatório de lançamentos.

## Decisoes

- DEC-1 (2026-10-30, substitui PA-1 a PA-5): sem checkbox. Saldo do mês = Saldo anterior + receitas − despesas pagas; o Resumo mantém "Saldo anterior" e tira o "Saldo acumulado" (cartão e bloco), que ficaria igual ao Saldo do mês. Gastar a sobra é lançar a despesa. A legenda "Receitas menos despesas pagas" deixa de ser verdade e passa a "Saldo anterior mais receitas menos despesas pagas".
- DEC-2 (2026-10-30): no gráfico e no bloco do mês, o Saldo inclui o anterior (substitui a D1 da #48); sai o "Acumulado" do bloco; "Despesas pagas equivalem a N%" segue só receitas × pagas do mês.
- DEC-3 (2026-10-30): o contrato da API (redefinir `balance`, manter ou remover `accumulatedBalance`) fica para o planejamento; a spec fixa o comportamento e o invariante.
- DEC-4 (2026-10-30): o relatório não muda; ele não usa "acumulado" na tela nem na Central (só um comentário em `TransactionReportResource`). O Saldo atual é a mesma soma do Saldo anterior, até hoje.
- DEC-5 (2026-10-30, PA-6): ordem global por valor sem sinal; no celular, sem título por dia.
- DEC-6 (2026-10-30, PA-7): favicon = marca "F" do menu, em SVG e `favicon.ico`.
- DEC-7 (2026-10-30): versão abaixo de "FinanceOS", no menu lateral e na conta do menu do celular.
- DEC-8 (2026-10-30, PA-1 da regeneração): aceitar a diferença entre o Saldo do mês corrente (mês inteiro, inclui lançamentos datados mais adiante) e o Saldo atual do relatório (até hoje), sem alinhar cálculos; a Central (Resumo e Relatório) explica a diferença.

## Pontos em aberto

Nenhum.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/117
- Conhecimento consultado: `knowledge/README.md`, `architecture.md`, `dashboard.md`, `transactions.md`, `documentation.md`; `specs/113-saldo-acumulado/spec.md`; código: `dashboard.html`, `TransactionRepository.java`, `transactions.{html,ts}`, `main-layout.*`, `index.html`, `SummaryAreaContent.java`, `TransactionsAreaContent.java`, `TransactionReportResource.java`, `ReleaseNotesContent.java` (`origin/v1.0.3`).
