package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class OverviewContent {

    private OverviewContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "overview",
                "Como utilizar o sistema",
                "Para que serve o FinanceOS, os conceitos que aparecem em todas as telas e como circular entre elas.",
                List.of(descricao(), conceitos(), navegacao(), acesso()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "O FinanceOS é um sistema de controle financeiro pessoal. Nele você registra o que "
                                + "recebeu e o que gastou, organiza esses registros por categoria e acompanha o "
                                + "resultado de cada mês."),
                DocumentationBlock.paragraph(
                        "Esta Central reúne, tela por tela, o que cada funcionalidade faz, quais campos existem "
                                + "e quais regras o sistema aplica. Use o índice das áreas para ir direto a uma "
                                + "tela ou o campo de busca para procurar por um assunto."));
    }

    private static DocumentationSection conceitos() {
        return DocumentationSection.of(
                "Conceitos gerais",
                DocumentationBlock.list(
                        "Lançamento: cada entrada de dinheiro (receita) ou saída (despesa), com data, descrição, "
                                + "valor, tipo e categoria.",
                        "Categoria: o rótulo que classifica um lançamento, como Salário ou Mercado. Cada categoria "
                                + "é de um tipo só, receita ou despesa.",
                        "Período: o par de mês e ano que o Resumo usa para calcular os totais.",
                        "Perfil: o conjunto de permissões que define o que uma pessoa pode ver e fazer no sistema.",
                        "Permissão: a autorização para Ver, Incluir, Alterar ou Excluir dentro de uma tela."));
    }

    private static DocumentationSection navegacao() {
        return DocumentationSection.of(
                "Como navegar",
                DocumentationBlock.paragraph(
                        "O menu à esquerda dá acesso a todas as telas. Ele fica recolhido como uma faixa de "
                                + "ícones e se abre quando o ponteiro entra nele ou quando o foco do teclado chega "
                                + "ali. Ao escolher uma tela, o menu se recolhe sozinho."),
                DocumentationBlock.list(
                        "Resumo: os totais e os gráficos do mês escolhido.",
                        "Lançamentos: o cadastro das receitas e despesas.",
                        "Cadastros: reúne a tela de Categorias.",
                        "Configurações: reúne as telas de Usuários e Perfis.",
                        "Sobre: reúne esta Central de Documentação e a tela de Novidades por versão."),
                DocumentationBlock.paragraph(
                        "Em telas estreitas, como as de celular, o menu vira uma gaveta que abre pelo botão Menu "
                                + "no alto da tela e fecha ao escolher um item ou ao pressionar a tecla Esc."),
                DocumentationBlock.paragraph(
                        "Nas telas longas, ao rolar a página aparece no canto inferior direito o botão Voltar ao "
                                + "topo, que leva de volta ao início da tela."));
    }

    private static DocumentationSection acesso() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O menu mostra somente as telas que o seu perfil pode ver: sem a permissão Ver, a tela não "
                                + "aparece na lista.",
                        "Esconder o item do menu não é a trava: digitar o endereço da tela também é recusado, com "
                                + "um aviso e o retorno para uma tela permitida.",
                        "Quem confere cada permissão é o servidor, a cada pedido de informação; a tela apenas "
                                + "reflete o que ele autoriza.",
                        "A sessão dura 12 horas. Depois disso o sistema pede que você entre novamente."),
                DocumentationBlock.highlight(
                        "Se uma tela ou um botão de que você precisa não aparece, fale com o administrador do "
                                + "sistema: o ajuste é feito na tela de Perfis, e não nesta Central."));
    }
}
