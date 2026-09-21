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

- **Nada de regra inventada.** Toda afirmacao publicada tem origem num `knowledge/*.md` ou no codigo — a tabela de rastreamento (uma linha por afirmacao, com a origem) esta em `specs/70-sobre-central-documentacao/implementation-notes.md` e e o ponto de partida para revisar o conteudo depois.
- **Nada de funcionalidade inexistente**: Contas, Cartoes, Relatorios, importacao de Excel, recorrencia e subcategorias ficam de fora (removidas ou nao implementadas).
- **Linguagem de usuario**: os nomes sao os rotulos em portugues da UI ("Resumo", "Lançamentos", "Pendentes", "Situação") — nenhum valor de enum, nome de classe ou termo de implementacao aparece no texto. Quando o rotulo da tela divergir do que a spec/`knowledge` escreve, vale o **rotulo da tela**.
- Paragrafo curto (limite de 600 caracteres, coberto por teste), conteudo em blocos estruturados e toda `<td>` de tabela com `data-label` — e o que faz a tabela virar cartao pela regra global de 680px.
- **Mudanca de regra de negocio em qualquer tela obriga a revisar a area correspondente da Central**: hoje nao ha nenhum mecanismo que detecte a divergencia — o conteudo e texto escrito a mao no backend, e so um humano (ou esta base de conhecimento) percebe que envelheceu.

## Acrescentar uma area

Muda **so** a fonte de conteudo: um arquivo novo `documentation/content/<NovaArea>Content.java` e **uma linha** no `List.of(...)` de `DocumentationContent.build()`. Nao muda componente, template, `.scss`, rota, guard, enum nem migration. O unico teste que acompanha e `DocumentationContentTest`, que fixa a quantidade e os titulos das areas de proposito.
