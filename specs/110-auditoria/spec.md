---
issue: 110
url: https://github.com/thiagodjlz/financeos/issues/110
title: "Inclusão de auditoria"
domains: [auth, users, categories, transactions, documentation]
target: main
stage: pr-open
branch: feature/issue-110-auditoria
created: 2026-10-06
---

# Inclusão de auditoria

## Historia

Como responsável pelo FinanceOS, quero consultar quem incluiu, alterou ou excluiu cada registro e os eventos de uso (login, logout, acesso a telas), para ter histórico confiável das operações.

## Contexto

A issue pede: auditoria de alterações (quem, quando, funcionalidade, registro); auditoria de eventos (login, logout, acesso a telas, impressão, extensível); tela de consulta com filtros, responsiva; mecanismo transversal; registros imutáveis.

Hoje: 12 endpoints de escrita (`POST`/`PUT`/`DELETE` de `/categories`, `/transactions`, `/users`, `/profiles`); hard delete em categorias, lançamentos e perfis; usuário só é desativado. Logout é só do front (401 força logout). Não há impressão. Tela nova exige valor em `Screen`, migration recriando `profile_permissions_screen_check` (modelo `V13`), linha em `entry-route.ts` e no menu/painel "Mais". O `super_admin` é oculto e ignora perfis; `purgeSeededAccounts` apaga contas semeadas (FKs para `app_users` com `on delete cascade`).

## Criterios de aceite

**Alterações**
- [x] Cada endpoint de escrita, ao responder 2xx, grava registro Alteração com usuário (id, nome e e-mail do momento), data/hora com fuso, ação (Inclusão/Alteração/Exclusão), funcionalidade (`Screen`) e registro (id + rótulo do momento) — teste por endpoint.
- [x] Detalhe por campo (rótulo + valor como texto legível do momento; referência a outro cadastro grava o nome): Inclusão = valores criados; Alteração = só campos alterados, com anterior e novo; Exclusão = valores existentes. Perfis: só as permissões que mudaram. `DELETE /users/{id}` = Alteração com "Ativo" de "Sim" para "Não" — teste.
- [x] Nenhum registro contém senha nem hash (teste com `POST`/`PUT /users` enviando senha).
- [x] Recusa 400/404/409 não grava nada; a operação e o registro ficam na mesma transação (falha na auditoria desfaz a operação) — teste.
- [x] Mecanismo único; um teste percorre os `@POST`/`@PUT`/`@DELETE`/`@PATCH` dos `*Resource` e falha se algum não for auditado, salvo lista explícita dos endpoints que geram evento (login, logout, acesso a tela).

**Eventos**
- [x] Login com sucesso grava Login. Login com falha grava "Login com falha" com o e-mail digitado (sem senha), vinculado ao usuário se o e-mail existir e sem usuário se não existir; persiste apesar do 401 — teste.
- [x] "Sair" (menu e painel "Mais") chama endpoint autenticado que grava Logout antes de o front descartar o token. O logout forçado por 401 não chama o endpoint.
- [x] Requisição com token de assinatura válida e vencido → 401 e evento "Sessão expirada" do usuário do token; 403 de `accessControl.require` → evento "Acesso negado" (funcionalidade e ação pedidas), persistido apesar do erro — teste.
- [x] Ao entrar numa tela do menu (mudança de primeiro segmento da rota, ou carga inicial), o front chama endpoint novo que grava "Acesso à tela"; lista ↔ detalhe da mesma tela, troca de aba e paginação não geram evento — teste de front com as quatro situações. O endpoint começa com `require(<tela informada>, VIEW)` (403 sem o privilégio); tela inválida → 400 em português.
- [x] Tipo de evento novo entra sem migration (nenhum check lista tipos/ações) e sem mudar a tela: a resposta traz os rótulos em português de tipo, ação e funcionalidade, exibidos sem mapa no front. "Impressão" existe como tipo, sem emissor.

**Imutabilidade**
- [x] Nenhum endpoint de manutenção; `PUT`/`DELETE` em `/api/audit` → 404/405 sem alterar nada.
- [x] Exclusões, desativação e `purgeSeededAccounts` não removem nem alteram registros (sem FK `on delete cascade` na tabela); não há expurgo nem job de retenção — teste.
- [x] Registro de algo excluído mantém o rótulo gravado; renomear usuário não muda registros antigos.

**Permissão**
- [x] `Screen` `AUDIT` ("Auditoria") em `VIEW_ONLY_SCREENS`; migration recria o check (nome conferido em `pg_constraint`) e semeia `can_view=true` só no perfil "Administrador" (demais sem acesso); `POST`/`PUT /profiles` com `canCreate/canEdit/canDelete=true` em `AUDIT` grava `false`; Perfis mostra só "Ver"; `/auth/me` devolve 8 telas.
- [x] `GET /api/audit` começa com `require(Screen.AUDIT, Action.VIEW)`: 200 com, 403 sem (inclusive sem linha), 401 sem token.

**Consulta**
- [x] `GET /api/audit` paginado (padrão de `backend-patterns.md`), mais recente primeiro; filtros período, usuário (contém, sem caixa/acento, independe de `USERS/VIEW`), tipo, ação, funcionalidade; data inicial após a final → 400 em português; sem período devolve tudo.
- [x] Registros do `super_admin` são gravados, mas `GET /api/audit` nunca os devolve (nem no `totalItems`, nem pelo filtro de usuário, nem para o próprio `super_admin`), inclusive depois que a conta deixa de existir — teste de back-end.
- [x] Rota `/audit` com `permissionGuard('AUDIT','VIEW')`; item "Auditoria" em "Configurações", logo após Perfis, no menu e no painel "Mais" com o mesmo gate; `entry-route.ts` na ordem do menu.
- [x] A tela abre filtrada de hoje − 30 dias até hoje. Colunas Data e hora (`dd/mm/aaaa hh:mm:ss`, fuso do navegador), Usuário, Tipo, Ação, Funcionalidade, Registro; sem incluir/editar/excluir; a linha abre o Detalhe (`core/record-detail`) com todos os campos e a lista campo/anterior/novo.
- [x] Em 390 px a lista vira cartões sem rolagem horizontal da página; filtros no painel do padrão de listagem.
- [x] Textos em português acentuado; as duas varreduras de `architecture.md` continuam vazias.

**Documentação e suíte**
- [x] A Central ganha a área "Auditoria" (6 áreas; `DocumentationContentTest` ajustado) e o bloco 1.0.3 de Novidades ganha item; textos revisados por `revisar-textos`, só com regras conferidas no código entregue.
- [x] `knowledge/` registra o padrão transversal (endpoint de escrita novo audita; como acrescentar tipo de evento).
- [x] Suítes completas de backend e frontend passam.

## Fora de escopo

- Alterações fora da API (psql, migrations, `ProductionBootstrap`); auditoria retroativa.
- Fechar o navegador sem "Sair" (não detectável); token malformado ou de assinatura inválida.
- Exportação/impressão da tela de Auditoria; emissor de evento Impressão; expurgo.
- Auditar leituras além do acesso a tela.

## Decisoes

- 2026-10-06 — PA-1 Quem vê? Só "Administrador" recebe `AUDIT` (somente ver); demais via Perfis. Menu: "Configurações", após Perfis.
- 2026-10-06 — PA-2 `super_admin` é auditado? Sim, mas a consulta nunca exibe nem encontra os registros dele, para ninguém; ocultação imposta no back-end.
- 2026-10-06 — PA-3 Detalhe? Antes/depois por campo, sem senha/hash; inclusão = criados, exclusão = existentes; Perfis só permissões alteradas; visível no Detalhe.
- 2026-10-06 — PA-4 Acesso a tela? Um evento por entrada em tela do menu; abrir registro, trocar aba ou paginar não geram. Endpoint novo chamado pelo front.
- 2026-10-06 — PA-5 Impressão? Não existe; tipo aceito, sem emissor.
- 2026-10-06 — PA-6/PA-7 Sessão e falhas? Auditar login com falha (com e-mail digitado, inclusive inexistente), 403 e sessão expirada (token vencido recusado). Fechar o navegador fica fora.
- 2026-10-06 — PA-8 Retenção? Para sempre; sem expurgo.
- 2026-10-06 — PA-9 Desativar usuário? Alteração do campo "Ativo" (Sim → Não); ações seguem Inclusão/Alteração/Exclusão.
- 2026-10-06 — PA-10 Período padrão? Últimos 30 dias, mais recente primeiro.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/110
- Conhecimento consultado: `knowledge/README.md`, `architecture.md`, `auth-and-permissions.md`, `users.md`, `documentation.md` (áreas/Novidades), `backend-patterns.md` (listagem paginada)
