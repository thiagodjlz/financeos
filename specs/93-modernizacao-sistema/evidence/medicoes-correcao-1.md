# Medições da correção 1 (etapa 3)

Data: 2026-09-24. `npm run build` da branch com a correção, servido por um servidor estático local (porta 4317) que respondia `/api/*` com dados fictícios (usuário com todas as permissões, 1 categoria, 1 lançamento; todo não-GET recebe um 400 de `description` no formato do `ExceptionMapper`). Nada chegou ao backend nem ao banco. Chrome headless via CDP; 390/480/680 com `mobile: true` e toque emulado. O ambiente Docker ainda serve o bundle anterior: a etapa 6 precisa reconstruir antes de reverificar.

## Critério 10 (os dois defeitos)

| Largura | Cadastros (lançamento, categoria, usuário, perfil) | Toque no centro do "Salvar" |
|---|---|---|
| 390 | sem `.bottom-bar`; "Salvar" 358×52 em y=780 (viewport 844); `elementFromPoint` = o próprio botão; `padding-bottom` do workspace 101px | `POST /transactions` enviado; borda `rgb(185, 58, 46)` + "A descrição é obrigatória." |
| 480 | idem, 448×52 | idem |
| 680 | idem, 648×52 | idem |
| 1440 | "Salvar" 40px no rodapé do card (sem fixo) | clique envia o `POST`; mesmo erro |

Fonte dos campos:

| Largura | Cadastros | Filtros visíveis / painel de filtros | Login |
|---|---|---|---|
| 390, 480 | 16px (Data, Descrição, Categoria, Nome, Tipo, Cor, Situação, E-mail, Senha, Perfil); altura 48px; Valor 36px | busca e selects 16px/48px; painel aberto: Tipo, Categoria, Status, Data de/até 16px/48px | 16px, moldura 48px |
| 680 | 16px, altura 44px (48px continua só a ≤480, como na `main`) | painel 16px/48px; busca 16px/40px | — |
| 1440 | **14px**, 44px; Valor 24px/60px | busca 14px/40px; pílulas de filtro 13px/38px (`--fs-small`, desenho da pílula, sem mudança) | 14px, moldura 48px |

## Não-regressão (critérios 2, 4, 9, 11)

- 2: campo 44px e 400 com borda `rgb(185, 58, 46)` + legenda, em 1440 e no celular.
- 4: filtros visíveis a 1440 (Lançamentos 5, Categorias 2); a ≤680 continuam no painel.
- 9: `.bottom-bar` `display: flex`, 76px em Lançamentos, Resumo e Categorias a 390/480/680 (`none` a 1440); painel Mais: Usuários, Perfis, Documentação, Novidades por versão, Sair.
- 11: campos do login 48px; 16px no celular, 14px no desktop.
