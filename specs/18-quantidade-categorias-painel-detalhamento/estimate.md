# Estimativa

| Area | Horas |
|---|---|
| Backend | 0 |
| Frontend | 1.5 |
| Migration/dados | 0 |
| Testes | 1 |
| **Total** | **2.5** |

## Confianca

Alta — mudança é puramente de template HTML (2 bindings), sem lógica, sem schema, sem autorização. O método `categoriesByType()` já existe e é usado na mesma tela. Validação é visual e manual, com testes E2E previsíveis.

## Premissas

- `categoriesByType()` já está funcionando corretamente (confirmado pelo plano: já é usado para renderizar a lista).
- Nenhum ajuste CSS será necessário (número inteiro pequeno cabe no estilo `.category-section-header` existente).
- Testes E2E existem e podem ser estendidos para cobrir os novos cenários (0 categorias, múltiplas categorias).
