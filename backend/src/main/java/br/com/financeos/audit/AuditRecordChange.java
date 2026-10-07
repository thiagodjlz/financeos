package br.com.financeos.audit;

import java.util.UUID;

import org.hibernate.annotations.Immutable;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Immutable
@Table(name = "audit_record_changes")
public class AuditRecordChange extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "audit_record_id", nullable = false, updatable = false)
    public AuditRecord record;

    @Column(nullable = false)
    public int position;

    @Column(name = "field_label", nullable = false)
    public String fieldLabel;

    @Column(name = "old_value")
    public String oldValue;

    @Column(name = "new_value")
    public String newValue;
}
