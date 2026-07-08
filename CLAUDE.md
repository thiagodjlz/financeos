# FinanceOS

Sistema financeiro pessoal: backend Java/Quarkus (`backend/`), frontend Angular (`frontend/`), PostgreSQL. Ver [README.md](README.md) para setup/comandos de dev.

## Antes de mexer no dominio

Regras de negocio e modelo de dados nao ficam aqui — ficam em [knowledge/](knowledge/README.md), separado por area (auth/permissoes, usuarios, contas, cartoes, categorias, transacoes, dashboard). Leia o(s) arquivo(s) relevante(s) antes de implementar algo que toque essas areas; varias regras nao sao obvias so lendo o codigo (ex.: categorias sao hoje um catalogo global, o usuario `super_admin` e oculto e ignora perfis, transacoes nunca sao excluidas de verdade).

## Convencoes

- Commits e Pull Requests em portugues.
- Sem comentarios no codigo a menos que expliquem um "porque" nao-obvio.
- Todo endpoint novo do backend comeca chamando `accessControl.require(Screen.X, Action.Y)` — ver [knowledge/auth-and-permissions.md](knowledge/auth-and-permissions.md).
- Detalhes de stack/comandos de build e teste: [knowledge/architecture.md](knowledge/architecture.md).

## Esteira automatizada de features (issue -> PR)

Para transformar uma issue do GitHub em Pull Request com confirmacao a cada etapa, ver [specs/README.md](specs/README.md) e rodar, na ordem:

```
/pipeline:spec-from-issue <numero-da-issue>
/pipeline:plan-implementation <numero>
/pipeline:estimate <numero>
/pipeline:implement <numero>
/pipeline:quality-check <numero>
/pipeline:build <numero>
/pipeline:open-pr <numero>
```

Cada comando roda um subagente dedicado (`.claude/agents/pipeline-*.md`) e grava o resultado em `specs/<numero>-<slug>/`, nunca avancando sozinho para a proxima etapa.

Ao final do `/pipeline:open-pr`, e perguntado se voce quer rodar `/pipeline:sync-knowledge <numero>` — etapa opcional que atualiza `knowledge/*.md` e os proprios agents/skills da esteira com regras de negocio e padroes de processo que a feature revelou. So roda com confirmacao explicita seu.
