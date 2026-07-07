package br.com.financeos.profiles;

import java.util.List;
import java.util.UUID;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProfilePermissionRepository implements PanacheRepositoryBase<ProfilePermission, UUID> {

    public List<ProfilePermission> listByProfile(UUID profileId) {
        return list("profileId", profileId);
    }

    public void deleteByProfile(UUID profileId) {
        delete("profileId", profileId);
    }
}
