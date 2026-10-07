# Tela Auditoria no build servido (Chrome headless por CDP)

Build: `http://localhost/main-L6QEBLFR.js` (o mesmo servido pelo container `financeos-frontend`).
Todas as chamadas `/api/*` foram respondidas **dentro da sessao do navegador** (`Fetch.fulfillRequest`); nenhuma chegou ao backend nem ao banco. Token no `localStorage` = texto falso, nunca enviado a API real. Perfil simulado: as 8 telas com `canView=true`.
Dados simulados: 10 registros na pagina 1 (Alteracao em Lancamentos com 3 campos; Login com falha sem nome; tipo desconhecido `TIPO_FUTURO`; 7 Acessos a tela) e 2 na pagina 2. Script: scratchpad da sessao (`cdp-audit.js`).

## Abertura (1440 px, fuso America/Sao_Paulo, hoje = 2026-10-06)

- Requisicoes, em ordem: `GET /api/auth/me`; `POST /api/audit/screen-access {"screen":"AUDIT"}`; `GET /api/audit?page=1&size=10&startDate=2026-09-06&endDate=2026-10-06&timeZone=America/Sao_Paulo`; `GET /api/audit/options`.
- Filtros ativos: "Data inicial: 06/09/2026", "Data final: 06/10/2026".
- Cabecalhos: Data e hora, Usuário, Tipo, Ação, Funcionalidade, Registro.
- Linha 1: `06/10/2026 14:05:09` | Márcia Conceição | Alteração | Alteração | Lançamentos | (rotulo).
- Linha 2 (`2026-10-06T09:00:01Z`): `06/10/2026 06:00:01` | naoexiste@exemplo.invalid | Login com falha | — | — | —.
- Linha 3: tipo `TIPO_FUTURO` exibido como veio (sem mapa no front).
- Opcoes de Tipo: Todos, Alteração, Login, Login com falha, Logout, Sessão expirada, Acesso negado, Acesso à tela, Impressão.
- Botoes na tela: Filtros, Fechar filtros, Limpar filtros, Aplicar, chips, botoes de data das linhas, Anterior, Próxima — nenhum Incluir/Editar/Excluir.
- Menu lateral: Resumo, Lançamentos, Cadastros, Categorias, **Configurações, Usuários, Perfis, Auditoria**, Sobre, Documentação, Novidades por versão.

## Detalhe

- Clique na linha 1: titulo = rotulo do registro; campos Data e hora, Usuário, E-mail, Tipo, Ação, Funcionalidade, Registro, Campos; tabela Campo/Anterior/Novo = [Valor, R$ 10,00, R$ 25,50], [Descrição, Aluguel, ...], [Observações, —, Pago com atraso]; unico botao "Fechar". `Esc` fecha.
- Teclado: foco no botao da data da linha 3 + `Enter` abre o Detalhe ("TIPO_FUTURO"), foco vai para `.detail-close`; ao fechar, foco volta ao botao da data.

## Contagem de requisicoes por interacao

- "Próxima": so `GET /api/audit?page=2&...` (nenhum `screen-access`).
- Menu Perfis -> menu Auditoria: `screen-access` PROFILES e AUDIT (um por entrada).
- "Limpar filtros": `GET /api/audit?page=1&size=10&timeZone=...` (sem periodo).

## Larguras

| Largura | doc scrollWidth | sidebar | barra inferior | thead | tr | `td::before` | botao Filtros | Data inicial inline | `.table-wrap` scroll/client |
|---|---|---|---|---|---|---|---|---|---|
| 1440 | 1440 | visivel | oculta | visivel | table-row | none | oculto | visivel | 1110/1110 |
| 1280 | 1280 | visivel | oculta | visivel | table-row | none | oculto | visivel | 950/950 |
| 1024 | 1024 | visivel | oculta | visivel | table-row | none | oculto | visivel | 920/694 |
| 768 | 768 | visivel | oculta | visivel | table-row | none | oculto | visivel | 920/438 |
| 390 | 390 | oculta | visivel | oculto | block | "Usuário" | visivel | oculto | 358/358 |
| 320 | 320 | oculta | visivel | oculto | block | "Usuário" | visivel | oculto | 288/288 |

- 390: "Filtros" abre `.filter-sheet.open` (top 178, bottom 844 de 844) com Data inicial, Data final, Tipo, Ação, Funcionalidade; busca por usuario fica fora do painel.
- 390, painel "Mais": Cadastros, Categorias, Configurações, Usuários, Perfis, **Auditoria**, Sobre, Documentação, Novidades por versão, Sair.
- 390, Detalhe com valor de 80 caracteres sem espaco: painel 0..390, `scrollWidth/clientWidth` 390/390, tabela de campos 328 px em cartoes (`tr` block, `td::before` "Campo"); documento 390/390.

## Fuso Asia/Tokyo (mesmos dados)

- Requisicao: `startDate=2026-09-07&endDate=2026-10-07&timeZone=Asia/Tokyo`.
- `2026-10-06T14:05:09-03:00` -> `07/10/2026 02:05:09`; `2026-10-06T09:00:01Z` -> `06/10/2026 18:00:01`.

## Bundle

- Chunk da tela (`chunk-CfCxL_ku.js`): textos com escapes `\xE3`, `\xED`, `\xE1` ("Não foi possível carregar a auditoria.", "Buscar por usuário"); nenhum `Ã`/`Â` (UTF-8 duplo) em nenhum dos 31 arquivos JS servidos.
- `main-L6QEBLFR.js` contem `auth/logout`; ordem `ENTRY_ROUTES` com `AUDIT` entre `PROFILES` e `DOCUMENTATION`.
