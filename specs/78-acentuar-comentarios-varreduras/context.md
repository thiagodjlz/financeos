# Briefing — issue 78

## Regras que restringem esta mudanca

- Varreduras de acentuacao, comandos literais (rodar da raiz do repo). Hoje saem com 2 + 6 linhas, todas comentario de codigo; esta issue as deixa **vazias** (`knowledge/architecture.md`, "Idioma"):
  ```bash
  rg -n "Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b" frontend/src --glob '!**/*.md'
  rg -n "\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo" backend/src/main/java --glob '*.java'
  ```
  Baseline reconfirmado nesta etapa (2026-09-23, `d59ded8`): front `styles.scss` 24, 30; back `ProductionBootstrap.java` 178, 179 e `DashboardResource.java` 41, 85, 124, 125.
- Os arquivos ficam em UTF-8; acentuacao so vale se nao virar mojibake (`knowledge/architecture.md`, "Idioma").
- Nao se acentua nem renomeia identificador de codigo — so o texto do comentario muda (`knowledge/architecture.md`, "Idioma"; spec, "Fora de escopo").
- Os comentarios documentam regras que **continuam valendo** e cujo sentido nao pode mudar: ordem das checagens do `summary` (mes antes do ano) e leitura dos parametros por `UriInfo` (`knowledge/dashboard.md`); remocao de conta semeada em producao so sem linha relacionada, com tabelas vindas do catalogo de FKs (`knowledge/auth-and-permissions.md`, "Travas de ambiente de producao").
- Escopo fechado: **14 linhas exatas** (CA3 + CA4 da spec), nenhuma outra. Outros comentarios sem acento fora desses blocos (`ProfileResource.java` 34-35, `CategoryUsageCheck.java` 22 etc.) ficam como estao — nao acentuar de carona (spec, "Fora de escopo").

## Arquivos em jogo

| Arquivo | O que faz hoje | O que muda |
|---|---|---|
| `frontend/src/styles.scss` (CRLF no working tree) | Estilos globais; bloco de comentario 22-36 documenta os breakpoints | Linhas 23, 24, 27, 30, 33 acentuadas (texto exato no CA3/CA4) |
| `backend/src/main/java/br/com/financeos/bootstrap/ProductionBootstrap.java` (CRLF) | Travas de producao; comentario 177-179 acima de `hasRelatedRows` | Linhas 177, 178, 179 acentuadas |
| `backend/src/main/java/br/com/financeos/dashboard/DashboardResource.java` (LF) | Endpoints do Resumo; comentarios 41-43, 85-86, 124-125 | Linhas 41, 42, 85, 86, 124, 125 acentuadas (43 ja esta correta e nao muda) |

Nenhum teste le o texto desses arquivos (busca por nome de arquivo fora de `specs/`/`knowledge/` so acha `angular.json`, que referencia `styles.scss` como entrada do build).

## Convencoes aplicaveis

- Editar **so com a ferramenta Edit**, uma linha (ou bloco contiguo) por vez, copiando o texto alvo literal da spec. **Nao** usar `Write` no arquivo inteiro nem `Set-Content`/`Out-File`/`-replace` do PowerShell: o Windows PowerShell grava em ANSI/UTF-16 ou troca CRLF/LF, e o diff sairia com o arquivo inteiro alterado ou com mojibake (CA5, CA6).
- Preservar o fim de linha de cada arquivo (CRLF em `styles.scss` e `ProductionBootstrap.java`, LF em `DashboardResource.java`); `.gitattributes` e `* text=auto`, entao o indice normaliza para LF, mas o working tree nao deve ser reescrito.
- Nao quebrar nem reformatar as linhas: mesma posicao, mesma indentacao (4 espacos + `// ` no Java; ` * ` no SCSS), so troca de caracteres acentuados. Atencao ao `NAO e` -> `NÃO é` (styles.scss 33) e ao travessao `—` ja existente nas linhas 24 e 27.
- Sem comentario novo e sem mudar codigo (`knowledge/architecture.md`, "Convencoes de codigo").
- Nao atualizar `knowledge/architecture.md` agora: a troca do criterio de baseline por "varredura vazia" e da etapa `sync-knowledge` (spec, "Fora de escopo").

## Consultas fora do briefing

Nenhuma ate agora.
