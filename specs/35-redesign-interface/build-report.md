# Relatorio de build

## Backend

PASSOU — jar gerado em `backend/target/quarkus-app/app/backend-1.0.0.jar` (75KB)

Build executado com `./mvnw -q package -DskipTests` sem erros ou avisos. O artefato está pronto para empacotamento em imagem Docker.

## Frontend

PASSOU — bundle gerado em `frontend/dist/frontend`

Build executado com `npm run build` concluído em 4.660 segundos. Estrutura de saída:
- HTML (index): `frontend/dist/frontend/browser/index.html`
- JavaScript (main + chunks): ~286 KB initial, 100+ KB lazy
- CSS (styles): 7.73 KB
- Assets estáticos: `frontend/dist/frontend/browser/assets/`

### Verificacao de assets — Fontes

Confirmado: Os arquivos de fonte variável Inter estão presentes no bundle:
- `frontend/dist/frontend/browser/assets/fonts/inter-latin.woff2` ✓
- `frontend/dist/frontend/browser/assets/fonts/inter-latin-ext.woff2` ✓

Confirmado: O arquivo `README.md` da pasta de fontes **não** está no bundle (glob do `angular.json` é `**/*.woff2`, exclui documentacao).

## Conclusao

Pronto para abrir PR — ambas as camadas compilaram com sucesso, artefatos gerados, nenhuma regressao no tamanho do bundle, fontes self-hosted incluidas no bundle conforme requisito.
