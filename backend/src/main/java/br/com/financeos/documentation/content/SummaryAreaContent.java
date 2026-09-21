package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class SummaryAreaContent {

    private SummaryAreaContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "dashboard",
                "Resumo",
                "O painel de abertura do sistema: os totais do mês escolhido, a evolução do ano e as categorias "
                        + "que mais pesaram.",
                List.of(descricao(), funcionalidades(), filtros(), indicadores(), regras(), particularidades(),
                        acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "O Resumo é a tela de abertura do sistema. Ele consolida, para um único mês, o que você "
                                + "recebeu, o que gastou, o que ainda está em aberto e quanto sobrou."),
                DocumentationBlock.paragraph(
                        "Nada é cadastrado aqui: a tela apenas lê os lançamentos já registrados e os apresenta em "
                                + "indicadores, gráfico e listas. Todos os números são sempre os seus — lançamentos "
                                + "de outras pessoas nunca entram na conta."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Quatro indicadores no alto da tela: Receitas, Despesas, Pendentes e Saldo.",
                        "Gráfico Evolução anual, com os doze meses do ano escolhido.",
                        "Painel Detalhamento, com as categorias do mês separadas em Receitas e Despesas.",
                        "Seleção de Ano e de Mês, que refaz todos os números da tela.",
                        "Saudação no alto da tela, com o seu primeiro nome e um cumprimento que muda conforme "
                                + "a hora do dia."));
    }

    private static DocumentationSection filtros() {
        return DocumentationSection.of(
                "Filtros",
                DocumentationBlock.paragraph(
                        "Os campos Ano e Mês, no alto da tela, definem o período exibido. Os dois são listas de "
                                + "opções: você escolhe entre os períodos que o sistema oferece, sem digitar."),
                DocumentationBlock.list(
                        "A lista de anos traz os anos em que você tem lançamentos.",
                        "A lista de meses traz os meses com lançamentos dentro do ano escolhido.",
                        "Ao trocar de ano, se o mês selecionado não existir no ano novo, o sistema reposiciona a "
                                + "seleção no maior mês disponível daquele ano."));
    }

    private static DocumentationSection indicadores() {
        return DocumentationSection.of(
                "Indicadores e cálculos",
                DocumentationBlock.table(
                        List.of("Indicador", "O que entra na conta"),
                        List.of(
                                List.of("Receitas", "Soma das receitas do mês, exceto as canceladas."),
                                List.of("Despesas", "Soma apenas das despesas com situação Pago no mês."),
                                List.of("Pendentes", "Soma apenas das despesas com situação Pendente no mês."),
                                List.of("Saldo", "Receitas menos Despesas pagas."))),
                DocumentationBlock.highlight(
                        "Despesa pendente não reduz o Saldo e não entra no indicador Despesas: ela aparece somente "
                                + "no indicador Pendentes. Marcar a despesa como Paga é o que a faz entrar no "
                                + "cálculo do Saldo."));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O Saldo é sempre Receitas menos as Despesas pagas do mês; despesas em aberto ficam de fora.",
                        "Despesas pendentes aparecem em um único lugar da tela: o indicador Pendentes.",
                        "Lançamentos cancelados não entram em nenhum total.",
                        "Um mês sem lançamentos não é erro: a tela abre com todos os valores zerados e cada painel "
                                + "exibe o aviso Sem dados no período.",
                        "Um ano em que você não tem nenhum lançamento é recusado, com o aviso Não há lançamentos "
                                + "no ano informado. O mês vazio, ao contrário, abre normalmente, apenas zerado."),
                DocumentationBlock.paragraph(
                        "A seleção de Ano e Mês oferece os períodos em que você tem lançamentos, com três exceções "
                                + "que valem sempre:"),
                DocumentationBlock.list(
                        "O ano corrente sempre aparece na lista de anos, mesmo que você ainda não tenha nenhum "
                                + "lançamento nele.",
                        "Dentro do ano corrente, o mês corrente sempre aparece na lista de meses, tenha ele "
                                + "movimento ou não.",
                        "Um lançamento cancelado continua contando como período disponível: o mês dele permanece na "
                                + "lista, ainda que não some nada nos indicadores."),
                DocumentationBlock.highlight(
                        "Filtrar os meses é disponibilidade de lista, não validação: o mês oferecido pode estar "
                                + "zerado, e isso é esperado."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "O gráfico Evolução anual sempre desenha os doze meses do ano escolhido, mesmo os que não "
                                + "têm movimento.",
                        "A linha de saldo do gráfico mostra o saldo de cada mês isolado, e não um acumulado do ano.",
                        "Essa linha termina no último mês que teve movimento, para não sugerir saldo zero em um mês "
                                + "que ainda não aconteceu.",
                        "Passar o ponteiro sobre o gráfico, tocá-lo ou percorrê-lo com as setas do teclado abre "
                                + "um informativo com a receita, a despesa e o saldo daquele mês.",
                        "No painel Detalhamento, o número ao lado de Receitas e de Despesas é a quantidade de "
                                + "categorias distintas no mês, e não o valor somado.",
                        "Lançamentos antigos gravados sem categoria aparecem no Detalhamento agrupados como "
                                + "Sem categoria."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.list(
                        "Trocar o Ano: recarrega a tela inteira no ano escolhido.",
                        "Trocar o Mês: recarrega os indicadores e o Detalhamento no mês escolhido.",
                        "Abrir o informativo de um mês do gráfico, pelo ponteiro, pelo toque ou pelas setas do "
                                + "teclado."),
                DocumentationBlock.paragraph(
                        "Não há botão de atualizar: a tela se recarrega sozinha a cada troca de Ano ou de Mês."));
    }
}
