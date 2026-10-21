# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/115
- Base: `main`
- Branch: `feature/issue-113-saldo-acumulado`
- Commit: `0cc90a6e54aba09b33aa24a183e7d4a4a8d2c991` - "Adiciona saldo acumulado ao Resumo a partir de outubro de 2026"
- Issue: #113 (fechada pelo merge via "Resolve #113")

## Resumo

Saldo anterior e Saldo acumulado no Resumo a partir de out/2026, calculados na hora no back-end (por usuario, sem pendentes, negativo levado adiante, mes futuro soma so ate o mes corrente). Front mostra as duas linhas no quadro "Saldo do mês" e o "Acumulado" no quadro abaixo do grafico; Central (area Resumo) e Novidades 1.0.3 atualizadas. Qualidade e build PASSOU (230 testes back, 542 front); 14/14 criterios verificados; validado pelo usuario em 2026-10-20.
