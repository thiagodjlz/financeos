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
                        "A tela abre na tabela Últimos registros, com até 10 categorias por página e, de início, "
                                + "só as ativas. A criação e a alteração acontecem numa tela própria de cadastro, "
                                + "aberta pelo botão Incluir ou pelo botão Editar da linha."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Criar uma categoria de receita ou de despesa pelo botão Incluir.",
                        "Alterar nome, tipo, cor e situação de uma categoria existente pelo botão Editar da linha.",
                        "Desativar uma categoria que não deve mais ser oferecida em novos lançamentos.",
                        "Reativar uma categoria desativada: a edição abre com a Situação Inativo e basta trocar "
                                + "para Ativo.",
                        "Excluir definitivamente uma categoria que não é usada por nenhum lançamento.",
                        "Encontrar categorias pelo botão Filtros: Nome, Tipo e Situação (Ativos, Inativos ou "
                                + "Todos), e percorrer a lista com os botões Anterior e Próxima."));
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
                        "A lista abre filtrando a Situação Ativos, e por isso o botão mostra Filtros (1). Remover "
                                + "esse rótulo mostra todas as categorias; Limpar filtros volta a mostrar só as "
                                + "ativas.",
                        "A busca por Nome encontra o texto em qualquer parte e não diferencia maiúsculas nem "
                                + "acentos.",
                        "Sair do cadastro pelo botão Cancelar com alguma alteração ainda não salva abre a "
                                + "confirmação Deseja sair sem salvar? antes de descartar.",
                        "Ao voltar do cadastro, a tabela reabre com os mesmos filtros e na mesma página.",
                        "Uma categoria inativa que já estava em um lançamento continua disponível na edição daquele "
                                + "lançamento, marcada como Inativo, para que ele possa ser salvo sem troca de "
                                + "categoria."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Incluir", "Abre o cadastro Nova categoria numa tela própria."),
                                List.of("Editar (linha)",
                                        "Abre o cadastro Editar categoria, já preenchido, numa tela própria."),
                                List.of("Salvar (cadastro)",
                                        "Grava a categoria e volta à tabela. Se algum campo for recusado, o "
                                                + "cadastro continua aberto com o campo destacado."),
                                List.of("Cancelar (cadastro)", "Volta à tabela sem gravar; se houver "
                                        + "alteração pendente, pede confirmação antes de descartá-la."),
                                List.of("Excluir (linha)", "Pede confirmação citando o nome da categoria. "
                                        + "Confirmada, a categoria é excluída definitivamente e a lista é "
                                        + "recarregada; se ela estiver em uso, nada é excluído e o aviso mostra "
                                        + "quantos lançamentos a usam."),
                                List.of("Filtros", "Mostra os critérios de busca; cada filtro aplicado vira um "
                                        + "rótulo que pode ser removido."),
                                List.of("Limpar filtros", "Volta aos filtros iniciais (só as ativas) e à primeira "
                                        + "página."),
                                List.of("Anterior / Próxima", "Troca de página mantendo os filtros."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Categorias."));
    }
}
