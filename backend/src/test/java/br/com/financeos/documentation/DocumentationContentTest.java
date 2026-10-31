package br.com.financeos.documentation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import br.com.financeos.documentation.content.DocumentationContent;

class DocumentationContentTest {

    private static final int MAX_PARAGRAPH_LENGTH = 600;

    private static final Pattern REMOVED_OR_UNIMPLEMENTED = Pattern.compile(
            "Contas|Cartões|Cartoes|Excel|Recorrência|Recorrencia|Subcategoria",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern TECHNICAL_IDENTIFIER = Pattern.compile(
            "INCOME|EXPENSE|PENDING|PAID|CANCELED|Screen\\.|Action\\.|accessControl|@NotNull|@NotBlank"
                    + "|Panache|Flyway|ProfilePermission|localStorage|JWT");

    private static final Pattern INFRASTRUCTURE_TERM = Pattern.compile(
            "Tailscale|HTTPS|Docker|deploy|hospedagem|Flyway|migration|endpoint|\\bAPI\\b|banco de dados"
                    + "|\\btoken\\b|Caddy|Swagger|framework|JWT",
            Pattern.CASE_INSENSITIVE);

    private static final DocumentationResponse CONTENT = DocumentationContent.build();

    private static Stream<DocumentationArea> allAreas() {
        return Stream.concat(Stream.of(CONTENT.introduction()), CONTENT.areas().stream());
    }

    private static List<String> displayedTexts() {
        List<String> texts = new ArrayList<>();
        texts.add(CONTENT.title());

        allAreas().forEach(area -> {
            texts.add(area.title());
            texts.add(area.summary());

            area.sections().forEach(section -> {
                texts.add(section.title());

                section.blocks().forEach(block -> {
                    if (block.text() != null) {
                        texts.add(block.text());
                    }
                    texts.addAll(block.items());
                    if (block.table() != null) {
                        texts.addAll(block.table().columns());
                        block.table().rows().forEach(texts::addAll);
                    }
                });
            });
        });

        return texts;
    }

    @Test
    void shouldPublishIntroductionAndSevenAreas() {
        assertTrue(CONTENT.title() != null && !CONTENT.title().isBlank());
        assertTrue(CONTENT.introduction() != null);
        assertEquals(7, CONTENT.areas().size());
        assertEquals(
                List.of("Resumo", "Lançamentos", "Relatórios - Lançamentos", "Categorias", "Usuários", "Perfis",
                        "Auditoria"),
                CONTENT.areas().stream().map(DocumentationArea::title).toList());
    }

    @Test
    void shouldGiveEveryAreaAUniqueIdentifier() {
        List<String> ids = allAreas().map(DocumentationArea::id).toList();

        ids.forEach(id -> assertTrue(id != null && !id.isBlank()));
        assertEquals(ids.size(), ids.stream().distinct().count());
    }

    @Test
    void shouldPublishTheMinimumSectionsOfEveryArea() {
        CONTENT.areas().forEach(area -> {
            List<String> titles = area.sections().stream().map(DocumentationSection::title).toList();

            List.of("Descrição", "Funcionalidades", "Regras de negócio", "Ações")
                    .forEach(required -> assertTrue(titles.contains(required),
                            area.title() + " sem a seção " + required));
        });
    }

    @Test
    void shouldNotPublishEmptySection() {
        allAreas().forEach(area -> {
            assertFalse(area.sections().isEmpty(), area.title() + " sem seção");

            area.sections().forEach(section -> {
                assertTrue(section.title() != null && !section.title().isBlank());
                assertFalse(section.blocks().isEmpty(), section.title() + " sem bloco");

                section.blocks().forEach(block -> {
                    boolean hasContent = switch (block.kind()) {
                        case PARAGRAPH, HIGHLIGHT -> block.text() != null && !block.text().isBlank();
                        case LIST -> !block.items().isEmpty()
                                && block.items().stream().noneMatch(String::isBlank);
                        case TABLE -> block.table() != null
                                && !block.table().columns().isEmpty()
                                && !block.table().rows().isEmpty();
                    };

                    assertTrue(hasContent, "Bloco sem conteúdo em " + section.title());
                });
            });
        });
    }

    @Test
    void shouldNotMentionRemovedOrUnimplementedFeatures() {
        allAreas().forEach(area -> {
            assertFalse(REMOVED_OR_UNIMPLEMENTED.matcher(area.title()).find(), area.title());

            area.sections().forEach(section -> assertFalse(
                    REMOVED_OR_UNIMPLEMENTED.matcher(section.title()).find(), section.title()));
        });
    }

    @Test
    void shouldNotExposeTechnicalIdentifiers() {
        displayedTexts().forEach(text -> {
            assertFalse(TECHNICAL_IDENTIFIER.matcher(text).find(), "Identificador técnico exibido: " + text);
            assertFalse(INFRASTRUCTURE_TERM.matcher(text).find(), "Termo de infraestrutura exibido: " + text);
        });
    }

    @Test
    void shouldKeepParagraphsShort() {
        allAreas().forEach(area -> area.sections().forEach(section -> section.blocks().forEach(block -> {
            if (block.text() != null) {
                assertTrue(block.text().length() <= MAX_PARAGRAPH_LENGTH,
                        "Parágrafo com " + block.text().length() + " caracteres em " + section.title());
            }
        })));
    }

    @Test
    void shouldNotMentionTheBackToTopButtonInHowToNavigate() {
        DocumentationSection navegacao = CONTENT.introduction().sections().stream()
                .filter(section -> "Como navegar".equals(section.title()))
                .findFirst()
                .orElseThrow();

        assertTrue(navegacao.blocks().stream()
                .noneMatch(block -> block.text() != null && block.text().contains("Voltar ao topo")));
    }

    @Test
    void shouldExplainOwnAccountProtectionsInUsersBusinessRules() {
        DocumentationSection regras = CONTENT.areas().stream()
                .filter(area -> "Usuários".equals(area.title()))
                .findFirst()
                .orElseThrow()
                .sections().stream()
                .filter(section -> "Regras de negócio".equals(section.title()))
                .findFirst()
                .orElseThrow();

        String highlight = regras.blocks().stream()
                .filter(block -> block.kind() == DocumentationBlock.Kind.HIGHLIGHT)
                .map(DocumentationBlock::text)
                .findFirst()
                .orElseThrow();

        assertTrue(highlight.contains("botão Desativar"), highlight);
        assertTrue(highlight.contains("Status"), highlight);
        assertTrue(highlight.contains("Inativo"), highlight);
        assertTrue(highlight.contains("próprio perfil"), highlight);
        assertTrue(highlight.contains("Você não pode desativar a própria conta."), highlight);
        assertTrue(highlight.contains("Você não pode alterar o próprio perfil."), highlight);
    }

    private static final Pattern PROFILE_RULE_TECHNICAL_TERM = Pattern.compile(
            "\\b(banco|migração|migration|API|nulo|null|profile|Flyway|V5|V6)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS);

    @Test
    void shouldDescribeProfileRequirementAndUsersWithoutProfileInUsersBusinessRules() {
        List<String> items = CONTENT.areas().stream()
                .filter(area -> "Usuários".equals(area.title()))
                .findFirst()
                .orElseThrow()
                .sections().stream()
                .filter(section -> "Regras de negócio".equals(section.title()))
                .flatMap(section -> section.blocks().stream())
                .flatMap(block -> Stream.concat(
                        block.items().stream(), Stream.ofNullable(block.text())))
                .toList();

        items.forEach(item -> {
            assertFalse(item.contains("não existe pessoa cadastrada sem um"), item);
            assertFalse(item.contains("precisa de um perfil: não existe"), item);
        });

        String requirement = items.stream()
                .filter(item -> item.contains("Todo cadastro e toda alteração") && item.contains("perfil"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Sem o item de perfil obrigatório no cadastro e na alteração"));

        String withoutProfile = items.stream()
                .filter(item -> item.contains("Perfil") && item.contains("-") && item.contains("outra pessoa"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Sem o item que explica o - na coluna Perfil"));

        List.of(requirement, withoutProfile).forEach(item -> assertFalse(
                PROFILE_RULE_TECHNICAL_TERM.matcher(item).find(), "Termo técnico exibido: " + item));
    }

    @Test
    void shouldDescribeDefinitiveCategoryDeletion() {
        String published = String.join("\n", displayedTexts());

        assertFalse(published.contains("Excluir uma categoria significa apenas torná-la Inativa"));
        assertFalse(published.contains("uma desativação em Categorias"));

        String categoryRules = CONTENT.areas().stream()
                .filter(area -> "Categorias".equals(area.title()))
                .findFirst()
                .orElseThrow()
                .sections().stream()
                .filter(section -> "Regras de negócio".equals(section.title()))
                .flatMap(section -> section.blocks().stream())
                .flatMap(block -> block.items().stream())
                .reduce("", (left, right) -> left + "\n" + right);

        assertTrue(categoryRules.contains("remove definitivamente"), categoryRules);
        assertTrue(categoryRules.contains("Não é possível excluir a categoria"), categoryRules);
        assertTrue(categoryRules.contains("qualquer que seja a pessoa"), categoryRules);
        assertFalse(categoryRules.contains("cancelado"), categoryRules);
        assertTrue(categoryRules.contains("Situação"), categoryRules);
    }

    @Test
    void shouldKeepEveryTableRowAlignedWithItsColumns() {
        allAreas().forEach(area -> area.sections().forEach(section -> section.blocks().forEach(block -> {
            if (block.table() != null) {
                int columns = block.table().columns().size();

                block.table().rows().forEach(row -> assertEquals(columns, row.size(),
                        "Linha de tabela fora do número de colunas em " + section.title()));
            }
        })));
    }

    private static final List<String> REGISTRATION_AREAS =
            List.of("Lançamentos", "Categorias", "Usuários", "Perfis");

    private static final Pattern INLINE_EDITING_OR_SIDE_FORM = Pattern.compile(
            "à esquerda|à direita|na própria linha|na linha da tabela|ali mesmo na tabela|formulário lateral"
                    + "|Sair \\(linha\\)|Salvar \\(linha\\)");

    private static String areaText(DocumentationArea area) {
        List<String> texts = new ArrayList<>();
        texts.add(area.summary());
        area.sections().forEach(section -> section.blocks().forEach(block -> {
            if (block.text() != null) {
                texts.add(block.text());
            }
            texts.addAll(block.items());
            if (block.table() != null) {
                block.table().rows().forEach(texts::addAll);
            }
        }));
        return String.join("\n", texts);
    }

    @Test
    void shouldNotDescribeSideFormNorInlineEditingInAnyArea() {
        CONTENT.areas().forEach(area -> assertFalse(
                INLINE_EDITING_OR_SIDE_FORM.matcher(areaText(area)).find(),
                area.title() + " ainda descreve formulário lateral ou edição na linha"));
    }

    private static final Map<String, List<String>> REGISTRATION_BUTTONS = Map.of(
            "Lançamentos", List.of("Novo lançamento", "Editar lançamento", "Excluir lançamento"),
            "Categorias", List.of("Nova categoria", "Editar categoria", "Excluir categoria"),
            "Usuários", List.of("Novo usuário", "Editar usuário", "Desativar usuário"),
            "Perfis", List.of("Novo perfil", "Editar perfil", "Excluir perfil"));

    @Test
    void shouldDescribeNamedButtonsVisibleFiltersAndPaginationInRegistrationAreas() {
        CONTENT.areas().stream()
                .filter(area -> REGISTRATION_AREAS.contains(area.title()))
                .forEach(area -> {
                    String text = areaText(area);

                    Stream.concat(REGISTRATION_BUTTONS.get(area.title()).stream(),
                            Stream.of("tela própria", "Filtros ativos", "Anterior", "Próxima", "por página",
                                    "seta de voltar"))
                            .forEach(expected -> assertTrue(text.contains(expected),
                                    area.title() + " sem mencionar " + expected));
                });
    }

    private static final Pattern REMOVED_INTERFACE = Pattern.compile(
            "botão Incluir|Filtros \\(1\\)|Últimos registros|Últimos lançamentos|Detalhamento|gaveta"
                    + "|botão Menu|campos Ano e Mês|Trocar o Ano|Seleção de Ano");

    @Test
    void shouldNotDescribeTheInterfaceReplacedByTheRedesign() {
        displayedTexts().forEach(text -> assertFalse(
                REMOVED_INTERFACE.matcher(text).find(), "Texto da interface antiga: " + text));
    }

    @Test
    void shouldDescribeCollapsibleMenuAndBottomBarInHowToNavigate() {
        String navegacao = CONTENT.introduction().sections().stream()
                .filter(section -> "Como navegar".equals(section.title()))
                .flatMap(section -> section.blocks().stream())
                .map(block -> block.text() == null ? String.join("\n", block.items()) : block.text())
                .reduce("", (left, right) -> left + "\n" + right);

        List.of("Recolher menu", "Expandir menu", "barra fixa", "(Novo lançamento) e Mais", "painel Mais", "Sair")
                .forEach(expected -> assertTrue(navegacao.contains(expected), "Sem mencionar " + expected));
    }

    @Test
    void shouldCoverLoginNoAccessNoticesListsCentralAndReleaseNotes() {
        List<String> introductionTitles = CONTENT.introduction().sections().stream()
                .map(DocumentationSection::title)
                .toList();

        List.of("Entrar no sistema", "Tela Sem acesso", "Avisos do sistema", "Listas sem resultado ou com falha",
                "Como usar esta Central", "Novidades por versão")
                .forEach(expected -> assertTrue(introductionTitles.contains(expected),
                        "Introdução sem a seção " + expected));

        String published = String.join("\n", displayedTexts());

        List.of("Mostrar senha", "Ocultar senha", "Credenciais inválidas", "Sem acesso",
                "Seu perfil não tem acesso a nenhuma tela", "Correções", "Nenhuma novidade publicada ainda",
                "Ainda não há mudanças publicadas nesta versão",
                "Buscar na documentação", "Nenhuma área corresponde à busca", "Nenhum registro encontrado",
                "Limpar filtros", "Fechar aviso", "Sua sessão expirou", "Você não tem permissão para acessar esta tela",
                "pedem confirmação", "Lançamento excluído com sucesso", "Usuário desativado com sucesso",
                "Perfil excluído com sucesso")
                .forEach(expected -> assertTrue(published.contains(expected), "Central sem mencionar " + expected));

        assertFalse(published.contains("não diferencia maiúsculas de minúsculas nem acentos"),
                "A busca da Central diferencia acentos");
    }

    @Test
    void shouldDescribeMonthStepAndCategoryPanelInSummary() {
        String summary = areaText(CONTENT.areas().stream()
                .filter(area -> "Resumo".equals(area.title()))
                .findFirst()
                .orElseThrow());

        List.of("Mês anterior", "Próximo mês", "Por categoria", "Saldo do mês", "sempre disponíveis", "bolinha",
                "seletor", "Ano anterior", "Próximo ano", "Qualquer mês pode ser escolhido")
                .forEach(expected -> assertTrue(summary.contains(expected), "Resumo sem mencionar " + expected));
        List.of("desabilitado", "cancelad", "períodos em que você tem lançamentos")
                .forEach(removed -> assertFalse(summary.contains(removed), "Resumo ainda menciona " + removed));
    }

    @Test
    void shouldDescribeTheAccumulatedBalanceRulesInSummary() {
        String summary = areaText(CONTENT.areas().stream()
                .filter(area -> "Resumo".equals(area.title()))
                .findFirst()
                .orElseThrow());

        List.of("Saldo anterior mais Receitas menos Despesas pagas", "Saldo anterior mais receitas menos despesas pagas",
                "Soma de Receitas menos Despesas pagas de cada mês", "1º de outubro de 2026",
                "saldo negativo desconta do Saldo anterior", "segue adiante", "soma só até o mês atual",
                "a receita, a despesa e o saldo do mês do período", "muda esses saldos",
                "o Saldo do mês fica igual ao Saldo anterior", "basta lançar a despesa",
                "o Saldo do mês conta o mês inteiro", "Saldo atual de Relatórios - Lançamentos vai só até hoje")
                .forEach(expected -> assertTrue(summary.contains(expected), "Resumo sem mencionar " + expected));
        assertFalse(summary.toLowerCase().contains("acumulad"), "Resumo ainda menciona o Saldo acumulado");
        assertFalse(summary.contains("todos os valores zerados"), "Resumo ainda diz que o mês vazio zera o Saldo");
    }

    @Test
    void shouldDescribeTheNewLayoutOfSummaryAndTransactions() {
        String summary = areaText(CONTENT.areas().stream()
                .filter(area -> "Resumo".equals(area.title()))
                .findFirst()
                .orElseThrow());
        String transactions = areaText(CONTENT.areas().stream()
                .filter(area -> "Lançamentos".equals(area.title()))
                .findFirst()
                .orElseThrow());
        String published = String.join("\n", displayedTexts());

        List.of("Ver pendentes", "Despesas pagas equivalem a", "Sem receitas no mês", "Novo lançamento",
                "Toque em um mês do gráfico para ver os valores.")
                .forEach(expected -> assertTrue(summary.contains(expected), "Resumo sem mencionar " + expected));
        List.of("Todo o período", "Mês anterior", "Próximo mês", "Todos, Despesas e Receitas", "detalhe",
                "Hoje e Ontem", "do maior valor para o menor", "receitas e despesas juntas",
                "cada cartão mostra a sua data", "O valor é obrigatório.", "Salvando…", "Tentar novamente")
                .forEach(expected -> assertTrue(transactions.contains(expected),
                        "Lançamentos sem mencionar " + expected));
        List.of("agrupados por dia", "Sábado, 10 de outubro", "do mais recente para o mais antigo, com até")
                .forEach(removed -> assertFalse(transactions.contains(removed),
                        "Lançamentos ainda menciona " + removed));
        assertTrue(published.contains("linhas cinzas"), "Central sem mencionar a lista carregando");
        assertTrue(summary.contains("Clique em um mês do gráfico para ver os valores."),
                "Resumo sem a dica do computador");
        List.of("Categorias", "Usuários", "Perfis").forEach(title -> {
            String text = areaText(CONTENT.areas().stream()
                    .filter(area -> title.equals(area.title()))
                    .findFirst()
                    .orElseThrow());
            assertTrue(text.contains("abre o detalhe"), title + " sem descrever o detalhe");
            assertTrue(text.contains("tecla Esc"), title + " sem dizer como fechar o detalhe");
        });
        assertFalse(published.contains("sem confirmação"), "Central ainda diz que algo age sem confirmação");
        assertTrue(published.contains("Deseja desativar o usuário"), "Usuários sem a confirmação de desativar");
        assertTrue(published.contains("Deseja excluir o perfil"), "Perfis sem a confirmação de excluir");
        assertFalse(published.contains("Quatro indicadores"), "Central ainda descreve os quatro indicadores");
    }

    @Test
    void shouldDescribeDefinitiveTransactionDeletionAndMonthFilter() {
        String transactions = areaText(CONTENT.areas().stream()
                .filter(area -> "Lançamentos".equals(area.title()))
                .findFirst()
                .orElseThrow());

        List.of("Excluir lançamento", "Deseja excluir o lançamento", "Lançamento excluído com sucesso",
                "apaga de vez", "pede confirmação", "mês atual", "filtro Data", "Ano anterior", "Próximo ano",
                "rótulo Data", "Limpar filtros")
                .forEach(expected -> assertTrue(transactions.contains(expected),
                        "Lançamentos sem mencionar " + expected));

        String published = String.join("\n", displayedTexts());
        List.of("Cancelado", "cancelado", "Cancelar lançamento", "Lançamento cancelado com sucesso", "sem apagá-lo",
                "não o apaga", "valor riscado", "Data de", "Data até", "Não há lançamentos no ano informado",
                "um cancelamento em Lançamentos")
                .forEach(removed -> assertFalse(published.contains(removed), "Central ainda menciona " + removed));
    }

    @Test
    void shouldDescribeBothBalancesAndThePreferencesOfTheTransactionReport() {
        String report = areaText(CONTENT.areas().stream()
                .filter(area -> "Relatórios - Lançamentos".equals(area.title()))
                .findFirst()
                .orElseThrow());

        List.of("Receitas menos Despesas pagas de tudo o que passou nos filtros", "não entra no Saldo",
                "1º de outubro de 2026 até hoje", "não muda com os filtros", "não podem ser escondidos",
                "Mês atual", "Personalizado", "Parcelados", "Sem status", "Sem categoria", "sem páginas",
                "Escolha ao menos uma coluna.", "A data inicial não pode ser posterior à data final.",
                "ninguém mais a vê", "desmarca a anterior", "acompanha a data", "inativa continua", "Imprimir",
                "rola para os lados", "pode ser diferente do Saldo do mês atual no Resumo")
                .forEach(expected -> assertTrue(report.contains(expected), "Relatório sem mencionar " + expected));

        String navegacao = CONTENT.introduction().sections().stream()
                .filter(section -> "Como navegar".equals(section.title()))
                .flatMap(section -> section.blocks().stream())
                .map(block -> block.text() == null ? String.join(" ", block.items()) : block.text())
                .reduce("", (left, right) -> left + " " + right);
        assertTrue(navegacao.contains("Relatórios: seção com o relatório de Lançamentos."), navegacao);

        String published = String.join(" ", displayedTexts());
        assertFalse(published.contains("que ainda não tem registros"),
                "Auditoria ainda diz que Impressão não tem registros");
        assertTrue(published.contains("A Impressão é registrada quando alguém usa o botão Imprimir"));
    }

    @Test
    void shouldDescribeRegistersBeforeReportsInTheMenuOrder() {
        String menuOrder = "Resumo, Lançamentos, Categorias, Relatórios - Lançamentos, Usuários, Perfis, Auditoria, "
                + "Documentação e Novidades por versão";

        List<String> navegacao = CONTENT.introduction().sections().stream()
                .filter(section -> "Como navegar".equals(section.title()))
                .flatMap(section -> section.blocks().stream())
                .flatMap(block -> block.text() == null ? block.items().stream() : Stream.of(block.text()))
                .toList();
        int registers = navegacao.indexOf("Cadastros: seção com a tela de Categorias.");
        int reports = navegacao.indexOf("Relatórios: seção com o relatório de Lançamentos.");
        assertTrue(registers >= 0 && reports > registers, "Como navegar não põe Cadastros antes de Relatórios");
        assertTrue(String.join(" ", navegacao).contains("(Cadastros, Relatórios, Configurações e Sobre)"),
                "Painel Mais fora da ordem do menu");

        String entrada = CONTENT.introduction().sections().stream()
                .filter(section -> "Entrar no sistema".equals(section.title()))
                .flatMap(section -> section.blocks().stream())
                .flatMap(block -> block.items().stream())
                .reduce("", (left, right) -> left + " " + right);
        assertTrue(entrada.contains("na ordem do menu: " + menuOrder + "."), entrada);

        String profiles = areaText(CONTENT.areas().stream()
                .filter(area -> "Perfis".equals(area.title()))
                .findFirst()
                .orElseThrow());
        assertTrue(profiles.contains("As linhas da matriz são " + menuOrder + ", na mesma ordem em que as telas "
                + "aparecem no menu."), profiles);
    }
}
