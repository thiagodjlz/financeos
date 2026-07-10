# Notas de implementacao

Branch: `feature/issue-24-mensagem-inconsistencia-usuarios`

## Arquivos alterados

- `frontend/src/app/features/users/users.ts` — Substitui `invalidFields: Set<string>` por `fieldErrors: Map<string, string>` (campo -> mensagem da violacao do backend); adiciona `fieldError(field)` para a legenda; `applySaveError` popula o Map com a primeira mensagem de cada campo; cria `showError()` (seta o alerta e agenda auto-dismiss em 5s, cancelando o timer anterior a cada nova mensagem) e `dismissError()` (usado pelo botao "X", pelo timeout e ao limpar o ultimo campo invalido — nao mexe em `fieldErrors`); todos os pontos de erro (`loadData`, `applySaveError`/fallback, `deactivate`) usam `showError`; implementa `OnDestroy` limpando o timeout pendente.
- `frontend/src/app/features/users/users.html` — Status-bar ganha classe `dismissible` e botao "X" (`.status-close`, `aria-label="Fechar"`) chamando `dismissError()`; adiciona `<small class="field-error">` com a mensagem do backend sob os 4 campos (`name`, `email`, `password`, `profileId`), com o mesmo `*ngIf` do destaque vermelho.
- `frontend/src/app/features/users/users.scss` — `input.invalid:focus, select.invalid:focus` com `outline: 2px solid #c0392b` (indicador de foco vermelho, sem afetar campos validos); estilo da legenda `.field-error`; `.status-bar.dismissible` com `position: relative` e `padding-right` para o botao `.status-close` (absoluto no canto superior direito, sem borda/fundo).

## Decisoes

- O gatilho de limpeza da legenda/destaque continua sendo `(input)` nos inputs e `(change)` no select (comportamento pre-existente que ja atende a regra "focar nao basta, e preciso interagir").
- Ao corrigir o ultimo campo invalido, o alerta e fechado via `dismissError()` (comportamento pre-existente mantido), que tambem cancela o timeout pendente para nao disparar depois.
- Estilos do "X" e do foco vermelho restritos ao SCSS do componente users — o `.status-bar` global de `styles.scss` nao foi alterado (outras telas fora do escopo).

## Desvios em relacao ao plano

- Nenhum desvio.

## Validacao

- `npm run build`: OK.
- `npm test`: 21 testes passando (8 arquivos).
- Validacao manual no navegador (passo 7 do plano) fica a cargo do usuario, fora deste agente.
