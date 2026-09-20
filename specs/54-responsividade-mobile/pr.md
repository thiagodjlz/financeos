# Pull Request

- **URL**: https://github.com/thiagodjlz/financeos/pull/55
- **Commit**: `4e809ff` — Torna a interface responsiva para mobile e revisa a UX do desktop
- **Branch**: `feature/issue-54-responsividade-mobile`
- **Base**: `main`
- **Issue**: [#54](https://github.com/thiagodjlz/financeos/issues/54) — Ajuste de Responsividade e Melhoria de UX/UI — Mobile (fechada pelo merge, via `Closes #54`)
- **Data**: 2026-09-20

## Resumo

A feature torna a interface responsiva para mobile corrigindo na origem, e nao por
remendo de tela: conjunto unico de breakpoints (1080/680/480) e tokens novos em
`styles.scss`, gaveta de navegacao sobreposta com scrim no lugar do trilho de 76px que
so abria no `hover`, conversao tabela -> cartao como regra global de CSS via `data-label`
(Lancamentos, Categorias, Usuarios e a matriz de Perfis) e um componente compartilhado
`ConfirmDialog`.

Inclui tambem a revisao de UX/UI do desktop decidida pelo usuario (criterios 33-41,
decisao PA3): foco visivel em todos os botoes, estado `:disabled` do `.ghost-button`,
`hover` do menu distinto do item ativo, tokens de entrelinha, estado de carregamento,
modal com `role="dialog"`/`Esc`/gestao de foco, rotulos "Continuar editando"/"Sair sem
salvar" e affordance de rolagem das tabelas.

As correcoes de contraste foram feitas no token, nunca em cor literal: `--text-faint`,
`--sidebar-text-dim`, `--scroll-shadow-edge` e o `::placeholder`, que herdava o padrao do
navegador a 2.03:1.

Alteracao 100% de front-end — nenhuma regra de negocio nova, nenhuma migration e nenhum
arquivo sob `backend/`. Nenhuma dependencia nova.

**Decisao registrada do usuario**: o par `--border-input` sobre `--surface` (1.44:1) fica
como esta — e par pre-existente, nao alterado por esta feature; a divida de acessibilidade
vira issue propria.

## Conteudo do commit

- `frontend/src/index.html`, `frontend/src/styles.scss` e `frontend/src/app/app.scss` (M)
- `frontend/src/app/core/confirm-dialog/` (novo: `.ts`, `.html`, `.spec.ts` — sem `.scss` proprio)
- `frontend/src/app/core/toast/toast-host.scss` (M)
- `frontend/src/app/layout/main-layout/` `.html` / `.scss` / `.ts` / `.spec.ts` (M)
- `frontend/src/app/features/auth/login/login.scss` (M)
- `frontend/src/app/features/dashboard/` `.html` / `.scss` / `.ts` / `.spec.ts` (M)
- `frontend/src/app/features/transactions/` `.html` / `.scss` / `.ts` (M)
- `frontend/src/app/features/categories/` `.html` / `.scss` / `.ts` / `.spec.ts` (M)
- `frontend/src/app/features/users/` `.html` / `.scss` / `.ts` / `.spec.ts` (M)
- `frontend/src/app/features/profiles/` `.html` / `.scss` (M)
- `specs/54-responsividade-mobile/` (novo, com os relatorios da esteira)

Total: 37 arquivos, 2296 insercoes e 121 remocoes. Nenhum arquivo alheio entrou no commit;
o working tree nao tinha saida pendente de `sync-knowledge` de feature anterior.

## Situacao da esteira

- Qualidade: PASSOU (backend 51 testes, frontend 215 testes em 22 arquivos, build sem warning de orcamento)
- Build: PASSOU (jar + bundle gerados)
- Verificacao: 49 dos 51 criterios automatizados, 2 aceitos por emulacao (3 e 6 — barra de URL dinamica e safe area real do Safari, decisao PA4), 0 NAO ATENDIDO; validacao manual aprovada pelo usuario em 20/09/2026
- Tarefas: 45 de 45 concluidas (T42-T45 nasceram na rodada de correcao dos defeitos da etapa 8)
- Versao: PR contra `main`, sem incremento de build (nao e branch de versao); `VERSION` permanece `1.0.2-dev`
