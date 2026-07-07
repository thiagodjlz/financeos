package br.com.financeos.profiles;

import java.util.UUID;

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
@Table(name = "profile_permissions")
public class ProfilePermission extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "profile_id", nullable = false)
    public UUID profileId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    public Screen screen;

    @Column(name = "can_view", nullable = false)
    public boolean canView;

    @Column(name = "can_create", nullable = false)
    public boolean canCreate;

    @Column(name = "can_edit", nullable = false)
    public boolean canEdit;

    @Column(name = "can_delete", nullable = false)
    public boolean canDelete;
}
