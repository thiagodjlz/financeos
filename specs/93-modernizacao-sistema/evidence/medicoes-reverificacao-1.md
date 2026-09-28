# Medições da reverificação após a correção 1 (etapa 7)

Data: 2026-09-24. Build **servido** em `http://localhost` (`main-L5TS326I.js` + `styles-GKT2QS4E.css`, os mesmos de `frontend/dist`), Chrome headless via CDP. Chamadas a `*/api/*` respondidas **só dentro da sessão do navegador** (mesmos dados fictícios de `medicoes-navegador.md`; `POST /transactions` → 400 de `description` no formato do `ExceptionMapper`, demais não-GET → 404 simulado). Nada chegou ao backend nem ao banco. Larguras ≤680 com `mobile: true`, toque emulado e altura 844; acima, mouse e altura 900.

## Critério 10 — "Salvar" fixo e fonte dos campos (5 cadastros: lançamento novo/editar, categoria, usuário, perfil)

| Largura | Barra inferior no cadastro | "Salvar" | `elementFromPoint` no centro | Toque/clique real (CDP `Input.dispatch*`) | Campos |
|---|---|---|---|---|---|
| 1440, 1280, 1024, 768, 681 | fora do DOM (e `display: none` no desktop) | 40px, `rgb(59, 91, 219)`, raio 10, no rodapé do card (`static`), "Cancelar" visível | o próprio botão | 1 clique → `POST`/`PUT` enviado nos 5 | 14px, 44px, borda `rgb(147, 143, 135)`; Valor 24px/58 |
| 680 | fora do DOM | fixo, 648×52 em y=780 (viewport 844), "Cancelar" oculto | o próprio botão | 1 toque → `POST`/`PUT` nos 5 | **16px**, 44px |
| 480 | fora do DOM | fixo, 448×52 | o próprio botão | idem | **16px**, 48px |
| 390 | fora do DOM | fixo, 358×52 | o próprio botão | idem | **16px**, 48px |
| 320 | fora do DOM | fixo, 288×52 | o próprio botão | idem | **16px**, 48px; `scrollWidth` 320 |

- 400 simulado após o toque/clique, em todas as larguras: `description` com `invalid`, borda `rgb(185, 58, 46)`, legenda "A descrição é obrigatória.", toast Alerta.
- `workspace` no cadastro ≤680: `padding-bottom` 101px (rodapé 77px + 24); na listagem, 100px (barra 76 + 24).
- Voltar ao topo no cadastro a 390 (Perfil, rolado ao fim): 44×44 em y=708, rodapé do "Salvar" em y=767 — sem sobreposição.
- Painel de filtros (≤680): Tipo, Categoria, Status, Data de/até, E-mail, Perfil, Situação = **16px/48px** nas 4 listagens; busca 16px (38px a 680, 46px a ≤480); "Aplicar" 48px a ≤480 (40px a 680).
- Desktop (≥681): busca 14px/38; pílulas de filtro 13px/38 (desenho da pílula, `--fs-small`).

## Critério 9 — barra inferior e menu

| Largura | Menu | Barra inferior nas listagens (Resumo, Lançamentos, Categorias, Usuários, Perfis) |
|---|---|---|
| 1440 → 681 | 248px | `display: none` |
| 680, 480, 390, 320 | oculto | 76px em y=768, fixa |

Navegação a 390: listagem (barra) → "+" → `/transactions/new` (sem barra) → voltar → `/transactions` (barra de volta) → "Editar lançamento" (sem barra) → `history.back()` (barra de volta) → Cadastros > Categorias (barra, `body` sem trava) → "Nova categoria" (sem barra). Painéis, Esc, scrim e permissões (sem Categorias some "Cadastros"; sem `TRANSACTIONS/CREATE` some "+"; só Resumo → "Mais" só com "Sair") iguais à medição anterior.

## Critérios 2, 4, 11 — não-regressão

- 2: botão primário 40px/raio 10 ≥681 e 48px a ≤480 ("Nova categoria", "Novo usuário", "Novo perfil"); card 720 (1440/1280), borda `rgb(232, 230, 225)`, raio 14; no celular o cadastro é sem moldura (`border: 0`, como no `MobileForm`, anterior à correção).
- 4: em 1440/1280/1024/768/681 as 4 listagens com `h1` 26/700, "Novo/Nova …" 40px, `th` 44, linha 56, filtros visíveis (5/2/3/0 campos; Perfis só busca), "Mostrando …"; ≤680 botão "Filtros" + painel; `scrollWidth` = largura em todas.
- 11: login card 420/18 (342 a 390, 272 a 320), campos 48px, 14px ≥768 e 16px ≤480; "Entrar" 48px; "Mostrar senha" alterna `type` com 0 requisições; toast 360/12 (≤680 ocupa a largura − 24px); modal 400/16.
- Resumo ≤680: saudação 20px (regra do `dashboard.scss` para celular, mockup `MobileResumo` 18px); 26px ≥681.
