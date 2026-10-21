package br.com.financeos.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;

public record TransactionReportPreferenceResponse(
        UUID id,
        String name,
        boolean defaultPreference,
        ReportPeriod period,
        LocalDate startDate,
        LocalDate endDate,
        List<UUID> categoryIds,
        TransactionType type,
        TransactionStatus status,
        TransactionSource source,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        InstallmentFilter installments,
        List<ReportGrouping> groupBy,
        List<ReportColumn> columns) {

    public static TransactionReportPreferenceResponse from(TransactionReportPreference preference) {
        return new TransactionReportPreferenceResponse(
                preference.id,
                preference.name,
                preference.defaultPreference,
                preference.period,
                preference.startDate,
                preference.endDate,
                preference.categoryIds.stream().sorted().toList(),
                preference.type,
                preference.status,
                preference.source,
                preference.minAmount,
                preference.maxAmount,
                preference.installments,
                preference.groupings(),
                preference.reportColumns());
    }
}
