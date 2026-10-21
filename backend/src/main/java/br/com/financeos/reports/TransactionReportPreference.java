package br.com.financeos.reports;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import br.com.financeos.transactions.TransactionSource;
import br.com.financeos.transactions.TransactionStatus;
import br.com.financeos.transactions.TransactionType;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "transaction_report_preferences")
public class TransactionReportPreference extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @Column(nullable = false, length = 100)
    public String name;

    @Column(name = "is_default", nullable = false)
    public boolean defaultPreference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public ReportPeriod period;

    @Column(name = "start_date")
    public LocalDate startDate;

    @Column(name = "end_date")
    public LocalDate endDate;

    // O banco apaga a linha quando a categoria é excluída: a preferência só enxerga as que existem.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "transaction_report_preference_categories",
            joinColumns = @JoinColumn(name = "preference_id"))
    @Column(name = "category_id", nullable = false)
    public Set<UUID> categoryIds = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    public TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    public TransactionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    public TransactionSource source;

    @Column(name = "min_amount", precision = 14, scale = 2)
    public BigDecimal minAmount;

    @Column(name = "max_amount", precision = 14, scale = 2)
    public BigDecimal maxAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public InstallmentFilter installments = InstallmentFilter.ALL;

    @Column(name = "group_by", nullable = false, length = 200)
    public String groupBy = "";

    @Column(name = "report_columns", nullable = false, length = 200)
    public String columns = "";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    public OffsetDateTime updatedAt;

    public List<ReportGrouping> groupings() {
        return split(groupBy).stream().map(ReportGrouping::valueOf).toList();
    }

    public List<ReportColumn> reportColumns() {
        return split(columns).stream().map(ReportColumn::valueOf).toList();
    }

    public void groupings(List<ReportGrouping> values) {
        groupBy = values.stream().map(Enum::name).collect(Collectors.joining(","));
    }

    public void reportColumns(List<ReportColumn> values) {
        columns = values.stream().map(Enum::name).collect(Collectors.joining(","));
    }

    private static List<String> split(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split(",")).map(String::trim).filter(item -> !item.isEmpty()).toList();
    }
}
