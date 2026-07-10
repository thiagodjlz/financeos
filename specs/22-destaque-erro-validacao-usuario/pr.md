# Pull Request

URL: https://github.com/thiagodjlz/financeos/pull/23

## Resumo

PR aberto para a issue #22 — destaque de erros de validacao no formulario de Usuarios. Quando o backend retorna `400` com `{violations: [...]}`, a tela agora cita o(s) rotulo(s) do(s) campo(s) invalido(s) na mensagem de erro, aplica contorno vermelho nos campos correspondentes (Nome, E-mail, Senha, Perfil) e move o foco automaticamente para o primeiro campo invalido, na ordem visual do formulario. Erros sem `violations` (ex.: `409` de e-mail duplicado) mantem o comportamento generico atual, sem destaque de campo.

Branch: `feature/issue-22-destaque-erro-validacao-usuario`
Qualidade e build: PASSOU (backend, frontend testes e build).
