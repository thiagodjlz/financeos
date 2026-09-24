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
                        "A tela abre na tabela de usuários, com até 10 pessoas por página e, de início, só as "
                                + "ativas. O cadastro e a alteração acontecem numa tela própria, aberta pelo botão "
                                + "Incluir ou pelo botão Editar da linha."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Cadastrar uma pessoa com nome, e-mail, senha e perfil, pelo botão Incluir.",
                        "Alterar nome, e-mail, perfil e situação de quem já está cadastrado, pelo botão Editar.",
                        "Redefinir a senha de uma pessoa, sem precisar saber a senha atual.",
                        "Desativar o acesso de quem não deve mais entrar no sistema.",
                        "Encontrar pessoas pelo botão Filtros: Nome, E-mail, Perfil e Situação (Ativos, Inativos "
                                + "ou Todos), e percorrer a lista com os botões Anterior e Próxima."));
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
                                        "Ativo ou Inativo. Disponível apenas no cadastro de alteração."))),
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
                        "Você não pode desativar a sua própria conta, nem pelo botão Desativar nem mudando o "
                                + "Status para Inativo no seu cadastro: o sistema recusa com a mensagem Você não pode "
                                + "desativar a própria conta. Da mesma forma, ninguém altera o próprio perfil: "
                                + "escolher outro Perfil no seu cadastro é recusado com Você não pode alterar o "
                                + "próprio perfil. Nos dois casos nada é gravado, e a mudança precisa ser feita "
                                + "por outra pessoa com permissão na tela de Usuários."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "A lista abre filtrando a Situação Ativos, e por isso o botão mostra Filtros (1). Remover "
                                + "esse rótulo mostra também quem está inativo; Limpar filtros volta a mostrar só "
                                + "as pessoas ativas.",
                        "As buscas por Nome e por E-mail encontram o texto em qualquer parte e não diferenciam "
                                + "maiúsculas nem acentos.",
                        "Sair do cadastro pelo botão Cancelar com alguma alteração ainda não salva abre a "
                                + "confirmação Deseja sair sem salvar? antes de descartar. Deixar a senha em branco "
                                + "não conta como alteração.",
                        "Ao voltar do cadastro, a tabela reabre com os mesmos filtros e na mesma página.",
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
                                List.of("Incluir", "Abre o cadastro Novo usuário numa tela própria."),
                                List.of("Editar (linha)",
                                        "Abre o cadastro Editar usuário, já preenchido, numa tela própria."),
                                List.of("Salvar (cadastro)",
                                        "Grava o cadastro e volta à tabela. Se algum campo for recusado, o "
                                                + "cadastro continua aberto com o campo destacado."),
                                List.of("Cancelar (cadastro)", "Volta à tabela sem gravar; se houver "
                                        + "alteração pendente, pede confirmação antes de descartá-la."),
                                List.of("Desativar (linha)",
                                        "Tira o acesso da pessoa, sem apagar o cadastro."),
                                List.of("Filtros", "Mostra os critérios de busca; cada filtro aplicado vira um "
                                        + "rótulo que pode ser removido."),
                                List.of("Limpar filtros", "Volta aos filtros iniciais (só as pessoas ativas) e à "
                                        + "primeira página."),
                                List.of("Anterior / Próxima", "Troca de página mantendo os filtros."))),
                DocumentationBlock.paragraph(
                        "Cada botão só aparece se o seu perfil tiver a permissão correspondente na tela de "
                                + "Usuários."));
    }
}
