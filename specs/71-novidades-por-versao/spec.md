---
issue: 71
url: https://github.com/thiagodjlz/financeos/issues/71
title: "Novidades por versão"
domains: [documentation, auth]
target: main
stage: validated
branch: feature/issue-71-novidades-por-versao
created: 2026-09-21
---

# Novidades por versão

## Historia

Como usuário do FinanceOS, quero consultar, dentro do menu Sobre, um histórico das novidades de cada versão do sistema, para que eu entenda o que mudou sem precisar perguntar ou ler código/commits.

## Contexto

Hoje o menu **Sobre** tem só o submenu **Documentação** (Central de Documentação, issue #70), que explica como o sistema funciona hoje — não há nenhum lugar que mostre **o que mudou entre versões**. A issue pede um segundo submenu, **Novidades por versão**, com um bloco por versão (mais recente primeiro), cada um separado em até três categorias (Novidades / Melhorias / Correções, omitindo a vazia), escrito em linguagem de usuário final.

A versão atual é `1.0.2-dev` (arquivo `VERSION`, fonte única também usada por `pom.xml`, `frontend/src/app/core/version.ts` e `GET /api/health` — ver `knowledge/architecture.md`). A versão **1.0.1** foi a única já cortada como branch (`v1.0.1`) e, por decisão explícita da issue, não deve aparecer na tela — o primeiro bloco é **1.0.2**. As mudanças reais desde `v1.0.1` (fonte para o conteúdo, sem inventar) já estão no histórico do repositório: Central de Documentação (#70), ajuste de seleção/validação de Ano e Mês do Resumo (#69), saudação personalizada no Painel (#65), nome fixo do administrador de produção e remoção das contas semeadas em produção (#64/#66), correção de contraste da borda dos campos para WCAG (#58), responsividade mobile completa (#54) e o ambiente de produção externo com domínio próprio ou Tailscale Funnel. Não existe `CHANGELOG.md` no repositório — a curadoria do texto de cada item (rastreável a issue/commit real, sem termo técnico) é trabalho da etapa de planejamento/implementação, no padrão de rastreabilidade da Central de Documentação (#70: tabela afirmação → origem).

A tela segue o padrão já estabelecido por `DOCUMENTATION`: `Screen` própria no enum, privilégio **exclusivo de visualização** (sem criar/editar/excluir), matriz de Perfis oferecendo só a coluna "Ver" para essa linha, endpoint novo protegido por `accessControl.require(...)`, e submenu dentro do grupo "Sobre" visível só a quem tem a permissão — igual ao que `knowledge/auth-and-permissions.md` e `knowledge/documentation.md` já documentam para `DOCUMENTATION`.

## Critérios de aceite

### Permissão e menu

- [x] Existe um novo valor de `Screen` dedicado à funcionalidade, com privilégio **somente de visualização**: a matriz de Perfis oferece apenas a coluna "Ver" nessa linha, e o backend força `canCreate/canEdit/canDelete=false` ao persistir qualquer entrada dela (`POST`/`PUT` de Perfis), igual ao tratamento já existente para `DOCUMENTATION`.
- [x] O endpoint novo que serve o conteúdo começa chamando `accessControl.require(Screen.<nova>, Action.VIEW)`: retorna 200 com o conteúdo para quem tem o privilégio (perfil com `canView=true` e o usuário `super_admin` oculto, sempre), 403 para quem não tem (inclusive perfil sem linha cadastrada para a tela) e 401 sem token.
- [x] O submenu "Novidades por versão" aparece dentro do grupo "Sobre", junto de "Documentação", e só é exibido a quem tem a nova permissão de visualização — usuário sem ela não vê o item nem consegue abrir a tela navegando direto pela URL (é redirecionado, como as demais telas protegidas por permissão).
- [x] Uma migration nova adiciona o valor ao check constraint de `profile_permissions.screen` (recriando-o com a lista completa, no padrão da `V13__add_documentation_screen.sql`) e semeia `can_view=true` para todos os perfis já existentes nessa linha (ver Decisões).

### Conteúdo e regra de versão

- [x] A versão **1.0.1** não aparece em nenhum bloco da tela.
- [x] O bloco mais antigo exibido é o da versão **1.0.2**.
- [x] Os blocos são exibidos ordenados da versão mais recente para a mais antiga.
- [x] A versão mais recente exibida carrega uma indicação textual discreta de "atual" (ex.: rótulo junto ao número), calculada a partir da mesma fonte que o restante do sistema usa para a versão corrente (`VERSION`/`pom.xml`/`GET /api/health`) — sem número de versão duplicado numa configuração paralela, e exibida como `vX.Y.Z` (sem sufixo de build/`-dev`).
- [x] Cada bloco mostra só as categorias com conteúdo entre Novidades, Melhorias e Correções; categoria sem item não é renderizada (testável pela ausência do título da categoria no HTML do bloco correspondente).
- [x] Nenhum item de conteúdo é repetido em mais de um bloco de versão — uma alteração aparece só no bloco da versão em que foi introduzida; se ela for retrabalhada numa versão seguinte, só a descrição do retrabalho entra no bloco novo.
- [x] Todo item de conteúdo é rastreável a uma mudança real do projeto (issue, commit ou regra documentada em `knowledge/`) — nenhum item sem origem localizável; a rastreabilidade fica registrada numa tabela (afirmação → origem), no mesmo padrão usado pela Central de Documentação (#70).
- [x] Nenhum termo técnico de implementação (nome de classe, endpoint, tabela do banco) aparece no texto exibido — mesma regra de linguagem de usuário final já aplicada na Central de Documentação.
- [x] Uma correção publicada como um novo número de build da mesma versão (`X.Y.Z-NN` → `X.Y.Z-NN+1`, sem mudar `X.Y.Z`) entra na categoria Correções do bloco já existente dessa versão, sem criar um bloco novo.

### Perfil

- [x] A tela de Perfis exibe a nova linha de permissão com apenas a coluna "Ver" habilitada e as demais desabilitadas, sem alterar a contagem nem o alinhamento das colunas da matriz.

### UI e responsividade

- [x] A tela segue o design system existente: nenhuma cor literal nova fora de `styles.scss`, reutilizando componentes de cartão/painel já usados no sistema.
- [x] Em viewport de até 680px a tela não produz rolagem horizontal (`document.documentElement.scrollWidth` não excede `clientWidth` na tela) e os blocos de versão ocupam a largura disponível sem sobreposição de texto.
- [x] Texto novo introduzido pela tela não acrescenta ocorrência nova às varreduras de acentuação de `knowledge/architecture.md` (seção "Idioma") além do baseline já registrado lá.

## Fora de escopo

- Privilégios de criar, editar ou excluir conteúdo de novidades — a funcionalidade é somente de consulta (item 10 da issue).
- Notificação proativa de nova versão (push, badge no menu, e-mail) — a issue pede uma tela de consulta, não um alerta.
- Tela ou endpoint de manutenção/cadastro dinâmico do conteúdo — permanece redação versionada junto do código, como a Central de Documentação.
- Qualquer alteração no mecanismo de corte de versão (`scripts/new-version.ps1`, hook de bump de build) — a feature só lê a fonte de verdade já existente.
- Reintrodução de conteúdo sobre funcionalidades removidas (Contas, Cartões) — o conteúdo cobre só o que foi de fato implementado e continua ativo ou foi entregue e depois alterado.

## Decisões

- Migration do novo privilégio semeia `can_view=true` para todos os perfis já existentes, mesmo padrão da Central de Documentação (#70): tela nasce disponível, sem concessão manual em Perfis. Perguntado ao usuário; resposta: "Nasce liberado (true)". (2026-09-21)

## Pontos em aberto

- A redação final de cada item de conteúdo (texto exato por versão/categoria) depende de curadoria a partir do histórico real do projeto (commits/issues listados em Contexto) — não fechada nesta spec; vai para o `context.md` da etapa de planejamento, com a tabela de rastreabilidade exigida no critério correspondente.

## Referências

- Issue: https://github.com/thiagodjlz/financeos/issues/71
- Conhecimento consultado: `knowledge/README.md`, `knowledge/architecture.md`, `knowledge/documentation.md`, `knowledge/auth-and-permissions.md`
