package br.com.financeos.releasenotes.content;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import br.com.financeos.releasenotes.ReleaseNoteCategory;
import br.com.financeos.releasenotes.ReleaseNoteCategory.Kind;
import br.com.financeos.releasenotes.ReleaseNoteVersion;

public final class ReleaseNotesContent {

    private ReleaseNotesContent() {
    }

    // So existe a v1.0.1 ja cortada e nenhuma build foi publicada depois dela: todo o historico
    // desde entao cai no unico bloco 1.0.2 abaixo. Uma correcao publicada como build novo da mesma
    // versao (X.Y.Z-NN -> X.Y.Z-NN+1) entra na categoria Correcoes deste mesmo bloco, sem criar um
    // bloco novo — so cria bloco novo quando X.Y.Z muda.
    public static List<ReleaseNoteVersion> build() {
        return List.of(versao_1_0_2());
    }

    private static ReleaseNoteVersion versao_1_0_2() {
        List<ReleaseNoteCategory> categories = new ArrayList<>();

        addIfPresent(categories, Kind.NEW,
                "Novidades por versão: nova área, no menu Sobre, que reúne o que muda em cada versão.",
                "Central de Documentação: manual do sistema dentro do próprio FinanceOS, no menu Sobre.",
                "Visual novo: cores, textos, botões e campos redesenhados em todas as telas, com menu lateral "
                        + "em seções que pode ser recolhido.",
                "Uso completo pelo celular: barra de navegação na parte de baixo da tela, listas em cartões, "
                        + "filtros num painel com Aplicar e campos maiores para toque.");

        addIfPresent(categories, Kind.IMPROVEMENT,
                "Saudação no Resumo: o painel cumprimenta você pelo nome, conforme o horário do dia.",
                "Período do Resumo: botões Mês anterior e Próximo mês percorrem só os meses com "
                        + "lançamentos e o mês atual.",
                "Painel Por categoria: no Resumo, alterna entre Despesas e Receitas e mostra a cor de cada "
                        + "categoria.",
                "Excluir categoria: a tela de Categorias ganhou o botão Excluir em cada linha. Ele remove de vez "
                        + "a categoria sem lançamentos e, se ela estiver em uso, avisa quantos lançamentos a usam.",
                "Cadastros e listas: em Lançamentos, Categorias, Usuários e Perfis, os botões Novo e Editar abrem "
                        + "o cadastro numa tela própria, e as listas mostram 10 registros por página, com Filtros "
                        + "sempre visíveis acima da tabela.",
                "Tabela de Lançamentos: a data aparece em dia/mês/ano, cada categoria ganhou uma bolinha com a sua "
                        + "cor e o lançamento cancelado mostra o valor riscado.",
                "Avisos de erro: quando uma tela não consegue carregar, o aviso aparece no lugar do conteúdo, em "
                        + "vez de uma lista vazia.",
                "Busca nas listas: Lançamentos, Categorias, Usuários e Perfis ganharam busca por texto, que "
                        + "encontra o que foi digitado em qualquer parte, sem diferenciar maiúsculas nem acentos.",
                "Filtros ativos: cada filtro aplicado vira um rótulo acima da lista, que pode ser removido, e a "
                        + "busca sem resultado mostra Nenhum registro encontrado, com o botão Limpar filtros.",
                "Volta do cadastro: ao sair do cadastro, a lista reabre com os mesmos filtros e na mesma página "
                        + "em que você estava.",
                "Mostrar senha: na tela de entrada, um botão no campo Senha mostra ou esconde o que foi digitado.",
                "Contador na Descrição: o cadastro de lançamento mostra quantos dos 255 caracteres da Descrição "
                        + "já foram usados.",
                "Lançamentos por dia no celular: a lista de lançamentos é agrupada por dia, com os títulos Hoje, "
                        + "Ontem e a data dos demais dias.");

        addIfPresent(categories, Kind.FIX,
                "Campos de formulário: o contraste da borda foi corrigido, para que ela seja visível sob luz forte ou "
                        + "com baixa visão.",
                "Usuários: não é mais possível desativar a própria conta nem trocar o próprio perfil ao editar "
                        + "o seu cadastro.",
                "Entrada no sistema: quem não pode ver o Resumo passa a entrar direto na primeira tela que o seu "
                        + "perfil permite, em vez de ficar preso sem conseguir abrir nenhuma tela; sem nenhuma tela "
                        + "permitida, aparece a tela Sem acesso.");

        return new ReleaseNoteVersion("1.0.2", List.copyOf(categories));
    }

    private static void addIfPresent(List<ReleaseNoteCategory> categories, Kind kind, String... items) {
        List<String> present = Arrays.stream(items)
                .filter(item -> item != null && !item.isBlank())
                .toList();

        if (!present.isEmpty()) {
            categories.add(new ReleaseNoteCategory(kind, present));
        }
    }
}
