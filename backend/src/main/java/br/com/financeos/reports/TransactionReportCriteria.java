package br.com.financeos.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import br.com.financeos.shared.ListParams;
import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.UriInfo;

// Filtros e agrupamentos do relatório, validados num lugar só: tanto a geração (query) quanto a
// preferência salva (corpo JSON) passam por aqui, para responderem os mesmos 400.
public record TransactionReportCriteria(
        ReportPeriod period,
        LocalDate startDate,
        LocalDate endDate,
        Set<UUID> categoryIds,
        TransactionType type,
        TransactionStatus status,
        TransactionSource source,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        InstallmentFilter installments,
        List<ReportGrouping> groupBy) {

    static final String PERIOD_MESSAGE = "O período informado é inválido.";
    static final String TYPE_MESSAGE = "O tipo informado é inválido.";
    static final String STATUS_MESSAGE = "O status informado é inválido.";
    static final String SOURCE_MESSAGE = "A origem informada é inválida.";
    static final String INSTALLMENTS_MESSAGE = "O parcelamento informado é inválido.";
    static final String GROUPING_MESSAGE = "O agrupamento informado é inválido.";
    static final String CATEGORY_MESSAGE = "A categoria informada é inválida.";

    public static TransactionReportCriteria fromQuery(UriInfo uriInfo, LocalDate today) {
        ReportPeriod period = ListParams.enumValue(uriInfo, "period", ReportPeriod.class, PERIOD_MESSAGE);

        return of(
                period == null ? ReportPeriod.CURRENT_MONTH : period,
                ListParams.date(uriInfo, "startDate", "A data inicial informada é inválida."),
                ListParams.date(uriInfo, "endDate", "A data final informada é inválida."),
                ListParams.uuids(uriInfo, "categoryId", CATEGORY_MESSAGE),
                ListParams.enumValue(uriInfo, "type", TransactionType.class, TYPE_MESSAGE),
                ListParams.enumValue(uriInfo, "status", TransactionStatus.class, STATUS_MESSAGE),
                ListParams.enumValue(uriInfo, "source", TransactionSource.class, SOURCE_MESSAGE),
                ListParams.decimal(uriInfo, "minAmount", "O valor mínimo informado é inválido."),
                ListParams.decimal(uriInfo, "maxAmount", "O valor máximo informado é inválido."),
                ListParams.enumValue(uriInfo, "installments", InstallmentFilter.class, INSTALLMENTS_MESSAGE),
                ListParams.enumValues(uriInfo, "groupBy", ReportGrouping.class, GROUPING_MESSAGE),
                today);
    }

    // As datas só valem no Personalizado; nos períodos relativos elas são resolvidas pela data de hoje
    // e o que tiver vindo é descartado, para a preferência reaberta noutro mês acompanhar o mês novo.
    public static TransactionReportCriteria of(ReportPeriod period, LocalDate customStart, LocalDate customEnd,
            List<UUID> categoryIds, TransactionType type, TransactionStatus status, TransactionSource source,
            BigDecimal minAmount, BigDecimal maxAmount, InstallmentFilter installments,
            List<ReportGrouping> groupBy, LocalDate today) {
        LocalDate startDate;
        LocalDate endDate;

        if (period == ReportPeriod.CUSTOM) {
            if (customStart == null || customEnd == null) {
                throw new BadRequestException("Informe a data inicial e a data final do período personalizado.");
            }
            if (customStart.isAfter(customEnd)) {
                throw new BadRequestException("A data inicial não pode ser posterior à data final.");
            }
            startDate = customStart;
            endDate = customEnd;
        } else {
            startDate = period.startFor(today);
            endDate = period.endFor(today);
        }

        if (minAmount != null && minAmount.signum() < 0) {
            throw new BadRequestException("O valor mínimo não pode ser negativo.");
        }
        if (maxAmount != null && maxAmount.signum() < 0) {
            throw new BadRequestException("O valor máximo não pode ser negativo.");
        }
        if (minAmount != null && maxAmount != null && minAmount.compareTo(maxAmount) > 0) {
            throw new BadRequestException("O valor mínimo não pode ser maior que o valor máximo.");
        }

        List<ReportGrouping> groups = groupBy == null ? List.of() : groupBy;
        Set<ReportGrouping> seen = EnumSet.noneOf(ReportGrouping.class);
        for (ReportGrouping grouping : groups) {
            if (!seen.add(grouping)) {
                throw new BadRequestException("O agrupamento não pode repetir o mesmo campo.");
            }
        }

        return new TransactionReportCriteria(
                period,
                startDate,
                endDate,
                categoryIds == null ? Set.of() : categoryIds.stream().filter(Objects::nonNull).collect(Collectors.toUnmodifiableSet()),
                type,
                status,
                source,
                minAmount,
                maxAmount,
                installments == null ? InstallmentFilter.ALL : installments,
                List.copyOf(groups));
    }

    public static <E extends Enum<E>> E parse(String value, Class<E> type, String errorMessage) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Enum.valueOf(type, value.trim());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(errorMessage);
        }
    }

    public static <E extends Enum<E>> List<E> parseAll(List<String> values, Class<E> type, String errorMessage) {
        if (values == null) {
            return List.of();
        }

        List<E> parsed = new ArrayList<>();
        for (String value : values) {
            E item = parse(value, type, errorMessage);
            if (item == null) {
                throw new BadRequestException(errorMessage);
            }
            parsed.add(item);
        }

        return List.copyOf(parsed);
    }
}
