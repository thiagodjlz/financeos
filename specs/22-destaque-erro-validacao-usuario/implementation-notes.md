# Notas de implementacao

Branch: `feature/issue-22-destaque-erro-validacao-usuario`

## Arquivos alterados

- `frontend/src/app/features/users/users.ts` — captura o erro de `save()` (`catch (err)`), extrai `violations` de um `HttpErrorResponse`, mapeia o ultimo segmento de cada `field` para os campos conhecidos do formulario (`name`, `email`, `password`, `profileId`), popula o signal `invalidFields`, monta a mensagem citando os rotulos na ordem visual do formulario e move o foco para o primeiro campo invalido via `@ViewChild`. Adiciona `isFieldInvalid`/`clearFieldError` (usados pelo template) e limpa `invalidFields` no inicio de `save()`, em `edit()` e em `resetForm()`.
- `frontend/src/app/features/users/users.html` — adiciona template refs (`#nameInput`, `#emailInput`, `#passwordInput`, `#profileSelect`) e bindings `[class.invalid]`/`(input)`/`(change)` nos quatro campos do formulario (Nome, E-mail, Senha, Perfil).
- `frontend/src/app/features/users/users.scss` — adiciona regra `input.invalid, select.invalid` com contorno vermelho, escopada ao componente.

## Decisoes

- Seguido o plano a risca: logica toda concentrada em `users.ts`/`users.html`/`users.scss`, sem tocar `user.service.ts` (o `HttpErrorResponse` original ja chega intacto em `users.ts` via `firstValueFrom`).
- Erros sem `violations` reconhecidas (nenhum campo do array bate com `FIELD_LABELS`) caem no mesmo texto generico de antes, sem tocar `invalidFields` — preserva o comportamento atual para 409 de e-mail duplicado e outras falhas.
- `clearFieldError` so reseta a mensagem geral (`error`) quando o ultimo campo destacado e corrigido, conforme criterio de aceite de nao deixar destaque "preso" na tela.

## Desvios em relacao ao plano

Nenhum desvio. Nao havia teste automatizado para o componente `Users` (`features/users/*.spec.ts` inexistente), entao o passo 7 do plano (rodar `npm test` se houver spec) foi pulado por nao ser aplicavel. `npm run build` executado com sucesso (passo 6), validando o criterio de aceite explicito da spec.
