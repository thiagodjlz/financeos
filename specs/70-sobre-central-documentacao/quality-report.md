# Relatório de qualidade

## Backend (`./mvnw test`)

**PASSOU** — 81 testes, 0 falhas. Suite completa executada com sucesso, incluindo 6 testes novos da classe `DocumentationResourceTest` e `DocumentationSecurityTest`.

## Frontend (`npm test`)

**PASSOU** — 285 testes em 27 arquivos, 0 falhas. Todas as suites executadas com sucesso, incluindo os 30 testes novos da feature (adições em `permission.guard.spec.ts`, `main-layout.spec.ts` e `profiles.spec.ts`).

## Frontend build (`npm run build`)

**PASSOU** — Build compilado sem erros de tipo nem warnings novo. Nenhum aviso de `anyComponentStyle` detectado. Chunk da Central (`documentation`) gerado com 7.95 kB (dentro do budget de 8 kB).

## Varreduras de acentuação

**Frontend acentuação** — PASSOU com baseline. Regex `Usuarios|Usuario\b|Lancamento|Configuracoes|Situacao|Icone|Ultimos|possivel|invalid[oa]s?|indisponivel|periodo|[Vv]oce|obrigatori[oa]|maximo|Descricao|Acoes|\bnao\b|\bNao\b` retorna exatamente 2 linhas (ambas comentário pré-existente em `styles.scss` linhas 24 e 30).

**Backend acentuação** — PASSOU com baseline. Regex `\bnao\b|possivel|invalid|obrigatori|maximo|ja cadastrado|Ja existe|voce|lancamento|periodo` retorna exatamente 6 linhas (todas comentário pré-existente: `DashboardResource.java` 41, 85, 124, 125 e `ProductionBootstrap.java` 178, 179).

## Auditoria de assercão afrouxada

**PASSOU** — Nenhuma assercão existente foi relaxada nos testes do backend. Mudanças detectadas:
- `SCREEN_ROWS` em `profiles.spec.ts`: adição de `'Documentação'` como sexta linha (esperado)
- `checkboxes()` em `profiles.spec.ts`: aumento de 20 para 21 (esperado, uma checkbox nova na linha Documentação)
- `navButtons` em `main-layout.spec.ts`: aumento de 4 para 5 (esperado, novo grupo "Sobre" no menu)
- Adição de `'Sobre'` à lista de `aria-label` em `main-layout.spec.ts` (esperado)

Todas as mudanças estão alinhadas com a feature e não representam afrouxamento de testes pré-existentes.

## Conclusão

Pronto para build. Todos os critérios de qualidade foram atendidos: backend e frontend passam na suite completa, build compila sem erro, varreduras de acentuação mantêm o baseline e nenhuma assercão foi afrouxada.
