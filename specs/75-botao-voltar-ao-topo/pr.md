# Pull Request

- PR: https://github.com/thiagodjlz/financeos/pull/82
- Base: `main`
- Branch: `feature/issue-75-botao-voltar-ao-topo`
- Commit: `eed08ae` — Adiciona botao "Voltar ao topo" nas telas internas
- Issue: #75 (fechada pelo merge via "Resolve #75")

## Resumo

Botao flutuante global "Voltar ao topo" (componente `BackToTop`, montado uma vez em `main-layout.html`), exibido apos 300 px de rolagem, com rolagem suave (instantanea sob reduced motion), foco devolvido a `.workspace` e listener de scroll unico e passivo. Backend: item em Melhorias do 1.0.2 (Novidades) e paragrafo em "Como navegar" da Central.

Qualidade e build: PASSOU. Verificacao: 19/19 criterios; validado pelo usuario em 2026-09-22. Achado do CA11 (sobreposicao transitoria no meio da rolagem; nada coberto no fim da pagina) registrado no PR e aceito pelo usuario.
