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
                        "Quatro indicadores no alto da tela: Saldo do mês, Receitas, Despesas e Pendentes, cada "
                                + "um com uma linha que explica o que ele soma.",
                        "Gráfico Evolução anual, com os doze meses do ano do período escolhido.",
                        "Painel Por categoria, com as categorias do mês, alternando entre Despesas e Receitas.",
                        "Botões Mês anterior e Próximo mês, que trocam o período e refazem todos os números da "
                                + "tela.",
                        "Saudação como título da tela, com o seu primeiro nome e um cumprimento que muda conforme "
                                + "a hora do dia."));
    }

    private static DocumentationSection filtros() {
        return DocumentationSection.of(
                "Filtros",
                DocumentationBlock.paragraph(
                        "O período exibido aparece no alto da tela, como Setembro de 2026, entre os botões Mês "
                                + "anterior e Próximo mês. A tela abre no mês corrente, e cada botão anda um "
                                + "período por vez entre os que o sistema oferece, sem digitar."),
                DocumentationBlock.list(
                        "Os períodos oferecidos são os meses em que você tem lançamentos, em ordem de data, de "
                                + "qualquer ano.",
                        "Quando não há período antes ou depois do atual, o botão daquele lado fica desabilitado."));
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
                                List.of("Saldo do mês", "Receitas menos Despesas pagas."))),
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
                        "Um mês sem lançamentos não é erro: a tela abre com todos os valores zerados e o painel "
                                + "Por categoria exibe o aviso Sem dados no período."),
                DocumentationBlock.paragraph(
                        "Os botões Mês anterior e Próximo mês percorrem os períodos em que você tem lançamentos, "
                                + "com duas exceções que valem sempre:"),
                DocumentationBlock.list(
                        "O mês corrente sempre faz parte dos períodos, tenha ele movimento ou não.",
                        "Um lançamento cancelado continua contando como período disponível: o mês dele permanece na "
                                + "lista, ainda que não some nada nos indicadores."),
                DocumentationBlock.highlight(
                        "Um mês aparecer na lista não significa que ele tenha movimento: o mês oferecido pode "
                                + "estar zerado, e isso é esperado."));
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
                        "No painel Por categoria, cada categoria aparece com o valor do mês, uma bolinha e uma "
                                + "barra na cor dela; a barra mais longa é a da categoria de maior valor.",
                        "Categorias sem cor aparecem sem a bolinha e com a barra em cinza.",
                        "O rodapé do painel Por categoria mostra quantas categorias entram na lista e a soma "
                                + "delas.",
                        "Lançamentos antigos gravados sem categoria aparecem no painel Por categoria agrupados "
                                + "como Sem categoria."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.list(
                        "Mês anterior e Próximo mês: recarregam os indicadores, o gráfico e o painel Por "
                                + "categoria no período escolhido.",
                        "Despesas e Receitas, no painel Por categoria: trocam as categorias exibidas, sem "
                                + "recarregar a tela.",
                        "Abrir o informativo de um mês do gráfico, pelo ponteiro, pelo toque ou pelas setas do "
                                + "teclado."),
                DocumentationBlock.paragraph(
                        "Não há botão de atualizar: a tela se recarrega sozinha a cada troca de mês."));
    }
}
