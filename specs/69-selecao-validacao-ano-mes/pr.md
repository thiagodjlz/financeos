# Pull Request

- **URL**: https://github.com/thiagodjlz/financeos/pull/72
- **Commit**: `678d9a6a8c88961fb29b21ca0df2a5322904d6e2` ("Ajusta selecao e validacao dos campos Ano e Mes do Resumo")
- **Branch**: `feature/issue-69-selecao-validacao-ano-mes` -> `main`
- **Issue**: [#69](https://github.com/thiagodjlz/financeos/issues/69) — Ajustar seleção e validação dos campos Ano e Mês

## Resumo

Campo Mês passou a exibir o nome por extenso e a listar somente os meses com lançamentos do ano selecionado (reposicionando para o maior mês disponível na troca de ano). Campo Ano deixou de ser `<input type="number">` livre e virou `<select>` alimentado pelo novo `GET /api/dashboard/periods`. A validação do ano passou a ser imposta no back-end, antes de qualquer consulta, com as mensagens "O ano informado é inválido." e "Não há lançamentos no ano informado."; mês sem dados continua 200 com empty-state.

Commit com 19 arquivos: 11 de código (2 novos no backend) mais os 8 artefatos da esteira. Sem migration e sem mudança nos DTOs existentes. Sem incremento de build — o alvo é `main`, não uma branch de versão.

## Estado das checagens

- Qualidade: PASSOU (backend 63 testes, frontend 252 testes, build sem warning).
- Build: PASSOU (jar Quarkus e bundle do frontend gerados).
- Verificação: 43 de 43 critérios atendidos; validação manual aprovada pelo usuário em 2026-09-20.
