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
                        "O menu à esquerda fica sempre aberto e dá acesso a todas as telas, organizadas em "
                                + "seções. O botão Recolher menu, ao lado do nome do sistema, reduz o menu a uma "
                                + "faixa de ícones; o mesmo botão, agora Expandir menu, o abre de novo. No rodapé "
                                + "do menu ficam as suas iniciais, o seu nome, a versão do sistema e o botão Sair."),
                DocumentationBlock.list(
                        "Resumo: os totais e os gráficos do mês escolhido.",
                        "Lançamentos: o cadastro das receitas e despesas.",
                        "Cadastros: seção com a tela de Categorias.",
                        "Configurações: seção com as telas de Usuários e Perfis.",
                        "Sobre: seção com esta Central de Documentação e a tela de Novidades por versão."),
                DocumentationBlock.paragraph(
                        "Em telas estreitas, como as de celular, o menu dá lugar a uma barra fixa na parte de "
                                + "baixo da tela, com Resumo, Lançamentos, o botão + (Novo lançamento) e Mais. O "
                                + "item Mais abre um painel com as demais telas, nas mesmas seções do menu "
                                + "(Cadastros, Configurações e Sobre); o painel fecha ao escolher um item, ao tocar "
                                + "fora dele ou ao pressionar a tecla Esc. O botão Sair fica no painel Mais."));
    }

    private static DocumentationSection acesso() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O menu mostra somente as telas que o seu perfil pode ver: sem a permissão Ver, a tela não "
                                + "aparece na lista.",
                        "No celular, o botão + só aparece para quem pode incluir lançamentos, e o painel Mais "
                                + "mostra só as telas que o seu perfil pode ver. O item Mais aparece sempre, porque "
                                + "é nele que fica o botão Sair.",
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
