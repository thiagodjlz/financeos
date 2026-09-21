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
                        "A tela de Lançamentos é onde você registra cada entrada e cada saída de dinheiro. Ela tem "
                                + "duas partes: o formulário Novo lançamento, à esquerda, e a tabela Últimos "
                                + "lançamentos, com o que já foi registrado."),
                DocumentationBlock.paragraph(
                        "A tabela lista os seus lançamentos do mais recente para o mais antigo e é também onde a "
                                + "correção acontece: a edição é feita na própria linha, sem abrir outra tela."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Registrar uma receita ou uma despesa pelo formulário Novo lançamento.",
                        "Corrigir um lançamento já registrado, editando a própria linha da tabela.",
                        "Cancelar um lançamento pelo botão Cancelar da linha.",
                        "Consultar o histórico completo na tabela Últimos lançamentos."));
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
                                        "Obrigatória. A lista traz apenas categorias ativas do mesmo tipo."))));
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
                        "Só uma linha fica em edição por vez; o botão Editar das demais fica indisponível enquanto "
                                + "isso.",
                        "Sair da edição com alguma alteração ainda não salva abre uma confirmação antes de "
                                + "descartar.",
                        "Uma categoria que foi desativada e já estava no lançamento continua disponível na edição, "
                                + "marcada como Inativo, para que você consiga salvar sem trocá-la.",
                        "Lançamentos antigos gravados sem categoria continuam na tabela e aparecem como "
                                + "Sem categoria; ao editá-los, é preciso escolher uma categoria para salvar."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Salvar (formulário)", "Registra o lançamento e o traz para a tabela."),
                                List.of("Cancelar (formulário)",
                                        "Limpa o formulário e volta ao estado inicial. Nada é gravado."),
                                List.of("Editar (linha)", "Abre a linha para correção, ali mesmo na tabela."),
                                List.of("Salvar (linha)", "Grava a correção e recarrega a lista."),
                                List.of("Sair (linha)", "Abandona a edição da linha; se houver alteração "
                                        + "pendente, pede confirmação antes de descartá-la."),
                                List.of("Cancelar (linha)",
                                        "Passa o lançamento à situação Cancelado, sem apagá-lo."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Lançamentos."));
    }
}
