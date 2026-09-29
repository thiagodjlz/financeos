# Briefing — issue 99

## Regras que restringem esta mudanca

- Conteudo e dado tipado escrito a mao; nada de componente, template, `.scss`, rota, enum ou migration. A introducao "Como utilizar o sistema" e campo proprio; as 5 areas ficam como estao (fixadas em `DocumentationContentTest`/`DocumentationResourceTest`) (`knowledge/documentation.md`).
- Nada de regra inventada: toda afirmacao nova tem origem num `knowledge/*.md` ou no codigo, registrada na tabela afirmacao -> origem do `implementation-notes.md`. Nada de Contas, Cartoes, Relatorios, importacao, recorrencia, subcategorias (`knowledge/documentation.md`).
- Linguagem de usuario com os rotulos da tela (vale o rotulo da tela quando divergir do knowledge); nenhum enum, classe ou termo tecnico. Paragrafo (`PARAGRAPH`/`HIGHLIGHT`) ate 600 caracteres; secao sem conteudo e omitida (`knowledge/documentation.md`).
- Todo texto novo passa pela skill `pipeline:revisar-textos` antes de gravar; o hook `.githooks/check-texts.sh` recusa commit sem `FINANCEOS_TEXTOS_REVISADOS=1` (`knowledge/documentation.md`).
- Novidades: um bloco por `X.Y.Z`; nenhum item repetido entre blocos; categoria sem item nao entra; `1.0.1` nao tem bloco por decisao (#71), `1.0.2` segue bloco unico (spec P1; `knowledge/documentation.md`).
- Fatos das telas novas na Central (origem entre parenteses):
  - Login: campos E-mail e Senha, botao Mostrar senha/Ocultar senha, Entrar; credencial errada **ou usuario inativo** -> Alerta "Credenciais inválidas. Tente novamente."; outro erro -> "Não foi possível entrar. Tente novamente." (`login.html`, `login.ts`, `AuthResource.java` filtra `active`).
  - Apos entrar abre a primeira tela permitida na ordem do menu (Resumo, Lançamentos, Categorias, Usuários, Perfis, Documentação, Novidades por versão); sem nenhuma, tela **Sem acesso** com "Seu perfil não tem acesso a nenhuma tela. Fale com o administrador." (`knowledge/auth-and-permissions.md`, `entry-route.ts`, `no-access.html`).
  - Abrir tela sem permissao: Alerta "Você não tem permissão para acessar esta tela." e volta para a primeira tela permitida; acao recusada: "Você não tem permissão para realizar esta ação."; sessao (12 h) vencida: Alerta "Sua sessão expirou. Entre novamente." (`knowledge/auth-and-permissions.md`).
  - Avisos: Sucesso (fecha sozinho), Alerta (recusa que a pessoa corrige; fecha sozinho, fica mais tempo), Falha (erro inesperado; nao fecha sozinho, ex.: "Erro inesperado do sistema. Tente novamente em instantes."); botao Fechar aviso; no maximo 3 avisos ao mesmo tempo (`knowledge/frontend-ui.md` "Feedback ao usuario", `toast.service.ts`, `toast-host.html`, `http-error.ts`).
  - Listas: falha de carga mostra o aviso no lugar do conteudo; filtro sem resultado mostra "Nenhum registro encontrado." com Limpar filtros (`list-feedback.html`, `knowledge/frontend-ui.md` "Estados de carga").
  - Cancelar lançamento, Desativar usuário e Excluir perfil agem na hora, sem confirmação, e avisam "Lançamento cancelado com sucesso." / "Usuário desativado com sucesso." / "Perfil excluído com sucesso."; so Excluir categoria pede confirmação (`transactions.ts`, `users.ts`, `profiles.ts`, `categories.ts`).
  - Central: campo "Buscar na documentação" ("Procure por uma tela, campo ou regra"), filtra areas e secoes; mensagens "Nenhuma área corresponde à busca." e "Nenhum conteúdo encontrado para a sua busca.". A busca da Central **ignora maiusculas mas NAO ignora acentos** (`documentation.ts`, `toLowerCase().includes`) — nao afirmar o contrario.
  - Novidades: um bloco "Versão vX.Y.Z" por versao, a mais recente primeiro, rotulo "atual", grupos Novidades/Melhorias/Correções, "Nenhuma novidade publicada ainda." (`release-notes.html`, `release-notes.ts`).

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` | introducao com 4 secoes | ganha secoes de G1 a G6 |
| `.../documentation/content/{Transactions,Users,Profiles}AreaContent.java` | linha de Acoes de Cancelar/Desativar/Excluir | acrescenta "sem confirmação" + aviso de sucesso (G7) |
| `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` | bloco 1.0.2 (4 NEW, 7 IMPROVEMENT, 2 FIX) | itens R1-R6 em Melhorias, R7 em Correções |
| `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` | fixa areas, secoes, termos barrados | teste novo de cobertura G1-G7 |
| `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` | fixa 2 Correções | passa a 3 + teste de R1-R7 |
| `specs/99-*/implementation-notes.md` | nao existe | inventario de PRs e rotas, rastreamento, registro da skill |

## Convencoes aplicaveis

- Testes de conteudo barram (Central e Novidades): `Tailscale|HTTPS|Docker|deploy|hospedagem|Flyway|migration|endpoint|\bAPI\b|banco de dados|\btoken\b|Caddy|Swagger|framework|JWT` e `INCOME|EXPENSE|PENDING|PAID|CANCELED|...` (nas Novidades, sem diferenciar maiusculas). Interface antiga barrada na Central: `botão Incluir`, `Filtros (1)`, `Últimos lançamentos`, `Detalhamento`, `gaveta`, `botão Menu`; nas Novidades: `gaveta`, `botão Filtros`, `Incluir e Editar`.
- Testes das Novidades que limitam a redacao dos itens novos: so **um** item de Melhorias pode conter "Categorias" e "Excluir" juntos, e so **um** pode conter "tela própria" + "Filtros" + "por página" juntos; nenhum item pode citar "Voltar ao topo".
- Texto acentuado; as duas varreduras de `knowledge/architecture.md` devem seguir vazias (baseline 0/0):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
- Nao acentuar comentarios de carona (`ReleaseNotesContent.java` tem comentario sem acento fora do escopo); sem comentario novo.

## Consultas fora do briefing

- implement: nenhuma regra faltou. Correcao do briefing, conferida no codigo: "Não foi possível entrar. Tente novamente." nao vale para qualquer outro erro do login — so para recusa corrigivel sem mensagem (`http-error.ts`); erro inesperado ou sem conexao mostra a Falha generica. O texto nao cita essa mensagem.
