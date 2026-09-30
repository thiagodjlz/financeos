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
                List.of(descricao(), conceitos(), navegacao(), acesso(), entrada(), semAcesso(), avisos(),
                        listas(), central(), novidades()));
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
                        "O sistema confere a permissão a cada acesso; a tela apenas reflete o que ele "
                                + "autoriza.",
                        "A sessão dura 12 horas. Depois disso o sistema pede que você entre novamente."),
                DocumentationBlock.highlight(
                        "Se uma tela ou um botão de que você precisa não aparece, fale com o administrador do "
                                + "sistema: o ajuste é feito na tela de Perfis, e não nesta Central."));
    }

    private static DocumentationSection entrada() {
        return DocumentationSection.of(
                "Entrar no sistema",
                DocumentationBlock.paragraph(
                        "Para entrar, informe o seu E-mail e a sua Senha e use o botão Entrar. O botão Mostrar "
                                + "senha, dentro do campo Senha, exibe o que foi digitado; usado de novo, agora como "
                                + "Ocultar senha, volta a esconder a senha."),
                DocumentationBlock.list(
                        "E-mail ou senha errados são recusados com o Alerta Credenciais inválidas. Tente "
                                + "novamente. O mesmo aviso aparece para quem está inativo, mesmo que a senha "
                                + "esteja correta.",
                        "Depois de entrar, abre a primeira tela que o seu perfil pode ver, na ordem do menu: "
                                + "Resumo, Lançamentos, Categorias, Usuários, Perfis, Documentação e Novidades por "
                                + "versão.",
                        "Se o seu perfil não pode ver nenhuma tela, abre a tela Sem acesso."));
    }

    private static DocumentationSection semAcesso() {
        return DocumentationSection.of(
                "Tela Sem acesso",
                DocumentationBlock.paragraph(
                        "A tela Sem acesso aparece para quem entra com um perfil que não pode ver nenhuma tela. "
                                + "Ela mostra a mensagem Seu perfil não tem acesso a nenhuma tela. Fale com o "
                                + "administrador. O botão Sair continua disponível no rodapé do menu e, no celular, "
                                + "no painel Mais. Quem libera as telas é o administrador, na tela de Perfis."));
    }

    private static DocumentationSection avisos() {
        return DocumentationSection.of(
                "Avisos do sistema",
                DocumentationBlock.paragraph(
                        "O resultado das ações aparece em avisos sobre a tela, cada um com um título que indica "
                                + "o tipo:"),
                DocumentationBlock.list(
                        "Sucesso: a ação deu certo, como em Lançamento excluído com sucesso. Fecha sozinho "
                                + "depois de alguns segundos.",
                        "Alerta: algo que você pode resolver, como um dado recusado, uma ação que o seu perfil "
                                + "não permite ou a sessão encerrada. Também fecha sozinho, mas fica mais tempo "
                                + "na tela.",
                        "Falha: um erro inesperado ou a perda de conexão, como Erro inesperado do sistema. Tente "
                                + "novamente em instantes. Não fecha sozinho.",
                        "Todo aviso pode ser fechado pelo botão Fechar aviso. No máximo três ficam na tela ao "
                                + "mesmo tempo: quando chega um quarto, o mais antigo sai."),
                DocumentationBlock.paragraph("Algumas situações valem para todas as telas:"),
                DocumentationBlock.list(
                        "Quando a sessão de 12 horas termina, o sistema volta à tela de entrada com o Alerta Sua "
                                + "sessão expirou. Entre novamente.",
                        "Ao abrir pelo endereço uma tela que o seu perfil não pode ver, aparece o Alerta Você não "
                                + "tem permissão para acessar esta tela. e o sistema abre a primeira tela permitida.",
                        "Uma ação que o seu perfil não permite é recusada com o Alerta Você não tem permissão "
                                + "para realizar esta ação.",
                        "Desativar usuário e Excluir perfil agem na hora, sem confirmação, e mostram o aviso de "
                                + "Sucesso. Entre os botões das linhas das listas, Excluir lançamento e Excluir "
                                + "categoria pedem confirmação antes de agir."));
    }

    private static DocumentationSection listas() {
        return DocumentationSection.of(
                "Listas sem resultado ou com falha",
                DocumentationBlock.list(
                        "Se uma lista não consegue carregar, a mensagem do problema aparece no lugar dela, em vez "
                                + "de uma lista vazia.",
                        "Quando a busca ou os filtros não encontram nenhum registro, a lista mostra Nenhum "
                                + "registro encontrado. Se algum filtro estiver diferente do inicial, aparece junto "
                                + "o botão Limpar filtros, que volta aos filtros iniciais."));
    }

    private static DocumentationSection central() {
        return DocumentationSection.of(
                "Como usar esta Central",
                DocumentationBlock.paragraph(
                        "O índice das áreas lista esta introdução e uma área para cada tela; escolha uma área "
                                + "para ler o conteúdo dela."),
                DocumentationBlock.paragraph(
                        "O campo Buscar na documentação (Procure por uma tela, campo ou regra) filtra o conteúdo "
                                + "enquanto você digita: ficam só as áreas em que o termo aparece e, quando ele não "
                                + "está no nome nem no resumo da área, só as seções que o contêm. A busca não "
                                + "diferencia maiúsculas de minúsculas, mas diferencia acentos: escreva a palavra "
                                + "acentuada como ela aparece na tela. Se nada contém o termo, o índice mostra "
                                + "Nenhuma área corresponde à busca. e o conteúdo mostra Nenhum conteúdo encontrado "
                                + "para a sua busca."));
    }

    private static DocumentationSection novidades() {
        return DocumentationSection.of(
                "Novidades por versão",
                DocumentationBlock.paragraph(
                        "A tela Novidades por versão, no menu Sobre, reúne o que mudou no sistema. Cada versão tem "
                                + "um bloco com o título Versão e o número, do mais recente para o mais antigo, e o "
                                + "bloco da versão em uso leva o rótulo atual. Em cada bloco, as mudanças vêm em até "
                                + "três grupos: Novidades, para o que passou a existir; Melhorias, para o que ficou "
                                + "melhor; e Correções, para o que foi consertado. Grupo sem mudança não aparece."),
                DocumentationBlock.paragraph(
                        "Uma versão que ainda não tem mudanças publicadas aparece com o título e, logo abaixo, a "
                                + "mensagem Ainda não há mudanças publicadas nesta versão. Se nenhuma versão tiver "
                                + "sido publicada, a tela mostra Nenhuma novidade publicada ainda."));
    }
}
