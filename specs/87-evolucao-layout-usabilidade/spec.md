---
issue: 87
url: https://github.com/thiagodjlz/financeos/issues/87
title: "Evolução geral do layout e usabilidade do sistema"
domains: [transactions, categories, users, auth, documentation]
target: main
stage: pr-open
branch: feature/issue-87-evolucao-layout-usabilidade
created: 2026-09-23
---

# Evolução geral do layout e usabilidade do sistema

## Historia

Como operador que usa o FinanceOS tambem no celular, quero listagens paginadas e filtraveis, com inclusao e edicao numa tela propria de cadastro, para achar e manter registros sem rolagem excessiva e com o mesmo padrao em todos os cadastros.

## Contexto

Issue ampla, sem mockup. Conferido na `main` c1dfe2f:

- Lancamentos, Categorias e Usuarios: formulario lateral so de criacao + edicao inline na tabela; Perfis: formulario de criar/editar. Contas (removida na #20) e Centros de custo nao existem.
- `GET /categories|/users|/profiles|/transactions` devolvem a lista inteira. A lista completa alimenta o nome da categoria nas linhas de Lancamentos e do perfil em Usuarios; `GET /categories?type=` alimenta o dropdown (so ativas). `GET /categories/{id}` da 404 para inativa, mas o `PUT` a reativa.
- `DashboardResource` le parametros pelo `UriInfo` para responder 400 em portugues a valor nao numerico (a conversao de `@QueryParam` escapa do `BusinessExceptionMapper`).
- Ja existe (#54): cartao <=680px, toque 44px e campo 16px <=480px, `.loading-state` + `aria-busy`. Falha de carga hoje so gera toast e mostra o `.empty-state` "Nenhum ... cadastrado".
- A Central descreve "o formulario ... a esquerda" (`documentation/content/*AreaContent.java`).

## Criterios de aceite

Cadastro em tela propria (Lancamentos, Categorias, Usuarios, Perfis)

- [x] CA1: a listagem nao tem formulario nem edicao inline (nenhum campo na linha); cabecalho com "Incluir" (`.primary-button`) so com `CREATE`, e "Editar" por linha so com `EDIT`.
- [x] CA2: inclusao e edicao em rotas proprias com `permissionGuard('<SCREEN>','CREATE'|'EDIT')`; abrir direto sem permissao redireciona como hoje; abrir a edicao direto (recarregar) carrega o registro; id inexistente volta a listagem com erro em portugues.
- [x] CA3: titulos "Novo/Editar lançamento", "Nova/Editar categoria", "Novo/Editar usuário", "Novo/Editar perfil"; mesmos campos, valores iniciais e regras de UI da inclusao e da edicao atuais (Lancamentos: Categoria filtrada por Tipo, Status oculto para Receita, "Selecione"); botoes "Salvar" e "Cancelar".
- [x] CA4: editar categoria inativa abre com Situacao "Inativo" e permite reativar; lancamento com categoria inativa mantem a categoria na edicao.
- [x] CA5: Salvar 2xx -> toast de Sucesso atual e volta a listagem; 400/409 -> permanece com `invalid` + `field-error` + foco + toast atual. Payload de POST/PUT identico ao de hoje.
- [x] CA6: "Cancelar" sem alteracao volta sem modal e sem HTTP; com alteracao abre "Deseja sair sem salvar?": confirmar volta sem HTTP, recusar mantem o que foi digitado (`HttpTestingController`).
- [x] CA7: ao voltar (Salvar ou Cancelar) a listagem restaura filtros e pagina (ex.: pagina 2 com Tipo = Despesa).

Paginacao e filtros — API

- [x] CA8: os 4 `GET` de listagem aceitam `page` e `size` (max. 10) e devolvem itens + total de registros + total de paginas; com 11 registros e `size=10`: 10 na pagina 1, 1 na 2, totais 11 e 2.
- [x] CA9: `size` > 10 ou < 1, `page` invalido, valor nao numerico e filtro malformado (`status=XYZ`, `startDate=abc`, `categoryId` nao UUID) -> 400 com mensagem em portugues, nunca 404/500.
- [x] CA10: pagina alem da ultima -> 200, lista vazia, totais corretos.
- [x] CA11: filtros de P5 combinam por E (teste com 3 criterios); texto e "contem" sem diferenciar maiusculas nem acentos (`acai` acha "Açaí").
- [x] CA12: escopos mantidos: sem `VIEW` -> 403; Lancamentos so do usuario logado; Usuarios nunca devolve nem conta o `super_admin` oculto.
- [x] CA13: com 11+ categorias e perfis, o dropdown de Categoria (Lancamentos) e o de Perfil (Usuarios) mostram as mesmas opcoes de hoje, e as linhas mostram o nome certo (nunca "Sem categoria"/"-" indevido).

Paginacao e filtros — tela

- [x] CA14: ate 10 registros por pagina, "Anterior"/"Próxima" (desabilitados nas pontas) e "Página X de Y"; trocar de pagina mantem filtros; alterar/limpar filtro volta a pagina 1.
- [x] CA15: "Filtros" abre os criterios de P5; com filtro aplicado vira "Filtros (N)" com rotulos dos ativos; remover um rotulo reaplica os demais.
- [x] CA16: Categorias e Usuarios abrem com Situacao = Ativos (Ativos/Inativos/Todos); Lancamentos filtra Status (Pendente/Pago/Cancelado) sem padrao; Perfis sem Situacao. "Limpar filtros" volta a esse padrao.

Estados

- [x] CA17: carga em andamento: `.loading-state` com `aria-busy` e nenhum `.empty-state` (cadastros, Resumo, Documentacao, Novidades).
- [x] CA18: filtro sem resultado: "Nenhum registro encontrado." + "Limpar filtros"; sem registros e sem filtro: o `.empty-state` atual.
- [x] CA19: falha de carga (API fora ou 5xx) mostra na area do conteudo mensagem em portugues sem texto tecnico, no lugar do `.empty-state`, alem do toast (cadastros, Resumo, Documentacao, Novidades).

Responsividade (verificavel por emulacao — comportamento nativo nao reproduzido)

- [x] CA20: a 360px, listagem, filtros, paginacao e cadastro das 4 telas, mais Resumo, Documentacao, Novidades e Login, tem `document.documentElement.scrollWidth <= 360`.
- [x] CA21: ate 480px, "Incluir", "Editar", "Filtros", "Limpar filtros", paginacao e botoes do cadastro medem >= 44px de altura; campos do cadastro e dos filtros tem `font-size` 16px.
- [x] CA22: a 1280px a listagem segue em tabela com as colunas atuais; ate 680px vira cartao, com `data-label` em todo `<td>` novo.

Nao-regressao e documentacao

- [x] CA23: "Cancelar" de Lancamentos (`DELETE` -> `CANCELED`), exclusao de Categorias, "Desativar" de Usuarios, "Excluir" de Perfis, visibilidade por permissao e validacoes/mensagens dos DTOs de escrita seguem como hoje; `npm test` e `./mvnw test` passam.
- [x] CA24: as areas Lancamentos, Categorias, Usuarios e Perfis da Central descrevem Incluir, Editar em tela propria, Filtros e paginacao; nenhum `*AreaContent.java` cita formulario "à esquerda" nem edicao na linha.
- [x] CA25: as duas varreduras de idioma de `knowledge/architecture.md` seguem vazias (baseline 0/0, `main` c1dfe2f).

## Fora de escopo

- Modernizacao visual da secao 8 (issue separada, P7); tokens visuais novos.
- Regra de negocio ou campo novo, subcategorias, importacao, recorrencia; Situacao em Perfis ou Lancamentos.

## Decisoes

Todas em 2026-09-23, com o usuario.

- Alvo `main`. CA20-CA22 verificados por emulacao; comportamento nativo nao reprova (acordo da #54).
- P1 Onde paginar/filtrar? Back-end: `GET` paginado (`size` ate 10, totais) com filtros como parametros validados no `Resource`, erros em portugues. Derivado: `size` fora de 1..10 da 400 (nao limita em silencio); pagina alem da ultima e 200 vazio.
- P2 Telas? Os 4 cadastros ganham o padrao completo; Resumo, Documentacao, Novidades e Login so responsividade e estados; Contas e Centros de custo fora (nao existem).
- P3 Edicao? Inclusao e edicao na mesma tela propria nos 4 cadastros; a edicao inline acaba.
- P4 Situacao? Ativos/Inativos/Todos, padrao Ativos, so em Categorias e Usuarios. Lancamentos filtra Status sem padrao. Perfis sem filtro de Situacao; regra inalterada.
- P5 Criterios? Lancamentos: Descricao, Categoria, Tipo, Status, periodo de Data. Categorias: Nome, Tipo, Situacao. Usuarios: Nome, E-mail, Perfil, Situacao. Perfis: Nome. Texto ignora maiusculas e acentos.
- P6 Cancelar? Com alteracao pergunta "Deseja sair sem salvar?", sem alteracao volta direto; a listagem mantem filtros e pagina.
- P7 Modernizacao visual (secao 8)? Fora; issue separada. Ficam so responsividade, toque, estados e consistencia do padrao.
- P8 Entrega? Um PR so (o plano pode ter fases).
- P9 A Situacao padrao "Ativos" conta em "Filtros (N)"? Sim, sempre: Categorias e Usuarios abrem com "Filtros (1)" e o rotulo "Ativos". Remover o rotulo de Situacao = Todos; "Limpar filtros" volta ao padrao (Ativos). Lista vazia so com o padrao: "Nenhum registro encontrado." sem botao "Limpar filtros" (nao ha o que limpar); o botao so aparece quando os filtros diferem do padrao.
- P9a (2026-09-24) Texto do rotulo? "Situação: Ativos", no formato "Campo: valor" dos demais rotulos.
- P10 Perfis vira tabela? Sim: `table.fixed-layout` com Nome + acoes, cartao ate 680px como as demais.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/87
- Conhecimento consultado: `knowledge/README.md`, `architecture.md`, `categories.md`, `transactions.md`, `users.md`, `documentation.md`, trechos de `auth-and-permissions.md` e `frontend-ui.md`
