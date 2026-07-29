# Plano de implementacao

## Abordagem

Mudanca puramente de frontend, concentrada em `features/users/`. O `catch` vazio de `save()` em `users.ts` passa a capturar o erro (`unknown`), checar se e um `HttpErrorResponse` cujo corpo tem o formato `{violations: [{field, message}]}` do Quarkus e, se sim, extrair o ultimo segmento de cada `field` (`update.request.password` -> `password`), mapear para os campos conhecidos do formulario (`name`, `email`, `password`, `profileId`) e seus rotulos (Nome/E-mail/Senha/Perfil). Um novo signal `invalidFields` guarda o conjunto de campos invalidos, usado no `.html` para aplicar uma classe CSS de contorno vermelho (`[class.invalid]`) em cada `<input>`/`<select>` correspondente; o foco e movido via `@ViewChild` + `ElementRef.nativeElement.focus()` no primeiro campo invalido segundo a ordem visual do formulario. O destaque de cada campo e limpo por um handler `(input)`/`(change)` proprio (nao via `(ngModelChange)`, que ja esta ocupado pelo banana-in-box `[(ngModel)]`), e o conjunto inteiro e limpo no inicio de cada nova tentativa de `save()`. Erros que nao tem `violations` (ex.: 409 de e-mail duplicado) caem no mesmo texto generico que ja existe hoje, sem tocar `invalidFields` — nenhuma mudanca de comportamento para esse caminho. `user.service.ts` nao precisa mudar: os metodos `create`/`update` ja propagam o `HttpErrorResponse` original (via `firstValueFrom`) sem transformar o erro, entao o corpo com `violations` chega intacto em `users.ts`.

## Arquivos a alterar

### Backend

Nenhum arquivo de backend muda (confirmado pela spec — "fora de escopo": nenhuma mudanca em `UserResource`/`UserCreateRequest`/`UserUpdateRequest` ou nas regras de validacao).

### Frontend

- `frontend/src/app/features/users/users.ts`:
  - Importar `HttpErrorResponse` de `@angular/common/http` e `ElementRef`, `ViewChild` de `@angular/core` (junto ao import ja existente de `Component, OnInit, inject, signal`).
  - Adicionar constantes de modulo `FIELD_LABELS` (`{ name: 'Nome', email: 'E-mail', password: 'Senha', profileId: 'Perfil' }`) e `FIELD_ORDER` (`['name', 'email', 'password', 'profileId']`), usadas tanto para validar quais segmentos de `field` sao conhecidos quanto para decidir a ordem de foco/mensagem.
  - Adicionar signal `protected readonly invalidFields = signal<Set<string>>(new Set())`.
  - Adicionar quatro `@ViewChild` com template reference variables (`nameInput`, `emailInput`, `passwordInput`, `profileSelect`) tipados `ElementRef<HTMLInputElement>`/`ElementRef<HTMLSelectElement>`, correspondentes aos refs novos no `.html`.
  - `save()`: no inicio (junto de `this.error.set('')`), adicionar `this.invalidFields.set(new Set())` — limpa o destaque de uma tentativa anterior antes de avaliar a nova. Trocar o `catch { ... }` sem parametro por `catch (err) { this.applySaveError(err); }`.
  - Novo metodo privado `applySaveError(err: unknown)`: extrai `violations` do erro (novo metodo `extractViolations`); se vazio ou sem nenhum campo reconhecido (`field.split('.').pop()` presente em `FIELD_LABELS`), mantem a mensagem generica atual (`'Nao foi possivel salvar o usuario. Revise os campos e tente novamente.'`) sem tocar `invalidFields`; se houver campos reconhecidos, seta `invalidFields` com o conjunto desses campos, monta a mensagem citando os rotulos na ordem de `FIELD_ORDER` (ex.: `` `Revise o(s) campo(s) invalido(s): ${labels.join(', ')}.` ``) e chama `focusFirstInvalidField(fields)`.
  - Novo metodo privado `extractViolations(err: unknown): { field: string; message: string }[]` — retorna `[]` se `err` nao for `HttpErrorResponse` ou se `err.error` nao for um objeto com `violations` sendo array; senao retorna `err.error.violations`.
  - Novo metodo privado `focusFirstInvalidField(fields: Set<string>)` — percorre `FIELD_ORDER`, acha o primeiro presente em `fields`, resolve o `ElementRef` correspondente (`nameInput`/`emailInput`/`passwordInput`/`profileSelect`) e chama `.nativeElement.focus()`.
  - Novo metodo `protected isFieldInvalid(field: string): boolean` — `this.invalidFields().has(field)`, usado no `.html` para o `[class.invalid]`.
  - Novo metodo `protected clearFieldError(field: string): void` — remove `field` de `invalidFields` (se presente); se o conjunto resultante ficar vazio, tambem limpa `this.error.set('')` (a mensagem generica/combinada so faz sentido enquanto sobrar pelo menos um campo destacado).
  - `edit()`: adicionar `this.invalidFields.set(new Set())` junto ao restante da inicializacao do form, para nao carregar destaque de uma edicao anterior ao abrir outra linha para editar.
  - `resetForm()` (metodo privado existente): adicionar `this.invalidFields.set(new Set())`, cobrindo tanto o fluxo de sucesso (`save()` chama `resetForm()` apos salvar) quanto `cancelEdit()`.

- `frontend/src/app/features/users/users.html`:
  - No `<input name="name">`: adicionar `#nameInput`, `[class.invalid]="isFieldInvalid('name')"` e `(input)="clearFieldError('name')"`.
  - No `<input name="email">`: adicionar `#emailInput`, `[class.invalid]="isFieldInvalid('email')"` e `(input)="clearFieldError('email')"`.
  - No `<input name="password">`: adicionar `#passwordInput`, `[class.invalid]="isFieldInvalid('password')"` e `(input)="clearFieldError('password')"`.
  - No `<select name="profileId">`: adicionar `#profileSelect`, `[class.invalid]="isFieldInvalid('profileId')"` e `(change)="clearFieldError('profileId')"`.
  - Nenhuma mudanca no `[(ngModel)]` existente de cada campo (banana-in-box mantido; os handlers novos usam os eventos DOM nativos `input`/`change`, nao `ngModelChange`, para nao conflitar com o two-way binding).

- `frontend/src/app/features/users/users.scss` — adicionar regra `input.invalid, select.invalid { border-color: #c0392b; box-shadow: 0 0 0 1px #c0392b; }` (contorno vermelho), escopada ao componente (nao vira classe global em `styles.scss`, coerente com o "fora de escopo" de nao generalizar o padrao para outras telas).

- `frontend/src/app/core/services/user.service.ts` — **sem mudanca**. `create()`/`update()` ja usam `firstValueFrom(this.http.post/put(...))` sem `catch`/transformacao; o `HttpErrorResponse` original (com `error.violations` no corpo) chega intacto em `users.ts`, que e onde toda a logica nova mora.

### Migration (se houver mudanca de schema)

Nao aplicavel — feature e so de apresentacao no frontend, sem mudanca de schema nem de contrato de API.

## Sequencia de implementacao

1. Em `users.ts`, adicionar os imports novos (`HttpErrorResponse`, `ElementRef`, `ViewChild`), as constantes `FIELD_LABELS`/`FIELD_ORDER`, o signal `invalidFields` e os quatro `@ViewChild`.
2. Implementar `extractViolations`, `applySaveError`, `focusFirstInvalidField`, `isFieldInvalid` e `clearFieldError`.
3. Ajustar `save()` para limpar `invalidFields` no inicio e chamar `applySaveError(err)` no `catch`; ajustar `edit()` e `resetForm()` para limpar `invalidFields`.
4. Em `users.html`, adicionar os template refs (`#nameInput`, `#emailInput`, `#passwordInput`, `#profileSelect`) e os bindings `[class.invalid]`/`(input)`/`(change)` nos quatro campos do formulario.
5. Em `users.scss`, adicionar a regra `.invalid` de contorno vermelho.
6. Rodar `npm run build` no frontend e confirmar que compila sem erros (criterio de aceite explicito da spec).
7. Rodar `npm test` (se houver spec de `users` — conferir `features/users/users.spec.ts`/similar; se nao houver teste automatizado para este componente, seguir direto para a validacao manual).
8. Validacao manual ponta a ponta no navegador (`npm start` no frontend, com backend rodando):
   - Login como usuario com permissao `USERS`/`EDIT` e `CREATE`; abrir a tela "Usuarios".
   - **Senha curta na edicao** (caso da issue): clicar "Editar" num usuario existente, digitar uma senha com menos de 8 caracteres no campo Senha e clicar "Salvar". Confirmar que a mensagem no topo cita "Senha" (nao mais o texto generico fixo), que o campo Senha fica com contorno vermelho, e que o cursor esta focado no campo Senha.
   - **Campo unico na criacao**: clicar "Novo usuario" (ou equivalente), preencher Nome/E-mail validos e uma senha com menos de 8 caracteres, clicar "Salvar". Confirmar o mesmo comportamento (mensagem citando "Senha", contorno vermelho no campo Senha, foco nele) no fluxo de criacao (`POST /users`).
   - **Multiplos campos invalidos ao mesmo tempo**: em uma edicao, apagar totalmente o campo Nome e tambem digitar uma senha curta, clicar "Salvar". Confirmar que a mensagem no topo cita ambos os rotulos ("Nome" e "Senha"), que os dois campos (Nome e Senha) ficam com contorno vermelho, e que o foco vai para o Nome (primeiro na ordem visual do formulario: Nome, E-mail, Senha, Perfil), nao para a Senha.
   - **Limpeza ao corrigir o campo**: ainda no cenario acima, digitar qualquer caractere no campo Nome (sem clicar Salvar de novo). Confirmar que o contorno vermelho do campo Nome some imediatamente, mas o campo Senha (ainda invalido) continua com contorno vermelho ate ser corrigido tambem. Corrigir a Senha (8+ caracteres) e confirmar que o contorno some e a mensagem de erro no topo desaparece assim que o ultimo campo destacado for corrigido.
   - **Nova tentativa limpa o destaque anterior**: repetir o cenario de senha curta, sem corrigir nada; clicar "Salvar" de novo (mesma tentativa invalida). Confirmar que o destaque nao se acumula/duplica e o comportamento (mensagem, contorno, foco) se repete normalmente.
   - **Erro sem `violations` mantem o comportamento atual**: tentar criar um usuario com um e-mail ja cadastrado (`409`). Confirmar que a mensagem generica/atual aparece no topo (sem citar rotulos de campo) e que nenhum campo do formulario recebe contorno vermelho nem foco automatico — sem regressao.
   - Confirmar visualmente que o contorno vermelho e claramente distinguivel do estado normal do campo (nao muito sutil) e nao quebra o layout do formulario.

## Riscos e pontos de atencao

- **`novalidate` implicito do `NgForm`**: o `<form>` de `users.html` usa `FormsModule`/`ngModel` sem `ngNoForm`, entao o Angular aplica `novalidate` automaticamente e os atributos HTML5 `required`/`type="email"` nao bloqueiam o `(ngSubmit)="save()"` no navegador — e por isso que o backend recebe e rejeita nome em branco ou senha curta hoje (o proprio caso da issue). Esse plano depende desse comportamento ja existente continuar valendo; nenhuma mudanca nova o afeta, mas vale confirmar no passo de validacao manual que o clique em "Salvar" realmente dispara a chamada mesmo com campos "invalidos" pelo HTML5.
- **`(input)`/`(change)` em vez de `(ngModelChange)`**: usar um evento DOM nativo separado do `[(ngModel)]` evita duplicar o binding do mesmo evento no template (Angular nao permite dois `(ngModelChange)` no mesmo elemento), mas significa que `clearFieldError` roda a cada tecla digitada (`input`) nos campos de texto/senha e a cada selecao (`change`) no `<select>` — comportamento pretendido pela spec ("ao o usuario alterar o valor de um campo destacado"), sem necessidade de debounce.
- **`profileId` dificilmente sera exercitado na pratica**: como o proprio `spec.md` observa, o `<select>` de Perfil sempre vem preenchido pela UI, entao a violacao de `profileId` (`@NotNull`) praticamente nunca chega a acontecer a partir do formulario — o codigo trata esse campo por completude/consistencia com os demais, mas o roteiro de validacao manual foca em Nome/E-mail/Senha, que sao reproduzimos com certeza.
- **Mensagem generica para erros sem campo reconhecido**: se o backend um dia adicionar uma violacao cujo `field` nao mapeia para nenhum dos quatro campos conhecidos (`name`/`email`/`password`/`profileId`), `applySaveError` cai no fallback de mensagem generica sem contorno em nenhum campo — comportamento conservador e alinhado ao "fora de escopo" da spec (nao ha como destacar um campo que a tela nao tem).
- **`knowledge/users.md`**: nenhuma regra de negocio de usuarios muda (validacoes de tamanho de senha, e-mail unico, `super_admin` oculto, soft delete) — a mudanca e so de apresentacao do erro ja retornado pelo backend existente.
