# Pull Request

- URL: https://github.com/thiagodjlz/financeos/pull/25
- Numero: #25
- Titulo: Melhora mensagens de inconsistencia no formulario de usuarios
- Branch: `feature/issue-24-mensagem-inconsistencia-usuarios` -> `main`
- Issue: [#24](https://github.com/thiagodjlz/financeos/issues/24)
- Aberto em: 2026-07-09

## Resumo

Ajusta a apresentacao de erros do formulario de usuarios (frontend apenas): alerta da status-bar com auto-dismiss de 5 segundos e botao "X" para todas as mensagens de erro da tela; legenda vermelha por campo invalido com a mensagem especifica da violacao do backend, removida junto com o destaque apenas quando o usuario interage com o campo; e indicador de foco vermelho no campo invalido focado, sem o outline padrao do navegador sobrepor o destaque. Qualidade e build passaram (10 testes backend, 21 testes frontend, build sem warnings).
