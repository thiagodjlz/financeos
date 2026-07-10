---
issue: 24
url: https://github.com/thiagodjlz/financeos/issues/24
title: "Usuários - Alterar formato da mensagem de inconsistência"
domains: [users]
stage: pr-open
branch: feature/issue-24-mensagem-inconsistencia-usuarios
created: 2026-07-09
---

# Usuários - Alterar formato da mensagem de inconsistência

## Historia

Como usuario administrador que cadastra/edita usuarios, quero que os erros de validacao do formulario sejam apresentados de forma clara (destaque vermelho visivel mesmo com o campo focado, alerta temporario com opcao de fechar e legenda explicativa abaixo de cada campo invalido), para que eu identifique e corrija rapidamente o que esta inconsistente.

## Contexto

A issue #22 (PR #23) introduziu o destaque vermelho dos campos invalidos no formulario de usuarios (`frontend/src/app/features/users/`): quando o backend retorna violacoes de validacao, os campos recebem a classe `.invalid` (borda + box-shadow vermelhos), uma mensagem generica aparece na `.status-bar` e o primeiro campo invalido recebe foco automatico. A issue #24 pede tres ajustes nesse comportamento:

1. **Contorno preto sobre o vermelho**: como o primeiro campo invalido recebe `focus()` automatico e o projeto nao define nenhum estilo customizado de `:focus`, o outline padrao do navegador (preto/azul) se sobrepoe ao destaque vermelho. Deve-se ajustar o estilo para que o campo invalido focado continue visivelmente vermelho (mantendo algum indicador de foco visivel, por acessibilidade).
2. **Alerta com auto-dismiss e botao de fechar**: o alerta de erro (`.status-bar`) deve ser exibido por 5 segundos e sumir automaticamente; alem disso, deve ter um "X" no canto superior direito para o usuario fecha-lo manualmente antes disso. Por decisao do usuario, esse comportamento vale para **toda mensagem de erro exibida na status-bar da tela de usuarios** (validacao, falha ao carregar, falha ao desativar), nao apenas para o alerta de inconsistencia de campos.
3. **Legenda por campo**: alem do contorno vermelho, cada campo inconsistente deve exibir uma legenda logo abaixo. Por decisao do usuario, o texto da legenda e a **mensagem especifica retornada pelo backend** em cada violacao (ex.: "A senha deve ter entre 8 e 72 caracteres"), em vez do texto generico dos exemplos da issue ("Senha inválida"). A legenda deve sumir somente quando o usuario **interagir de fato** com o campo — apenas clicar/focar nao basta; e preciso uma interacao a mais (ex.: digitar). Hoje o comportamento de limpar o destaque ja e disparado por `(input)` nos inputs e `(change)` no select, o que atende a essa regra; a legenda deve seguir a mesma logica que o destaque vermelho (somem juntos).

Regras existentes relevantes (`knowledge/users.md`): a validacao vem do backend (`UserCreateRequest`/`UserUpdateRequest` — nome, e-mail, senha 8-72 chars, perfil obrigatorio); o frontend mapeia as `violations` da resposta 400 para os campos `name`, `email`, `password`, `profileId`. Mudanca e exclusivamente de frontend — nenhuma alteracao de API ou regra de negocio.

## Criterios de aceite

- [ ] 1. Ao salvar com campo(s) invalido(s), o primeiro campo invalido recebe foco e seu destaque permanece vermelho — o outline padrao preto/azul do navegador nao se sobrepoe mais a cor vermelha (o campo invalido focado exibe indicador de foco em tom vermelho, ou equivalente, mantendo o foco perceptivel).
- [ ] 2. Campos validos continuam exibindo indicacao de foco normal ao serem focados (a mudanca de estilo de foco afeta apenas campos marcados como invalidos).
- [ ] 3. Toda mensagem de erro exibida na status-bar da tela de usuarios (validacao de formulario, falha ao carregar usuarios, falha ao desativar) desaparece automaticamente 5 segundos apos ser exibida.
- [ ] 4. Se um novo alerta for exibido antes de o anterior sumir, o contador de 5 segundos reinicia (o novo alerta fica visivel por 5 segundos completos).
- [ ] 5. Toda mensagem de erro da status-bar possui um botao "X" no canto superior direito; clicar nele fecha o alerta imediatamente.
- [ ] 6. Fechar o alerta (pelo "X" ou pelo timeout de 5s) NAO remove o destaque vermelho nem as legendas dos campos invalidos — esses estados sao independentes do alerta.
- [ ] 7. Cada campo invalido exibe uma legenda em vermelho logo abaixo do campo, com a mensagem especifica da violacao retornada pelo backend na resposta 400 (ex.: "A senha deve ter entre 8 e 72 caracteres"), nao um texto generico.
- [ ] 8. Apenas clicar/focar no campo invalido NAO remove a legenda nem o destaque vermelho; digitar no input (evento `input`) ou alterar a selecao do perfil (evento `change`) remove a legenda e o destaque daquele campo.
- [ ] 9. A legenda e o destaque vermelho de um campo somem sempre juntos (mesmo gatilho e mesmo estado).
- [ ] 10. Ao submeter novamente o formulario, os estados de legenda/destaque sao recalculados a partir da nova resposta do backend (campos corrigidos deixam de exibir erro; campos ainda invalidos voltam a exibir).
- [ ] 11. `npm run build` e `npm test` do frontend passam.

## Fora de escopo

- Validacao no proprio frontend antes do submit (a origem das violacoes continua sendo a resposta 400 do backend).
- Mudancas no backend (validacoes, mensagens de erro da API).
- Replicar o novo comportamento de alerta/legenda em outras telas (categorias, lancamentos etc.) — a issue trata apenas do formulario de usuarios.

## Decisoes

- 2026-07-09 — Texto da legenda por campo: usar a **mensagem especifica do backend** de cada violacao da resposta 400 (ex.: "A senha deve ter entre 8 e 72 caracteres"), em vez do texto generico dos exemplos da issue ("Senha inválida").
- 2026-07-09 — Abrangencia do auto-dismiss: o comportamento de 5 segundos + botao "X" vale para **todas as mensagens de erro da status-bar da tela de usuarios** (validacao, falha ao carregar, falha ao desativar), nao apenas para o alerta de inconsistencia de campos.

## Referencias

- Issue: https://github.com/thiagodjlz/financeos/issues/24
- Issue relacionada: #22 / PR #23 (commit b79e0b1) — introduziu o destaque vermelho atual
- Documentos de conhecimento consultados: knowledge/README.md, knowledge/architecture.md, knowledge/users.md
- Codigo atual: frontend/src/app/features/users/users.ts, users.html, users.scss
