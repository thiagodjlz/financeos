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
                                + "recebeu, o que gastou, o que ainda está em aberto e quanto sobrou. Também mostra "
                                + "quanto você juntou desde 1º de outubro de 2026, somando o que sobrou de cada "
                                + "mês."),
                DocumentationBlock.paragraph(
                        "Nada é cadastrado aqui: a tela apenas lê os lançamentos já registrados e os apresenta em "
                                + "quadros, gráfico e listas. Todos os números são sempre os seus — lançamentos "
                                + "de outras pessoas nunca entram na conta."),
                DocumentationBlock.paragraph(
                        "No computador, a tela se divide em duas colunas: numa ficam o Saldo do mês e a Evolução "
                                + "anual; na outra, o quadro Pendentes e o painel Por categoria. No celular, tudo "
                                + "fica numa coluna só, nesta ordem: Saldo do mês, Pendentes, Por categoria e "
                                + "Evolução anual."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Quadro Saldo do mês, com o saldo, uma barra com a frase Despesas pagas equivalem a 29,3% "
                                + "das receitas, as linhas Saldo anterior e Saldo acumulado e, logo abaixo, as "
                                + "Receitas (entradas no mês) e as Despesas (já pagas no mês).",
                        "Quadro Pendentes · despesas a pagar, com a soma das despesas em aberto do mês e o atalho "
                                + "Ver pendentes (no celular, só Ver), que abre Lançamentos já filtrado.",
                        "Gráfico Evolução anual, com os doze meses do ano do período escolhido e o mês do período "
                                + "em destaque.",
                        "Painel Por categoria, com as categorias do mês, alternando entre Despesas e Receitas, e a "
                                + "fatia de cada uma no total, como 8,7%.",
                        "Campo do período, com um seletor de mês, e botões Mês anterior e Próximo mês, que trocam "
                                + "o período e refazem todos os números da tela.",
                        "Botão Novo lançamento, ao lado do período, que abre o cadastro de lançamento. No celular, "
                                + "esse papel é do botão + da barra inferior.",
                        "Saudação como título da tela, com o seu primeiro nome e um cumprimento que muda conforme "
                                + "a hora do dia."));
    }

    private static DocumentationSection filtros() {
        return DocumentationSection.of(
                "Filtros",
                DocumentationBlock.paragraph(
                        "O período exibido aparece no alto da tela, como Setembro de 2026, num campo entre os "
                                + "botões Mês anterior e Próximo mês. A tela abre no mês corrente."),
                DocumentationBlock.list(
                        "Mês anterior e Próximo mês andam um mês por vez no calendário e viram o ano quando "
                                + "preciso: de Dezembro de 2025, Próximo mês leva a Janeiro de 2026. Os dois "
                                + "botões ficam sempre disponíveis.",
                        "Tocar no campo do período abre um seletor com o ano no alto, os botões Ano anterior e "
                                + "Próximo ano, que trocam de ano sem limite, e os doze meses, sem dias. Escolher um "
                                + "mês fecha o seletor e atualiza a tela.",
                        "Qualquer mês pode ser escolhido, tenha ele lançamentos ou não."));
    }

    private static DocumentationSection indicadores() {
        return DocumentationSection.of(
                "Indicadores e cálculos",
                DocumentationBlock.table(
                        List.of("Indicador", "O que entra na conta"),
                        List.of(
                                List.of("Receitas", "Soma das receitas do mês."),
                                List.of("Despesas", "Soma apenas das despesas com situação Pago no mês."),
                                List.of("Pendentes", "Soma apenas das despesas com situação Pendente no mês."),
                                List.of("Saldo do mês", "Receitas menos Despesas pagas."),
                                List.of("Saldo anterior",
                                        "Soma do Saldo do mês de cada mês desde outubro de 2026 até o mês "
                                                + "anterior ao escolhido. Num mês futuro, a soma para no mês "
                                                + "atual. Antes de outubro de 2026, fica em zero."),
                                List.of("Saldo acumulado",
                                        "Saldo anterior mais o Saldo do mês. Pode ficar negativo."),
                                List.of("Despesas pagas equivalem a",
                                        "Despesas pagas divididas pelas Receitas do mês, com uma casa decimal. "
                                                + "Passa de 100% quando as despesas pagas superam as receitas, "
                                                + "como 130,0%; nesse caso a barra fica cheia. Sem receitas no "
                                                + "mês, a frase dá lugar a Sem receitas no mês e a barra fica "
                                                + "vazia."),
                                List.of("Fatia da categoria",
                                        "Valor da categoria dividido pelo total do mesmo tipo no painel Por "
                                                + "categoria, com uma casa decimal."))),
                DocumentationBlock.highlight(
                        "Despesa pendente não reduz o Saldo e não entra em Despesas: ela aparece somente no "
                                + "quadro Pendentes. Marcar a despesa como Paga é o que a faz entrar no cálculo do "
                                + "Saldo."));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O Saldo é sempre Receitas menos as Despesas pagas do mês; despesas em aberto ficam de fora.",
                        "Despesas pendentes aparecem em um único lugar da tela: o quadro Pendentes.",
                        "Um lançamento excluído em Lançamentos deixa de contar em todos os totais, inclusive no "
                                + "Saldo acumulado dos meses seguintes. Alterar o valor ou a data de um lançamento "
                                + "antigo também muda o acumulado na mesma hora.",
                        "O Saldo acumulado vale a partir de 1º de outubro de 2026, igual para todos: lançamentos "
                                + "de datas anteriores nunca entram no Saldo anterior, e nos meses antes de outubro "
                                + "de 2026 o Saldo acumulado é igual ao Saldo do mês.",
                        "O que sobra de cada mês (Receitas menos Despesas pagas) passa para o mês seguinte. Um mês "
                                + "com saldo negativo desconta do acumulado, e essa diferença também segue adiante.",
                        "Despesas pendentes não entram no Saldo anterior; passam a contar quando marcadas como "
                                + "Pagas.",
                        "Ao abrir um mês futuro, o Saldo anterior soma só até o mês atual: os meses entre o atual "
                                + "e o escolhido, que ainda não aconteceram, ficam de fora.",
                        "Um mês sem lançamentos não é erro, em qualquer ano: a tela mostra todos os valores "
                                + "zerados e o painel Por categoria exibe o aviso Sem dados no período.",
                        "O atalho Ver pendentes só aparece para quem pode ver a tela de Lançamentos, e o botão "
                                + "Novo lançamento, para quem pode incluir lançamentos. Sem a permissão, o quadro "
                                + "Pendentes continua mostrando o valor."),
                DocumentationBlock.highlight(
                        "Os botões e o seletor não pulam os meses sem movimento: chegar a um mês zerado é "
                                + "esperado e não indica erro."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "O gráfico Evolução anual sempre desenha os doze meses do ano escolhido, mesmo os que não "
                                + "têm movimento. O mês do período aparece com uma faixa de fundo e o nome em "
                                + "negrito.",
                        "A linha de saldo do gráfico mostra o saldo de cada mês isolado, e não um acumulado do ano. "
                                + "O Saldo acumulado aparece só no quadro Saldo do mês e no quadro abaixo do "
                                + "gráfico.",
                        "Essa linha termina no último mês que teve movimento, para não sugerir saldo zero em um mês "
                                + "que ainda não aconteceu.",
                        "Passar o ponteiro sobre o gráfico, tocá-lo ou percorrê-lo com as setas do teclado abre "
                                + "um informativo com a receita, a despesa e o saldo daquele mês.",
                        "Um quadro logo abaixo do gráfico mostra a receita, a despesa, o saldo e o acumulado do "
                                + "mês do período, com uma dica: no celular, Toque em um mês do gráfico para ver os "
                                + "valores. No computador, a dica é Clique em um mês do gráfico para ver os "
                                + "valores. Tocar ou clicar em outro mês troca o quadro para ele, e trocar o "
                                + "período o devolve ao mês do período.",
                        "No painel Por categoria, cada categoria aparece com a fatia dela, o valor do mês, uma "
                                + "bolinha e uma barra na cor dela; a barra mais longa é a da categoria de maior "
                                + "valor.",
                        "Como cada fatia é arredondada em uma casa decimal, a soma delas pode dar 99,9% ou 100,1%.",
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
                        "Mês anterior e Próximo mês: recarregam os quadros, o gráfico e o painel Por categoria no "
                                + "mês anterior ou no seguinte.",
                        "Campo do período: abre o seletor de mês; escolher um mês recarrega os quadros, o gráfico "
                                + "e o painel Por categoria daquele mês.",
                        "Ver pendentes: abre Lançamentos no mês do Resumo, mostrando só as despesas com situação "
                                + "Pendente. Os filtros que estavam em Lançamentos dão lugar a esses.",
                        "Novo lançamento: abre o cadastro de lançamento.",
                        "Despesas e Receitas, no painel Por categoria: trocam as categorias exibidas, sem "
                                + "recarregar a tela.",
                        "Abrir o informativo de um mês do gráfico, pelo ponteiro, pelo toque ou pelas setas do "
                                + "teclado."),
                DocumentationBlock.paragraph(
                        "Não há botão de atualizar: a tela se recarrega sozinha a cada troca de mês."));
    }
}
