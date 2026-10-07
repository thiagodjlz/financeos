package br.com.financeos.audit;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.Immutable;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

// Tipo, ação e tela ficam como texto (e não @Enumerated): uma linha com código que esta versão não
// conhece continua legível na consulta, exibida pelo próprio código.
@Entity
@Immutable
@Table(name = "audit_records")
public class AuditRecord extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    public OffsetDateTime occurredAt;

    @Column(name = "event_type", nullable = false, length = 40)
    public String eventType;

    @Column(length = 30)
    public String action;

    @Column(length = 30)
    public String screen;

    @Column(name = "user_id")
    public UUID userId;

    @Column(name = "user_name")
    public String userName;

    @Column(name = "user_email")
    public String userEmail;

    @Column(name = "user_super_admin", nullable = false)
    public boolean userSuperAdmin;

    @Column(name = "record_id")
    public UUID recordId;

    @Column(name = "record_label")
    public String recordLabel;

    @OneToMany(mappedBy = "record", cascade = CascadeType.PERSIST)
    @OrderBy("position")
    public List<AuditRecordChange> changes = new ArrayList<>();
}
