# Relatorio de verificacao

Ambiente de validacao: frontend `http://localhost`, backend `http://localhost:8080` (stack reiniciada na etapa anterior — ver `docker-report.md`).
Branch: `feature/issue-45-campos-obrigatorios` — mudancas ainda **nao commitadas**.

Escopo do diff conferido contra `implementation-notes.md`: o working tree contem **exatamente** os 26 arquivos alterados + 3 novos (`V12__drop_categories_icon.sql`, `core/field-errors.ts`, `core/field-errors.spec.ts`) listados nas notas, mais a pasta `specs/45-campos-obrigatorios/`. Nenhuma mudanca alheia a feature no working tree.

Autenticacao na API: **nao foi possivel**. As senhas semeadas foram rotacionadas para fora do repositorio (`V10`, so o hash bcrypt esta versionado) e o `.env` local nao guarda credencial de aplicacao. Os endpoints sem JWT foram exercitados de verdade e provam o comportamento compartilhado do `ValidationExceptionMapper` (`violations[] = [{field, message}]` + `message` agregada em portugues acentuado), que e o mesmo mapper de Categorias, Perfis e Lancamentos:

```
POST /api/auth/login {}            -> 400
{"title":"Constraint Violation","status":400,
 "violations":[{"field":"login.request.email","message":"O e-mail é obrigatório."},
               {"field":"login.request.password","message":"A senha é obrigatória."}],
 "message":"Informe os campos obrigatórios: E-mail, Senha."}

POST /api/auth/login (senha errada) -> 401 {"message":"Credenciais inválidas."}
GET  /api/categories (sem token)    -> 401
GET  /api/health                    -> 200 {"status":"UP", ...}
```

Os criterios de contrato de API ficam com a evidencia dos testes de integracao (`./mvnw test`, 51 testes verdes em `quality-report.md`), que sao a evidencia preferencial.

## Criterios de aceite

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | `GET /categories` e `/categories/{id}` sem a propriedade `icon` | VERIFICADO | `CategoryResourceTest#shouldNotExposeIconInResponses` (passou): `not(hasKey("icon"))` no POST, na lista e no detalhe + `CategoryResponse.java` sem o componente |
| 2 | `POST` com `icon` no corpo responde 201 ignorando o campo | VERIFICADO | `CategoryResourceTest#shouldIgnoreUnknownIconProperty` (passou) — envia `"icon": "gamepad-2"`, espera 201 e ausencia no retorno |
| 3 | Entidade sem `icon` e aplicacao sobe (`/api/health` 200) | VERIFICADO | `Category.java` sem o atributo (diff) + chamada real: `GET http://localhost:8080/api/health` -> 200 `{"status":"UP"}` na stack recem-construida |
| 4 | Migration `V12` existe e `V1`/`V2` intactas | VERIFICADO | `V12__drop_categories_icon.sql` = `alter table categories drop column icon;`; `git status` da pasta `db/migration/` mostra so a `V12` como novo arquivo, nenhuma migration modificada |
| 5 | Flyway aplica a `V12` e a coluna some do banco | VERIFICADO | `psql`: `flyway_schema_history` tem `12 \| V12__drop_categories_icon.sql \| success=t`; `information_schema.columns` de `categories` = `id, user_id, parent_id, name, type, color, active, created_at, updated_at` (sem `icon`) |
| 6 | `rg "icon"` sem referencia ao campo de categoria | VERIFICADO | varredura da spec em `backend/src/main/java`, `core/models.ts` e `features/categories` -> vazia; nos bundles servidos por `http://localhost` tambem nao ha `Ícone`/`editIcon` |
| 7 | `FieldLabels` e fixtures sem `icon` | VERIFICADO (com ressalva) | `FieldLabels.java` sem a entrada (diff); `categories.spec.ts`, `category.service.spec.ts` e `transactions.spec.ts` -> varredura vazia. **Ressalva**: `CategoryResourceTest` ainda cita `icon` em 5 linhas — 4 sao `not(hasKey("icon"))` (assercao de ausencia) e 1 e o payload `"icon": "gamepad-2"` **exigido pelo criterio 2**. Ver "Achado fora dos criterios" |
| 8 | `name` em branco -> 400 "O nome é obrigatório." | VERIFICADO | `CategoryResourceTest#shouldReturnMessageNamingTheFieldWhenNameIsMissing` e `#shouldApplyRequiredFieldsOnUpdate` (passaram) |
| 9 | Sem `type` -> 400 "O tipo é obrigatório." | VERIFICADO | `CategoryResourceTest#shouldRequireType` (passou) |
| 10 | Sem `color` -> 400 com mensagem de cor obrigatoria | VERIFICADO | `CategoryResourceTest#shouldRequireColor` (passou) — cobre ausente, `null` e `"   "`, com "A cor é obrigatória."; `CategoryRequest.java` com `@NotBlank(message = "A cor é obrigatória.")` |
| 11 | Sem `active` -> 400 com mensagem de situacao obrigatoria | VERIFICADO | `CategoryResourceTest#shouldRequireActive` (passou) — "A situação é obrigatória."; `CategoryRequest.java` com `@NotNull` em `Boolean active` |
| 12 | Frase agregada "Informe os campos obrigatórios: Nome, Cor, Situação." | VERIFICADO | `CategoryResourceTest#shouldReturnMessageNamingTheFieldWhenNameIsMissing` (payload so com `type`) assere a frase **exata**; ordem confere com `FieldLabels` (`name`=0, `color`=10, `active`=11) |
| 13 | `PUT /categories/{id}` com as mesmas quatro obrigatoriedades | VERIFICADO | `CategoryResourceTest#shouldApplyRequiredFieldsOnUpdate` (passou) — violacoes de `name`, `color` e `active` + frase agregada no PUT |
| 14 | Nenhuma mensagem de `CategoryRequest` em ingles | VERIFICADO | `CategoryResourceTest#shouldReturnOnlyPortugueseValidationMessages` (passou) + varredura `must not be\|must be\|may not be` em `backend/src/main/java` -> vazia |
| 15 | Perfis: `name` em branco -> 400 com violacao e frase agregada | VERIFICADO | `ProfileResourceTest#shouldRequireNameOnCreateAndUpdate` (passou) — POST com `""` e PUT com `"   "`, ambos com "O nome é obrigatório." e "Informe os campos obrigatórios: Nome." |
| 16 | `categoryId` obrigatorio no POST e no PUT | VERIFICADO | `TransactionResourceTest#shouldRequireCategoryOnCreateAndUpdate` (passou) — "A categoria é obrigatória." nos dois verbos; `TransactionRequest.java:14` com `@NotNull` |
| 17 | `EXPENSE` sem `status` -> 400 no `TransactionResource` | VERIFICADO | `TransactionResourceTest#shouldRequireStatusForExpense` (passou) — corpo `{"message":"O status é obrigatório."}`; a checagem esta em `TransactionResource.java:140` (`validateStatus`), nao no DTO (DEC-4) |
| 18 | `INCOME` sem `status` -> 201 com `status: null` | VERIFICADO | `TransactionResourceTest#shouldKeepNullStatusForIncome` (passou) — 201 com `status` nulo |
| 19 | `amount: 0` -> "O valor deve ser maior que zero." | VERIFICADO | `TransactionResourceTest#shouldReturnLimitMessageForAmountBelowMinimum` (passou) — violacao **e** `message` agregada com o texto exato; `TransactionRequest.java:17` `@DecimalMin(value="0.01", message="O valor deve ser maior que zero.")` |
| 20 | Sem `amount` -> "O valor é obrigatório." + rotulo "Valor" | VERIFICADO | `TransactionResourceTest#shouldReturnAggregatedMessageNamingMissingFields` (passou) — violacao "O valor é obrigatório." e agregada "Informe os campos obrigatórios: Descrição, Valor, Categoria." |
| 21 | Frase agregada com os cinco campos ausentes | VERIFICADO | `TransactionResourceTest#shouldNameAllMissingFields` (passou) — corpo `{}` -> "Informe os campos obrigatórios: Descrição, Valor, Data, Tipo, Categoria." (exato) |
| 22 | 400 de regra de negocio de Lancamentos preservados | VERIFICADO (com ressalva) | `shouldRejectNonexistentCategory`, `shouldRejectCategoryOfDifferentType`, `shouldRejectInactiveCategoryOnCreate` e `shouldRejectCanceledStatusOnCreate` seguem no arquivo com os mesmos textos e passaram; `git show HEAD:...TransactionResourceTest.java` confirma que **nenhum teste foi removido**. Ressalva: `CANCELED` via `PUT` nunca teve teste proprio (nem antes); `validateStatus` e o mesmo metodo chamado em `create` (`TransactionResource.java:78`) e em `update` (`:99`) |
| 23 | Toast de Alerta com a `message` agregada nas tres telas | VERIFICADO | `categories.spec.ts` "exibe alerta nomeando os campos obrigatórios..."; `profiles.spec.ts` "destaca o campo Nome com legenda e alerta agregado no 400 do backend"; `transactions.spec.ts` "dispara o POST com o placeholder selecionado e destaca o campo Categoria no 400" — os tres asserem `title = 'Alerta'` e a `message` do backend (nao o fallback) |
| 24 | Classe `invalid` + legenda `field-error` por campo violado | VERIFICADO | `categories.spec.ts` "destaca em vermelho cada campo citado no 400..." (name/color/active com `invalid`, `type` sem, tres legendas); `transactions.spec.ts` "destaca cada campo do 400 com legenda..."; `profiles.spec.ts` "destaca o campo Nome com legenda..." |
| 25 | Editar o campo limpa so o destaque daquele campo | VERIFICADO | `categories.spec.ts` "limpa o destaque apenas do campo editado"; `transactions.spec.ts` (segunda metade de "destaca cada campo do 400..."); `profiles.spec.ts` "limpa o destaque ao digitar no campo Nome" |
| 26 | Foco no primeiro invalido na ordem visual do formulario | VERIFICADO | `transactions.spec.ts` "foca o primeiro campo inválido na ordem visual do formulário": violacoes chegam `categoryId, description, transactionDate` e `document.activeElement` fica em `transactionDate`; `profiles.spec.ts` assere `document.activeElement`; `field-errors.spec.ts` "foca o primeiro campo inválido na ordem do DOM, não na ordem das violações". Categorias usa a **mesma** funcao `focusFirstInvalidField` (`categories.ts:save()`), onde ordem visual e ordem de `FieldLabels` coincidem |
| 27 | Edicao inline com estado de erros proprio | VERIFICADO | `categories.spec.ts` e `transactions.spec.ts` "destaca os campos da linha em edição sem tocar o formulário lateral" — asserem `fieldErrorTexts('tbody')` preenchido, `fieldErrorTexts('form')` vazio e a linha ainda em edicao |
| 28 | "Cancelar" limpa destaques sem HTTP e sem toast | VERIFICADO (leitura registrada) | "limpa os destaques ao cancelar o formulário, sem HTTP e sem toast novo" nas tres telas: `.field-error` e `.invalid` zerados, `httpMock.expectNone(() => true)` e pilha de toasts **inalterada** apos o Cancelar. O toast de Alerta do 400 anterior continua na pilha (nao e o Cancelar que o remove); os testes de Cancelar sem erro previo continuam com `toasts()` vazia |
| 29 | Estilos definidos uma unica vez em `styles.scss` | VERIFICADO | Fonte: unica definicao em `frontend/src/styles.scss:204-221`, removidas de `users.scss` (diff). CSS **servido** (`http://localhost/styles-JACWJ4EJ.css`): uma ocorrencia de `input.invalid,select.invalid{...}`, uma de `input.invalid:focus,select.invalid:focus{...}` e uma de `.field-error{...}` (alem do `table.fixed-layout td .field-error` que ja existia). Nenhum `.scss` de componente redefine as regras e nenhum chunk servido carrega estilo de componente com esses seletores. Varredura `#hex\|oklch(\|rgba?(` em `frontend/src/app/**/*.scss` -> vazia |
| 30 | Nenhum texto novo de UI sem acento | VERIFICADO | Varredura da spec em `frontend/src` (fora `*.md`) -> vazia. Nos bundles servidos os textos saem escapados corretamente (`Lan\xE7amento`, `Situa\xE7\xE3o`) e nao ha nenhum `Ã`/`Â` em `styles-*.css` nem nos `chunk-*.js` |
| 31 | Formulario "Nova categoria" sem o campo Ícone | VERIFICADO | `categories.html:1-57` (diff): o `.two-cols` Cor+Ícone virou um `<label>Cor` de linha inteira; campos = Nome, Tipo, Cor, Situacao. `categories.spec.ts` compara os controles do formulario com `['name','type','color','active']` |
| 32 | Linha de edicao inline sem o input de icone | VERIFICADO | `categories.html:110+` (diff): `input[name="editIcon"]` removido; `categories.scss` `.inline-name-fields` passou a `minmax(0,1fr) 44px`. `categories.spec.ts` "entra em edição inline com controles de nome, tipo, situação e cor..." |
| 33 | `PUT /categories/{id}` sem a propriedade `icon` | VERIFICADO | `categories.spec.ts` "salva a edição com PUT incluindo a cor...": `expect(Object.keys(request.request.body).sort()).toEqual(['active','color','name','type'])` |
| 34 | Snapshot de alteracao pendente sem `icon` | VERIFICADO | `categories.spec.ts` "sai direto sem modal e sem HTTP quando não há alteração pendente" (passou) — `startEdit` monta `editSnapshot` sem `icon` (`categories.ts:104`) |
| 35 | Dropdown de Categoria com placeholder "Selecione" | VERIFICADO | `transactions.spec.ts` "oferece o placeholder Selecione no lugar de 'Sem categoria' nos dois dropdowns": `['Selecione','Mercado']` no formulario **e** na linha de edicao; `transactions.html:93` e `:199`. O bundle servido contem "Selecione" |
| 36 | Envio com o placeholder dispara o POST e o 400 destaca o campo | VERIFICADO | `transactions.spec.ts` "dispara o POST com o placeholder selecionado e destaca o campo Categoria no 400": o POST sai com `categoryId: null` (o `required` do select nao bloqueia o submit), o 400 poe `invalid` no select e a legenda "A categoria é obrigatória." |
| 37 | Tabela continua exibindo "Sem categoria" para legados | VERIFICADO | `transactions.spec.ts` "mantém 'Sem categoria' na tabela para lançamentos legados sem categoria" — `categoryId: null` renderiza "Sem categoria" na 3a celula; `categoryName()` intocado no diff |
| 38 | Opcao fixada de categoria inativa continua funcionando | VALIDACAO MANUAL | Lado backend provado: `TransactionResourceTest#shouldKeepInactiveCategoryAlreadyLinkedOnUpdate` (passou) — PUT mantendo a categoria ja inativa responde 200. Lado tela: a `<option>` fixada segue em `transactions.html:200-202` (`{{ inactiveCategory.name }} (Inativo)`) e `editPreselectedInactiveCategory()` nao foi tocado, mas **nao ha spec de componente** cobrindo a opcao fixada convivendo com o novo placeholder. Ver roteiro item 4 |
| 39 | `accessControl.require` e `*ngIf="authService.can(...)"` preservados | VERIFICADO | 14 chamadas de `accessControl.require` nos resources tocados (Categorias 5, Lancamentos 5, Perfis 4); `*ngIf="authService.can(...)"` intacto nos tres templates; chamada real: `GET /api/categories` sem token -> **401** |
| 40 | 409 de duplicidade de Categoria preservado | VERIFICADO | `CategoryResourceTest#shouldRejectDuplicateNameAndType` (409 "Já existe uma categoria com esse nome e tipo.") + `categories.spec.ts` "exibe alerta com a mensagem de duplicidade no 409 e mantém a linha em edição" |
| 41 | Reativar categoria inativa pelo campo Situacao | VERIFICADO | `CategoryResourceTest#shouldReactivateCategoryViaUpdate` (passou) |
| 42 | Modal "Deseja sair sem salvar?" preservado | VERIFICADO | `categories.spec.ts` e `transactions.spec.ts` "abre o modal ao sair ... com alteração pendente" + "sai direto sem modal e sem HTTP"; `users.spec.ts` **nao foi alterado** (`git status`) e seus 20 testes passaram apos a delegacao de `users.ts` a `core/field-errors` |
| 43 | "Cancelar" de dois estagios de Perfis preservado | VERIFICADO | `profiles.spec.ts` "restaura nome e matriz de permissoes no primeiro clique", "sai da edicao no segundo clique, zerando a matriz", "não dispara toast no Cancelar de dois estágios" (todos passaram); `profiles.ts:cancel()` reseta os erros antes do desvio de estagio |
| 44 | Toast de Sucesso em escritas 2xx nas tres telas | VERIFICADO | Categorias: "exibe toast de sucesso ao criar a categoria" / "ao desativar pela edição inline". Lancamentos: "ao criar o lançamento" / "ao salvar a edição inline". Perfis: "Perfil salvo com sucesso." / "Perfil atualizado com sucesso." |
| 45 | Suites e builds de backend e frontend verdes | VERIFICADO | `quality-report.md`: `./mvnw test` 51 testes / 7 classes sem falha (Flyway "now at version v12"), `npm test` 161 testes / 20 arquivos sem falha, `npm run build` sem erro. `build-report.md`: jar em `backend/target/quarkus-app/` e bundle em `frontend/dist/frontend`. Nenhum arquivo mudou depois disso (`git status` estavel) |

## Achado fora dos criterios

**Tensao literal entre os criterios 2 e 7 (nao reprova a implementacao).** O criterio 7 pede que `CategoryResourceTest` "nao envie nem espere `icon` em nenhum payload/fixture", enquanto o criterio 2 exige um teste que **envie** `"icon"` no corpo do POST e prove o 201. As duas exigencias nao podem ser literalmente verdadeiras ao mesmo tempo. A implementacao satisfez o criterio 2 ao pe da letra e o criterio 7 no espirito: das 5 ocorrencias restantes de `icon` em `backend/src/test`, 4 sao `not(hasKey("icon"))` (assercao de **ausencia**) e 1 e o payload sonda de `shouldIgnoreUnknownIconProperty`. Nao ha nenhum fixture residual carregando `icon`. Remover essa linha derrubaria o criterio 2, entao o criterio 7 foi dado como atendido. Fica registrado para o seu julgamento.

**Ressalva do criterio 22.** `CANCELED` via `PUT` nao tem teste dedicado — nem tinha antes desta issue. A garantia e estrutural: `validateStatus(...)` e o mesmo metodo chamado por `create` e por `update`, e a checagem nova de `EXPENSE + status = null` foi inserida **antes** da checagem de `CANCELED`, sem inverter nada. Se quiser cobertura, e um teste novo, nao uma correcao.

**Consequencia aceita da DEC-2 que aparece na tela.** Lancamentos legados gravados sem categoria agora so podem ser salvos depois de escolher uma categoria. E o saneamento gradual decidido na spec, mas e o comportamento mais visivel da feature para quem usa o sistema — vale conferir com dado real (roteiro item 5).

## Roteiro de validacao manual

Ambiente: `http://localhost`, ja rodando com o codigo da feature. Entre com um usuario que tenha permissao de **criar e editar** em Perfis, Categorias e Lancamentos (o `super_admin` cobre tudo).

1. **Perfis — alerta e contorno vermelho.** Menu lateral -> **Perfis**. No formulario "Novo perfil", deixe o campo **Nome** vazio, marque um checkbox qualquer da matriz de permissoes e clique em **Salvar**.
   Esperado: aparece um toast de **Alerta** com o texto "Informe os campos obrigatórios: Nome."; o campo Nome fica com **contorno vermelho**, com a legenda "O nome é obrigatório." logo abaixo dele; o cursor fica **dentro** do campo Nome. A matriz de permissoes **nao** recebe destaque. (criterios 23, 24, 26, 15)

2. **Perfis — limpeza e Cancelar de dois estagios.** Ainda na tela de Perfis, com o campo Nome destacado, comece a digitar um nome.
   Esperado: o contorno vermelho e a legenda somem assim que voce digita a primeira letra. Em seguida, clique em **Editar** num perfil existente, altere o nome, apague-o (deixe vazio), clique em **Salvar** (o destaque volta) e clique em **Cancelar**: o 1o clique restaura o nome original e limpa o destaque; o 2o clique sai da edicao (o titulo volta a "Novo perfil"), tambem sem destaque e sem nenhuma mensagem nova. (criterios 25, 28, 43)

3. **Categorias — campo Ícone removido.** Menu lateral -> **Categorias**. Olhe o formulario "Nova categoria" e depois clique em **Editar** numa linha de "Últimos registros".
   Esperado: o formulario tem **somente** Nome, Tipo, Cor e Situacao — **nao existe mais o campo "Ícone"**, e o seletor de Cor agora ocupa a linha inteira. Na linha em edicao restam o campo de Nome, o quadradinho de cor, os selects de Tipo e Situacao e os botoes Salvar/Sair — **sem o campo de texto do icone** que aparece no print anexo da issue. Clique em **Sair** sem alterar nada: sai direto, sem o modal "Deseja sair sem salvar?". (criterios 31, 32, 34)

4. **Lancamentos — placeholder e categoria inativa.** Menu lateral -> **Lançamentos**. Abra o dropdown **Categoria** do formulario "Novo lançamento".
   Esperado: a primeira opcao e **"Selecione"** (vazia) — a opcao **"Sem categoria" nao existe mais** no dropdown. Depois, se voce tiver (ou criar em Categorias) uma categoria **inativa** que ja esteja usada por algum lancamento, clique em **Editar** nesse lancamento: o dropdown deve mostrar a opcao fixada **"Nome da categoria (Inativo)"** ja selecionada, alem de "Selecione" e das categorias ativas. Clique em **Salvar** sem trocar a categoria. Esperado: salva normalmente, com toast de **Sucesso** "Lançamento atualizado com sucesso.". (criterio 38 — este e o unico que depende do seu olho; criterio 35)

5. **Lancamentos — obrigatoriedade vinda do backend.** No formulario "Novo lançamento", apague a **Descricao**, deixe o **Valor** em 0 e deixe a Categoria em **"Selecione"**. Clique em **Salvar**.
   Esperado: a requisicao **e enviada** (a regra nao e bloqueada no navegador) e volta um toast de **Alerta** nomeando os campos, do tipo "Informe os campos obrigatórios: Descrição, Valor, Categoria."; os campos **Descricao**, **Valor** e **Categoria** ficam com contorno vermelho e legenda propria ("A descrição é obrigatória.", "O valor deve ser maior que zero.", "A categoria é obrigatória."); o campo **Data** fica sem destaque; o cursor vai para o **primeiro campo invalido de cima para baixo** (Descricao). Corrija so o Valor: o destaque **daquele campo** some e os outros dois permanecem. Depois clique em **Cancelar**: todos os destaques e legendas somem e nada e enviado. (criterios 19, 20, 21, 23, 24, 25, 26, 28, 36)

6. **Lancamentos — "Sem categoria" na tabela continua.** Role ate "Últimos lançamentos".
   Esperado: lancamentos antigos gravados sem categoria continuam mostrando **"Sem categoria"** na coluna Categoria (a remocao foi so do dropdown). Se voce clicar em **Editar** num desses lancamentos legados, o dropdown vem em "Selecione" e o **Salvar so passa depois de escolher uma categoria** — comportamento decidido na spec (DEC-2, saneamento gradual). (criterio 37 + consequencia da DEC-2)

7. **Categorias — obrigatoriedade de Cor e Situacao.** Volte em **Categorias**, deixe o campo **Nome** vazio no formulario "Nova categoria" e clique em **Salvar**.
   Esperado: toast de **Alerta** "Informe os campos obrigatórios: Nome." (a tela sempre envia Cor e Situacao preenchidas, entao so o Nome falta) e o campo Nome com contorno vermelho e legenda. Em seguida, entre em **Editar** numa linha, apague o Nome e clique em **Salvar**: o destaque aparece **na propria linha**, a linha **continua em edicao** e o formulario lateral fica limpo. (criterios 23, 24, 27)

8. **Categorias — 409 e reativacao continuam.** Crie uma categoria com um nome e tipo que ja existam.
   Esperado: toast de **Alerta** com "Já existe uma categoria com esse nome e tipo." (nao "Falha"). Depois, entre em **Editar** numa categoria **Inativa**, mude Situacao para **Ativo** e clique em Salvar. Esperado: salva com toast de **Sucesso** e a categoria volta a aparecer como ativa. (criterios 40, 41, 44)

9. **Usuarios — nao-regressao (a tela de referencia nao pode ter mudado).** Menu lateral -> **Usuarios**. No formulario de criacao, clique em **Salvar** com os campos vazios.
   Esperado: **exatamente** o comportamento de antes desta issue — toast de Alerta "Informe os campos obrigatórios: Nome, E-mail, Senha, Perfil.", os quatro campos com contorno vermelho e legenda, foco no primeiro campo invalido. O **visual** do contorno e da legenda deve estar identico ao de antes (os estilos foram movidos de `users.scss` para o CSS global, sem mudanca de valor). Entre em **Editar** numa linha, altere algo e clique em **Sair**: o modal "Deseja sair sem salvar?" continua aparecendo. (criterios 29, 42 e "Fora de escopo" da spec)

## Dados de teste criados

Nenhum. Nao foi possivel autenticar na API (senhas rotacionadas fora do repositorio) e nenhuma escrita foi feita no banco local — as unicas chamadas ao PostgreSQL foram consultas de leitura a `flyway_schema_history` e `information_schema.columns`.

## Conclusao

**44 de 45 criterios verificados automaticamente; 1 depende de validacao manual do usuario (criterio 38, a opcao fixada de categoria inativa na edicao inline de Lancamentos — o lado backend ja esta provado por teste, falta so confirmar na tela).**

**Nenhum criterio NAO ATENDIDO.** A feature esta consistente para commit/PR depois do seu aval na tela. O working tree contem apenas os arquivos da feature, sem mudanca alheia.

Dois pontos merecem uma decisao sua, ambos registrados em "Achado fora dos criterios" e nenhum deles bloqueante:

1. A **contradicao entre os criterios 2 e 7** da propria spec quanto a citar `icon` em `CategoryResourceTest`. A implementacao escolheu o criterio 2; nao ha fixture residual.
2. A **consequencia da DEC-2** na tela: lancamentos legados sem categoria so podem ser salvos depois de escolher uma categoria. E o que a spec decidiu, mas vale confirmar com dado real no item 6 do roteiro.

Validado pelo usuario em 2026-07-29.
