# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/108
- Base: `main` (head: `feature/issue-107-bloco-novidades-1-0-3`)
- Commit: `cdd72c8e8480ae5d65bf60874486355dc0f5297d` - "Abre o bloco de Novidades da versao 1.0.3"
- Aberto em: 2026-09-30

## Resumo

Cria o bloco `versao_1_0_3()` sem itens antes do 1.0.2 e deixa o 1.0.2 identico. Com isso a suite do backend volta a passar na `main`. A tela Novidades por versao mostra "Ainda não há mudanças publicadas nesta versão." em bloco sem categorias, e a Central descreve esse caso. Os testes acham o 1.0.2 pela versao, e o `new-version.ps1` lembra de abrir o bloco da versao nova. Commit feito com `FINANCEOS_TEXTOS_REVISADOS=1`, com a revisao registrada em `implementation-notes.md`. `VERSION` continua em `1.0.3-dev`, e `origin/v1.0.2` continua em `c292e3d` (CA13).
