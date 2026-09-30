# Revisao de textos — antes -> depois (issue 104)

Nao havia ferramenta para invocar a skill neste subagente: apliquei manualmente o `.claude/skills/pipeline/revisar-textos/SKILL.md` (5 perguntas, rotulos da tela, sem enum/infra). A etapa seguinte pode reexecutar a skill se quiser confirmar. Antes -> depois:

- Lancamentos, resumo: "registradas, corrigidas e canceladas" -> "... e excluídas"; descricao: abre "com os lançamentos do mês atual".
- Lancamentos: "Cancelar um lançamento pelo botão Cancelar lançamento" -> "Excluir ... pelo botão Excluir lançamento da linha, depois de confirmar"; "período de Data" -> "Data, que escolhe um mês".
- Lancamentos, regras: sai "Cancelado não é uma opção..." e o destaque "Cancelar ... não o apaga ... Nenhum lançamento é removido" -> destaque "Excluir ... o apaga de vez ... pede confirmação"; Status "com as situações Pendente e Pago".
- Lancamentos, particularidades: sai "Editar um lançamento cancelado ... o reativa" e "valor riscado"; entram o seletor do filtro Data (abre no mes atual, Ano anterior/Próximo ano, 1o ao ultimo dia) e "remova o rótulo Data ... ou Limpar filtros"; volta do cadastro "inclusive o mês do filtro Data ou a falta dele".
- Lancamentos, acoes: linha "Cancelar lançamento" -> "Excluir lançamento" (confirmacao, aviso "Lançamento excluído com sucesso", Cancelar desiste); Limpar filtros inclui o mes; permissao "Excluir para Excluir lançamento".
- Resumo: sai "percorrem os períodos em que você tem lançamentos", as duas excecoes, "desabilitado", "exceto as canceladas", "cancelados não entram"; entram campo com seletor, passo de calendario (dez/2025 -> jan/2026), "sempre disponíveis", "Qualquer mês pode ser escolhido", mes zerado em qualquer ano, destaque "não pulam os meses sem movimento".
- Visao geral: exemplo de Sucesso -> "Lançamento excluído com sucesso"; "sem confirmação" fica so para Desativar usuario/Excluir perfil; "Excluir lançamento e Excluir categoria pedem confirmação".
- Categorias: sai "e mesmo que ele esteja cancelado". Perfis: "um cancelamento em Lançamentos" -> "a exclusão de um lançamento em Lançamentos".
- Novidades 1.0.2, Melhorias: item "Período do Resumo" **reescrito** (seletor + passo mes a mes em qualquer ano); novos "Filtro Data em Lançamentos" e "Excluir lançamento". Correcoes: novo "Filtro de data no celular".
- Novidades 1.0.2, Melhorias: item "Tabela de Lançamentos" perde "e o lançamento cancelado mostra o valor riscado" (o valor riscado deixa de existir na propria 1.0.2) -> "a data aparece em dia/mês/ano e cada categoria ganhou uma bolinha com a sua cor." Decisao do orquestrador; confirmar na validacao.

## Revisao pelo orquestrador (2026-09-30)

Skill `pipeline:revisar-textos` aplicada pelo orquestrador sobre todas as linhas acrescentadas em `documentation/content/` e `releasenotes/content/` (diff da branch): nenhuma cita infraestrutura, banco, API, enum ou processo; todas descrevem o que o usuario ve/faz; rotulos citados conferidos na tela ("Ano anterior", "Próximo ano", "Excluir lançamento", "Deseja excluir o lançamento ...", "Lançamento excluído com sucesso"). Itens de Novidades no formato "Titulo: frase". Nenhuma reescrita adicional necessaria. Liberado o commit com `FINANCEOS_TEXTOS_REVISADOS=1`.
