# Medições dos ajustes pós-validação (etapa 3)

Data: 2026-09-28. `npm run build` da branch com os ajustes, servido por um servidor estático local (porta 4317) que responde `/api/*` com dados fictícios (usuário com todas as permissões; uma rodada extra sem `TRANSACTIONS/CREATE`; 1 categoria, 1 lançamento de despesa e 1 de receita para os modos de edição). Nada chegou ao backend nem ao banco (nenhuma requisição de escrita). Chrome headless via CDP; 320/390/680 com `mobile: true` e toque emulado. O ambiente Docker ainda serve o bundle anterior: a etapa 6 precisa reconstruir antes de reverificar.

## DEC-11 — barra de filtros no desktop (critério 10)

| Largura | Lançamentos, Categorias, Usuários, Perfis |
|---|---|
| 1440 | alça, cabeçalho ("Filtros" + fechar) e ações do painel com `display: none`, 0×0; título e "Fechar filtros" invisíveis. Linha: busca, depois os campos (Lançamentos quebra "Data até" para a 2ª linha, 90px; as demais em 1 linha de 40px) |
| 2000 | idem; Lançamentos numa linha só (40px): busca x309, Tipo x619, Categoria x766, Status x971, Data de x1143, Data até x1356 |
| 680, 390 | painel fechado: só busca + botão "Filtros". Painel aberto: alça (14px), cabeçalho com "Filtros" e fechar (60px), campos e "Aplicar" — comportamento mantido |

Causa: `.filter-sheet-head`/`.filter-sheet-handle { display: none }` tinha a mesma especificidade que `.sheet-head`/`.sheet-handle { display: flex }`, declaradas depois no `styles.scss`, e perdia.

## DEC-12 — cadastros (critérios 2 e 5)

Área de conteúdo: 1672px a 2000, 1112px a 1440. Card: x288, **960px** nas duas larguras; rodapé 958px (dentro da borda), "Salvar lançamento" alinhado à direita do card.

| Cadastro (1440 e 2000) | Grade | Campos (largura) |
|---|---|---|
| Lançamento novo / edição de despesa | corpo 1 coluna (902px) + par Data/Status `441px 441px` | Tipo 902, Valor 902 (60px), Data 441 \| Status 441, Descrição 902, Categoria 902 |
| Edição de receita | idem | Data **902** (ocupa a linha quando Status some), demais iguais |
| Categoria (novo/edição) | `441px 441px` | Nome \| Tipo, Cor \| Situação |
| Usuário novo | `441px 441px` | Nome \| E-mail, Senha \| Perfil |
| Usuário edição | `441px 441px` | Nome \| E-mail, Nova senha \| Perfil, Status (coluna 1) |
| Perfil novo | `441px 441px` | Nome (coluna 1), tabela de permissões 902 |

"R$" do Valor: 23×27px, `white-space: nowrap`, altura igual ao `line-height` (27px) — uma linha, em 1440 e 2000 (e 26×30 no celular).

Celular (680 e 390): 1 coluna em todos os cadastros (580px e 290px), Data e Status um abaixo do outro, "Salvar" fixo 648×52 / 358×52 em y=780, sem barra inferior — igual à correção 1.

## DEC-13/14 — barra inferior (critério 9)

| Largura | Itens (largura) | Rótulo (largura × altura) |
|---|---|---|
| 320 | Resumo 76, Lançamentos 76, + 76 (botão 52×52), Mais 76 | "Lançamentos" 74,7×17 ativo (700) / 72,8×17 inativo; Resumo 43,6×17; Mais 25,7×17 |
| 390 | 4 × 93,5 | idem, 1 linha |
| 680 | 4 × 166 | idem, 1 linha |
| 320 sem `CREATE` | Resumo, Lançamentos, Mais: 3 × 101,3 (sem "+") | 1 linha |
| 390 sem `CREATE` | 3 × 124,7 | 1 linha |
| 1440 | barra `display: none` | — |

Altura de cada item 56px (alvo ≥ 44px); fonte 11,5px (500; 700 no ativo), `letter-spacing: -0.01em`. Destaque: `/transactions` → só Lançamentos; `/dashboard` → só Resumo; `/categories` e `/users` → só Mais.

Painel "Mais" (320/390/680): seções Cadastros, Configurações, Sobre; itens Categorias, Usuários, Perfis, Documentação, Novidades por versão, Sair.
