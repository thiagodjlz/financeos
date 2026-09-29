# Notas de implementacao

Branch: `feature/issue-99-validacao-documentacao-notas-versao` (base: `main` 55957fd; mudancas nao commitadas — commit na etapa `/pipeline:open-pr`)

Tarefas: 8 de 9 concluidas (ver `plan.md`; T9 parcial, ver Desvios)

## Arquivos alterados

- `backend/src/main/java/br/com/financeos/documentation/content/OverviewContent.java` — 6 secoes novas (G1-G6, resumo de G7)
- `backend/src/main/java/br/com/financeos/documentation/content/TransactionsAreaContent.java` — G7 em Cancelar lançamento
- `backend/src/main/java/br/com/financeos/documentation/content/UsersAreaContent.java` — G7 em Desativar usuário
- `backend/src/main/java/br/com/financeos/documentation/content/ProfilesAreaContent.java` — G7 em Excluir perfil
- `backend/src/main/java/br/com/financeos/releasenotes/content/ReleaseNotesContent.java` — R1-R6 Melhorias, R7 Correções
- `backend/src/test/java/br/com/financeos/documentation/DocumentationContentTest.java` — teste G1-G7
- `backend/src/test/java/br/com/financeos/releasenotes/ReleaseNotesContentTest.java` — Correções 2->3, teste R1-R7
- `specs/99-validacao-documentacao-notas-versao/` — `spec.md`, `context.md`, `plan.md`, este arquivo

## Inventario de PRs na `main` (#51-#100)

- Item novo: #74 (i70) -> R7; #88 (i87) -> R1, R2, R3; #95 (i93) -> R2 (rótulos), R4, R5, R6.
- Ja coberto: #55 (Uso completo pelo celular); #63 (Campos de formulário); #67 (Saudação no Resumo); #72 (Período do Resumo); #74 (Central de Documentação); #81 (Novidades por versão); #84 (Usuários: própria conta); #85 (Excluir categoria); #88 (Cadastros e listas, Avisos de erro); #95 (Visual novo, Tabela de Lançamentos, Painel Por categoria).
- Sem item: #51, #64, #66 (publicação/admin, #97); #57, #60, #68, #73, #79, #83, #90 (sync-knowledge); #80, #86 (internos); #82, #98 (Voltar ao topo estreou e saiu na 1.0.2); #91, #94 (corrigem algo que estreou na 1.0.2); #100 (reescrita de texto).
- Nenhuma lacuna fora de G1-G7/R1-R7.

## Rotas -> Central

`login` -> Entrar no sistema; `''`, `**` -> Entrar no sistema + Avisos do sistema; `dashboard` -> Resumo; `transactions` (+`new`, `:id/edit`) -> Lançamentos; `categories` (idem) -> Categorias; `users` (idem) -> Usuários; `profiles` (idem) -> Perfis; `documentation` -> Como usar esta Central; `release-notes` -> Novidades por versão; `no-access` -> Tela Sem acesso.

## Afirmacao -> origem (texto novo)

| Afirmacao | Origem |
|---|---|
| E-mail, Senha, Entrar, Mostrar/Ocultar senha | `login.html` |
| Credenciais inválidas (Alerta), também p/ inativo | `login.ts`, `AuthResource.java` |
| Primeira tela permitida na ordem do menu, senão Sem acesso | `entry-route.ts`, `knowledge/auth-and-permissions.md` |
| Mensagem Sem acesso; Sair no menu/painel Mais | `no-access.html`, `main-layout.html` |
| Sucesso/Alerta/Falha, fecha sozinho ou não, máx. 3, Fechar aviso | `toast.service.ts`, `toast-host.html` |
| Tipo do aviso por situação | `http-error.ts` |
| Sessão de 12 h -> Sua sessão expirou | `auth.interceptor.ts`, `knowledge/auth-and-permissions.md` |
| Sem permissão para acessar esta tela + primeira permitida | `permission.guard.ts` |
| Sem permissão para realizar esta ação | `AccessControl.java` |
| Cancelar/Desativar/Excluir perfil sem confirmação + aviso | `transactions.ts`, `users.ts`, `profiles.ts` |
| Só Excluir categoria confirma | `categories.html` |
| Falha de carga no lugar da lista; Nenhum registro; Limpar filtros se difere do inicial | `list-feedback.html`, `paged-list.ts` |
| Índice; busca por área/seção; maiúsculas sim, acentos não; 2 vazios | `documentation.html`, `documentation.ts` |
| Bloco Versão, mais recente primeiro, atual, 3 grupos, vazio | `release-notes.html`, `release-notes.ts`, `ReleaseNotesContent.java` |
| R1 busca (inexistente na v1.0.1) sem maiúsculas/acentos | `TextSearch.java` |
| R2 / R3 | `list-feedback.html` / `list-state.service.ts` |
| R4 / R5 / R6 | `login.html` / `transaction-form.html` / `formatters.ts` |
| R7 v1.0.1 voltava fixo ao Resumo | `permission.guard.ts` em `origin/v1.0.1` x `main` |

Nenhum texto novo cita Contas, Cartões, Relatórios, importação, recorrência ou subcategorias.

## Revisao de textos (`pipeline:revisar-textos`)

Aplicada a todo texto novo das duas telas antes de gravar:
- "toast" -> "aviso"; duração em ms -> "fecha sozinho depois de alguns segundos" / "fica mais tempo".
- Mensagem de rede ("servidor") -> "perda de conexão".
- R7 "redirecionamento" -> "ficar preso sem conseguir abrir nenhuma tela".
- R1 "busca sem diferenciar..." -> "ganharam busca por texto" (a v1.0.1 não tinha busca).
- Cortado: "outro erro -> Não foi possível entrar" (só em recusa sem mensagem; inexato) e posição do aviso (não verificada).
- "conta o que mudou" -> "reúne o que mudou" (não confundir com Contas).
- G4 diz que a busca da Central diferencia acentos; teste barra o contrário.

## Decisoes

- G5 e o resumo de G7 em "Avisos do sistema"; G6 em "Listas sem resultado ou com falha" (titulo diferente do sugerido no plano).
- CA6: diff so acrescenta; as 3 linhas de Ações mantem a frase original e ganham uma segunda.

## Desvios em relacao ao plano

- T9 desmarcada: feitos `npm test` (408/408), varreduras de idioma (0/0), escopo do diff e testes escopados (`DocumentationContentTest`, `ReleaseNotesContentTest`, `DocumentationResourceTest`, `ReleaseNotesResourceTest` verdes); `./mvnw test` inteiro fica para `/pipeline:quality-check`, portao da suite completa.
