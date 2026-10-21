package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class TransactionReportsAreaContent {

    private TransactionReportsAreaContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "transaction-reports",
                "Relatórios - Lançamentos",
                "Relatório dos seus lançamentos com filtros, agrupamentos e colunas à sua escolha, com o Saldo do "
                        + "período e o Saldo atual.",
                List.of(descricao(), funcionalidades(), campos(), regras(), particularidades(), acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "A tela Lançamentos, na seção Relatórios do menu, monta um relatório com os seus "
                                + "lançamentos. Você escolhe o período, os filtros, como agrupar e quais colunas "
                                + "aparecem, e pode salvar essa montagem como preferência para usar de novo."),
                DocumentationBlock.paragraph(
                        "No topo ficam sempre dois quadros: Saldo, que é o resultado do que passou nos filtros, e "
                                + "Saldo atual, que mostra quanto você tem hoje. Eles não podem ser escondidos."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Filtrar por Período, Categoria, Tipo, Status, Origem, Valor e Parcelamento.",
                        "Agrupar por Categoria, Tipo, Status, Origem, Dia, Mês ou Ano, em quantos níveis quiser e "
                                + "na ordem escolhida, com o subtotal de cada grupo.",
                        "Escolher as colunas: Data, Descrição, Categoria, Tipo, Status, Origem, Parcela, Valor e "
                                + "Observações.",
                        "Salvar a montagem como preferência, alterá-la, excluí-la e escolher uma para abrir a tela "
                                + "já com ela.",
                        "Imprimir o relatório ou salvá-lo em PDF pela impressão do navegador."));
    }

    private static DocumentationSection campos() {
        return DocumentationSection.of(
                "Campos",
                DocumentationBlock.table(
                        List.of("Filtro", "Como funciona"),
                        List.of(
                                List.of("Período",
                                        "Mês atual (o padrão), Mês anterior, Ano atual, Ano anterior ou "
                                                + "Personalizado. No Personalizado, a Data inicial e a Data final "
                                                + "são obrigatórias e entram no período."),
                                List.of("Categoria",
                                        "Marque uma ou mais. Sem nenhuma marcada, entram todas. Só aparece "
                                                + "para quem pode ver a tela de Categorias."),
                                List.of("Tipo", "Todos, Receita ou Despesa."),
                                List.of("Status",
                                        "Todos, Pendente ou Pago. Escolher um status deixa as receitas de fora, "
                                                + "porque receita não tem status."),
                                List.of("Origem", "Todas, Manual, Importação de planilha ou Recorrência."),
                                List.of("Valor mínimo e Valor máximo",
                                        "Opcionais; os dois valores informados entram no resultado."),
                                List.of("Parcelamento",
                                        "Todos, Parcelados (mais de uma parcela) ou À vista."))),
                DocumentationBlock.paragraph(
                        "Os filtros valem juntos: só entra o lançamento que atende a todos eles."));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O relatório mostra só os seus lançamentos.",
                        "Saldo: Receitas menos Despesas pagas de tudo o que passou nos filtros. Despesa pendente "
                                + "aparece na lista, mas não entra no Saldo. O mesmo cálculo vale para o subtotal de "
                                + "cada grupo e para o Total do período.",
                        "Saldo atual: Receitas menos Despesas pagas de 1º de outubro de 2026 até hoje, inclusive. "
                                + "Ele não muda com os filtros nem com o período escolhido.",
                        "A Data inicial não pode ser posterior à Data final: o sistema recusa com A data inicial "
                                + "não pode ser posterior à data final.",
                        "O Valor mínimo não pode ser maior que o Valor máximo, e nenhum dos dois pode ser "
                                + "negativo.",
                        "O mesmo campo não pode aparecer duas vezes no agrupamento.",
                        "É preciso escolher ao menos uma coluna; sem nenhuma, a tela avisa Escolha ao menos uma "
                                + "coluna. e não gera o relatório.",
                        "Cada preferência é sua: ninguém mais a vê. O nome é obrigatório, tem até 100 caracteres e "
                                + "não pode repetir o de outra preferência sua, mesmo com maiúsculas diferentes.",
                        "Só uma preferência abre a tela: marcar Abrir a tela com esta preferência numa delas "
                                + "desmarca a anterior."),
                DocumentationBlock.highlight(
                        "Preferência com período relativo, como Mês atual, acompanha a data: salva em outubro e "
                                + "aberta em novembro, ela mostra novembro. No Personalizado, as datas salvas são "
                                + "mantidas."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "Sem preferência marcada para abrir a tela, o relatório abre no Mês atual, sem filtros e "
                                + "com as colunas Data, Descrição, Categoria, Tipo, Status e Valor.",
                        "Sem agrupamento, os lançamentos aparecem numa lista só, por data. Com agrupamento, cada "
                                + "grupo traz o título, os lançamentos e o subtotal com Receitas, Despesas pagas e "
                                + "Saldo.",
                        "No agrupamento por Status, as receitas ficam em Sem status; por Categoria, lançamento "
                                + "antigo sem categoria fica em Sem categoria. Esses grupos vêm por último.",
                        "Marcar ou desmarcar uma coluna muda a tabela na hora, sem gerar o relatório de novo.",
                        "Todos os lançamentos do período aparecem de uma vez, sem páginas.",
                        "Uma categoria excluída sai das preferências em que estava; uma categoria inativa continua "
                                + "nelas e continua filtrando.",
                        "Se nenhum lançamento passar nos filtros, a tela mostra Nenhum lançamento no relatório, "
                                + "com o Saldo zerado e o Saldo atual preenchido.",
                        "No celular, a tabela rola para os lados dentro do próprio quadro.",
                        "Na impressão saem o menu, os filtros e os botões; ficam os quadros de saldo, o período, os "
                                + "filtros aplicados e a tabela."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Gerar relatório", "Aplica o período, os filtros e o agrupamento."),
                                List.of("Limpar filtros",
                                        "Volta ao Mês atual, sem filtros, sem agrupamento e com as colunas "
                                                + "padrão, e gera o relatório."),
                                List.of("Preferência", "Escolher uma preferência aplica a montagem dela e gera o "
                                        + "relatório."),
                                List.of("Salvar como nova", "Salva a montagem atual com o nome informado."),
                                List.of("Salvar alterações", "Grava a montagem atual na preferência escolhida."),
                                List.of("Excluir preferência",
                                        "Pede confirmação antes de agir e, confirmada, apaga a preferência de "
                                                + "vez; o relatório na tela não muda."),
                                List.of("Imprimir",
                                        "Abre a impressão do navegador, onde também dá para salvar em PDF."))),
                DocumentationBlock.highlight(
                        "Na tela de Perfis, a permissão Ver libera gerar e imprimir o relatório; Incluir, Alterar e "
                                + "Excluir valem para as preferências. Todos os perfis vêm com as quatro liberadas."));
    }
}
