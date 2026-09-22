# Briefing — issue 71

## Regras que restringem esta mudanca

- Tela nova segue o padrao de `DOCUMENTATION`: `Screen` propria, privilegio **so de visualizacao** — matriz de Perfis oferece so "Ver", backend forca `canCreate/canEdit/canDelete=false` ao persistir (`knowledge/auth-and-permissions.md`).
- Endpoint comeca por `accessControl.require(Screen.X, Action.VIEW)`; sem linha de permissao = nega; 403 generico em portugues, 401 sem corpo (`knowledge/auth-and-permissions.md`).
- `profile_permissions.screen` tem `check` constraint (V5, recriado na V9/V13): `Screen` novo exige migration que recria o check com a lista completa **e** semeia `can_view=true` para os perfis existentes (`on conflict on constraint profile_permissions_profile_screen_uk do nothing`), no molde da `V13__add_documentation_screen.sql`.
- `effectivePermissions()`/`resolvePermissions()` iteram `Screen.values()` dinamicamente — so acrescentar o enum, sem tocar em `AuthResource`/`AccessControl`.
- Fonte unica da versao corrente: `VERSION`, espelhado no `pom.xml`, lido em runtime por `quarkus.application.version` (mesmo `@ConfigProperty` do `HealthResource`) — `X.Y.Z-dev` na `main`. `vX.Y.Z` exige remover o sufixo, nunca criar constante paralela (`knowledge/architecture.md`).
- "Sobre" e agrupador visual sem `Screen` propria: cada subitem tem seu `*ngIf` de permissao, grupo so aparece se algum filho for visivel; rotas seguem protegidas por `permissionGuard` (`knowledge/auth-and-permissions.md`).
- Texto exibido e sempre portugues acentuado, sem nome de classe/endpoint/tabela — regra da Central de Documentacao (`knowledge/documentation.md`).
- `styles.scss` e o unico arquivo com cor literal; reusar `.panel`/`.page-title` e os breakpoints globais 1080/680/480px (`knowledge/frontend-ui.md`).
- Mudar uma tela documentada obriga revisar a area correspondente da Central (`knowledge/documentation.md`): a nova linha na matriz de Perfis torna `ProfilesAreaContent.java` e o bullet "Sobre" de `OverviewContent.java` desatualizados se nao forem ajustados.

## Conteudo curado (bloco unico, versao 1.0.2)

So existe `v1.0.1` ja cortada, nada foi cortado depois — todas as mudancas reais desde entao caem no **unico** bloco `1.0.2` (mais recente e tambem mais antigo exibido). Tabela afirmacao->origem vai para `specs/71-novidades-por-versao/implementation-notes.md` na implementacao (padrao #70).

**Novidades**
1. Nova area "Novidades por versao", no menu Sobre, reunindo o que muda em cada versao. — issue #71
2. Central de Documentacao: manual do sistema dentro do proprio FinanceOS, no menu Sobre. — issue #70
3. Uso completo pelo celular: menu em gaveta, tabelas em cartao, campos maiores para toque. — issue #54
4. Publicar o FinanceOS na internet com endereco proprio (HTTPS automatico) ou pela rede privada do Tailscale, sem custo de hospedagem. — `knowledge/deployment.md`

**Melhorias**
5. Painel Resumo: saudacao personalizada com o seu nome, conforme o horario do dia. — issue #65
6. Periodo do Resumo: mes por extenso; ano e mes so listam datas com lancamentos existentes. — issue #69
7. Mais seguranca nas contas ao publicar na internet: administrador com nome fixo, contas de teste removidas do ambiente publicado. — `knowledge/auth-and-permissions.md` (ProductionBootstrap; issues #64/#66 citadas no contexto da spec)

**Correcoes**
8. Contraste da borda dos campos de formulario corrigido, visivel sob luz forte ou baixa visao. — issue #58

Regra a preservar (criterio 13): build novo da mesma versao (`X.Y.Z-NN`->`X.Y.Z-NN+1`) entra em Correcoes do bloco **ja existente** — nunca cria bloco novo. So testavel por construcao hoje (nenhuma versao com dois builds documentados ainda); registrar como comentario no conteudo.

## Arquivos em jogo

| Arquivo | O que muda |
|---|---|
| `backend/.../profiles/Screen.java` | Acrescenta `RELEASE_NOTES` |
| `backend/.../profiles/ProfileResource.java` | `savePermissions` passa a forcar `RELEASE_NOTES` view-only tambem |
| `backend/.../db/migration/V14__add_release_notes_screen.sql` | Novo — recria check + semeia `can_view=true` (molde: V13) |
| `backend/.../releasenotes/*` (pacote novo) | `Resource`, `Response`, `Version`, `Category` — endpoint `GET /release-notes` |
| `backend/.../releasenotes/content/ReleaseNotesContent.java` | Conteudo curado acima, so leitura |
| `backend/.../documentation/content/ProfilesAreaContent.java` | Passa a citar a 7a linha da matriz (Novidades por versao) |
| `backend/.../documentation/content/OverviewContent.java` | Bullet "Sobre" passa a citar as duas telas |
| `backend/.../auth/AuthResourceTest.java` | `hasSize(6)` -> `hasSize(7)` (consumidor do enum maior) |
| `frontend/.../core/models.ts` | `Screen` +`'RELEASE_NOTES'`; interfaces de release notes |
| `frontend/.../core/entry-route.ts` | `ENTRY_ROUTES` +`RELEASE_NOTES -> /release-notes` |
| `frontend/.../app.routes.ts` | Rota `release-notes` com `permissionGuard` |
| `frontend/.../layout/main-layout/{html,ts}` | Novo subitem; `canSeeAbout()`/`isAboutActive()` passam a considerar as duas telas |
| `frontend/.../features/release-notes/*` (novo) | Componente da tela, padrao de `features/documentation/` |
| `frontend/.../features/profiles/profiles.ts` | `SCREENS` +`RELEASE_NOTES` com `viewOnly: true` |
| `frontend/.../features/profiles/profiles.spec.ts` | `SCREEN_ROWS`/`toHaveLength(6)` -> 7 |

## Convencoes aplicaveis

- Controle de formulario estilizado nunca substituido: switches da matriz continuam `<input type="checkbox">` real.
- Celula sem acao na matriz nao leva `data-label` (senao o modo cartao de 680px anuncia acao inexistente).
- Uma unica `GET` por vida do componente (sem requisicao extra no `ngOnInit`), como `documentation.service.ts`.
- `rg` de acentuacao (`knowledge/architecture.md`, Idioma) so pode manter a divida ja catalogada — zero ocorrencia nova.

## Consultas fora do briefing

Nenhuma ate agora.
