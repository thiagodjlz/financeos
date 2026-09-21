package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class UsersAreaContent {

    private UsersAreaContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "users",
                "Usuários",
                "Quem entra no sistema, com qual e-mail e com qual perfil de permissões.",
                List.of(descricao(), funcionalidades(), campos(), regras(), particularidades(), acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "A tela de Usuários controla quem tem acesso ao sistema. Cada pessoa entra com o próprio "
                                + "e-mail e a própria senha, e recebe um perfil que define o que ela pode ver e "
                                + "fazer."),
                DocumentationBlock.paragraph(
                        "A tela tem o formulário Novo usuário, à esquerda, e a tabela de usuários, onde a alteração "
                                + "é feita na própria linha."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Cadastrar uma pessoa com nome, e-mail, senha e perfil.",
                        "Alterar nome, e-mail, perfil e situação de quem já está cadastrado.",
                        "Redefinir a senha de uma pessoa, sem precisar saber a senha atual.",
                        "Desativar o acesso de quem não deve mais entrar no sistema."));
    }

    private static DocumentationSection campos() {
        return DocumentationSection.of(
                "Campos",
                DocumentationBlock.table(
                        List.of("Campo", "Preenchimento"),
                        List.of(
                                List.of("Nome", "Obrigatório, com no máximo 120 caracteres."),
                                List.of("E-mail",
                                        "Obrigatório, em formato válido e com no máximo 180 caracteres."),
                                List.of("Senha",
                                        "De 8 a 72 caracteres. Obrigatória no cadastro; opcional na alteração."),
                                List.of("Perfil", "Obrigatório."),
                                List.of("Status",
                                        "Ativo ou Inativo. Disponível na alteração, na linha da tabela."))),
                DocumentationBlock.highlight(
                        "Na alteração, o campo de senha vem sempre em branco e preenchê-lo é opcional: se você "
                                + "deixá-lo vazio, a senha atual da pessoa é mantida; se preenchê-lo, a senha é "
                                + "redefinida."));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "O e-mail é único no sistema. Ao repetir um e-mail já usado, o cadastro é recusado com "
                                + "E-mail já cadastrado.",
                        "Todo usuário precisa de um perfil: não existe pessoa cadastrada sem um.",
                        "O perfil escolhido precisa existir no sistema; caso contrário o cadastro é recusado com "
                                + "Perfil informado não existe.",
                        "A senha tem de 8 a 72 caracteres.",
                        "Nenhum usuário é apagado do sistema: Desativar apenas tira o acesso, e a pessoa continua "
                                + "na lista com a situação Inativo.",
                        "Quem está inativo não consegue entrar, mesmo com a senha correta."),
                DocumentationBlock.highlight(
                        "Você não pode desativar a sua própria conta pelo botão Desativar: o sistema recusa com "
                                + "a mensagem Você não pode desativar a própria conta. A desativação precisa ser "
                                + "feita por outra pessoa com permissão na tela de Usuários."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "O formulário da esquerda serve apenas para cadastrar: a alteração acontece sempre na linha "
                                + "da tabela.",
                        "Só uma linha fica em edição por vez; o botão Editar das demais fica indisponível enquanto "
                                + "isso.",
                        "Sair da edição com alguma alteração ainda não salva abre uma confirmação antes de "
                                + "descartar.",
                        "O botão Desativar aparece somente nas linhas de quem está ativo.",
                        "Trocar o perfil de uma pessoa muda o que ela vê no menu assim que ela entrar novamente no "
                                + "sistema.",
                        "O nome cadastrado é o que aparece no rodapé do menu e na saudação do Resumo, que usa "
                                + "apenas o primeiro nome."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Salvar (formulário)", "Cadastra a pessoa e a traz para a tabela."),
                                List.of("Cancelar (formulário)",
                                        "Limpa o formulário e volta ao estado inicial. Nada é gravado."),
                                List.of("Editar (linha)", "Abre a linha para alteração, ali mesmo na tabela."),
                                List.of("Salvar (linha)", "Grava a alteração e recarrega a lista."),
                                List.of("Sair (linha)", "Abandona a edição da linha; se houver alteração "
                                        + "pendente, pede confirmação antes de descartá-la."),
                                List.of("Desativar (linha)",
                                        "Tira o acesso da pessoa, sem apagar o cadastro."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Usuários."));
    }
}
