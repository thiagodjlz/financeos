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
                "Onde as receitas e as despesas são registradas, corrigidas e canceladas. É a origem de todos os "
                        + "números do Resumo.",
                List.of(descricao(), funcionalidades(), campos(), regras(), particularidades(), acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "A tela de Lançamentos é onde você registra cada entrada e cada saída de dinheiro. Ela "
                                + "abre na tabela Últimos lançamentos, do mais recente para o mais antigo, com até 10 "
                                + "registros por página."),
                DocumentationBlock.paragraph(
                        "A inclusão e a correção acontecem numa tela própria de cadastro: o botão Incluir, acima "
                                + "da tabela, abre o cadastro em branco, e o botão Editar de cada linha abre o "
                                + "cadastro já preenchido com aquele lançamento."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Registrar uma receita ou uma despesa pelo botão Incluir.",
                        "Corrigir um lançamento já registrado pelo botão Editar da linha, que abre o cadastro "
                                + "numa tela própria.",
                        "Cancelar um lançamento pelo botão Cancelar da linha.",
                        "Encontrar lançamentos pelo botão Filtros: Descrição, Categoria, Tipo, Status e período "
                                + "de Data, combinados entre si.",
                        "Percorrer o histórico página a página, com os botões Anterior e Próxima."));
    }

    private static DocumentationSection campos() {
        return DocumentationSection.of(
                "Campos",
                DocumentationBlock.table(
                        List.of("Campo", "Preenchimento"),
                        List.of(
                                List.of("Data", "Obrigatória. Começa preenchida com o dia de hoje."),
                                List.of("Descrição",
                                        "Obrigatória, com no máximo 255 caracteres."),
                                List.of("Valor", "Obrigatório e maior que zero."),
                                List.of("Tipo", "Obrigatório. Despesa ou Receita."),
                                List.of("Status",
                                        "Pendente ou Pago. O campo só existe quando o Tipo é Despesa."),
                                List.of("Categoria",
                                        "Obrigatória. A lista traz apenas categorias ativas do mesmo tipo. Se o "
                                                + "seu perfil não puder ver a tela de Categorias, a lista dá "
                                                + "lugar a um aviso de que não é possível escolher a categoria: "
                                                + "na edição, a categoria já gravada é mantida enquanto o Tipo "
                                                + "não for trocado."))));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O valor precisa ser maior que zero: o sistema recusa o lançamento com a mensagem O valor "
                                + "deve ser maior que zero.",
                        "A categoria é obrigatória e precisa ser do mesmo tipo do lançamento: usar uma categoria "
                                + "de receita em uma despesa é recusado com a mensagem A categoria deve ser do "
                                + "mesmo tipo do lançamento.",
                        "O campo Status existe apenas para despesa. Receita não tem situação: ela é simplesmente "
                                + "registrada.",
                        "Cancelado não é uma opção do campo Status: essa situação só aparece quando o lançamento "
                                + "é cancelado."),
                DocumentationBlock.highlight(
                        "Cancelar um lançamento não o apaga. Ele passa à situação Cancelado, continua na tabela, "
                                + "continua podendo ser consultado e sai dos totais do Resumo. Nenhum lançamento é "
                                + "removido do sistema em momento algum."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "Trocar o Tipo com uma categoria já escolhida limpa a seleção, porque a categoria deixa de "
                                + "servir para o novo tipo.",
                        "Editar um lançamento cancelado e salvar o reativa: ele volta à situação escolhida no "
                                + "campo Status.",
                        "Sair do cadastro pelo botão Cancelar com alguma alteração ainda não salva abre a "
                                + "confirmação Deseja sair sem salvar? antes de descartar.",
                        "Ao voltar do cadastro, a tabela reabre com os mesmos filtros e na mesma página em que "
                                + "você estava.",
                        "A busca por Descrição encontra o texto em qualquer parte e não diferencia maiúsculas nem "
                                + "acentos: acai encontra Açaí.",
                        "Uma categoria que foi desativada e já estava no lançamento continua disponível na edição, "
                                + "marcada como Inativo, para que você consiga salvar sem trocá-la.",
                        "Lançamentos antigos gravados sem categoria continuam na tabela e aparecem como "
                                + "Sem categoria; ao editá-los, é preciso escolher uma categoria para salvar.",
                        "O filtro de Categoria só aparece se o seu perfil puder ver a tela de Categorias. Sem "
                                + "essa permissão, a tabela continua mostrando normalmente a categoria de cada "
                                + "lançamento."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Incluir", "Abre o cadastro Novo lançamento numa tela própria."),
                                List.of("Editar (linha)",
                                        "Abre o cadastro Editar lançamento, já preenchido, numa tela própria."),
                                List.of("Salvar (cadastro)",
                                        "Grava o lançamento e volta à tabela. Se algum campo for recusado, o "
                                                + "cadastro continua aberto com o campo destacado."),
                                List.of("Cancelar (cadastro)", "Volta à tabela sem gravar; se houver "
                                        + "alteração pendente, pede confirmação antes de descartá-la."),
                                List.of("Cancelar (linha)",
                                        "Passa o lançamento à situação Cancelado, sem apagá-lo."),
                                List.of("Filtros", "Mostra os critérios de busca. Com filtro aplicado, o botão "
                                        + "indica quantos estão ativos e cada um vira um rótulo que pode ser "
                                        + "removido."),
                                List.of("Limpar filtros", "Remove todos os filtros e volta à primeira página."),
                                List.of("Anterior / Próxima", "Troca de página mantendo os filtros."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Lançamentos."));
    }
}
