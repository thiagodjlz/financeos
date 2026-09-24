# Central de Documentacao

Criada na issue #70. Fontes: `backend/src/main/java/br/com/financeos/documentation/`, `frontend/src/app/features/documentation/`, `frontend/src/app/core/services/documentation.service.ts`.

E o manual do sistema **dentro do sistema**: menu "Sobre" -> "Documentação", rota `/documentation`, uma area por tela existente. Nao ha nenhuma tela, endpoint ou tabela de manutencao do conteudo — a manutencao continua sendo pelo processo de desenvolvimento.

## Permissao

- Tela propria no enum `Screen` (`DOCUMENTATION`) e privilegio **exclusivamente de visualizacao** — detalhes em [auth-and-permissions.md](auth-and-permissions.md).
- `GET /api/documentation` comeca com `accessControl.require(Screen.DOCUMENTATION, Action.VIEW)`: 200 com o conteudo, 403 sem o privilegio (inclusive quando o perfil nao tem linha para a tela), 401 sem token, e o `super_admin` oculto recebe 200 sempre. O pacote `documentation` tem **um unico** `@GET` — nenhum verbo de escrita.
- A `V13` semeou `can_view = true` para **todos** os perfis que existiam quando ela rodou (decisao do usuario na issue #70, para o manual nascer disponivel). Perfil criado depois nasce com o que a tela de Perfis enviar.

## O conteudo e dado tipado, nao Markdown

- O conteudo **nao** e lido de `knowledge/*.md` em runtime. Os `.md` sao a **fonte da redacao** — quem escreve o conteudo le os arquivos de dominio e o codigo; o sistema serve uma estrutura tipada. Renderizar Markdown exigiria dependencia nova (vetada pelo design system) ou `[innerHTML]`.
- Contrato: `DocumentationResponse(title, introduction, areas[])`; `DocumentationArea(id, title, summary, sections[])`; `DocumentationSection(title, blocks[])`; `DocumentationBlock(kind, text, items[], table)` com `kind` em `PARAGRAPH | LIST | TABLE | HIGHLIGHT`. A introducao ("Como utilizar o sistema") e campo proprio, separada de `areas`, para "exatamente 5 areas" ser afirmacao testavel.
- As areas sao as **5 telas que existem**: Resumo, Lancamentos, Categorias, Usuarios e Perfis. Cada uma traz, no minimo, Descricao, Funcionalidades, Regras de negocio e Acoes (mais Campos nas telas com formulario); secao sem conteudo e **omitida**, nunca renderizada vazia.
- Frontend: `documentation.service.ts` guarda a resposta num signal e a tela faz **uma unica** `GET /api/documentation` por vida do componente. Busca e troca de area sao estado local (signal), nunca requisicao nova. O componente itera `[introduction, ...areas]` por um caminho unico, sem nenhum `if` por id ou titulo de area, e o `.scss` estiliza por **tipo de bloco**, nunca por area.

## Regras de redacao do conteudo publicado

- **Nada de regra inventada.** Toda afirmacao publicada tem origem num `knowledge/*.md` ou no codigo — a tabela de rastreamento (uma linha por afirmacao, com a origem) esta em `specs/70-sobre-central-documentacao/implementation-notes.md` e e o ponto de partida para revisar o conteudo depois. Afirmacao absoluta ("todo X tem Y", "nao existe X sem Y") se confere tambem no banco, nao so na validacao do DTO: a API recusar nao impede dado anterior a migration ou coluna anulavel (issue #92).
- **Nada de funcionalidade inexistente**: Contas, Cartoes, Relatorios, importacao de Excel, recorrencia e subcategorias ficam de fora (removidas ou nao implementadas).
- **Linguagem de usuario**: os nomes sao os rotulos em portugues da UI ("Resumo", "Lançamentos", "Pendentes", "Situação") — nenhum valor de enum, nome de classe ou termo de implementacao aparece no texto. Quando o rotulo da tela divergir do que a spec/`knowledge` escreve, vale o **rotulo da tela**.
- Paragrafo curto (limite de 600 caracteres, coberto por teste), conteudo em blocos estruturados e toda `<td>` de tabela com `data-label` — e o que faz a tabela virar cartao pela regra global de 680px.
- **Mudanca visivel ao usuario tem dois consumidores escritos a mao que nenhum mecanismo automatico acusa quando envelhecem**: a area correspondente da Central (o que o sistema faz *hoje*) e, desde a issue #71, o bloco da versao corrente em "Novidades por versao" (o que *mudou* nesta versao — ver secao abaixo). Mudar regra de tela documentada obriga revisar os dois; so um humano (ou esta base de conhecimento) percebe a divergencia.

## Novidades por versao (issue #71)

Submenu irmao dentro de "Sobre", ao lado de "Documentação" — mas e outro conteudo, outro `Screen` (`RELEASE_NOTES`, mesmo padrao view-only, migration `V14`, `VIEW_ONLY_SCREENS` em `ProfileResource` — ver [auth-and-permissions.md](auth-and-permissions.md)) e outro pacote (`backend/.../releasenotes/`, endpoint `GET /release-notes`). Enquanto a Central explica o sistema como ele e hoje, esta tela conta **o que mudou entre versoes**, tambem como dado tipado escrito a mao (`releasenotes/content/ReleaseNotesContent.java`), nunca Markdown.

- Contrato: `ReleaseNotesResponse(currentVersion, versions[])`; `ReleaseNoteVersion(version, categories[])`; `ReleaseNoteCategory(kind, items[])` com `kind` em `NEW | IMPROVEMENT | FIX` (rotulos "Novidades"/"Melhorias"/"Correções"). Categoria sem item **nao entra** na lista (nunca renderizada vazia). `currentVersion` vem do mesmo `quarkus.application.version` do `GET /api/health` (sem sufixo de build/`-dev`) — o frontend so compara por igualdade de string com o `version` de cada bloco para exibir o rotulo "atual", sem fallback.
- **Um bloco por `X.Y.Z`, nunca por build**: uma correcao publicada como build novo da mesma versao (`X.Y.Z-NN -> X.Y.Z-NN+1`) entra na categoria `FIX` do bloco **ja existente** dessa versao — o modelo nao tem campo de build, entao criar bloco novo por build e impossivel por construcao, nao por disciplina de quem escreve.
- **Nenhum item se repete entre blocos**: uma mudanca aparece so no bloco da versao em que foi introduzida; retrabalho numa versao seguinte entra so como a descricao do retrabalho, no bloco novo. Corrigir algo que estreou na versao corrente (ainda nao cortada) nao gera item (issue #92).
- Versoes ja cortadas mas nunca destacadas na tela (ex.: `1.0.1`, decisao explicita da issue #71) simplesmente nao tem `versao_X_Y_Z()` nenhuma — omissao por ausencia de bloco, nao por filtro em runtime.
- Mesma regra de redacao da Central (linguagem de usuario, sem identificador tecnico) e mesma exigencia de rastreabilidade (tabela afirmacao -> origem em `implementation-notes.md` da issue que curou o bloco).
- **Toda feature que muda algo visivel ao usuario e candidata a um item novo no bloco da versao corrente** — e a razao de existir da tela. Sem mecanismo que force isso: quem decide se a mudanca merece linha e quem planeja a issue seguinte.

## Acrescentar uma area

Muda **so** a fonte de conteudo: um arquivo novo `documentation/content/<NovaArea>Content.java` e **uma linha** no `List.of(...)` de `DocumentationContent.build()`. Nao muda componente, template, `.scss`, rota, guard, enum nem migration. O unico teste que acompanha e `DocumentationContentTest`, que fixa a quantidade e os titulos das areas de proposito.
