# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/111
- Base: `main` (branch `feature/issue-109-reformulacao-layout`)
- Commit: `f39fdbdee0fc32b4d29ccff2a995a27dea07392f` ("Reformula o layout do Resumo, Lancamentos e Detalhe dos cadastros")
- Issue: #109 (fechada pelo PR com "Resolve #109")

## Resumo

Novo layout do Resumo (cartões Saldo e Pendentes, percentuais vindos da API, bloco do mês, duas colunas no desktop), de Lançamentos (passo de mês, Tipo segmentado, Filtros, título por dia, Detalhe na linha) e do cadastro de lançamento (nova ordem, Valor em texto validado pelo back-end). O Detalhe também vale em Categorias, Usuários e Perfis. O `InvalidFormatExceptionMapper` agora vale para todo o backend. "Desativar usuário" e "Excluir perfil" passam a pedir confirmação. A Central e o bloco 1.0.3 das Novidades foram revisados por `revisar-textos`.

Qualidade: backend 181/181, frontend 491/491, build PASSOU. Verificação: 9 de 17 critérios verificados automaticamente; os outros 8 passaram pela validação manual, aprovada pelo usuário em 2026-10-06.

Este arquivo e a mudança de `stage` para `pr-open` ficaram fora do commit do PR (foram gravados depois dele) e entram com o commit do sync-knowledge, como nas features anteriores.
