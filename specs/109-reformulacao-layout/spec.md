---
issue: 109
url: https://github.com/thiagodjlz/financeos/issues/109
title: "Reformulação de layout"
domains: [dashboard, transactions, categories, users, auth, documentation]
target: main
stage: validated
branch: feature/issue-109-reformulacao-layout
created: 2026-10-03
---

# Reformulação de layout

## Historia

Como usuário, quero Resumo, Lançamentos, cadastro de lançamento e Detalhe dos cadastros no novo design, para ler o mês e registrar com menos toques no celular.

## Contexto

Design em `design/project/` (fonte da verdade visual; dados fictícios). Na API: percentuais de `/dashboard/summary` (DEC-2, DEC-11) e validação do Valor (DEC-14).

## Tokens extraidos do mockup

Só o que difere de `styles.scss`. M=`Main`, RD=`Resumo-desktop`, LC/LD=`Lancamentos-*`, F=`Filtros`, D=`Detalhe`, N=`Novo-lancamento`, C=`Componentes`.

| Elemento | Valor | Origem |
|---|---|---|
| Saldo | 34/700 cel., 40/700 desk., `-0.02em`; barra 8px trilho `rgba(255,255,255,0.16)` cor `#9fb0f7`; ícones `#8fe0b5`/`#f3b2a6` | M, RD |
| Pendentes | fundo `#fcf1de`, raio 16, alt. mín. 72; ícone 40 branco raio 12; rótulo 12.5/500 `#8f5507`; valor 17/600 cel., 20/600 desk. | M, RD |
| Por categoria | % 12.5 `#6b6760`; valor 14/600 larg. mín. 92/96; barra 6px | M, RD |
| Segmentado | trilho `#efeeea`; cel. 40px raio 9 (trilho 12, pad 4); desk. 32–34px raio 8 (trilho 10, pad 3); ligado `#fff` + `0 1px 2px rgba(27,26,24,0.12)` | M, LC, LD |
| Gráfico | alt. 140 cel., 200 desk.; mês ativo faixa `#efeeea`, rótulo 700; informativo cel. `#faf9f7` raio 12 | M, RD |
| Passo de mês | cel. 48px raio 14, botões 44, 15/600 + calendário; Resumo desk. 40px raio 12, botões 36; Lançamentos desk. `#edf1fd`/`#c9d4f7`/`#2b44b0`, botões 34 | M, RD, LD |
| Lista cel. | busca/"Filtros" 48px raio 12, selo 20px; linha 68px, ícone 40 raio 12, descrição 15/600, valor 15/600, pill 22px, "Pago" 12.5 `#6b6760`; dia 13/600 | LC |
| Painéis | título 18/700; botões 52px raio 14; Detalhe: valor 28/700, linhas 48px, Excluir 48px | F, D |
| Cadastro cel. | cabeçalho 56px, 18/700; Tipo 44px raio 11; Valor 72px borda 2px raio 14, número 34/700; campo 48px raio 12; Hoje/Ontem 44px pill | N |
| Modal / toast | sombra `0 20px 50px rgba(20,24,40,0.18)` / `0 12px 32px rgba(27,26,24,0.12)`; modal cel. botões empilhados 48px | C |

## Divergencias entre o mockup e o app atual

Seguem o mockup: Saldo + Pendentes no lugar dos 4 indicadores; Tipo e passo de mês fora do painel Filtros; total no cabeçalho. Seguem o app atual: saudação (#65), Inter local, Status padrão Pendente, "Recolher menu"; receita no Detalhe com Status "—".

## Regras existentes que restringem o redesign

Não mudam: permissões por botão, rascunho do Filtros, `ListStateService`, voltar sem HTTP, confirmação antes do DELETE, campo inválido, teclado do gráfico, toasts.

## Decisoes

Todas de 2026-10-03, com o usuário.

- DEC-1. "Ver pendentes" abre Lançamentos com o mês do Resumo, Status Pendente e Tipo Despesa; link só com `TRANSACTIONS/VIEW`.
- DEC-2. O percentual "despesas pagas / receitas" é campo novo do Resumo, com regra e teste no back-end; real, pode passar de 100% (barra cheia no limite); receita zero = nulo e o front mostra "Sem receitas no mês" com barra vazia.
- DEC-3. % por categoria com uma casa e vírgula ("8,7%").
- DEC-4. Gráfico no celular mantém rótulos do eixo Y e pontos do saldo; o bloco do mês abaixo segue o mockup.
- DEC-5. Sem mês ("Todo o período"), as setas do passo de mês ficam desabilitadas.
- DEC-6. "Filtros ativos" continua no celular, com o mesmo visual novo do desktop.
- DEC-7. Valor é campo de texto vazio, placeholder "0,00", vírgula decimal, `inputmode="decimal"`; vazio volta "O valor é obrigatório." do back-end.
- DEC-8. Ordem do cadastro Tipo, Valor, Descrição, Categoria, Data, Status, num único template.
- DEC-9. Detalhe abre ao tocar/clicar na linha, no celular e no desktop; no desktop os botões da linha continuam.
- DEC-10. Percentual do Saldo com uma casa e vírgula ("29,3%"; acima de 100%, o real, "130,0%"); a API devolve arredondado em uma casa (HALF_UP) e o front só formata.
- DEC-11. % de cada categoria sobre o total do tipo vem da API (`categoryBreakdown[].sharePercent`), como na DEC-10; nulo com total zero; teste no back-end.

De 2026-10-06, após a validação manual:

- DEC-12. O Detalhe (rodapé no cel., janela no desk.) vale também em Categorias, Usuários e Perfis, com Editar/Excluir conforme as permissões da tela.
- DEC-13. O bloco do mês abaixo do gráfico aparece também no desktop (clicar num mês troca o bloco; texto "Clique em um mês do gráfico para ver os valores."); o informativo flutuante continua.
- DEC-14. O front não altera o Valor digitado; negativo, zero ou com caracteres inválidos é recusado pelo back-end com mensagem em português (teste no backend).
- DEC-15. "Desativar usuário" e "Excluir perfil" passam a pedir confirmação (linha e Detalhe), como em Categorias; a Central muda junto. Cor no Detalhe de Categorias: só a bolinha.

## Criterios de aceite

- [x] `GET /api/dashboard/summary` traz o percentual `paidExpense / totalIncome × 100` com uma casa HALF_UP (ex.: 29.3; 130.0 quando passa), nulo com `totalIncome = 0`; teste no backend. A frase mostra "29,3%".
- [x] Cartão Saldo: valor, "Receitas menos despesas pagas", barra e "Despesas pagas equivalem a N% das receitas" (ou "Sem receitas no mês" com barra vazia), Receitas ("Entradas no mês"), Despesas ("Já pagas no mês"); cartão "Pendentes · despesas a pagar" com "Ver"/"Ver pendentes" conforme DEC-1.
- [x] Por categoria com "N,N%" sobre o total do tipo; alternância 40px abaixo do título (cel.) e 32px no cabeçalho (desk.).
- [x] Gráfico destaca o mês do período; o bloco fixo mostra o mês ativo nas duas faixas ("Toque…" no cel., "Clique…" no desk., DEC-13), mantendo rótulos Y, pontos e o informativo flutuante do desktop.
- [x] Desktop: Resumo em duas colunas (Saldo + Evolução | Pendentes + Por categoria) e "Novo lançamento" para `/transactions/new`, só com `TRANSACTIONS/CREATE`.
- [x] Lançamentos: passo de mês com setas que trocam o filtro Data (desabilitadas sem mês); Tipo "Todos/Despesas/Receitas" segmentado aplicando na hora; total "N lançamentos" ("1 lançamento").
- [x] Painel Filtros (cel.): Período (mês + "Todo o período"), Status "Todos/Pendente/Pago", Categoria, "Aplicar"/"Limpar filtros"; desktop: "Categoria: todas", "Status: todos"; "Filtros ativos" nas duas faixas.
- [x] Título do dia "Sábado, 10 de outubro", "Hoje, …", "Ontem, …", com ano fora do ano corrente (teste de `dayHeading`).
- [x] Clicar/tocar na linha abre o Detalhe (Tipo, Categoria, Data, Status) com "Editar lançamento" (só `EDIT`) e "Excluir lançamento" (só `DELETE`, confirmação, um `DELETE`, fecha e recarrega); X/scrim/Esc fecham sem HTTP; botões da linha no desktop não abrem o Detalhe.
- [x] Cadastro na ordem da DEC-8; Valor conforme DEC-7 ("184,90" sai como `184.9`); vazio: 400 com "O valor é obrigatório." (teste no backend) na legenda do campo; "Hoje"/"Ontem" preenchem a Data; "Salvando…" desabilitado no envio.
- [x] Categorias, Usuários e Perfis: Detalhe conforme DEC-12, como o de Lançamentos (confirmação, um `DELETE`, X/scrim/Esc sem HTTP).
- [x] Valor conforme DEC-14: "-50,00" e "12abc" não viram outro número; o back-end recusa com mensagem em português (teste no backend).
- [x] Listas: esqueleto ao carregar; falha com "Tentar novamente"; vazio com "Novo lançamento" (só `CREATE`).
- [x] Confirmação cel. com botões empilhados de 48px; sombras de modal e toast da tabela.
- [x] Specs atuais verdes (ajustados só no que muda); varreduras vazias: cor literal em `.scss` de `frontend/src/app`, `https?://` em `frontend/src` e as duas de acentuação.
- [x] Central (Resumo, Lançamentos, introdução) e bloco 1.0.3 (Melhorias) descrevem o novo layout, revisados por `revisar-textos`; `rg -n "Quatro indicadores" backend/src/main/java` sem saída.
- [x] A 390px e 1440px, sem rolagem horizontal e com os tokens no Computed.

## Fora de escopo

- Login e formulários de Categorias, Usuários e Perfis.
