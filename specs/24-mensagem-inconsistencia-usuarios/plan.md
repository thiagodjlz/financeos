# Plano de implementacao

## Abordagem

Mudanca exclusivamente de frontend, contida em `frontend/src/app/features/users/`. Trocar o estado `invalidFields: Set<string>` por um `Map<string, string>` (campo -> mensagem da violacao do backend), para alimentar tanto o destaque vermelho quanto a legenda por campo com o mesmo estado (somem juntos, via os mesmos gatilhos `(input)`/`(change)` ja existentes). Centralizar a exibicao de erro num helper `showError()` que agenda um `setTimeout` de 5s (reiniciando o timer a cada nova mensagem) e num `dismissError()` usado pelo botao "X" — sem tocar em `invalidFields`/legendas, que sao independentes do alerta. O estilo de foco vermelho e o layout do alerta com "X" ficam em `users.scss` (escopo do componente), sem alterar o `.status-bar` global usado pelas outras telas.

## Arquivos a alterar

### Backend

Nenhum (fora de escopo da issue).

### Frontend

- `frontend/src/app/features/users/users.ts` —
  - Substituir `invalidFields = signal<Set<string>>` por `fieldErrors = signal<Map<string, string>>(new Map())`; manter `isFieldInvalid(field)` (derivado do Map) e adicionar `fieldError(field): string` para a legenda.
  - Em `applySaveError`: montar o Map a partir de `violations` (chave = `violation.field.split('.').pop()`, valor = `violation.message`; se houver mais de uma violacao para o mesmo campo, manter a primeira). Continuar montando a mensagem generica da status-bar e o foco no primeiro campo invalido como hoje.
  - Criar `showError(message: string)`: seta o signal `error`, cancela timeout anterior (guardado em campo privado, tipo `ReturnType<typeof setTimeout>`) e agenda `dismissError()` em 5000ms — garante o reinicio do contador quando um novo alerta chega (criterio 4). Trocar todos os `this.error.set('...')` de erro (`loadData`, `save`/`applySaveError`, `deactivate`) por `showError(...)`.
  - Criar `dismissError()`: limpa o timeout e seta `error('')` — **nao** mexe em `fieldErrors` (criterio 6). Usado pelo "X" e pelo timeout.
  - `clearFieldError(field)`: adaptar para o Map; manter a regra atual de limpar o alerta quando o ultimo campo invalido e corrigido (agora via `dismissError()` para tambem cancelar o timeout pendente).
  - Implementar `OnDestroy` para cancelar o timeout pendente ao destruir o componente.
  - Ajustar `edit`/`resetForm`/`save` que hoje fazem `invalidFields.set(new Set())` para `fieldErrors.set(new Map())`.
- `frontend/src/app/features/users/users.html` —
  - Status-bar: trocar por um bloco com a mensagem + botao "X" (`<button type="button" class="status-close" (click)="dismissError()" aria-label="Fechar">×</button>`), aplicando uma classe extra local (ex.: `status-bar dismissible`) para o posicionamento do X.
  - Sob cada um dos 4 campos (`name`, `email`, `password`, `profileId`), dentro do `<label>`, adicionar `<small class="field-error" *ngIf="isFieldInvalid('name')">{{ fieldError('name') }}</small>` (idem para os demais) — mesmo `*ngIf` do destaque, garantindo que somem juntos (criterios 7 e 9).
- `frontend/src/app/features/users/users.scss` —
  - Foco em campo invalido: `input.invalid:focus, select.invalid:focus { outline: 2px solid #c0392b; outline-offset: 1px; }` — substitui o outline padrao do navegador por um indicador vermelho, mantendo foco perceptivel (criterio 1) e sem afetar campos validos (criterio 2, o seletor exige `.invalid`).
  - Legenda: `.field-error { color: #c0392b; font-size: 12px; font-weight: 400; text-transform: none; }` (o `<small>` fica dentro do `<label>`, que e grid com `gap: 6px` — a legenda ja cai logo abaixo do campo sem CSS extra de layout).
  - Alerta: `.status-bar.dismissible { position: relative; padding-right: 40px; }` + `.status-close { position: absolute; top: 8px; right: 10px; ... }` (botao sem borda/fundo, cursor pointer). Nao alterar o `.status-bar` de `frontend/src/styles.scss` (outras telas ficam fora do escopo).

### Migration

Nao ha mudanca de schema.

## Sequencia de implementacao

1. `users.ts`: trocar `invalidFields` (Set) por `fieldErrors` (Map campo -> mensagem), atualizar `isFieldInvalid`, `clearFieldError`, `edit`, `resetForm`, `save` e adicionar `fieldError(field)`.
2. `users.ts`: extrair as mensagens das violations em `applySaveError` para popular o Map (mantendo mensagem generica na status-bar e foco no primeiro invalido).
3. `users.ts`: criar `showError`/`dismissError` com timeout de 5s (com reinicio a cada chamada), usar nos tres pontos de erro (`loadData`, `applySaveError`/fallback do `save`, `deactivate`) e implementar `OnDestroy` limpando o timeout.
4. `users.html`: adicionar botao "X" na status-bar e as legendas `.field-error` sob os 4 campos.
5. `users.scss`: estilos de foco vermelho para `.invalid:focus`, da legenda `.field-error` e do alerta com botao de fechar.
6. Rodar `npm run build` e `npm test` em `frontend/` (criterio 11).
7. Validacao manual ponta a ponta no navegador (tela Usuarios, logado como admin):
   - Submeter o formulario "Novo usuario" vazio (ou com senha curta, ex.: "123"): conferir que o primeiro campo invalido recebe foco e permanece com contorno/indicador vermelho (sem outline preto/azul por cima); conferir que cada campo invalido exibe a legenda vermelha logo abaixo com a mensagem especifica do backend (ex.: "A senha deve ter entre 8 e 72 caracteres").
   - Clicar/tabular em um campo invalido sem digitar: legenda e destaque devem permanecer; digitar um caractere no input (ou trocar a opcao do select Perfil): legenda e destaque daquele campo somem juntos.
   - Conferir que o alerta da status-bar some sozinho apos ~5s e que o destaque/legendas dos campos permanecem apos o alerta sumir.
   - Submeter de novo antes de 5s: o alerta deve reiniciar a contagem (ficar mais 5s completos).
   - Clicar no "X" do alerta: ele fecha na hora e os destaques/legendas continuam.
   - Corrigir parte dos campos e submeter de novo: apenas os campos ainda invalidos exibem erro (estado recalculado da nova resposta 400).
   - Focar um campo valido: indicacao de foco padrao do navegador continua normal.
   - Forcar erro de "Desativar" (ex.: desativar o proprio usuario logado, que o backend rejeita com 409) e conferir que esse alerta tambem tem "X" e some em 5s.

## Riscos e pontos de atencao

- **Formato das violations do backend**: `applySaveError` assume `violations[].field` no formato `metodo.request.campo` (`split('.').pop()`) e `violations[].message` com a mensagem em portugues (Bean Validation do Quarkus, `UserCreateRequest`/`UserUpdateRequest` — ver `knowledge/users.md`). Erros 409 (e-mail duplicado, autodesativacao) nao tem `violations` e caem no fallback generico — comportamento atual mantido, mas agora com auto-dismiss.
- **Nao vazar o novo estilo para outras telas**: `.status-bar` e global (`frontend/src/styles.scss`) e usado por dashboard, perfis, transacoes, categorias e login. O "X" e o `padding-right` devem ficar restritos ao SCSS do componente users (fora de escopo replicar — ver spec).
- **Independencia alerta x campos (criterio 6)**: `dismissError()` nao pode limpar `fieldErrors`; ja a direcao inversa (corrigir o ultimo campo limpa o alerta) e comportamento pre-existente e deve ser mantida, cancelando tambem o timeout para nao disparar depois.
- **Timeout residual**: sem `OnDestroy`/`clearTimeout`, o `setTimeout` pode disparar apos sair da tela ou "engolir" um alerta novo — dai a regra de sempre cancelar o timer anterior em `showError`.
- **Acessibilidade do foco (criterio 1)**: nao usar `outline: none` puro — substituir por outline vermelho visivel, mantendo o indicador de foco.
- **Testes**: nao existe `users.spec.ts` hoje; o criterio 11 exige apenas que `npm run build` e `npm test` (suites existentes de services) continuem passando.
