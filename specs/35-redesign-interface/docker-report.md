# Relatorio do ambiente de teste (Docker)

## Rodada 1 (inicialização da feature)

AMBIENTE ATUALIZADO E NO AR

Estado anterior: stack estava rodando (3 containers saudáveis há 59 minutos)
Comando: `docker compose up -d --build`

### Checagens

- **Containers**: 
  - `financeos-postgres` ✓ (Up 46 hours — mantido, dados preservados)
  - `financeos-backend` ✓ (Up 4 seconds — recriado)
  - `financeos-frontend` ✓ (Up 4 seconds — recriado)

- **Backend health**: `GET http://localhost:8080/api/health` → `200 OK`
- **Backend logs**: "Listening on: http://0.0.0.0:8080" (startup sucesso, sem erros de migration Flyway)
- **Frontend**: `GET http://localhost/` → `200 OK`

- **Fontes self-hosted (validacao especifica desta feature)**:
  - `GET http://localhost/assets/fonts/inter-latin.woff2` → `200 OK` (Content-Type: font/woff2, 48KB) ✓
  - `GET http://localhost/assets/fonts/inter-latin-ext.woff2` → `200 OK` (Content-Type: font/woff2, 84KB) ✓
  - `GET http://localhost/assets/fonts/README.md` → `200 OK` (redirecionado para index.html, arquivo nao publicado como recurso estatico) ✓

### Resultado

Nenhum erro, nenhuma regressao observada no startup. Frontend compilou sem warnings de budget de CSS/bundle.

---

## Rodada 2 (re-execução após correcção — Criterio 9)

AMBIENTE ATUALIZADO E NO AR

**Motivo**: Criterio 9 foi reprovado na etapa `/pipeline:verify`. Correcoes aplicadas no working tree:
- Removida sobrescrita `.nav-children button svg { width: 18px; height: 18px }` de `frontend/src/app/layout/main-layout/main-layout.scss`
- `::selection` atualizado para usar o token `--accent-selection`
- Dois nomes de teste atualizados
- `npm test` passou com 66 verdes
- `npm run build` passou sem erros

Estado anterior: stack estava rodando (3 containers rodando há ~7 minutos da rodada anterior)
Comando: `docker compose up -d --build`

### Checagens

- **Containers**: 
  - `financeos-postgres` ✓ (Up 47 hours — mantido, dados preservados)
  - `financeos-backend` ✓ (Up 4 seconds — recriado)
  - `financeos-frontend` ✓ (Up 4 seconds — recriado)

- **Backend health**: `GET http://localhost:8080/api/health` → `200 OK`
- **Backend logs**: "Listening on: http://0.0.0.0:8080" (startup sucesso, sem erros de migration Flyway)
- **Frontend**: `GET http://localhost/` → `200 OK`

- **Fontes self-hosted (re-validacao especifica)**:
  - `GET http://localhost/assets/fonts/inter-latin.woff2` → `200 OK` (48KB) ✓
  - `GET http://localhost/assets/fonts/inter-latin-ext.woff2` → `200 OK` (84KB) ✓

- **Validacao do CSS corrigido**:
  - Verificado que `.nav-children button svg { width: 18px; height: 18px }` **nao esta presente** no bundle publicado ✓
  - Bundle frontend compilou sem erros, com os arquivos de font assets inclusos ✓

### Resultado

Ambiente pronto para re-validacao do criterio 9 e dos demais criterios em `http://localhost`. Nenhum erro observado.

## Onde validar

- **Tela**: http://localhost
- **API/Swagger**: http://localhost:8080/docs
- **Design**: Navegue pelas telas (Login, Dashboard, Lancamentos, Categorias, Usuarios, Perfis) e valide:
  - Paleta OKLCH aplicada (fundo, superficie, sidebar, acento, textos)
  - Sidebar em trilho de 76px com expansao em hover
  - Cards com radius 14px, sombras e bordas no novo tema
  - Tipografia Inter nos pesos 400/500/600/700/800
  - Grafico SVG de evolucao anual no Dashboard
  - Switches na matriz de permissoes (Perfis)
  - Edicao inline preservada em Lancamentos/Categorias/Usuarios
  - **Criterio 9 (icons na sidebar)**: SVGs dos icones com tamanho 20px, stroke-width 1.8, paths/rects/circles exatamente do mockup
