package br.com.financeos.transactions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "transactions")
public class FinancialTransaction extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "user_id", nullable = false)
    public UUID userId;

    @Column(name = "category_id")
    public UUID categoryId;

    @Column(name = "account_id")
    public UUID accountId;

    @Column(name = "card_id")
    public UUID cardId;

    @Column(name = "transaction_date", nullable = false)
    public LocalDate transactionDate;

    @Column(nullable = false, length = 255)
    public String description;

    @Column(nullable = false, precision = 14, scale = 2)
    public BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public TransactionStatus status = TransactionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    public TransactionSource source = TransactionSource.MANUAL;

    @Column(name = "installment_number")
    public Integer installmentNumber;

    @Column(name = "installment_total")
    public Integer installmentTotal;

    public String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    public OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    public OffsetDateTime updatedAt;
}
