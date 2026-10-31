# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/121
- Base: `v1.0.3` (correcao de versao ja cortada)
- Branch: `fix/issue-120-icone-guia-ordem-menu`
- Commit: `363fae4` (Troca o icone da guia por uma moeda com F e poe Cadastros antes de Relatorios no menu)
- Build gerada pelo hook `pre-commit`: `1.0.3-02` -> `1.0.3-03` (`VERSION`, `backend/pom.xml`, `frontend/src/app/core/version.ts`, `.env.example`)

## Resumo

Icone da guia trocado por uma moeda com a letra F (favicon SVG/ICO, `?v=2` no `index.html`), mesma marca no menu lateral e no login; Cadastros antes de Relatorios no menu, no painel Mais, na tela de entrada e na matriz de Perfis; Central e item "Icone da guia" do bloco 1.0.3 de Novidades atualizados (textos revisados com `revisar-textos`). Quality e build PASSOU; 14/14 criterios verificados; validado pelo usuario em 2026-10-31.

## Pendente depois do merge

Levar a correcao para a `main` (`git checkout main && git merge v1.0.3` ou cherry-pick de `363fae4`), com o bloco 1.0.3 de Novidades recebendo o mesmo texto e sem item novo no 1.0.4. Como a base nao e a branch padrao, o "Resolve #120" nao fecha a issue sozinho no merge em `v1.0.3`.
