# Pull Request

- **URL**: https://github.com/thiagodjlz/financeos/pull/50
- **Commit**: `3d1067d` — Ajusta o grafico "Evolucao anual" do painel
- **Branch**: `feature/issue-48-ajuste-grafico-dashboard`
- **Base**: `main`
- **Issue**: [#48](https://github.com/thiagodjlz/financeos/issues/48) — Ajuste de gráfico (fechada pelo merge, via `Closes #48`)
- **Data**: 2026-09-19

## Resumo

O card "Evolução anual" do painel desenhava a linha de Saldo numa escala propria
(`(balance - minBalance)/balanceRange`) enquanto as barras escalavam a partir do zero,
o que produzia a linha reta acima das barras relatada na issue. O PR unifica a escala,
acrescenta eixo Y com rotulos abreviados em R$ pt-BR, informativo por mouse/toque/teclado
com os valores reais do mes, corta a linha de Saldo apos o ultimo mes com lancamento e
faz o desenho ocupar o card inteiro (`ResizeObserver`). Titulo corrigido para
"Evolução anual" acentuado.

Alteracao 100% de front-end — nenhuma regra de negocio nova e nenhum arquivo sob `backend/`.

## Conteudo do commit

- `frontend/src/app/core/formatters.ts` (M) e `frontend/src/app/core/formatters.spec.ts` (novo)
- `frontend/src/app/features/dashboard/dashboard.ts` / `.html` / `.scss` / `.spec.ts` (M)
- `frontend/src/styles.scss` (M)
- `specs/48-ajuste-grafico-dashboard/` (novo, incluindo `design/` com o print da issue)

Nenhum arquivo alheio entrou no commit; o working tree nao tinha saida pendente de
`sync-knowledge` de feature anterior.

## Situacao da esteira

- Qualidade: PASSOU (backend 51 testes, frontend 199 testes, build limpo)
- Build: PASSOU (jar + bundle gerados)
- Verificacao: 38/42 criterios automatizados, 4 por validacao manual, aprovados pelo usuario em 19/09/2026
- Tarefas: 21 de 21 concluidas
- Versao: PR contra `main`, sem incremento de build (nao e branch de versao)
