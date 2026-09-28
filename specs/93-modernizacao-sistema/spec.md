---
issue: 93
url: https://github.com/thiagodjlz/financeos/issues/93
title: "Modernização do sistema"
domains: [auth, users, categories, transactions, dashboard, documentation]
target: main
stage: validated
branch: feature/issue-93-modernizacao-sistema
created: 2026-09-24
---

# Modernização do sistema

## Historia

Como usuário, quero a interface redesenhada conforme o protótipo, para ter telas modernas e consistentes no desktop e no celular.

## Contexto

A issue pede "seguir fielmente o protótipo" (cópia em `design/`, fonte da verdade visual). Redesign de apresentação: "O que NÃO muda" (canvas) e `knowledge/` seguem valendo; a única mudança de API é a D7.

## Tokens extraidos do mockup

| Base | Valor | Origem |
|---|---|---|
| Fundo / menu | `#F6F5F2` / `#FBFAF8` | `Main` |
| Superfície / borda card / botão-chip / campo | `#FFFFFF` / `#E8E6E1` / `#D6D3CC` / `#938F87` | `Lancamentos` |
| Texto / 2º / apagado / desab. | `#1B1A18` / `#4A4741` / `#6B6760` / `#8E8A83` | `Main`, `Componentes` |
| Primária / forte / suave / chip ativo / foco | `#3B5BDB` / `#2B44B0` / `#EDF1FD` / `#C9D4F7` / `#B9C7F5` | `Main`, `Componentes` |
| Receita · Despesa-erro · Pendente · Neutro | `#177245/#E6F4EC/#35A56C` · `#B93A2E/#FBECEA/#F7D5D0` · `#8F5507/#FCF1DE/#D9951F` · `#5E5B55/#EFEEEA/#9C978E` | `Componentes` |
| Card Saldo / `th` / scrim | `#1D2440` (+`#C3C9E2`) / `#FAF9F7` / `rgba(20,24,40,0.55)` | `Main`, `MobileFiltros` |
| Tipografia | Inter; título 26/700; seção 16/650; corpo 14/400; rótulo 13.5/600; `th` 12.5/600; `tabular-nums`; campo no celular 16px | `Componentes` |
| Raios | card 14; botão/campo 10; ícone 8; toast 12; modal 16; login 18; pill 999 | `Componentes`, `Login` |
| Sombras | card `0 1px 2px rgba(27,26,24,0.04)`; toast `0 12px 32px rgba(27,26,24,0.12), 0 2px 6px rgba(27,26,24,0.06)`; modal `0 20px 50px rgba(20,24,40,0.3)`; foco/erro `0 0 0 3px` | `Componentes` |
| Alturas | botão 40 (48 toque); campo 44 / filtro 40 / celular 48; linha 56; `th` 44; ação 36; pill 24; menu 248; barra inferior 76 | `Componentes`, `MobileResumo` |

## Telas do mockup -> arquivos do app

`Main`/`MobileResumo` -> `layout/main-layout`, `features/dashboard`; `Lancamentos`/`Mobile{Lancamentos,Filtros}` -> `transactions.*`, `core/{filter-panel,pagination,list-feedback}`; `LancamentoForm`/`MobileForm` -> `transaction-form.*`; `Categorias` -> `categories.*`; `Componentes` -> `styles.scss`, `core/{toast,confirm-dialog,field-errors}`; `Login` -> `features/auth/login`.

## Divergencias entre o mockup e o app atual

| # | Divergência | Resolução |
|---|---|---|
| D1 | Inter via Google Fonts | Inter self-hosted |
| D2 | Hex no markup | Tokens em `:root` |
| D3 | Menu e barra inferior | Mockup (DEC-1, DEC-2) |
| D4 | Números do mockup somam pendentes | Regra atual (DEC-3) |
| D5 | Selects Ano/Mês | Passo de mês (DEC-5) |
| D6 | "Detalhamento" (#18) | "Por categoria" (DEC-4) |
| D7 | Cor da categoria sem fonte na API | `categoryColor` (DEC-6) |
| D8 | Tipo/Status como botões | Visual sobre `radio` nativo |
| D9 | Erro "Informe a descrição." | Mensagem do back-end |
| D10 | Título de toast por ação | Título atual por estado |
| D11 | Data de/até e Situação não desenhados | Permanecem |
| D12 | "Ativa" x "Ativo" | App ("Ativo") |
| D13 | Chip "Período" ativo | Exemplo; sem período padrão |
| D14 | Placeholder `voce@exemplo.com` | Não entra (varredura) |

## Regras existentes que restringem o redesign

Permissão esconde menu e botões; Status só para despesa; cancelar lançamento é `DELETE` -> `CANCELED`; "Cancelar"/voltar do cadastro sem HTTP, confirmando só com alteração; destaque pelo `violations[]`; paginação de 10; toasts; filtros restaurados na volta; `.field-notice`; totais do Resumo.

## Criterios de aceite

- [x] `:root` define os tokens; `rg "#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(" frontend/src/app --glob "*.scss"` e `rg -n "fonts.googleapis|fonts.gstatic|https?://" frontend/src --glob '!**/README.md'` seguem vazias (baseline 0); `body` em Inter, fundo `rgb(246, 245, 242)`.
- [x] Botão primário `rgb(59, 91, 219)`, 40px, raio 10 (48px a 390px); card com borda `rgb(232, 230, 225)`, raio 14; campo 44px, borda `rgb(147, 143, 135)`; no 400, borda `rgb(185, 58, 46)` e legenda com ícone e a `message` do back-end.
- [x] Pills de status/situação com 24px e cores da tabela; receita sem status mostra "—" (`aria-label="Sem status"`).
- [x] Listagens: título 26/700 com subtítulo, botão "Novo lançamento"/"Nova categoria"/"Novo usuário"/"Novo perfil", `th` 44px, linha 56px, ações 36px com `aria-label` ("Editar lançamento", "Excluir categoria"...), datas dd/mm/aaaa, "Mostrando X–Y de N"; cancelado riscado; filtros visíveis no desktop.
- [x] Cadastro de lançamento (DEC-12): card até 960px com grade de 2 colunas a 1440px, "R$" numa linha só, Valor 60px com "R$", contador "N/255", "Salvar lançamento"; Tipo/Status são `input type="radio"`, Status some com Receita, payload inalterado.
- [x] `GET /api/transactions` e `GET /api/dashboard/summary` (`categoryBreakdown`) retornam `categoryColor` igual ao `color` da categoria, e `null` sem categoria ou sem cor (teste de `Resource`); a bolinha aparece em Lançamentos, Resumo e select do cadastro, e some com `null`.
- [x] Resumo: saudação em título 26px; cards Saldo (`#1D2440`), Receitas, Despesas, Pendentes com os valores atuais e as linhas "Receitas menos despesas pagas", "Entradas no mês", "Já pagas no mês", "Despesas a pagar"; sem "Pagas: R$".
- [x] "Por categoria": alternância Despesas/Receitas, R$ e barra por categoria, rodapé "N categorias" + total; passo "Mês anterior"/"Próximo mês" percorre a lista atual de períodos e desabilita nas pontas.
- [x] Menu desktop: 248px, seções visíveis, recolhível em trilho. Celular (390px, DEC-13/14): barra inferior Resumo, Lançamentos, +, Mais, sem "Cadastros", com rótulos sem quebra; "Mais" abre painel com os itens permitidos (Categorias incluída) e fica sempre visível (contém "Sair"); "+" some sem `TRANSACTIONS/CREATE`.
- [x] Desktop (DEC-11): a barra de filtros não mostra a alça, o título "Filtros" nem o fechar do painel do celular.
- [x] Celular: filtros em painel inferior com "Aplicar"; Lançamentos em cartões por dia; cadastro com "Salvar" fixo 52px e voltar igual ao "Cancelar"; campos a 16px (verificável por emulação — comportamento nativo não reproduzido).
- [x] Login: card 420px raio 18, campos 48px, "Mostrar senha" alterna `type` sem HTTP. Toast 360px raio 12, durações 3800/5200/sem fechar. Modal 400px raio 16.
- [x] Não-regressão: sem `CREATE`/`EDIT`/`DELETE` o botão não aparece e cada item de menu mantém a condição atual; "Cancelar" sem alteração: sem HTTP nem toast; cancelar lançamento faz `DELETE /api/transactions/{id}`.
- [x] `./mvnw test` e `npm test` verdes; varreduras de acentuação de `architecture.md` vazias (baseline 0).

## Fora de escopo

- Modo escuro; regras de negócio, validações e banco.

## Decisoes

Com o usuário, 2026-09-24:
- DEC-2 (P2): barra inferior no celular (Resumo, Lançamentos, +, Cadastros, Mais); "Cadastros" (Categorias) e "Mais" (Usuários, Perfis, Documentação, Novidades, Sair) abrem painel inferior filtrado pela permissão atual.
- DEC-3 (P6): regra atual (#16) mantida: Despesas e Saldo só com pagas; linhas de apoio reescritas conforme critério.
- DEC-4 (P8): "Por categoria" do mockup substitui a apresentação da #18; só front (`categoryBreakdown`).
- DEC-6 (P9): `categoryColor` aditivo e nullable em `TransactionResponse` e `CategoryBreakdownResponse`.

Derivadas de "seguir fielmente o protótipo", 2026-09-24:
- DEC-1 (P1): menu claro sempre aberto, recolhível, seções no lugar do acordeão.
- DEC-7 (P3/P4/P5): botão nomeia o registro; datas dd/mm/aaaa; filtros visíveis no desktop (aplica no change) e painel com "Aplicar" no celular.
- DEC-5 (P7): passo de mês no lugar dos selects, só pelos períodos de hoje (`/periods` + mês corrente).
- DEC-8 (P10/P11): Inter self-hosted; telas não desenhadas: listagem como `Categorias`, cadastro como `LancamentoForm`, resto só tokens.
- Critério "verificável por emulação" não reprova a feature (acordo da #54).

Com o usuário, 2026-09-24 (planejamento):
- DEC-9: "Mais" fica sempre visível no celular, porque contém "Sair"; só "Cadastros" some quando não sobra item permitido.
- DEC-10: no celular, fechar o painel de filtros sem "Aplicar" descarta o rascunho; a lista mantém os filtros anteriores.

Com o usuário, 2026-09-28 (validação manual):
- DEC-11: no desktop, o cabeçalho do painel de filtros do celular (alça + "Filtros" + fechar) não aparece; a barra de filtros é só busca + campos.
- DEC-12: o cadastro no desktop ocupa melhor o espaço: card na largura da área de conteúdo até 960px e grade de 2 colunas do `LancamentoForm` (substitui o card de 720px); "R$" nunca quebra linha. Mesmo card nos outros cadastros.
- DEC-13: a barra inferior do celular perde "Cadastros" (substitui DEC-2/DEC-9): fica Resumo, Lançamentos, +, Mais, e "Categorias" entra no painel "Mais" (seção Cadastros), com a permissão atual.
- DEC-14: os itens restantes da barra são redimensionados para dividir a largura, sem quebrar rótulo ("Lançamentos" numa linha).

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/93
- Conhecimento: `README`, `architecture`, `frontend-ui`, `transactions`, `categories`, `dashboard`
