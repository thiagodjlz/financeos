---
name: revisar-textos
description: Revisa texto voltado ao usuario final antes de grava-lo. Use ao criar, alterar ou revisar o conteudo da tela "Documentação" (documentation/content/*Content.java) ou de "Novidades por versão" (releasenotes/content/ReleaseNotesContent.java), separando o que e funcional (fica) do que e tecnico (sai ou vira resultado percebido).
---

Estas duas telas respondem a uma pergunta so: **o que isso significa para mim, usuario?** Texto que nao responde isso nao entra.

## Funcional x tecnico

Fica (funcional): o que a pessoa ve, faz ou percebe — telas, botoes, campos, regras que ela sente, resultados.

Sai ou e reescrito (tecnico): nao chega ao usuario.
1. Infraestrutura e hospedagem (Docker, deploy, HTTPS, Tailscale, Caddy, servidor).
2. Banco de dados (migration, Flyway, tabelas, colunas).
3. Interface de programacao (API, endpoint, token, JWT).
4. Arquitetura e bibliotecas (framework, Swagger, classes, enums).
5. Processo de desenvolvimento (esteira, testes, build, commit).
6. Contas e dados de teste ou de desenvolvimento.
7. Refatoracao e correcao interna sem efeito visivel.

Correcao tecnica sem efeito perceptivel **nao gera item**: remova.

## As 5 perguntas, para cada texto

1. Uma pessoa sem conhecimento tecnico entende cada palavra?
2. Descreve algo que ela ve ou faz, ou so algo interno?
3. Diz o que mudou **para ela** (o resultado), nao como foi feito?
4. Usa o rotulo em portugues da tela, e nao nome de enum, classe ou campo?
5. Sem esse texto, ela perderia alguma informacao util?

## Formato

Item de "Novidades por versão": **"Titulo curto:** explicacao em uma frase."** (titulo com o nome da funcionalidade, explicacao com o beneficio).

Pares tecnico -> usuario:
- "Publicar na internet com HTTPS automatico ou Tailscale, sem custo de hospedagem" -> resultado percebido (ex.: acesso ao sistema de qualquer lugar, com conexao segura), sem citar a tecnologia; ou remova se nao ha efeito perceptivel.
- "Administrador com nome fixo, contas de teste removidas do ambiente publicado" -> "Acesso mais seguro: o sistema deixou de trazer contas de exemplo prontas para uso" ou remova.

## Preservar o significado

Reescrever nunca altera o que o texto afirma. Toda afirmacao tem origem em `knowledge/*.md` ou no codigo (ver `knowledge/documentation.md`, "Regras de redacao"); se o texto mudou, confirme a origem e registre antes -> depois e o motivo em `implementation-notes.md`. Nao invente regra, nao acrescente funcionalidade inexistente, mantenha as frases-chave cobertas por teste.

## Commit

O hook `.githooks/check-texts.sh` recusa commit que altere esses conteudos sem `FINANCEOS_TEXTOS_REVISADOS=1`. So use a variavel depois de aplicar esta revisao e registra-la nas notas: `FINANCEOS_TEXTOS_REVISADOS=1 git commit ...`. No commit da esteira (`open-pr`) o publisher a exporta.
