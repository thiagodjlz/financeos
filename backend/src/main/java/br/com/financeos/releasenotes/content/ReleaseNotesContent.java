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
                "Nova área \"Novidades por versão\", no menu Sobre, reunindo o que muda em cada versão.",
                "Central de Documentação: manual do sistema dentro do próprio FinanceOS, no menu Sobre.",
                "Uso completo pelo celular: menu em gaveta, tabelas em cartão, campos maiores para toque.",
                "Publicar o FinanceOS na internet com endereço próprio (HTTPS automático) ou pela rede privada "
                        + "do Tailscale, sem custo de hospedagem.");

        addIfPresent(categories, Kind.IMPROVEMENT,
                "Painel Resumo: saudação personalizada com o seu nome, conforme o horário do dia.",
                "Período do Resumo: mês por extenso; ano e mês só listam datas com lançamentos existentes.",
                "Mais segurança nas contas ao publicar na internet: administrador com nome fixo, contas de "
                        + "teste removidas do ambiente publicado.",
                "Botão \"Voltar ao topo\" nas telas longas: aparece ao rolar a página e leva de volta ao início.");

        addIfPresent(categories, Kind.FIX,
                "Contraste da borda dos campos de formulário corrigido, visível sob luz forte ou baixa visão.",
                "Tela de Usuários: não é mais possível desativar a própria conta nem trocar o próprio perfil "
                        + "ao editar a sua linha.");

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
