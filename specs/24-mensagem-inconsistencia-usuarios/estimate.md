# Estimativa

| Área | Horas |
|---|---|
| Backend | 0 |
| Frontend | 7.5 |
| Migration/dados | 0 |
| Testes | 0 |
| **Total** | **7.5** |

## Confiança

Média — O escopo é bem definido e isolado ao componente de usuários (3 arquivos), mas envolve múltiplos estados interdependentes (alerta com timeout, destaque de campos, legendas, foco visual) que precisam ser coordenados corretamente. A lógica de reiniciar o timeout a cada novo alerta e manter a independência entre alerta e estado dos campos requer implementação cuidadosa. Validação manual ponta a ponta é crítica para confirmar todos os 11 critérios de aceite.

## Premissas

- O código existente em `users.ts`, `users.html` e `users.scss` está estável e não sofrerá alterações paralelas durante a implementação.
- A resposta 400 do backend continua retornando `violations` no formato `{ field, message }` conforme especificado em `knowledge/users.md`.
- O timeout de 5 segundos é suficiente para o usuário ler a mensagem (não há requisitos de acessibilidade que alterem esse tempo).
- Não há replicação do novo comportamento em outras telas durante esta feature (escopo limitado ao componente users).
- O projeto de frontend continua usando Angular 17+ com signals e a suíte de testes existente passa sem alterações (apenas validação com `npm run build` e `npm test`).
