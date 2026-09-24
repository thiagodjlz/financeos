# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/94
- Base: `main`
- Branch: `feature/issue-92-central-usuario-sem-perfil`
- Commit: `35004784e8db69383da09b2c9caf30159feef948`
- Issue: #92 (fechada pelo PR via "Resolve #92")

## Resumo

Corrige a regra de perfil na área Usuários da Central de Documentação: sai a afirmação de que não existe usuário sem perfil; entram "todo cadastro e toda alteração exigem um perfil" e a explicação do traço (-) na coluna Perfil para pessoas cadastradas antes dos perfis. Teste novo em `DocumentationContentTest` e `knowledge/users.md` atualizado. Quality check e build PASSOU; 6 de 7 critérios verificados automaticamente e validação manual aprovada pelo usuário em 2026-09-24.
