package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class CategoriesAreaContent {

    private CategoriesAreaContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "categories",
                "Categorias",
                "O catálogo de rótulos que classifica cada lançamento e alimenta o Detalhamento do Resumo.",
                List.of(descricao(), funcionalidades(), campos(), regras(), particularidades(), acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "Categorias são os rótulos usados para classificar os lançamentos, como Salário, Mercado ou "
                                + "Aluguel. É por elas que o Resumo consegue mostrar onde o dinheiro entrou e "
                                + "saiu."),
                DocumentationBlock.paragraph(
                        "A tela tem o formulário Nova categoria, à esquerda, e a tabela Últimos registros, onde a "
                                + "correção é feita na própria linha."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Criar uma categoria de receita ou de despesa.",
                        "Alterar nome, tipo, cor e situação de uma categoria existente, na própria linha.",
                        "Desativar uma categoria que não deve mais ser oferecida em novos lançamentos.",
                        "Reativar uma categoria desativada.",
                        "Excluir definitivamente uma categoria que não é usada por nenhum lançamento."));
    }

    private static DocumentationSection campos() {
        return DocumentationSection.of(
                "Campos",
                DocumentationBlock.table(
                        List.of("Campo", "Preenchimento"),
                        List.of(
                                List.of("Nome", "Obrigatório."),
                                List.of("Tipo", "Obrigatório. Despesa ou Receita."),
                                List.of("Cor", "Obrigatória. Identifica a categoria na tabela e no Resumo."),
                                List.of("Situação", "Obrigatória. Ativo ou Inativo."))),
                DocumentationBlock.paragraph(
                        "Os quatro campos valem tanto para criar quanto para alterar: nenhum deles pode ficar em "
                                + "branco ao salvar."));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "As categorias são um catálogo compartilhado do sistema: hoje elas não pertencem a um "
                                + "usuário, e todas as pessoas com permissão de ver Categorias enxergam a mesma "
                                + "lista.",
                        "Nome e tipo não podem se repetir. Ao tentar repetir, o sistema recusa com Já existe uma "
                                + "categoria com esse nome e tipo.",
                        "Como a combinação é nome mais tipo, o mesmo nome pode existir uma vez como receita e uma "
                                + "vez como despesa.",
                        "Excluir uma categoria a remove definitivamente do sistema, esteja ela ativa ou inativa. "
                                + "A exclusão não pode ser desfeita.",
                        "Uma categoria usada por algum lançamento não pode ser excluída, qualquer que seja a pessoa "
                                + "dona do lançamento e mesmo que ele esteja cancelado. O sistema recusa com Não é "
                                + "possível excluir a categoria e informa quantos lançamentos a usam.",
                        "Para tirar uma categoria de uso sem excluí-la, o caminho é o campo Situação: Inativo "
                                + "desativa e Ativo reativa."),
                DocumentationBlock.highlight(
                        "Desativar uma categoria não mexe nos lançamentos que já a usavam. Ela deixa de ser "
                                + "oferecida na escolha de novos lançamentos, mas o nome dela continua aparecendo "
                                + "nos lançamentos antigos e no Resumo."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "Na tabela, a cor da categoria aparece como um ponto ao lado do nome e a situação aparece "
                                + "como uma etiqueta Ativo ou Inativo.",
                        "Só uma linha fica em edição por vez; os botões Editar e Excluir das demais ficam "
                                + "indisponíveis enquanto isso, e a linha em edição não mostra o botão Excluir.",
                        "Sair da edição com alguma alteração ainda não salva abre uma confirmação antes de "
                                + "descartar.",
                        "Uma categoria inativa que já estava em um lançamento continua disponível na edição daquele "
                                + "lançamento, marcada como Inativo, para que ele possa ser salvo sem troca de "
                                + "categoria.",
                        "O formulário da esquerda serve apenas para criar: a alteração de uma categoria existente "
                                + "acontece sempre na linha da tabela."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Salvar (formulário)", "Cria a categoria e a traz para a tabela."),
                                List.of("Cancelar (formulário)",
                                        "Limpa o formulário e volta ao estado inicial. Nada é gravado."),
                                List.of("Editar (linha)", "Abre a linha para alteração, ali mesmo na tabela."),
                                List.of("Salvar (linha)", "Grava a alteração e recarrega a lista."),
                                List.of("Sair (linha)", "Abandona a edição da linha; se houver alteração "
                                        + "pendente, pede confirmação antes de descartá-la."),
                                List.of("Excluir (linha)", "Pede confirmação citando o nome da categoria. "
                                        + "Confirmada, a categoria é excluída definitivamente e a lista é "
                                        + "recarregada; se ela estiver em uso, nada é excluído e o aviso mostra "
                                        + "quantos lançamentos a usam."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Categorias."));
    }
}
