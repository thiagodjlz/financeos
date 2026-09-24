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
                        "A tela abre na tabela de perfis, com até 10 por página. O nome do perfil e a matriz de "
                                + "permissões ficam numa tela própria de cadastro, aberta pelo botão Incluir ou pelo "
                                + "botão Editar da linha."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Criar um perfil pelo botão Incluir e marcar, na matriz, o que ele pode fazer em cada "
                                + "tela.",
                        "Alterar as permissões de um perfil existente pelo botão Editar da linha.",
                        "Excluir um perfil que não esteja sendo usado por ninguém.",
                        "Encontrar perfis pelo botão Filtros, buscando pelo Nome, e percorrer a lista com os "
                                + "botões Anterior e Próxima."));
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
                                                + "a exclusão de uma categoria sem lançamentos em Categorias, uma "
                                                + "desativação em Usuários e a remoção do perfil sem uso em "
                                                + "Perfis."))),
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
                        "Sair do cadastro pelo botão Cancelar com alguma alteração ainda não salva, inclusive um "
                                + "único interruptor da matriz, abre a confirmação Deseja sair sem salvar? antes de "
                                + "descartar. Sem alteração, o Cancelar volta direto à tabela.",
                        "Ao voltar do cadastro, a tabela reabre com o mesmo filtro e na mesma página.",
                        "A busca por Nome encontra o texto em qualquer parte e não diferencia maiúsculas nem "
                                + "acentos.",
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
                                List.of("Incluir", "Abre o cadastro Novo perfil numa tela própria."),
                                List.of("Editar (linha)",
                                        "Abre o cadastro Editar perfil, já preenchido, numa tela própria."),
                                List.of("Salvar (cadastro)",
                                        "Grava o nome e a matriz inteira de permissões do perfil e volta à "
                                                + "tabela."),
                                List.of("Cancelar (cadastro)", "Volta à tabela sem gravar; se houver "
                                        + "alteração pendente, pede confirmação antes de descartá-la."),
                                List.of("Excluir (linha)",
                                        "Remove o perfil, desde que nenhum usuário o esteja usando."),
                                List.of("Filtros", "Mostra a busca por Nome; o filtro aplicado vira um rótulo que "
                                        + "pode ser removido."),
                                List.of("Anterior / Próxima", "Troca de página mantendo o filtro."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Perfis."));
    }
}
