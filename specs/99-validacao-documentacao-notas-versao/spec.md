---
issue: 99
url: https://github.com/thiagodjlz/financeos/issues/99
title: "Validação de documentação e notas de versão"
domains: [documentation, auth]
target: main
stage: pr-open
branch: feature/issue-99-validacao-documentacao-notas-versao
created: 2026-09-28
---

# Validação de documentação e notas de versão

## Historia

Como usuario do FinanceOS, quero que a Central de Documentação e as Novidades por versão cubram tudo o que o sistema faz hoje, para encontrar ali cada funcionalidade e cada mudança.

## Contexto

A issue pede conferir se a Central (`documentation/content/`) e as Novidades (`releasenotes/content/ReleaseNotesContent.java`) estao completas e acrescentar o que faltar. Inventario feito na `main` 55957fd: rotas (`app.routes.ts`), telas (`features/*`, `layout/main-layout`), recursos do backend e PRs mergeados #1-#100. Unica branch de versao: `origin/v1.0.1` (cortada apos #49/#50, hoje em `1.0.1-07`); o bloco `1.0.2` cobre o que entrou na `main` depois (#51-#100).

A Central tem a introducao e 5 areas (Resumo, Lançamentos, Categorias, Usuários, Perfis), bem cobertas. Faltam telas e comportamentos transversais:

| # | Lacuna da Central | Origem |
|---|---|---|
| G1 | Tela de entrada: E-mail, Senha, botão Mostrar senha/Ocultar senha, Entrar; aviso "Credenciais inválidas. Tente novamente." (também para usuário inativo); após entrar abre a primeira tela permitida, na ordem do menu | `login.html`, `login.ts`, `entry-route.ts`, `AuthResource` |
| G2 | Tela Sem acesso: "Seu perfil não tem acesso a nenhuma tela. Fale com o administrador." | `no-access.html`, `entry-route.ts` |
| G3 | Tela Novidades por versão: um bloco por versão, a mais recente primeiro, rótulo "atual", grupos Novidades/Melhorias/Correções, "Nenhuma novidade publicada ainda." | `release-notes.html`, `release-notes.ts` |
| G4 | Uso da própria Central: busca ("Procure por uma tela, campo ou regra"), "Nenhuma área corresponde à busca." e "Nenhum conteúdo encontrado para a sua busca." (hoje só uma frase na introdução) | `documentation.html` |
| G5 | Avisos do sistema: mensagens de Sucesso, Alerta e Falha; "Sua sessão expirou. Entre novamente."; "Você não tem permissão para acessar esta tela." | `toast.service.ts`, `auth.interceptor.ts`, `permission.guard.ts` |
| G6 | Estados das listas: falha de carga mostrada no lugar do conteúdo; filtro sem resultado mostra "Nenhum registro encontrado." com Limpar filtros | `list-feedback.html` |
| G7 | Cancelar lançamento, Desativar usuário e Excluir perfil agem na hora, sem confirmação, com aviso "... com sucesso."; só Excluir categoria pede confirmação | `transactions.ts`, `users.ts`, `profiles.ts`, `categories.html` |

Mudanças visíveis posteriores ao corte da `v1.0.1` sem item no bloco `1.0.2` (conferidas com `git grep` em `origin/v1.0.1` x `main`):

| # | Lacuna das Novidades | Origem | Categoria |
|---|---|---|---|
| R1 | Busca das listas sem diferenciar maiúsculas nem acentos | #87 | Melhorias |
| R2 | Filtros aplicados viram rótulos removíveis em Filtros ativos; filtro sem resultado mostra "Nenhum registro encontrado." | #87 | Melhorias |
| R3 | Voltar do cadastro reabre a lista com os mesmos filtros e página | #87 | Melhorias |
| R4 | Botão Mostrar senha na tela de entrada | #93 | Melhorias |
| R5 | Contador de caracteres na Descrição do lançamento | #93 | Melhorias |
| R6 | No celular, lançamentos agrupados por dia (Hoje, Ontem, data) | #93 | Melhorias |
| R7 | Perfil sem acesso ao Resumo entra na primeira tela permitida (antes ficava preso num redirecionamento); sem nenhuma tela, vê Sem acesso | #70 | Correções |

Sem item por regra vigente (`knowledge/documentation.md`, #97): #51/#53/#64/#66 (publicação/infra), #75/#96 (botão que estreou e saiu na mesma versão), #89/#92 (correção de algo que estreou na versão corrente), #78/#80/#86/#97 (internos). "Deseja sair sem salvar?", cor da categoria e informativo do gráfico pelo teclado já existiam na `v1.0.1`.

Regras que se aplicam: linguagem de usuário com os rótulos da tela, nada de regra inventada (afirmação -> origem), parágrafo até 600 caracteres, nenhum item repetido entre blocos, um bloco por `X.Y.Z`, termos técnicos barrados pelos testes de conteúdo, skill `pipeline:revisar-textos` antes de gravar.

## Criterios de aceite

- [x] CA1: o conteúdo servido por `GET /api/documentation` cobre G1 a G7, com G1 a G4 como seções novas da introdução "Como utilizar o sistema" (as 5 áreas seguem as fixadas no `DocumentationContentTest`); teste em `DocumentationContentTest` procura, no texto de todas as seções, ao menos "Mostrar senha", "Credenciais inválidas", "Sem acesso", "Correções", "Nenhum registro encontrado", "Sua sessão expirou" e "sem confirmação" (ou o rótulo equivalente que a redação adotar, registrado no teste).
- [x] CA2: `GET /api/release-notes` segue com `1.0.2` como bloco único (nenhum bloco `1.0.1`; os testes que fixam isso não mudam) e esse bloco tem item para cada R1 a R7 (vários R podem dividir um item), R7 em Correções; `ReleaseNotesContentTest` atualizado (a contagem de Correções hoje fixa 2) e o teste de não repetição passa.
- [x] CA3: `specs/99-*/implementation-notes.md` traz o inventário: cada PR mergeado na `main` de #51 a #100 classificado como "item novo", "já coberto (qual item)" ou "sem item (motivo)", e cada rota de `app.routes.ts` (inclusive `login` e `no-access`) apontada para a seção da Central que a descreve.
- [x] CA4: cada afirmação nova ou alterada tem linha na tabela afirmação -> origem (`knowledge/*.md` ou arquivo de código) no `implementation-notes.md`; nenhuma cita Contas, Cartões, Relatórios, importação, recorrência ou subcategorias.
- [x] CA5: o `implementation-notes.md` registra a passagem da skill `pipeline:revisar-textos` sobre todo texto novo das duas telas.
- [x] CA6: nenhum texto já publicado muda de significado: o diff dos `*Content.java` só acrescenta ou reescreve para incluir as lacunas, sem alterar regra descrita.
- [x] CA7: o diff toca só `documentation/content/`, `releasenotes/content/`, os testes de conteúdo e `specs/99-*/` (nenhum componente, template, `.scss`, rota, enum ou migration).
- [x] CA8: `./mvnw test` passa inteiro (inclui limite de 600 caracteres, seções obrigatórias, termos barrados e os testes de segurança 200/403/401 das duas telas); `npm test` passa.
- [x] CA9: as duas varreduras de idioma de `knowledge/architecture.md` seguem vazias (baseline 0/0 medido na `main` 55957fd).
- [x] CA10: em `http://localhost/documentation`, buscar "Mostrar senha" e "Sem acesso" mostra resultado; em `http://localhost/release-notes` o bloco v1.0.2 exibe os itens de R1 a R7.

## Fora de escopo

- Mudar comportamento, visual ou texto de qualquer tela que não seja o conteúdo das duas telas do menu Sobre.
- Reescrever textos já corretos (a linguagem foi revista na #97).
- Itens de publicação, produção, contas de administrador ou processo (barrados pela #97).
- Atualizar `knowledge/` (fica para o `sync-knowledge`).

## Decisoes

- P1 (2026-09-28): mantida a decisão da #71 — só o bloco `1.0.2` aparece, completado com R1 a R7; nenhum bloco `1.0.1`. `ReleaseNotesContentTest`/`ReleaseNotesResourceTest` continuam fixando `1.0.2` como bloco único.
- P2 (2026-09-28): G1 a G4 entram como seções novas da introdução "Como utilizar o sistema". As 5 áreas do `DocumentationContentTest` e a regra "5 áreas" de `knowledge/documentation.md` não mudam.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/99
- Conhecimento consultado: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/documentation.md`, `knowledge/auth-and-permissions.md` (só login, porta de entrada e avisos)
- Specs anteriores: `specs/71-*/spec.md` (decisão sobre a 1.0.1), `specs/87-*`, `specs/89-*`, `specs/93-*`, `specs/97-*`
