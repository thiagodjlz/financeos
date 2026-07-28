# Design da issue 39 — Toast Notifications

Fonte: projeto de design do Claude `9b029cd2-9bc9-4c28-a3ba-f8af21bcc8be`, arquivo `Toast Notifications.dc.html`
(baixado via DesignSync em 27/07/2026 e salvo nesta pasta). **Este arquivo local e a fonte da verdade visual da issue.**

Nota do proprio projeto de design (`github.md`): os toasts foram construidos com os tokens oklch do FinanceOS
(paleta income/pending/expense de `frontend/src/styles.scss`), tomando como base `specs/35-redesign-interface/spec.md`.

## O que o design especifica

Toasts flutuantes no **canto superior direito** (`position: fixed; top:24px; right:24px; z-index:999`),
coluna de largura `340px` (`max-width: calc(100vw - 32px)`), empilhados de cima para baixo com `12px` de gap.

Tres estados, cada um com icone proprio (SVG 20x20 em um quadrado 36x36, `border-radius:9px`), titulo em negrito
(14px/700) e mensagem (13px, `oklch(48% 0.014 80)`):

| Estado | Titulo | Mensagem de exemplo | Fundo do icone | Cor do icone | Auto-fecha |
|---|---|---|---|---|---|
| Sucesso | `Sucesso` | `Lançamento salvo com sucesso.` | `oklch(93% 0.05 155)` | `oklch(40% 0.13 155)` | sim, 3800 ms |
| Alerta  | `Alerta`  | `Categoria sem transações neste período.` | `oklch(94% 0.06 80)` | `oklch(48% 0.14 80)` | sim, 5200 ms |
| Falha   | `Falha`   | `Credenciais inválidas. Tente novamente.` | `oklch(94% 0.06 25)` | `oklch(42% 0.17 25)` | **nao** — fica ate o usuario fechar |

Icones: sucesso = circulo com check; alerta = triangulo com "!"; falha = circulo com "x".

## Comportamento

- Sucesso e alerta somem sozinhos ao fim da duracao; **falha permanece** ate o usuario clicar no fechar.
- Todo toast tem botao de fechar (X 16x16, `aria-label="Fechar"`, cor `oklch(55% 0.014 80)`) no canto direito.
- Toasts com auto-fechamento exibem uma **barra de progresso** de 3px na base do card, na cor do icone com
  `opacity: 0.35`, animando de `width:100%` a `0%` em `linear` durante a duracao do toast.
- Entrada: `toastIn 0.3s ease` — de `opacity:0; translateX(24px) scale(0.98)` para o estado normal.
- Saida: `toastOut 0.25s ease forwards` — volta a `opacity:0; translateX(24px)`, colapsando `max-height` e
  `margin-bottom` para 0; o card e removido do DOM ~260 ms depois de comecar a sair.
- Varios toasts podem coexistir na pilha.

## Card do toast

`background:#fff`, `border:1px solid oklch(91% 0.008 80)`, `border-radius:14px`,
`box-shadow:0 20px 50px oklch(30% 0.02 80 / 10%)`, `padding:16px 16px 18px`, `overflow:hidden`,
conteudo em flex com `gap:12px` e `align-items:flex-start`.
