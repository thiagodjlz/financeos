package br.com.financeos.documentation.content;

import java.util.List;

import br.com.financeos.documentation.DocumentationArea;
import br.com.financeos.documentation.DocumentationBlock;
import br.com.financeos.documentation.DocumentationSection;

final class AuditAreaContent {

    private AuditAreaContent() {
    }

    static DocumentationArea build() {
        return new DocumentationArea(
                "audit",
                "Auditoria",
                "O histórico de quem incluiu, alterou ou excluiu cada registro e dos acessos ao sistema.",
                List.of(descricao(), funcionalidades(), campos(), regras(), particularidades(), acoes()));
    }

    private static DocumentationSection descricao() {
        return DocumentationSection.of(
                "Descrição",
                DocumentationBlock.paragraph(
                        "A tela de Auditoria, no menu Configurações, mostra o histórico do que foi feito no "
                                + "sistema: cada inclusão, alteração e exclusão de lançamentos, categorias, usuários "
                                + "e perfis, e os acessos, como entrar, sair e abrir uma tela."),
                DocumentationBlock.paragraph(
                        "A tela abre com os registros dos últimos 30 dias, do mais recente para o mais antigo, "
                                + "com até 10 por página. Ela é só para consulta: não há botão para incluir, alterar "
                                + "ou excluir registros."));
    }

    private static DocumentationSection funcionalidades() {
        return DocumentationSection.of(
                "Funcionalidades",
                DocumentationBlock.list(
                        "Consultar quem fez cada alteração, quando, em qual tela e em qual registro.",
                        "Ver, no detalhe de uma alteração, cada campo que mudou, com o valor anterior e o novo.",
                        "Acompanhar os acessos: entradas no sistema, tentativas de entrada recusadas, saídas pelo "
                                + "botão Sair, sessões encerradas pelo tempo, ações recusadas por falta de "
                                + "permissão e a abertura de cada tela do menu.",
                        "Encontrar registros pela busca por usuário e pelos Filtros acima da tabela, Data "
                                + "inicial, Data final, Tipo, Ação e Funcionalidade, e percorrer a lista com os "
                                + "botões Anterior e Próxima."));
    }

    private static DocumentationSection campos() {
        return DocumentationSection.of(
                "Campos",
                DocumentationBlock.table(
                        List.of("Coluna", "O que mostra"),
                        List.of(
                                List.of("Data e hora",
                                        "O dia e a hora da ação, com segundos, no horário do aparelho que você "
                                                + "está usando."),
                                List.of("Usuário",
                                        "Quem fez a ação, com o nome que tinha naquele momento. Numa entrada "
                                                + "recusada com um e-mail que não existe no sistema, aparece o "
                                                + "e-mail digitado."),
                                List.of("Tipo",
                                        "Alteração, Login, Login com falha, Logout, Sessão expirada, Acesso "
                                                + "negado ou Acesso à tela."),
                                List.of("Ação",
                                        "Nas alterações, Inclusão, Alteração ou Exclusão. No Acesso à tela, "
                                                + "Visualização. No Acesso negado, a ação que foi recusada."),
                                List.of("Funcionalidade", "A tela em que a ação aconteceu, como Lançamentos ou "
                                        + "Perfis."),
                                List.of("Registro",
                                        "O registro alterado, pelo nome que tinha no momento: a descrição do "
                                                + "lançamento ou o nome da categoria, do usuário ou do perfil."))),
                DocumentationBlock.paragraph(
                        "O filtro Tipo também lista Impressão, que ainda não tem registros."));
    }

    private static DocumentationSection regras() {
        return DocumentationSection.of(
                "Regras de negócio",
                DocumentationBlock.list(
                        "Os registros não podem ser alterados nem apagados por ninguém e ficam guardados sem "
                                + "prazo para expirar.",
                        "Excluir um lançamento, uma categoria ou um perfil, ou desativar um usuário, não apaga o "
                                + "histórico: os registros continuam com o nome que o item tinha na data da ação.",
                        "Desativar um usuário aparece como Alteração do campo Ativo, de Sim para Não.",
                        "Numa alteração aparecem só os campos que mudaram. Em Perfis, só as telas cujas "
                                + "permissões mudaram.",
                        "Senhas nunca aparecem: trocar só a senha de um usuário gera uma Alteração sem campos.",
                        "Uma gravação recusada, como um dado inválido ou repetido, não gera registro de "
                                + "Alteração.",
                        "A busca por usuário procura no nome e no e-mail, em qualquer parte e sem diferenciar "
                                + "maiúsculas nem acentos, mesmo para quem não pode ver a tela de Usuários.",
                        "A Data inicial não pode ser posterior à Data final: o sistema recusa com A data inicial "
                                + "não pode ser posterior à data final.",
                        "Sem Data inicial e Data final, a lista mostra todo o histórico."),
                DocumentationBlock.highlight(
                        "Só o perfil Administrador vem com a Auditoria liberada. Para outro perfil, a liberação é "
                                + "feita na tela de Perfis, que oferece apenas a coluna Ver para esta tela."));
    }

    private static DocumentationSection particularidades() {
        return DocumentationSection.of(
                "Comportamentos e particularidades",
                DocumentationBlock.list(
                        "O Acesso à tela é registrado uma vez a cada entrada numa tela do menu: abrir um "
                                + "registro, trocar de aba ou mudar de página na mesma tela não geram novo registro.",
                        "O Logout é registrado quando você usa o botão Sair. Fechar o navegador sem sair não gera "
                                + "registro.",
                        "Ao voltar a usar o sistema depois que a sessão de 12 horas terminou, fica registrada uma "
                                + "Sessão expirada.",
                        "Tocar ou clicar num registro abre o detalhe dele, com todos os dados e, nas alterações, "
                                + "a lista Campo, Anterior e Novo. O detalhe fecha pelo X, tocando fora dele ou com "
                                + "a tecla Esc.",
                        "No celular, cada registro aparece como um cartão, e os filtros ficam no painel aberto "
                                + "pelo botão Filtros."));
    }

    private static DocumentationSection acoes() {
        return DocumentationSection.of(
                "Ações",
                DocumentationBlock.table(
                        List.of("Ação", "O que acontece"),
                        List.of(
                                List.of("Tocar ou clicar no registro", "Abre o detalhe do registro, sem alterar "
                                        + "nada."),
                                List.of("Busca por usuário", "Fica sempre visível acima da tabela; aplicada, vira "
                                        + "um rótulo em Filtros ativos, que pode ser removido."),
                                List.of("Filtros", "Data inicial, Data final, Tipo, Ação e Funcionalidade; "
                                        + "aplicados, viram rótulos em Filtros ativos."),
                                List.of("Limpar filtros", "Remove todos os filtros, inclusive o período, e mostra "
                                        + "todo o histórico."),
                                List.of("Anterior / Próxima", "Troca de página mantendo os filtros."))));
    }
}
