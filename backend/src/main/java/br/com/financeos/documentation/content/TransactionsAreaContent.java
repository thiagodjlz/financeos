package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class TransactionsAreaContent {

    private TransactionsAreaContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "transactions",
                "Lançamentos",
                "Onde as receitas e as despesas são registradas, corrigidas e excluídas. É a origem de todos os "
                        + "números do Resumo.",
                List.of(descricao(), funcionalidades(), campos(), regras(), particularidades(), acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "A tela de Lançamentos é onde você registra cada entrada e cada saída de dinheiro. Ela "
                                + "abre na tabela com os lançamentos do mês atual, do mais recente para o mais "
                                + "antigo, com até 10 registros por página; o rodapé mostra quais estão na tela, "
                                + "como Mostrando 1–10 de 23, e o total encontrado aparece acima da tabela, como "
                                + "23 lançamentos."),
                DocumentationBlock.paragraph(
                        "A inclusão e a correção acontecem numa tela própria de cadastro: o botão Novo "
                                + "lançamento, no alto da tela, abre o cadastro em branco, e o botão Editar "
                                + "lançamento (o lápis de cada linha) abre o cadastro já preenchido com aquele "
                                + "lançamento. Tocar ou clicar num lançamento abre o detalhe dele."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Registrar uma receita ou uma despesa pelo botão Novo lançamento.",
                        "Ver o detalhe de um lançamento tocando ou clicando nele: descrição, valor, Tipo, "
                                + "Categoria, Data e Status, com os botões Editar lançamento e Excluir lançamento.",
                        "Corrigir um lançamento já registrado pelo botão Editar lançamento, que abre o cadastro "
                                + "numa tela própria.",
                        "Excluir um lançamento pelo botão Excluir lançamento, depois de confirmar.",
                        "Passar de um mês a outro pelos botões Mês anterior e Próximo mês, acima da tabela.",
                        "Mostrar só despesas ou só receitas pelos botões Todos, Despesas e Receitas, que valem na "
                                + "hora.",
                        "Encontrar lançamentos pela busca por descrição e pelos Filtros de Categoria e Status, "
                                + "combinados com o mês e o tipo escolhidos.",
                        "Percorrer o histórico página a página, com os botões Anterior e Próxima."));
    }

    private static DocumentationSection campos() {
        return DocumentationSection.of(
                "Campos",
                DocumentationBlock.paragraph(
                        "O cadastro mostra os campos nesta ordem: Tipo, Valor, Descrição, Categoria, Data e "
                                + "Status."),
                DocumentationBlock.table(
                        List.of("Campo", "Preenchimento"),
                        List.of(
                                List.of("Tipo", "Obrigatório. Despesa ou Receita, escolhido entre dois botões."),
                                List.of("Valor",
                                        "Obrigatório e maior que zero, digitado ao lado de R$ com vírgula nos "
                                                + "centavos, como 184,90. Começa vazio no cadastro novo."),
                                List.of("Descrição",
                                        "Obrigatória, com no máximo 255 caracteres. Um contador abaixo do "
                                                + "campo mostra quantos já foram usados."),
                                List.of("Categoria",
                                        "Obrigatória. A lista traz apenas categorias ativas do mesmo tipo. Se o "
                                                + "seu perfil não puder ver a tela de Categorias, a lista dá "
                                                + "lugar a um aviso de que não é possível escolher a categoria: "
                                                + "na edição, a categoria já gravada é mantida enquanto o Tipo "
                                                + "não for trocado. Ao lado da lista, uma bolinha mostra a cor "
                                                + "da categoria escolhida."),
                                List.of("Data",
                                        "Obrigatória. Começa preenchida com o dia de hoje; os botões Hoje e "
                                                + "Ontem a preenchem com um toque."),
                                List.of("Status",
                                        "Pendente ou Pago, escolhido entre dois botões. O campo só existe quando "
                                                + "o Tipo é Despesa."))));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O valor é obrigatório e precisa ser maior que zero: salvar com o campo vazio mostra O "
                                + "valor é obrigatório., um valor zero ou negativo é recusado com a mensagem O "
                                + "valor deve ser maior que zero. e um texto que não é número, como 12abc, com O "
                                + "valor informado é inválido. O sistema não corrige o que foi digitado: a "
                                + "mensagem aparece abaixo do campo.",
                        "A categoria é obrigatória e precisa ser do mesmo tipo do lançamento: usar uma categoria "
                                + "de receita em uma despesa é recusado com a mensagem A categoria deve ser do "
                                + "mesmo tipo do lançamento.",
                        "O campo Status existe apenas para despesa, com as situações Pendente e Pago. Receita não "
                                + "tem situação: ela é simplesmente registrada."),
                DocumentationBlock.highlight(
                        "Excluir um lançamento o apaga de vez: ele sai da tabela e dos totais do Resumo e não pode "
                                + "ser recuperado. Por isso o sistema pede confirmação antes de excluir."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "Trocar o Tipo com uma categoria já escolhida limpa a seleção, porque a categoria deixa de "
                                + "servir para o novo tipo. O mesmo vale para os botões Despesas e Receitas acima "
                                + "da tabela: a categoria de outro tipo sai do filtro.",
                        "Sair do cadastro pelo botão Cancelar, ou pela seta de voltar do cabeçalho, com alguma "
                                + "alteração ainda não salva abre a confirmação Deseja sair sem salvar? antes de "
                                + "descartar.",
                        "Na tabela, a data aparece como dia/mês/ano, cada categoria tem uma bolinha na cor dela "
                                + "(categorias sem cor ficam sem bolinha) e a receita sem situação mostra um traço "
                                + "na coluna Status.",
                        "A tela abre com os lançamentos do mês atual, que aparece entre os botões Mês anterior e "
                                + "Próximo mês e no rótulo do filtro Data. Tocar no mês abre um seletor com o ano "
                                + "no alto, os botões Ano anterior e Próximo ano, que trocam de ano sem limite, e "
                                + "os doze meses; escolher um mês mostra os lançamentos do primeiro ao último dia "
                                + "dele.",
                        "Para ver os lançamentos de todos os meses, remova o rótulo Data em Filtros ativos ou use "
                                + "Limpar filtros: no lugar do mês aparece Todo o período, e os botões Mês anterior "
                                + "e Próximo mês ficam desabilitados até que um mês seja escolhido.",
                        "O detalhe do lançamento fecha pelo X, tocando fora dele ou com a tecla Esc, sem alterar "
                                + "nada. Os botões Editar lançamento e Excluir lançamento da linha, no computador, "
                                + "agem direto, sem abrir o detalhe.",
                        "Em telas estreitas, como as de celular, a tabela vira uma lista de cartões agrupados "
                                + "por dia, com os títulos Hoje, Ontem e, nos demais dias, o dia da semana e a "
                                + "data, como Sábado, 10 de outubro; o ano só aparece em datas de outro ano. "
                                + "Editar e excluir ficam no detalhe, e o botão + da barra inferior também abre o "
                                + "cadastro Novo lançamento.",
                        "Em telas estreitas, como as de celular, o mês fica acima da busca e os botões Todos, "
                                + "Despesas e Receitas abaixo dela, valendo na hora. Período (um mês ou Todo o "
                                + "período), Status e Categoria ficam num painel aberto pelo botão Filtros, ao lado "
                                + "da busca: as escolhas só valem ao tocar em Aplicar, e fechar o painel sem "
                                + "aplicar mantém os filtros anteriores.",
                        "No cadastro, os botões Hoje e Ontem ficam logo abaixo da Data e mostram qual dos dois "
                                + "está escolhido.",
                        "Ao voltar do cadastro, a tabela reabre com os mesmos filtros, inclusive o mês do filtro "
                                + "Data ou a falta dele, e na mesma página em que você estava.",
                        "A busca por Descrição encontra o texto em qualquer parte e não diferencia maiúsculas nem "
                                + "acentos: acai encontra Açaí.",
                        "Uma categoria que foi desativada e já estava no lançamento continua disponível na edição, "
                                + "marcada como Inativo, para que você consiga salvar sem trocá-la.",
                        "Lançamentos antigos gravados sem categoria continuam na tabela e aparecem como "
                                + "Sem categoria; ao editá-los, é preciso escolher uma categoria para salvar.",
                        "O filtro de Categoria só aparece se o seu perfil puder ver a tela de Categorias. Sem "
                                + "essa permissão, a tabela continua mostrando normalmente a categoria de cada "
                                + "lançamento.",
                        "Sem nenhum lançamento cadastrado, a tela mostra Sem lançamentos cadastrados, com o botão "
                                + "Novo lançamento para quem pode incluir."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Novo lançamento", "Abre o cadastro Novo lançamento numa tela própria."),
                                List.of("Tocar ou clicar no lançamento",
                                        "Abre o detalhe do lançamento, sem alterar nada."),
                                List.of("Editar lançamento (linha ou detalhe)",
                                        "Abre o cadastro Editar lançamento, já preenchido, numa tela própria."),
                                List.of("Salvar lançamento (cadastro)",
                                        "Grava o lançamento e volta à tabela; durante o envio o botão mostra "
                                                + "Salvando…. Se algum campo for recusado, o cadastro continua "
                                                + "aberto com o campo destacado."),
                                List.of("Cancelar ou voltar (cadastro)", "Volta à tabela sem gravar; se houver "
                                        + "alteração pendente, pede confirmação antes de descartá-la."),
                                List.of("Excluir lançamento (linha ou detalhe)",
                                        "Pergunta Deseja excluir o lançamento, com a descrição dele. Confirmar em "
                                                + "Excluir lançamento apaga o lançamento de vez, fecha o detalhe "
                                                + "e avisa Lançamento excluído com sucesso; Cancelar desiste sem "
                                                + "apagar nada."),
                                List.of("Mês anterior / Próximo mês",
                                        "Trocam o mês do filtro Data pelo anterior ou pelo seguinte."),
                                List.of("Todos / Despesas / Receitas",
                                        "Mostram todos os lançamentos, só as despesas ou só as receitas, na hora."),
                                List.of("Filtros", "Categoria e Status ficam sempre visíveis acima da tabela e "
                                        + "valem assim que são escolhidos; cada filtro aplicado vira um rótulo em "
                                        + "Filtros ativos, que pode ser removido. No celular, abrem num painel com "
                                        + "o botão Aplicar."),
                                List.of("Limpar filtros", "Remove todos os filtros, inclusive o mês do filtro "
                                        + "Data, e volta à primeira página."),
                                List.of("Tentar novamente", "Aparece quando a lista não consegue carregar e "
                                        + "carrega a lista de novo."),
                                List.of("Anterior / Próxima", "Troca de página mantendo os filtros."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Lançamentos: Incluir para Novo lançamento, Alterar para Editar lançamento e "
                                + "Excluir para Excluir lançamento, também no detalhe."));
    }
}
