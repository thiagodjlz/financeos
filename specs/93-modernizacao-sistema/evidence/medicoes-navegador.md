# Medições no navegador (etapa 7)

Data: 2026-09-24. Build **servido** em `http://localhost` (bundle `main-ZOUA5UV2.js`, o mesmo de `frontend/dist`), Chrome headless via CDP. Todas as chamadas a `*/api/*` foram respondidas **dentro da sessão do navegador** (`Fetch.requestPaused` → `fulfillRequest`); nada chegou ao backend nem ao banco, inclusive o `POST` (400 simulado no formato real do `ExceptionMapper`, conferido em `POST /api/auth/login` vazio) e o `DELETE` (204). Usuário fictício "Maria Souza"; 5 categorias (Lazer sem cor), 10 lançamentos de 23, períodos `/periods` = 12/2025, 07/2026, 08/2026 + mês corrente. 390/480/680px com `mobile: true` e toque emulado (comportamento nativo não reproduzido — acordo da #54).

## Desktop 1440px

| Medição | Valor efetivo |
|---|---|
| `body` | `font-family: Inter, …`, `background-color: rgb(246, 245, 242)`; `document.fonts.check('14px Inter')` = true (woff2 de `/assets/fonts`, `curl -I` 200 `font/woff2`) |
| Botão primário ("Novo lançamento", "Nova categoria", "Novo usuário", "Novo perfil", "Salvar lançamento") | `rgb(59, 91, 219)`, 40px, raio 10px |
| Card da listagem / cadastro | borda `rgb(232, 230, 225)`, raio 14px; cadastro 720px |
| Campo (data, descrição, categoria) | 44px, borda `rgb(147, 143, 135)`; Valor 60px com "R$"; contador "0/255" → "12/255" |
| 400 simulado (descrição) | borda `rgb(185, 58, 46)`, anel `rgb(247, 213, 208) 0 0 0 3px`, legenda "A descrição é obrigatória." com ícone `::before` "!" 16px em círculo, foco em `description`, toast Alerta 360px raio 12 |
| Payload do POST | `{"transactionDate":"2026-09-24","description":"","amount":12.5,"type":"EXPENSE","status":"PAID","categoryId":"c1"}` |
| Tipo/Status | `input type="radio"` (opacity 0 sob o visual); Receita → nenhum `input[name=status]`; Despesa → volta |
| Listagens (4 telas) | `h1` 26px/700 + subtítulo; `th` 44px; linha 56px; ações 36×36 "Editar lançamento/Cancelar lançamento", "Editar categoria/Excluir categoria", "Editar usuário/Desativar usuário", "Editar perfil/Excluir perfil"; "Mostrando 1–10 de 23" |
| Datas / cancelado | `24/09/2026`…; valor do cancelado `− R$ 39,90` com `line-through` (como no mockup) |
| Pills | 24px: Pendente `rgb(143, 85, 7)`/`rgb(252, 241, 222)`; Pago e Ativo `rgb(23, 114, 69)`/`rgb(230, 244, 236)`; Cancelado e Inativo `rgb(94, 91, 85)`/`rgb(239, 238, 234)`; receita "—" `aria-label="Sem status"` |
| Filtros | Tipo, Categoria, Status, Data de, Data até visíveis; trocar Status dispara 1 GET com `status=PAID` e "Filtros ativos: Status: Pago" |
| Bolinha | Lançamentos: cor na linha com `categoryColor`, ausente em Lazer (null) e legado; Resumo: idem; select do cadastro: `rgb(224, 122, 104)` em Alimentação, ausente em Lazer |
| Resumo | saudação `h1` 26px/700; Saldo `rgb(29, 36, 64)` "Receitas menos despesas pagas", Receitas "Entradas no mês", Despesas "Já pagas no mês", Pendentes "Despesas a pagar"; sem "Pagas:" |
| Por categoria | Despesas/Receitas com `aria-pressed`; barra relativa à maior (100%, 10,7%…); rodapé "4 categorias R$ 2.072,90" / "2 categorias R$ 6.200,00" |
| Passo de mês | Set/2026 (próximo desabilitado) → Ago → Jul → Dez/2025 (anterior desabilitado); 6 cliques = 6 `GET /summary`, nenhum `/periods` |
| Menu | 248px; seções Cadastros/Configurações/Sobre visíveis; "Recolher menu" → 76px com `aria-label` nos itens; volta a 248 |
| Modal | 400px, raio 16px, sombra `rgba(20, 24, 40, 0.3) 0 20px 50px` |
| Login | card 420px raio 18; campo (moldura) 48px; "Mostrar senha" `type=button` alterna `password`→`text`→`password`, 0 requisições |
| Não-regressão | só VIEW: nenhum botão Novo/Editar/Excluir/Cancelar/Desativar nas 4 listagens; menu com só Resumo/Perfis/Novidades mostra exatamente esses; "Cancelar" sem alteração: 0 não-GET, 0 toast; "Cancelar lançamento" = `DELETE /api/transactions/{id}` |

## Celular 390px

| Medição | Valor efetivo |
|---|---|
| Barra inferior | fixa, 76px: Resumo, Lançamentos, "+" (52px), Cadastros, Mais; sem `CATEGORIES/VIEW` some Cadastros; sem `TRANSACTIONS/CREATE` some "+"; só Resumo → "Mais" com só "Sair" |
| Painéis | Cadastros → Categorias; Mais → Usuários, Perfis, Documentação, Novidades por versão, Sair; `body` overflow hidden; Esc fecha e devolve foco; scrim fecha |
| Filtros | botão "Filtros" abre painel inferior com os 5 campos e "Aplicar" 48px; trocar Status: 0 requisições; "Aplicar": 1 GET; fechar sem aplicar: 0 requisições, rascunho descartado |
| Cartões por dia | `thead` none; cabeçalhos "Hoje, 24 de setembro", "Ontem, 23 de setembro", "22 de setembro"…; `scrollWidth` 390 |
| Voltar do cadastro | sem alteração → `/transactions`, 0 não-GET, 0 toast; com alteração → "Deseja sair sem salvar?" |
| **"Salvar" fixo** | 52×358px em y=780, **mas a barra inferior (y=768, 76px, z-index 60) fica por cima**: `elementFromPoint` no centro do botão devolve o "+" da barra; toque e clique reais (CDP `Input.dispatch*`) no botão **não enviam o POST**. Igual a 480 e 680px e nos 4 cadastros |
| **Fonte dos campos** | 16px só em busca e login (`.input-affix`/`.search-field`). Cadastros: `transactionDate`, `description`, `categoryId`, `name`, `type`, `color`, `email`, `password`, `profileId` = **13.5px**; selects do painel de filtros = **13px** |
