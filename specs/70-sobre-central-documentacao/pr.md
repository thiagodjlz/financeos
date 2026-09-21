# Pull Request

- **URL**: https://github.com/thiagodjlz/financeos/pull/74
- **Commit**: `cb57c834a7043d36710902b5faa234311472752f` ("Adiciona menu Sobre e Central de Documentacao do sistema")
- **Branch**: `feature/issue-70-sobre-central-documentacao` -> `main`
- **Issue**: [#70](https://github.com/thiagodjlz/financeos/issues/70) — Criar menu "Sobre" e Central de Documentação do Sistema

## Resumo

Privilégio novo "Visualizar Documentação" (`Screen.DOCUMENTATION`) pelo padrão de autorização já existente: migration `V13` recriando o check de `profile_permissions.screen` e semeando `can_view = true` / escrita `false` para todos os perfis, de forma idempotente; `GET /api/documentation` com `accessControl.require` na primeira linha; e `ProfileResource.savePermissions` forçando as ações de escrita como `false` para `DOCUMENTATION`. No front, o grupo "Sobre" no menu (agrupador visual, sem `Screen` própria), a Central com busca e índice por área (introdução + Resumo, Lançamentos, Categorias, Usuários e Perfis) e a linha da matriz de Perfis com só o switch "Ver". A porta de entrada passou a levar à primeira rota permitida (`resolveEntryRoute`), com a rota neutra `/no-access`.

Commit com 55 arquivos: 47 de código (29 novos) mais os 8 artefatos da esteira. Sem incremento de build — o alvo é `main`, não uma branch de versão.

## Estado das checagens

- Qualidade: PASSOU (backend 81 testes, frontend 287 testes em 28 arquivos, build sem warning de `anyComponentStyle`, varreduras de acentuação no baseline de 6/2).
- Build: PASSOU (jar Quarkus e bundle do frontend gerados; Flyway aplicou a `V13` sem erro).
- Verificação: 50 de 50 critérios atendidos, nenhum NÃO ATENDIDO; validação manual aprovada pelo usuário em 2026-09-21.

## Ressalvas registradas no PR

- Os caminhos autenticados de 200/403 do endpoint se apoiam nos testes `@QuarkusTest`; por HTTP só foi exercitado o `GET` sem token (401).
- A conferência visual no celular foi feita pelo usuário, não por navegador automatizado.
- 10 inconsistências entre `knowledge/*.md` e o código foram registradas e deliberadamente não resolvidas (critério 37), em `implementation-notes.md` — material para o `sync-knowledge` ou para issues próprias.
