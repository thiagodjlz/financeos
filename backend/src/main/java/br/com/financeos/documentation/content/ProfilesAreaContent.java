package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class ProfilesAreaContent {

    private ProfilesAreaContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "profiles",
                "Perfis",
                "Onde se define, tela por tela, o que cada grupo de pessoas pode ver e fazer no sistema.",
                List.of(descricao(), funcionalidades(), campos(), regras(), particularidades(), acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "Um perfil é um conjunto de permissões. Em vez de liberar telas pessoa por pessoa, você "
                                + "monta perfis como Administrador ou Consulta e atribui um deles a cada usuário na "
                                + "tela de Usuários."),
                DocumentationBlock.paragraph(
                        "A tela tem o formulário à esquerda, com o nome do perfil e a matriz de permissões, e a "
                                + "lista de perfis à direita."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Criar um perfil e marcar, na matriz, o que ele pode fazer em cada tela.",
                        "Alterar as permissões de um perfil existente.",
                        "Excluir um perfil que não esteja sendo usado por ninguém."));
    }

    private static DocumentationSection campos() {
        return DocumentationSection.of(
                "Campos",
                DocumentationBlock.list(
                        "Nome: obrigatório. É o rótulo que aparece na escolha de perfil da tela de Usuários.",
                        "Matriz de permissões: uma linha por tela do sistema e quatro colunas de ação."),
                DocumentationBlock.table(
                        List.of("Coluna", "O que libera"),
                        List.of(
                                List.of("Ver", "Abrir a tela pelo menu e consultar o que há nela."),
                                List.of("Incluir", "Criar registros novos naquela tela."),
                                List.of("Alterar", "Corrigir registros existentes naquela tela."),
                                List.of("Excluir",
                                        "Executar a ação de remoção daquela tela: um cancelamento em Lançamentos, "
                                                + "uma desativação em Categorias e em Usuários, e a remoção do "
                                                + "perfil sem uso em Perfis."))),
                DocumentationBlock.paragraph(
                        "As linhas da matriz são Resumo, Lançamentos, Categorias, Usuários, Perfis, Documentação e "
                                + "Novidades por versão, na mesma ordem em que as telas aparecem no menu."));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "Sem a permissão Ver de uma tela, ela não aparece no menu e também não pode ser aberta "
                                + "digitando o endereço: o sistema avisa e leva de volta a uma tela permitida.",
                        "Salvar um perfil substitui a matriz inteira: o que vale é exatamente o que está marcado na "
                                + "tela no momento de salvar, e não apenas o que você mudou.",
                        "Um perfil em uso por algum usuário não pode ser excluído. O sistema recusa com Perfil em "
                                + "uso por usuários.",
                        "A linha Documentação tem apenas a coluna Ver, porque a Central de Documentação é somente "
                                + "para leitura: não há o que incluir, alterar ou excluir nela.",
                        "A linha Novidades por versão também tem apenas a coluna Ver, pelo mesmo motivo: é uma "
                                + "tela só de consulta.",
                        "O nome do perfil é obrigatório."),
                DocumentationBlock.highlight(
                        "Incluir, Alterar e Excluir só são exercidos por botões que ficam dentro da própria tela. "
                                + "Por isso, marcar essas três colunas sem marcar Ver não libera nada: a tela "
                                + "continua sem abrir."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "Ao alterar um perfil, o botão Cancelar age em duas etapas: o primeiro clique desfaz as "
                                + "alterações e mantém o perfil aberto; o segundo sai da alteração.",
                        "Sem nenhuma alteração pendente, o primeiro clique em Cancelar já sai da alteração.",
                        "Alterar um perfil muda o que as pessoas ligadas a ele enxergam, assim que elas "
                                + "entrarem novamente no sistema.",
                        "Quem confere cada permissão é o servidor, a cada consulta de informação: esconder um "
                                + "item do menu ou um botão é conveniência de tela, e não o que protege o dado."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Salvar", "Grava o nome e a matriz inteira de permissões do perfil."),
                                List.of("Cancelar",
                                        "Desfaz as alterações pendentes e, no clique seguinte, sai da alteração. "
                                                + "Nada é gravado."),
                                List.of("Editar (lista)", "Carrega o perfil no formulário para alteração."),
                                List.of("Excluir (lista)",
                                        "Remove o perfil, desde que nenhum usuário o esteja usando."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Perfis."));
    }
}
