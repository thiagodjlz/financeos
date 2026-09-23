# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/84
- Base: `main`
- Branch: `feature/issue-76-bloqueia-autodesativacao-put`
- Commit da feature: `9158d43` — "Bloqueia desativacao e troca de perfil da propria conta pelo PUT"
- Aberto em: 2026-09-23

## Resumo

`PUT /api/users/{id}` recusa com 409 a desativacao e a troca de perfil da propria conta, sem gravar nada; `active` passa a obrigatorio (400 quando ausente/nulo). Central (area Usuarios) e Novidades 1.0.2 atualizadas; testes novos no backend e em `users.spec.ts`. Quality-check e build PASSOU; 10 de 13 criterios verificados automaticamente e validacao manual aprovada pelo usuario em 2026-09-23. Resolve #76.
